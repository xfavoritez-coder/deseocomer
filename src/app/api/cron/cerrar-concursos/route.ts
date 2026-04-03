import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

function generarCodigo(concursoId: string) {
  return `DC-${concursoId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
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
      const codigo = generarCodigo(c.id);
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
