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
    const { userId, enviarEmail, motivo, borrarReferidos } = await req.json();
    if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

    const participante = await prisma.participanteConcurso.findFirst({
      where: { concursoId, usuarioId: userId },
      include: { usuario: { select: { id: true, nombre: true, email: true, ipRegistro: true } } },
    });
    if (!participante) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });

    const concurso = await prisma.concurso.findUnique({ where: { id: concursoId }, select: { premio: true, slug: true } });

    // 1. Descalificar al participante
    await prisma.participanteConcurso.update({
      where: { id: participante.id },
      data: { estado: "descalificado", puntos: 0, puntosReferidosNuevos: 0, puntosReferidosExistentes: 0, puntosNivel2: 0 },
    });

    // 2. Get all referrals
    const referidos = await prisma.participanteConcurso.findMany({
      where: { concursoId, referidorDirectoId: userId },
      include: { usuario: { select: { id: true, email: true, nombre: true } } },
    });

    let cuentasEliminadas = 0;

    if (borrarReferidos !== false && referidos.length > 0) {
      // Descalificar todas las participaciones de referidos
      await prisma.participanteConcurso.updateMany({
        where: { id: { in: referidos.map(r => r.id) } },
        data: { estado: "descalificado", puntos: 0 },
      });

      // Delete referral user accounts and all related data
      const refUserIds = referidos.map(r => r.usuario.id);
      await prisma.participanteConcurso.deleteMany({ where: { usuarioId: { in: refUserIds } } });
      await prisma.notificacion.deleteMany({ where: { usuarioId: { in: refUserIds } } });
      await prisma.favorito.deleteMany({ where: { usuarioId: { in: refUserIds } } });
      await prisma.toastDismissed.deleteMany({ where: { usuarioId: { in: refUserIds } } });
      await prisma.mensajeVisto.deleteMany({ where: { usuarioId: { in: refUserIds } } });
      await prisma.usuario.deleteMany({ where: { id: { in: refUserIds } } });
      cuentasEliminadas = refUserIds.length;
    }

    // 3. Also descalify this user in ALL other concursos
    await prisma.participanteConcurso.updateMany({
      where: { usuarioId: userId, concursoId: { not: concursoId }, estado: { not: "descalificado" } },
      data: { estado: "descalificado", puntos: 0 },
    });

    // 4. Block user permanently from future concursos
    await prisma.usuario.update({
      where: { id: userId },
      data: { tipo: "bloqueado" },
    });

    // 5. Add to blacklist for future detection
    try {
      const blRow = await prisma.configSite.findUnique({ where: { clave: "blacklist_infractores" } });
      const bl = blRow?.valor ? JSON.parse(blRow.valor) : { ips: [], emails: [], infractores: [] };
      const userIp = participante.usuario.ipRegistro ?? "";
      const [local, dom] = (participante.usuario.email ?? "").split("@");
      const emailNorm = dom === "gmail.com" ? local.toLowerCase().replace(/\./g, "").replace(/\+.*$/, "") + "@gmail.com" : (participante.usuario.email ?? "").toLowerCase();
      if (userIp && !bl.ips.includes(userIp)) bl.ips.push(userIp);
      if (emailNorm && !bl.emails.includes(emailNorm)) bl.emails.push(emailNorm);
      bl.infractores.push({ nombre: participante.usuario.nombre, email: participante.usuario.email, ip: userIp, motivo: motivo || "Descalificado por fraude", fecha: new Date().toISOString() });
      bl.updatedAt = new Date().toISOString();
      await prisma.configSite.update({ where: { clave: "blacklist_infractores" }, data: { valor: JSON.stringify(bl) } });
    } catch { /* best effort */ }

    // 4. Send email if requested
    let emailEnviado = false;
    if (enviarEmail && participante.usuario.email) {
      try {
        const infracciones = motivo || "Actividad fraudulenta detectada en tu cuenta.";
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
                hemos detectado las siguientes infracciones:
              </p>
              <div style="background: rgba(224,85,85,0.1); border: 1px solid rgba(224,85,85,0.3); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;">
                <p style="color: #e05555; font-size: 0.85rem; line-height: 1.8; margin: 0; white-space: pre-wrap;">${infracciones}</p>
              </div>
              <p style="color: #c0a060; font-size: 0.9rem; line-height: 1.8; margin-bottom: 16px;">
                <strong>Consecuencias aplicadas:</strong>
              </p>
              <ul style="color: #c0a060; font-size: 0.85rem; line-height: 1.8; margin-bottom: 16px; padding-left: 20px;">
                <li>Tu participación fue descalificada y tus puntos removidos</li>
                ${cuentasEliminadas > 0 ? `<li>${cuentasEliminadas} cuentas asociadas fueron eliminadas</li>` : ""}
                <li>Has sido descalificado de todos los concursos activos</li>
                <li>Esto viola nuestros <a href="https://deseocomer.com/terminos" style="color: #3db89e;">Términos y Condiciones</a></li>
              </ul>
              <p style="color: #c0a060; font-size: 0.9rem; line-height: 1.8;">
                Si consideras que esta decisión es un error, puedes contactarnos respondiendo a este correo.
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
      cuentasEliminadas,
      emailEnviado,
    });
  } catch (e) {
    console.error("[Admin descalificar]", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
