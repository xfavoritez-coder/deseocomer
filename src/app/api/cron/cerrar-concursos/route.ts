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
  emailAudienciaLocal,
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
    // PASO 0: Recordatorio a participantes de concursos que van a cerrar
    // 3 días → cuando quedan ≤24h | 1 día → cuando quedan ≤8h
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
        _count: { select: { participantes: { where: { estado: { not: "descalificado" } } } } },
      },
    });

    for (const c of concursosTerminanHoy) {
      if (c._count.participantes < 3) {
        log.push(`[REC_SKIP] ${c.id} - menos de 3 participantes`);
        continue;
      }

      // Detectar duración: si ≤30h es concurso de 1 día → solo enviar cuando quedan ≤8h
      const duracionMs = c.fechaActivacion
        ? new Date(c.fechaFin).getTime() - new Date(c.fechaActivacion).getTime()
        : null;
      const esConcurso1Dia = duracionMs !== null && duracionMs <= 30 * 3600000;
      const horasRestantes = (new Date(c.fechaFin).getTime() - now.getTime()) / 3600000;

      if (esConcurso1Dia && horasRestantes > 8) {
        log.push(`[REC_WAIT] ${c.id} "${c.premio}" - concurso 1 día, quedan ${Math.round(horasRestantes)}h, esperando ≤8h`);
        continue;
      }

      // Marcar ANTES de enviar para evitar duplicados si la función se reintenta
      await prisma.concurso.update({ where: { id: c.id }, data: { recordatorio24h: true } });

      const lider = c.participantes[0];
      const from = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>";
      const esSorteo = c.modalidadConcurso === "sorteo";
      const totalBoletos = esSorteo ? c.participantes.reduce((acc, p) => acc + Math.max(1, p.puntos), 0) : 0;
      let enviados = 0;

      // Send emails via Resend batch API (up to 100 per request)
      const BATCH_SIZE = 100;
      for (let b = 0; b < c.participantes.length; b += BATCH_SIZE) {
        const batch = c.participantes.slice(b, b + BATCH_SIZE);
        const emails = batch.map(p => {
          const pos = c.participantes.findIndex(x => x.id === p.id) + 1;
          const esLider = pos === 1;
          const concursoUrl = `${BASE_URL}/concursos/${c.slug || c.id}`;

          if (esSorteo) {
            const boletos = Math.max(1, p.puntos);
            const pct = Math.round((boletos / totalBoletos) * 100);
            return {
              from,
              to: p.usuario.email,
              subject: `🎲 ¡Último día! El sorteo de "${c.premio}" cierra hoy`,
              html: `<html><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>
<div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">🎲 ¡El sorteo cierra hoy!</h2>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Hola ${p.usuario.nombre.split(" ")[0]},</p>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">El sorteo de <strong style="color:#f5d080">"${c.premio}"</strong> de <strong style="color:#e8a84c">${c.local.nombre}</strong> cierra en pocas horas.</p>
<div style="background-color:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.15);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
<p style="color:rgba(240,234,214,0.5);font-size:14px;margin:0 0 4px">Tus boletos actuales</p>
<p style="color:#e8a84c;font-size:28px;font-weight:bold;margin:0">${boletos} 🎟️</p>
<p style="color:rgba(240,234,214,0.5);font-size:14px;margin:4px 0 0">de ${totalBoletos} boletos en juego</p>
<p style="color:#3db89e;font-size:14px;font-weight:bold;margin:8px 0 0">${pct}% de chances de ganar</p>
</div>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">¿Quieres más chances? Cada amigo que entre por tu link te da <strong style="color:#f5d080">+3 boletos</strong> extra — y a él también. Con solo 1 amigo pasas de ${boletos} a ${boletos + 3} boletos.</p>
<div style="text-align:center"><a href="${concursoUrl}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver sorteo →</a></div>
<p style="color:#5a4028;font-size:13px;line-height:1.6;text-align:center;margin-top:16px;margin-bottom:0">El ganador se elige al azar entre todos los boletos.<br/>Más boletos = más probabilidad de ganar.</p>
</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`,
            };
          }

          // Modalidad mérito
          return {
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
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">${esLider ? "Mantén tu ventaja compartiendo tu link. Cada referido verificado te da hasta +3 puntos." : "Todavía puedes ganar. Comparte tu link con amigos — cada referido verificado te da hasta +3 puntos."}</p>
<div style="text-align:center"><a href="${concursoUrl}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver mi concurso →</a></div>
</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`,
          };
        });
        try {
          const result = await resend.batch.send(emails);
          enviados += result.data?.data?.length ?? emails.length;
        } catch (batchErr) {
          log.push(`[24H_ERR] ${c.id} - batch error: ${batchErr}`);
        }
      }

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

      const codigo = generarCodigo();
      const token = generarToken();

      let ganador1Id: string;
      let ganador2Id: string | null = null;
      let ganador3Id: string | null = null;

      if (c.modalidadConcurso === "sorteo") {
        // Sorteo: necesitamos todos los participantes
        const todos = await prisma.participanteConcurso.findMany({
          where: { concursoId: c.id, estado: { not: "descalificado" } },
          include: { usuario: { select: { id: true, nombre: true, email: true, telefono: true } } },
        });

        // Si hay ganador preseleccionado por admin, usarlo
        if (c.ganadorPreseleccionadoId && todos.some(p => p.usuario.id === c.ganadorPreseleccionadoId)) {
          ganador1Id = c.ganadorPreseleccionadoId;
          const ganadorNombre = todos.find(p => p.usuario.id === ganador1Id)?.usuario.nombre ?? "?";
          log.push(`[SORTEO_PRESEL] ${c.id} "${c.premio}" — ganador preseleccionado: ${ganadorNombre}`);
        } else {
          // Sorteo ponderado aleatorio
          const totalBoletos = todos.reduce((acc, p) => acc + Math.max(1, p.puntos), 0);
          let rand = Math.random() * totalBoletos;
          let ganadorIdx = 0;
          for (let i = 0; i < todos.length; i++) {
            rand -= Math.max(1, todos[i].puntos);
            if (rand <= 0) { ganadorIdx = i; break; }
          }
          ganador1Id = todos[ganadorIdx].usuario.id;
          log.push(`[SORTEO] ${c.id} "${c.premio}" — ${totalBoletos} boletos, ganador: ${todos[ganadorIdx].usuario.nombre}`);
        }
        // Fallbacks por ranking (para si el ganador no reclama)
        const fallbacks = todos.filter(p => p.usuario.id !== ganador1Id).sort((a, b) => b.puntos - a.puntos);
        ganador2Id = fallbacks[0]?.usuario.id ?? null;
        ganador3Id = fallbacks[1]?.usuario.id ?? null;
      } else {
        // Méritos: ranking normal
        const [p1, p2, p3] = c.participantes;
        ganador1Id = p1.usuario.id;
        ganador2Id = p2?.usuario.id ?? null;
        ganador3Id = p3?.usuario.id ?? null;
      }

      // Check for fraud on winner
      const ganadorPart = c.participantes.find(p => p.usuario.id === ganador1Id) ?? c.participantes[0];
      const esSospechoso = ganadorPart?.estado === "sospechoso";

      await prisma.concurso.update({
        where: { id: c.id },
        data: {
          estado: esSospechoso ? "en_revision" : "finalizado",
          activo: false,
          ganador1Id,
          ganador2Id,
          ganador3Id,
          ganadorActualId: ganador1Id,
          codigoEntrega: codigo,
          confirmacionToken: token,
        },
      });

      // Update winner stats
      await prisma.usuario.update({
        where: { id: ganador1Id },
        data: { totalConcursosGanados: { increment: 1 } }
      }).catch(() => {});

      // Update stats for top 20 participants (batched to reduce queries)
      const allParticipants = await prisma.participanteConcurso.findMany({
        where: { concursoId: c.id, estado: { not: "descalificado" } },
        orderBy: { puntos: "desc" },
        select: { usuarioId: true, puntos: true },
        take: 20,
      });
      if (allParticipants.length > 0) {
        const userIds = allParticipants.map(p => p.usuarioId);
        const existingUsers = await prisma.usuario.findMany({
          where: { id: { in: userIds } },
          select: { id: true, mejorPosicion: true },
        });
        const posMap = new Map(existingUsers.map(u => [u.id, u.mejorPosicion]));
        await Promise.all(allParticipants.map((p, i) => {
          const posicion = i + 1;
          const mejorActual = posMap.get(p.usuarioId);
          return prisma.usuario.update({
            where: { id: p.usuarioId },
            data: {
              totalPuntosHistoricos: { increment: p.puntos },
              ...(!mejorActual || posicion < mejorActual ? { mejorPosicion: posicion } : {}),
            },
          }).catch(() => {});
        }));
      }

      // Fetch winner data
      const ganadorUser = await prisma.usuario.findUnique({
        where: { id: ganador1Id },
        select: { nombre: true, email: true, telefono: true },
      });

      if (esSospechoso) {
        log.push(`[EN_REVISION] ${c.id} - ganador sospechoso: ${ganadorUser?.email}`);
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
      const ganadorData = { nombre: ganadorUser?.nombre ?? "", email: ganadorUser?.email ?? "", telefono: ganadorUser?.telefono ?? "" };
      const urls = confirmUrls(c.id, token);

      try {
        const coordinarUrl = `${BASE_URL}/concursos/coordinar?id=${c.id}&token=${token}`;
        await emailGanador(emailData, ganadorData, urls.confirm, urls.disputa);
        await emailLocal({ ...emailData, coordinarUrl }, c.local.email, ganadorData);
        await prisma.concurso.update({
          where: { id: c.id },
          data: { ganadorNotificadoAt: now, localNotificadoAt: now },
        });
        log.push(`[FINALIZADO] ${c.id} - notificados: ${ganadorUser?.email} y ${c.local.email}`);
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
              const coordinarUrl = `${BASE_URL}/concursos/coordinar?id=${c.id}&token=${token}`;
              await emailNuevoGanador(emailData, nuevoGanador, siguiente.orden, diasSiguiente, urls.confirm, urls.disputa);
              await emailLocal({ ...emailData, coordinarUrl }, c.local.email, nuevoGanador);
              await prisma.concurso.update({
                where: { id: c.id },
                data: { localNotificadoAt: now, fechaPropuestaAt: null, fechaPropuesta: null },
              });
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
    // PASO 3: Email de audiencia al local (12h después de finalizar)
    // ════════════════════════════════════════════════════════════════════════

    const hace4h = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const concursosParaAudiencia = await prisma.concurso.findMany({
      where: {
        estado: { in: ["finalizado", "completado"] },
        audienciaNotificadoAt: null,
        localNotificadoAt: { not: null, lte: hace4h },
      },
      include: {
        local: { select: { id: true, email: true, nombre: true } },
        participantes: {
          where: { estado: { not: "descalificado" } },
          include: {
            usuario: {
              select: { estiloAlimentario: true, comidasFavoritas: true },
            },
          },
        },
        _count: { select: { participantes: { where: { estado: { not: "descalificado" } } } } },
      },
    });

    for (const c of concursosParaAudiencia) {
      const total = c._count.participantes;
      if (total === 0) continue;

      // Contar estilos alimentarios
      let veganos = 0, vegetarianos = 0, comeDeTodo = 0;
      const comidasCount: Record<string, number> = {};

      for (const p of c.participantes) {
        const estilo = p.usuario.estiloAlimentario?.toLowerCase() ?? "";
        if (estilo === "vegano") veganos++;
        else if (estilo === "vegetariano") vegetarianos++;
        else comeDeTodo++;

        for (const comida of p.usuario.comidasFavoritas ?? []) {
          const key = comida.trim();
          if (key) comidasCount[key] = (comidasCount[key] ?? 0) + 1;
        }
      }

      const comidasTop = Object.entries(comidasCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nombre, count]) => ({ nombre, count }));

      try {
        await emailAudienciaLocal({
          concursoId: c.id,
          titulo: c.premio,
          localNombre: c.local.nombre,
          totalParticipantes: total,
          estilos: [
            { label: "Come de todo", emoji: "🥩", count: comeDeTodo },
            { label: "Vegetarianos", emoji: "🌱", count: vegetarianos },
            { label: "Veganos", emoji: "🌿", count: veganos },
          ],
          comidasTop,
          panelUrl: `${BASE_URL}/panel/concursos`,
        }, c.local.email);

        await prisma.concurso.update({
          where: { id: c.id },
          data: { audienciaNotificadoAt: now },
        });
        log.push(`[AUDIENCIA] ${c.id} "${c.premio}" - email enviado a ${c.local.email} (${total} participantes)`);
      } catch (e) {
        log.push(`[ERROR_AUDIENCIA] ${c.id} - ${e}`);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTIVAR CONCURSOS PROGRAMADOS
    // ════════════════════════════════════════════════════════════════════════

    const aActivar = await prisma.concurso.findMany({
      where: {
        estado: "programado",
        fechaActivacion: { lte: now },
      },
      include: {
        listaEspera: { where: { notificado: false } },
      },
    });

    for (const concurso of aActivar) {
      await prisma.concurso.update({
        where: { id: concurso.id },
        data: { estado: "activo", activo: true },
      });
      log.push(`[ACTIVADO] ${concurso.id} - ${concurso.premio}`);

      // Notificar lista de espera via batch API
      if (concurso.listaEspera.length > 0) {
        const fromEspera = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>";
        const emailsEspera = concurso.listaEspera.map(entrada => ({
          from: fromEspera,
          to: entrada.email,
          subject: `🔮 ¡Ya comenzó! ${concurso.premio}`,
          html: `<div style="background:#1a0e05;font-family:Georgia,serif;padding:40px 24px;max-width:560px;margin:0 auto"><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.2em;text-align:center">🧞 DeseoComer</h1><div style="background:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:32px;margin-top:24px"><p style="font-size:24px;text-align:center;margin-bottom:16px">🔮</p><h2 style="color:#f5d080;font-size:20px;text-align:center;margin-bottom:12px">¡El concurso que esperabas ya comenzó!</h2><p style="color:#c0a060;font-size:16px;line-height:1.6;text-align:center;margin-bottom:8px">${entrada.nombre ? `Hola ${entrada.nombre},` : "Hola,"}</p><p style="color:#c0a060;font-size:15px;line-height:1.6;text-align:center;margin-bottom:24px">El concurso <strong style="color:#e8a84c">${concurso.premio}</strong> acaba de activarse. ¡Entra ahora y empieza a sumar puntos!</p><div style="text-align:center"><a href="https://deseocomer.com/concursos/${concurso.slug || concurso.id}" style="background:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">¡Participar ahora! →</a></div><p style="color:#5a4028;font-size:13px;text-align:center;margin-top:20px;line-height:1.6">💡 Invita amigos para sumar más puntos y aumentar tus chances</p></div></div>`,
        }));
        try {
          await resend.batch.send(emailsEspera);
          await prisma.listaEsperaConcurso.updateMany({
            where: { id: { in: concurso.listaEspera.map(e => e.id) } },
            data: { notificado: true },
          });
        } catch (emailErr) {
          console.error(`[Cron] Error batch lista espera ${concurso.id}:`, emailErr);
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
