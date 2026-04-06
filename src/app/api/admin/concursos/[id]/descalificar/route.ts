import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { checkAdminAuth } from "@/lib/adminAuth";

const FROM = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id: concursoId } = await params;
    const { userId, enviarEmail, motivo } = await req.json();
    if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

    // Get participant and concurso info
    const participante = await prisma.participanteConcurso.findFirst({
      where: { concursoId, usuarioId: userId },
      include: { usuario: { select: { id: true, nombre: true, email: true } } },
    });
    if (!participante) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });

    const concurso = await prisma.concurso.findUnique({ where: { id: concursoId }, select: { premio: true, slug: true } });

    // 1. Descalificar al participante
    await prisma.participanteConcurso.update({
      where: { id: participante.id },
      data: { estado: "descalificado", puntos: 0, puntosReferidosNuevos: 0, puntosReferidosExistentes: 0, puntosNivel2: 0 },
    });

    // 2. Find and delete fake referral accounts (Gmail dot trick + VPN IPs)
    const referidos = await prisma.participanteConcurso.findMany({
      where: { concursoId, referidorDirectoId: userId },
      include: { usuario: { select: { id: true, email: true, ipRegistro: true } } },
    });

    const DC_PREFIXES = ["51.158.", "51.159.", "51.81.", "62.210.", "15.204.", "15.235.", "94.242.", "146.70.", "141.95."];
    const userEmail = participante.usuario.email ?? "";
    const [userLocal] = userEmail.split("@");
    const userNorm = userLocal.toLowerCase().replace(/\./g, "").replace(/\+.*$/, "");

    const cuentasFalsas = referidos.filter(r => {
      const email = (r.usuario.email ?? "").toLowerCase();
      const [local, domain] = email.split("@");
      const ip = r.usuario.ipRegistro ?? "";
      // Gmail dot trick
      if (domain === "gmail.com") {
        const norm = local.replace(/\./g, "").replace(/\+.*$/, "");
        // Check if normalized matches any other referral
        const otherNorms = referidos
          .filter(o => o.id !== r.id && (o.usuario.email ?? "").endsWith("@gmail.com"))
          .map(o => (o.usuario.email ?? "").split("@")[0].toLowerCase().replace(/\./g, "").replace(/\+.*$/, ""));
        if (otherNorms.includes(norm)) return true;
      }
      // VPN IP
      if (DC_PREFIXES.some(p => ip.startsWith(p))) return true;
      // Same IP as the fraudster
      if (ip === (participante.usuario as any).ipRegistro && ip !== "unknown" && ip !== "") return true;
      return false;
    });

    // Descalificar participaciones falsas
    if (cuentasFalsas.length > 0) {
      await prisma.participanteConcurso.updateMany({
        where: { id: { in: cuentasFalsas.map(c => c.id) } },
        data: { estado: "descalificado", puntos: 0 },
      });

      // Delete fake user accounts and their related data
      const fakeUserIds = cuentasFalsas.map(c => c.usuario.id);
      await prisma.participanteConcurso.deleteMany({ where: { usuarioId: { in: fakeUserIds } } });
      await prisma.notificacion.deleteMany({ where: { usuarioId: { in: fakeUserIds } } });
      await prisma.favorito.deleteMany({ where: { usuarioId: { in: fakeUserIds } } });
      await prisma.toastDismissed.deleteMany({ where: { usuarioId: { in: fakeUserIds } } });
      await prisma.mensajeVisto.deleteMany({ where: { usuarioId: { in: fakeUserIds } } });
      await prisma.usuario.deleteMany({ where: { id: { in: fakeUserIds } } });
    }

    // 3. Enviar email si se solicitó
    let emailEnviado = false;
    if (enviarEmail && participante.usuario.email) {
      try {
        await resend.emails.send({
          from: FROM,
          to: participante.usuario.email,
          subject: "Descalificación del concurso — DeseoComer",
          html: `
            <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0f0a1c; color: #f0ead6; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 2rem;">🧞</span>
                <p style="font-size: 0.9rem; color: #e8a84c; letter-spacing: 0.2em; margin-top: 8px;">DESEOCOMER</p>
              </div>
              <h2 style="color: #e05555; font-size: 1.1rem; margin-bottom: 16px;">Tu participación ha sido descalificada</h2>
              <p style="color: #c0a060; font-size: 0.9rem; line-height: 1.8; margin-bottom: 16px;">
                Hola ${participante.usuario.nombre?.split(" ")[0] ?? ""},
              </p>
              <p style="color: #c0a060; font-size: 0.9rem; line-height: 1.8; margin-bottom: 16px;">
                Tras una revisión de tu actividad en el concurso <strong style="color: #e8a84c;">"${concurso?.premio ?? "Concurso"}"</strong>,
                hemos detectado actividad fraudulenta en tu cuenta.
              </p>
              ${motivo ? `<p style="color: #c0a060; font-size: 0.9rem; line-height: 1.8; margin-bottom: 16px;"><strong>Motivo:</strong> ${motivo}</p>` : ""}
              <div style="background: rgba(224,85,85,0.1); border: 1px solid rgba(224,85,85,0.3); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;">
                <p style="color: #e05555; font-size: 0.85rem; margin: 0;">
                  <strong>Consecuencias:</strong><br/>
                  • Tu participación fue descalificada y tus puntos removidos<br/>
                  ${cuentasFalsas.length > 0 ? `• ${cuentasFalsas.length} cuentas asociadas fueron eliminadas<br/>` : ""}
                  • Esto viola nuestros <a href="https://deseocomer.com/terminos" style="color: #3db89e;">Términos y Condiciones</a>
                </p>
              </div>
              <p style="color: #c0a060; font-size: 0.9rem; line-height: 1.8;">
                Si crees que es un error, puedes contactarnos respondiendo a este correo.
              </p>
              <hr style="border: none; border-top: 1px solid rgba(232,168,76,0.15); margin: 24px 0;" />
              <p style="color: rgba(240,234,214,0.3); font-size: 0.75rem; text-align: center;">DeseoComer — Concursos justos para todos</p>
            </div>
          `,
        });
        emailEnviado = true;
      } catch (e) {
        console.error("[Email descalificación]", e);
      }
    }

    return NextResponse.json({
      ok: true,
      descalificado: participante.usuario.nombre,
      cuentasEliminadas: cuentasFalsas.length,
      emailEnviado,
    });
  } catch (e) {
    console.error("[Admin descalificar]", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
