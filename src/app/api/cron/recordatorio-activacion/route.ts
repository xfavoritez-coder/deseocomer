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

    // ━━━ SEGUNDO RECORDATORIO: 7-8 días — motivador ━━━
    const hace8dias = new Date(ahora.getTime() - 8 * 24 * 3600000);
    const hace7dias = new Date(ahora.getTime() - 7 * 24 * 3600000);

    const usuariosSegundo = await prisma.usuario.findMany({
      where: {
        emailVerificado: false,
        createdAt: { gte: hace8dias, lte: hace7dias },
      },
      select: { id: true, nombre: true, email: true, tokenVerificacion: true, updatedAt: true },
    });

    let enviadosSegundo = 0;
    for (const u of usuariosSegundo) {
      try {
        const { token } = await prepararUsuario(u);
        const nombre = u.nombre.split(/\s+/)[0];
        const activarUrl = `https://deseocomer.com/verificar-email?token=${token}`;
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px"><h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">¡Ya casi estás dentro, ${nombre}!</h2><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Te registraste en DeseoComer pero tu cuenta aún no está activa. Quizás no viste el correo o pensaste que ya estaba listo — solo falta un click.</p><p style="color:#f5d080;font-size:17px;font-weight:bold;margin-bottom:12px">¿Qué te estás perdiendo?</p><div style="margin-bottom:24px"><p style="color:#f5d080;font-size:15px;line-height:2;margin:0">🏆 <strong style="color:#e8a84c">${concursosActivos} concursos activos</strong> donde puedes ganar comida gratis</p><p style="color:#f5d080;font-size:15px;line-height:2;margin:0">🎯 <strong style="color:#e8a84c">3 puntos gratis</strong> — cada amigo que invites te da +3 y él también gana +3</p><p style="color:#f5d080;font-size:15px;line-height:2;margin:0">📈 <strong style="color:#e8a84c">Sube en el ranking</strong> — comparte tu link, suma puntos y gana el premio</p></div><div style="text-align:center;margin-bottom:24px"><a href="${activarUrl}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Activar mi cuenta →</a></div><p style="color:#5a4028;font-size:13px;line-height:1.6">Muchas personas ya están participando. No te quedes fuera.</p></div><div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 · DeseoComer.com</p></div></div></body></html>`;
        await resend.emails.send({
          from,
          to: u.email,
          subject: `Estás a 1 click de ganar comida gratis`,
          html,
        });
        enviadosSegundo++;
        log.push(`✅ [7d] ${u.email}`);
      } catch (err) {
        errores++;
        log.push(`❌ [7d] ${u.email}: ${err instanceof Error ? err.message : "error"}`);
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
        log.push(`✅ [14d] ${u.email}`);
      } catch (err) {
        errores++;
        log.push(`❌ [14d] ${u.email}: ${err instanceof Error ? err.message : "error"}`);
      }
    }

    return NextResponse.json({
      ok: true,
      primerRecordatorio: { total: usuariosPrimer.length, enviados: enviadosPrimer },
      segundoRecordatorio: { total: usuariosSegundo.length, enviados: enviadosSegundo },
      ultimoRecordatorio: { total: usuariosUltimo.length, enviados: enviadosUltimo },
      errores,
      log,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
