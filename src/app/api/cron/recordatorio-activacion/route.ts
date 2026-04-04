import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { recordatorioActivacionHtml } from "@/emails/recordatorioActivacionHtml";
import { ultimoRecordatorioHtml } from "@/emails/ultimoRecordatorioHtml";

const resend = new Resend(process.env.RESEND_API_KEY);

async function prepararUsuario(u: { id: string; nombre: string; email: string; tokenVerificacion: string | null; updatedAt: Date }) {
  // Buscar referidor
  const participacion = await prisma.participanteConcurso.findFirst({
    where: { usuarioId: u.id, referidorDirectoId: { not: null } },
    select: { referidorDirectoId: true },
  });
  let referidorNombre: string | null = null;
  if (participacion?.referidorDirectoId) {
    const referidor = await prisma.usuario.findUnique({
      where: { id: participacion.referidorDirectoId },
      select: { nombre: true },
    });
    referidorNombre = referidor?.nombre?.split(/\s+/)[0] ?? null;
  }

  // Regenerar token si no tiene o si expiró (>48h)
  let token = u.tokenVerificacion;
  const tokenEdad = Date.now() - new Date(u.updatedAt).getTime();
  if (!token || tokenEdad > 48 * 3600000) {
    token = crypto.randomBytes(32).toString("hex");
    await prisma.usuario.update({
      where: { id: u.id },
      data: { tokenVerificacion: token },
    });
  }

  return { referidorNombre, token };
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;
  const log: string[] = [];
  const ahora = new Date();

  // Contar concursos activos (compartido para ambos emails)
  const concursosActivos = await prisma.concurso.count({
    where: { activo: true, fechaFin: { gt: ahora } },
  });

  let enviadosPrimer = 0;
  let enviadosUltimo = 0;
  let errores = 0;

  try {
    // ━━━ PRIMER RECORDATORIO: 48h-72h después del registro ━━━
    const hace3dias = new Date(ahora.getTime() - 72 * 3600000);
    const hace2dias = new Date(ahora.getTime() - 48 * 3600000);

    const usuariosPrimer = await prisma.usuario.findMany({
      where: {
        emailVerificado: false,
        createdAt: { gte: hace3dias, lte: hace2dias },
      },
      select: { id: true, nombre: true, email: true, tokenVerificacion: true, updatedAt: true },
    });

    for (const u of usuariosPrimer) {
      try {
        const { referidorNombre, token } = await prepararUsuario(u);
        const html = recordatorioActivacionHtml({
          nombre: u.nombre,
          concursosActivos,
          referidorNombre,
          tokenVerificacion: token,
        });
        await resend.emails.send({
          from,
          to: u.email,
          subject: `🧞 ${u.nombre.split(/\s+/)[0]}, tu cuenta está casi lista — solo falta un clic`,
          html,
        });
        enviadosPrimer++;
        log.push(`✅ [48h] ${u.email}`);
      } catch (err) {
        errores++;
        log.push(`❌ [48h] ${u.email}: ${err instanceof Error ? err.message : "error"}`);
      }
    }

    // ━━━ ÚLTIMO RECORDATORIO: 7-8 días después del registro ━━━
    const hace8dias = new Date(ahora.getTime() - 8 * 24 * 3600000);
    const hace7dias = new Date(ahora.getTime() - 7 * 24 * 3600000);

    const usuariosUltimo = await prisma.usuario.findMany({
      where: {
        emailVerificado: false,
        createdAt: { gte: hace8dias, lte: hace7dias },
      },
      select: { id: true, nombre: true, email: true, tokenVerificacion: true, updatedAt: true },
    });

    for (const u of usuariosUltimo) {
      try {
        const { referidorNombre, token } = await prepararUsuario(u);
        const html = ultimoRecordatorioHtml({
          nombre: u.nombre,
          concursosActivos,
          referidorNombre,
          tokenVerificacion: token,
        });
        await resend.emails.send({
          from,
          to: u.email,
          subject: `😢 ${u.nombre.split(/\s+/)[0]}, este es nuestro último recordatorio`,
          html,
        });
        enviadosUltimo++;
        log.push(`✅ [7d] ${u.email}`);
      } catch (err) {
        errores++;
        log.push(`❌ [7d] ${u.email}: ${err instanceof Error ? err.message : "error"}`);
      }
    }

    return NextResponse.json({
      ok: true,
      primerRecordatorio: { total: usuariosPrimer.length, enviados: enviadosPrimer },
      ultimoRecordatorio: { total: usuariosUltimo.length, enviados: enviadosUltimo },
      errores,
      log,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
