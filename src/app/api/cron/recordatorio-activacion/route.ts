import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { recordatorioActivacionHtml } from "@/emails/recordatorioActivacionHtml";
import { ultimoRecordatorioHtml } from "@/emails/ultimoRecordatorioHtml";

const resend = new Resend(process.env.RESEND_API_KEY);

// Pre-load referrer names for a batch of users (avoids N+1 queries)
async function cargarReferidores(userIds: string[]): Promise<Map<string, string>> {
  const participaciones = await prisma.participanteConcurso.findMany({
    where: { usuarioId: { in: userIds }, referidorDirectoId: { not: null } },
    select: { usuarioId: true, referidorDirectoId: true },
    distinct: ["usuarioId"],
  });
  const refIds = [...new Set(participaciones.map(p => p.referidorDirectoId!))];
  const referidores = refIds.length > 0
    ? await prisma.usuario.findMany({ where: { id: { in: refIds } }, select: { id: true, nombre: true } })
    : [];
  const refMap = new Map(referidores.map(r => [r.id, r.nombre?.split(/\s+/)[0] ?? null]));
  const result = new Map<string, string>();
  for (const p of participaciones) {
    const nombre = refMap.get(p.referidorDirectoId!);
    if (nombre) result.set(p.usuarioId, nombre);
  }
  return result;
}

async function prepararToken(u: { id: string; tokenVerificacion: string | null; updatedAt: Date }): Promise<string> {
  let token = u.tokenVerificacion;
  const tokenEdad = Date.now() - new Date(u.updatedAt).getTime();
  if (!token || tokenEdad > 48 * 3600000) {
    token = crypto.randomBytes(32).toString("hex");
    await prisma.usuario.update({
      where: { id: u.id },
      data: { tokenVerificacion: token },
    });
  }
  return token;
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

    const refsPrimer = await cargarReferidores(usuariosPrimer.map(u => u.id));
    // Prepare all emails first, then send via batch API
    const emailsPrimer: { from: string; to: string; subject: string; html: string }[] = [];
    for (const u of usuariosPrimer) {
      try {
        const referidorNombre = refsPrimer.get(u.id) ?? null;
        const token = await prepararToken(u);
        const html = recordatorioActivacionHtml({
          nombre: u.nombre,
          concursosActivos,
          referidorNombre,
          tokenVerificacion: token,
        });
        emailsPrimer.push({
          from,
          to: u.email,
          subject: `🧞 ${u.nombre.split(/\s+/)[0]}, tu cuenta está casi lista — solo falta un clic`,
          html,
        });
      } catch (err) {
        errores++;
        log.push(`❌ [48h] ${u.email}: ${err instanceof Error ? err.message : "error"}`);
      }
    }
    if (emailsPrimer.length > 0) {
      const BATCH = 100;
      for (let i = 0; i < emailsPrimer.length; i += BATCH) {
        const batch = emailsPrimer.slice(i, i + BATCH);
        try {
          await resend.batch.send(batch);
          enviadosPrimer += batch.length;
          batch.forEach(e => log.push(`✅ [48h] ${e.to}`));
        } catch (err) {
          errores += batch.length;
          batch.forEach(e => log.push(`❌ [48h] ${e.to}: ${err instanceof Error ? err.message : "error"}`));
        }
      }
    }

    // ━━━ ÚLTIMO RECORDATORIO: 14-15 días después del registro ━━━
    const hace15dias = new Date(ahora.getTime() - 15 * 24 * 3600000);
    const hace14dias = new Date(ahora.getTime() - 14 * 24 * 3600000);

    const usuariosUltimo = await prisma.usuario.findMany({
      where: {
        emailVerificado: false,
        createdAt: { gte: hace15dias, lte: hace14dias },
      },
      select: { id: true, nombre: true, email: true, tokenVerificacion: true, updatedAt: true },
    });

    const refsUltimo = await cargarReferidores(usuariosUltimo.map(u => u.id));
    const emailsUltimo: { from: string; to: string; subject: string; html: string }[] = [];
    for (const u of usuariosUltimo) {
      try {
        const referidorNombre = refsUltimo.get(u.id) ?? null;
        const token = await prepararToken(u);
        const html = ultimoRecordatorioHtml({
          nombre: u.nombre,
          concursosActivos,
          referidorNombre,
          tokenVerificacion: token,
        });
        emailsUltimo.push({
          from,
          to: u.email,
          subject: `😢 ${u.nombre.split(/\s+/)[0]}, este es nuestro último recordatorio`,
          html,
        });
      } catch (err) {
        errores++;
        log.push(`❌ [14d] ${u.email}: ${err instanceof Error ? err.message : "error"}`);
      }
    }
    if (emailsUltimo.length > 0) {
      const BATCH = 100;
      for (let i = 0; i < emailsUltimo.length; i += BATCH) {
        const batch = emailsUltimo.slice(i, i + BATCH);
        try {
          await resend.batch.send(batch);
          enviadosUltimo += batch.length;
          batch.forEach(e => log.push(`✅ [14d] ${e.to}`));
        } catch (err) {
          errores += batch.length;
          batch.forEach(e => log.push(`❌ [14d] ${e.to}: ${err instanceof Error ? err.message : "error"}`));
        }
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
