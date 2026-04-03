import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import crypto from "crypto";
import {
  emailGanador,
  emailLocal,
  emailAcreditacion,
  emailNuevoGanador,
  emailExpiracion,
} from "@/lib/emails/concurso-cierre";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://deseocomer.com";

// Días para reclamar según posición: 1° = 7d, 2° = 5d, 3° = 3d
const DIAS_RECLAMO: Record<number, number> = { 1: 7, 2: 5, 3: 3 };

function generarCodigo() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `DC-${num}`;
}

function generarToken() {
  return crypto.randomUUID();
}

function confirmUrls(concursoId: string, token: string) {
  return {
    confirm: `${BASE_URL}/concursos/confirmar?id=${concursoId}&token=${token}&respuesta=si`,
    disputa: `${BASE_URL}/concursos/confirmar?id=${concursoId}&token=${token}&respuesta=no`,
  };
}

function obtenerOrdenGanadorActual(c: {
  ganadorActualId: string | null;
  ganador1Id: string | null;
  ganador2Id: string | null;
  ganador3Id: string | null;
}): number {
  if (c.ganadorActualId === c.ganador1Id) return 1;
  if (c.ganadorActualId === c.ganador2Id) return 2;
  if (c.ganadorActualId === c.ganador3Id) return 3;
  return 1;
}

function obtenerSiguienteGanador(c: {
  ganadorActualId: string | null;
  ganador1Id: string | null;
  ganador2Id: string | null;
  ganador3Id: string | null;
}): { id: string; orden: number } | null {
  if (c.ganadorActualId === c.ganador1Id && c.ganador2Id) {
    return { id: c.ganador2Id, orden: 2 };
  }
  if (c.ganadorActualId === c.ganador2Id && c.ganador3Id) {
    return { id: c.ganador3Id, orden: 3 };
  }
  return null;
}

function diasDesde(date: Date | null): number {
  if (!date) return 0;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const log: string[] = [];
  const now = new Date();

  try {
    // ════════════════════════════════════════════════════════════════════════
    // PASO 0: Recordatorio 24h a participantes de concursos que terminan hoy
    // ════════════════════════════════════════════════════════════════════════

    const en24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const concursosTerminanHoy = await prisma.concurso.findMany({
      where: {
        estado: "activo",
        recordatorio24h: false,
        fechaFin: { gt: now, lte: en24h },
      },
      include: {
        local: { select: { nombre: true } },
        participantes: {
          where: { estado: { not: "descalificado" } },
          include: { usuario: { select: { id: true, nombre: true, email: true } } },
          orderBy: { puntos: "desc" },
        },
        _count: { select: { participantes: true } },
      },
    });

    for (const c of concursosTerminanHoy) {
      if (c._count.participantes < 3) {
        log.push(`[24H_SKIP] ${c.id} - menos de 3 participantes`);
        continue;
      }

      const lider = c.participantes[0];
      const from = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>";
      let enviados = 0;

      for (const p of c.participantes) {
        const pos = c.participantes.findIndex(x => x.id === p.id) + 1;
        const esLider = pos === 1;
        try {
          await resend.emails.send({
            from,
            to: p.usuario.email,
            subject: `⏰ ¡Última oportunidad! "${c.premio}" cierra hoy`,
            html: `<html><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>
<div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">⏰ ¡El concurso cierra hoy!</h2>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Hola ${p.usuario.nombre.split(" ")[0]},</p>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">El concurso <strong style="color:#f5d080">"${c.premio}"</strong> de <strong style="color:#e8a84c">${c.local.nombre}</strong> cierra en pocas horas.</p>
<div style="background-color:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.15);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
<p style="color:rgba(240,234,214,0.5);font-size:14px;margin:0 0 4px">Tu posición actual</p>
<p style="color:#e8a84c;font-size:28px;font-weight:bold;margin:0">#${pos}</p>
<p style="color:rgba(240,234,214,0.5);font-size:14px;margin:4px 0 0">${p.puntos} puntos</p>
${!esLider ? `<p style="color:#ff8080;font-size:13px;margin:8px 0 0">El líder tiene ${lider.puntos} puntos</p>` : `<p style="color:#3db89e;font-size:13px;margin:8px 0 0">¡Vas primero! No bajes la guardia</p>`}
</div>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">${esLider ? "Mantén tu ventaja compartiendo tu link. Cada referido verificado te da +2 puntos." : "Todavía puedes ganar. Comparte tu link con amigos — cada referido verificado te da +2 puntos."}</p>
<div style="text-align:center"><a href="${BASE_URL}/concursos/${c.slug || c.id}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver mi concurso →</a></div>
</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`,
          });
          enviados++;
        } catch (emailErr) {
          log.push(`[24H_ERR] ${c.id} - ${p.usuario.email}: ${emailErr}`);
        }
      }

      await prisma.concurso.update({ where: { id: c.id }, data: { recordatorio24h: true } });
      log.push(`[24H_OK] ${c.id} "${c.premio}" - ${enviados}/${c.participantes.length} emails enviados`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASO 1: Cerrar concursos que terminaron
    // ════════════════════════════════════════════════════════════════════════

    const concursosParaCerrar = await prisma.concurso.findMany({
      where: {
        estado: "activo",
        fechaFin: { lte: now },
      },
      include: {
        local: { select: { id: true, email: true, nombre: true, direccion: true, comuna: true, telefono: true } },
        participantes: {
          where: { estado: { not: "descalificado" } },
          orderBy: { puntos: "desc" },
          take: 3,
          include: { usuario: { select: { id: true, nombre: true, email: true, telefono: true } } },
        },
        _count: { select: { participantes: true } },
      },
    });

    for (const c of concursosParaCerrar) {
      if (c._count.participantes === 0) {
        await prisma.concurso.update({
          where: { id: c.id },
          data: { estado: "expirado", activo: false, premioExpiradoAt: now },
        });
        log.push(`[EXPIRADO] ${c.id} - sin participantes`);
        continue;
      }

      const [p1, p2, p3] = c.participantes;
      const codigo = generarCodigo();
      const token = generarToken();

      // Check for fraud on winner
      const esSospechoso = p1.estado === "sospechoso";

      await prisma.concurso.update({
        where: { id: c.id },
        data: {
          estado: esSospechoso ? "en_revision" : "finalizado",
          activo: false,
          ganador1Id: p1.usuario.id,
          ganador2Id: p2?.usuario.id ?? null,
          ganador3Id: p3?.usuario.id ?? null,
          ganadorActualId: p1.usuario.id,
          codigoEntrega: codigo,
          confirmacionToken: token,
        },
      });

      if (esSospechoso) {
        log.push(`[EN_REVISION] ${c.id} - ganador sospechoso: ${p1.usuario.email}`);
        continue;
      }

      // Notify winner and local
      const emailData = {
        concursoId: c.id,
        titulo: c.premio,
        premio: c.premio,
        codigoEntrega: codigo,
        local: {
          nombre: c.local.nombre,
          direccion: c.local.direccion,
          comuna: c.local.comuna,
          telefono: c.local.telefono,
        },
      };
      const ganadorData = { nombre: p1.usuario.nombre, email: p1.usuario.email, telefono: p1.usuario.telefono };
      const urls = confirmUrls(c.id, token);

      try {
        await emailGanador(emailData, ganadorData, urls.confirm, urls.disputa);
        await emailLocal(emailData, c.local.email, ganadorData);
        await prisma.concurso.update({
          where: { id: c.id },
          data: { ganadorNotificadoAt: now, localNotificadoAt: now },
        });
        log.push(`[FINALIZADO] ${c.id} - notificados: ${p1.usuario.email} y ${c.local.email}`);
      } catch (emailErr) {
        log.push(`[ERROR_EMAIL] ${c.id} - ${emailErr}`);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASO 2: Seguimiento de concursos finalizados
    // ════════════════════════════════════════════════════════════════════════

    const concursosFinalizados = await prisma.concurso.findMany({
      where: { estado: "finalizado" },
      include: {
        local: { select: { id: true, email: true, nombre: true, direccion: true, comuna: true, telefono: true } },
        ganadorActual: { select: { id: true, nombre: true, email: true, telefono: true } },
      },
    });

    for (const c of concursosFinalizados) {
      if (!c.ganadorActual || !c.ganadorNotificadoAt) continue;

      const diasNotificado = diasDesde(c.ganadorNotificadoAt);
      const orden = obtenerOrdenGanadorActual(c);
      const diasLimite = DIAS_RECLAMO[orden] ?? 7;

      // 2a. 48h sin contacto → enviar email con código al ganador
      if (diasNotificado >= 2 && !c.segundoNotificadoAt && orden === 1) {
        const emailData = {
          concursoId: c.id, titulo: c.premio, premio: c.premio, codigoEntrega: c.codigoEntrega!,
          local: { nombre: c.local.nombre, direccion: c.local.direccion, comuna: c.local.comuna, telefono: c.local.telefono },
        };
        try {
          await emailAcreditacion(emailData, { nombre: c.ganadorActual.nombre, email: c.ganadorActual.email, telefono: c.ganadorActual.telefono });
          await prisma.concurso.update({ where: { id: c.id }, data: { segundoNotificadoAt: now } });
          log.push(`[ACREDITACION] ${c.id} - email 48h a ${c.ganadorActual.email}`);
        } catch (e) { log.push(`[ERROR_EMAIL] ${c.id} acreditacion - ${e}`); }
      }

      // 2b. Pasó el plazo y no confirmó → pasar al siguiente
      if (diasNotificado >= diasLimite && !c.premioConfirmadoAt && !c.disputaAt) {
        const siguiente = obtenerSiguienteGanador(c);

        if (siguiente) {
          const token = generarToken();
          const diasSiguiente = DIAS_RECLAMO[siguiente.orden] ?? 3;
          await prisma.concurso.update({
            where: { id: c.id },
            data: {
              ganadorActualId: siguiente.id,
              ganadorDescartadoRazon: "no_reclamo",
              ganadorNotificadoAt: now,
              segundoNotificadoAt: null,
              confirmacionToken: token,
            },
          });

          const nuevoGanador = await prisma.usuario.findUnique({ where: { id: siguiente.id }, select: { nombre: true, email: true, telefono: true } });
          if (nuevoGanador) {
            const emailData = {
              concursoId: c.id, titulo: c.premio, premio: c.premio, codigoEntrega: c.codigoEntrega!,
              local: { nombre: c.local.nombre, direccion: c.local.direccion, comuna: c.local.comuna, telefono: c.local.telefono },
            };
            const urls = confirmUrls(c.id, token);

            try {
              await emailNuevoGanador(emailData, nuevoGanador, siguiente.orden, diasSiguiente, urls.confirm, urls.disputa);
              await emailLocal(emailData, c.local.email, nuevoGanador);
              log.push(`[PASO_SIGUIENTE] ${c.id} - ${siguiente.orden}° lugar: ${nuevoGanador.email}`);
            } catch (e) { log.push(`[ERROR_EMAIL] ${c.id} nuevo ganador - ${e}`); }
          }
        } else {
          // No hay más candidatos → expirar
          await prisma.concurso.update({
            where: { id: c.id },
            data: { estado: "expirado", premioExpiradoAt: now },
          });
          try {
            await emailExpiracion(
              { nombre: c.ganadorActual.nombre, email: c.ganadorActual.email },
              c.premio,
            );
          } catch {}
          log.push(`[EXPIRADO] ${c.id} - sin más candidatos`);
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // RESULTADO
    // ════════════════════════════════════════════════════════════════════════

    console.log("[Cron cerrar-concursos]", log.join(" | "));
    return NextResponse.json({ ok: true, procesados: log.length, detalle: log });
  } catch (error) {
    console.error("[Cron cerrar-concursos] ERROR:", error);
    return NextResponse.json({ error: "Error interno", detalle: String(error) }, { status: 500 });
  }
}
