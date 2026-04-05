import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const refCodeParam = searchParams.get("ref");
    const concursoParam = searchParams.get("concurso");
    if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

    const usuario = await prisma.usuario.findFirst({ where: { tokenVerificacion: token } });
    if (!usuario) return NextResponse.json({ error: "Token inválido o ya usado" }, { status: 400 });

    // Reject tokens older than 48 hours (use updatedAt since token is regenerated on resend)
    const tokenAge = Date.now() - new Date(usuario.updatedAt).getTime();
    if (tokenAge > 48 * 60 * 60 * 1000) return NextResponse.json({ error: "Este enlace ha expirado. Solicita uno nuevo." }, { status: 400 });

    await prisma.usuario.update({ where: { id: usuario.id }, data: { emailVerificado: true, emailVerificadoAt: new Date(), tokenVerificacion: null } });

    let autoReferidorNombre: string | null = null;
    let autoConcursoSlug: string | null = null;

    // Auto-participate in concurso if referred
    if (refCodeParam && concursoParam) {
      try {
        const referidor = await prisma.usuario.findFirst({ where: { OR: [{ codigoRef: refCodeParam.toUpperCase() }, { id: refCodeParam }] }, select: { id: true } });
        if (referidor) {
          const concurso = await prisma.concurso.findFirst({
            where: { OR: [{ id: concursoParam }, { slug: concursoParam }], activo: true },
          });
          if (concurso && new Date(concurso.fechaFin) > new Date()) {
            const yaParticipa = await prisma.participanteConcurso.findUnique({
              where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: usuario.id } },
            });
            if (!yaParticipa) {
              // Create participation via internal API call logic
              const refParticipante = await prisma.participanteConcurso.findUnique({
                where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidor.id } },
              });
              const totalPart = await prisma.participanteConcurso.count({ where: { concursoId: concurso.id } });
              const esMadrugador = totalPart < 10;
              const puntosBase = 1;
              const puntosRefBonus = 3;
              const puntosMadrugador = esMadrugador ? 2 : 0;

              await prisma.participanteConcurso.create({
                data: {
                  concursoId: concurso.id, usuarioId: usuario.id, referidoPor: referidor.id,
                  puntos: puntosBase + puntosRefBonus + puntosMadrugador,
                  referidorDirectoId: referidor.id, esMadrugador, puntosMadrugador,
                },
              });

              // Give referrer +3 points
              if (refParticipante) {
                await prisma.participanteConcurso.update({
                  where: { id: refParticipante.id },
                  data: { puntos: { increment: 3 }, puntosReferidosNuevos: { increment: 3 } },
                });
              }

              // Notificación al nuevo participante
              const totalPts = puntosBase + puntosRefBonus + puntosMadrugador;
              prisma.notificacion.create({ data: { usuarioId: usuario.id, tipo: "entrada_concurso", mensaje: `¡Entraste al concurso con ${totalPts} puntos! (+1 base, +3 por link de referido${esMadrugador ? ", +2 madrugador" : ""}) 🎉` } }).catch(() => {});

              // Notificación al referidor
              if (refParticipante) {
                const nombreRef = usuario.nombre?.split(" ")[0] ?? "Alguien";
                prisma.notificacion.create({ data: { usuarioId: referidor.id, tipo: "referido_nuevo", mensaje: `${nombreRef} activó su cuenta con tu link. +3 pts para ti 🎉` } }).catch(() => {});
              }

              prisma.usuario.update({ where: { id: usuario.id }, data: { totalConcursosParticipados: { increment: 1 } } }).catch(() => {});
            }
          }
        }
        // Set concursoSlug and referidorNombre for the response
        const refUser = referidor ? await prisma.usuario.findUnique({ where: { id: referidor.id }, select: { nombre: true } }) : null;
        autoReferidorNombre = refUser?.nombre?.split(" ")[0] ?? null;
        autoConcursoSlug = concursoParam;
      } catch (e) { console.error("[verificar-email] Error auto-participar:", e); }
    }

    // Mover puntos pendientes a reales en concursos activos
    const participaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: usuario.id, puntosPendientes: { gt: 0 } },
      include: { concurso: { select: { activo: true, fechaFin: true } } },
    });
    for (const p of participaciones) {
      if (p.concurso.activo && new Date(p.concurso.fechaFin) > new Date()) {
        await prisma.participanteConcurso.update({
          where: { id: p.id },
          data: { puntos: { increment: p.puntosPendientes }, puntosPendientes: 0 },
        });
      }
    }

    // Acreditar puntos al referidor directo ahora que este usuario verificó email
    let referidorNombre: string | null = null;
    let concursoSlug: string | null = null;
    const misParticipaciones2 = await prisma.participanteConcurso.findMany({
      where: { usuarioId: usuario.id, referidorDirectoId: { not: null } },
      select: { concursoId: true, referidorDirectoId: true },
    });
    for (const mp of misParticipaciones2) {
      if (!mp.referidorDirectoId) continue;
      const conc = await prisma.concurso.findUnique({
        where: { id: mp.concursoId },
        select: { activo: true, fechaFin: true, premio: true, slug: true },
      });
      if (!conc?.activo || new Date(conc.fechaFin) <= new Date()) continue;

      const refPart = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: mp.concursoId, usuarioId: mp.referidorDirectoId } },
      });
      if (refPart && refPart.puntosPendientes > 0) {
        await prisma.participanteConcurso.update({
          where: { id: refPart.id },
          data: { puntos: { increment: refPart.puntosPendientes }, puntosPendientes: 0 },
        });

        // Notificar al referidor directo que se le acreditaron los puntos
        const refUser = await prisma.usuario.findUnique({ where: { id: mp.referidorDirectoId }, select: { nombre: true } });
        referidorNombre = refUser?.nombre?.split(" ")[0] ?? null;
        concursoSlug = conc.slug ?? mp.concursoId;
        const nombreReferido = usuario.nombre?.split(" ")[0] ?? "Alguien";
        prisma.notificacion.create({
          data: {
            usuarioId: mp.referidorDirectoId,
            tipo: "referido",
            mensaje: `${nombreReferido} activó su cuenta. ¡+${refPart.puntosPendientes} puntos para ti en "${conc.premio}"! 🎉`,
          },
        }).catch(() => {});
      }
    }

    // --- NIVEL 2: Acreditar puntos por referidos de referidos ---
    // Find all participations where this user was referred by someone
    const misParticipaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: usuario.id },
      select: { concursoId: true, referidorDirectoId: true, referidorNivel2Id: true },
    });
    console.log("[Nivel2] Buscando participaciones con nivel2 para usuario:", usuario.id, usuario.nombre);
    console.log("[Nivel2] Total encontradas:", misParticipaciones.length);

    for (const mp of misParticipaciones) {
      if (!mp.referidorNivel2Id) continue;
      console.log("[Nivel2] Procesando concursoId:", mp.concursoId, "nivel2Id:", mp.referidorNivel2Id);

      // Get the concurso to check if active
      const concurso = await prisma.concurso.findUnique({
        where: { id: mp.concursoId },
        select: { activo: true, fechaFin: true },
      });
      if (!concurso?.activo || new Date(concurso.fechaFin) <= new Date()) continue;

      // Get the nivel 2 referrer's participation
      const nivel2Participante = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: mp.concursoId, usuarioId: mp.referidorNivel2Id } },
      });
      if (!nivel2Participante) continue;

      // Get the direct referrer's user data for antifraude check
      const referidorDirecto = mp.referidorDirectoId
        ? await prisma.usuario.findUnique({ where: { id: mp.referidorDirectoId }, select: { ipRegistro: true, createdAt: true } })
        : null;
      const referidorNivel2 = await prisma.usuario.findUnique({
        where: { id: mp.referidorNivel2Id },
        select: { ipRegistro: true },
      });

      // Antifraude checks
      const mismaIP = (usuario.ipRegistro && usuario.ipRegistro !== "unknown" && usuario.ipRegistro !== "") &&
        (usuario.ipRegistro === referidorDirecto?.ipRegistro || usuario.ipRegistro === referidorNivel2?.ipRegistro);
      const menosDeUnaHora = referidorDirecto?.createdAt
        ? (Date.now() - new Date(referidorDirecto.createdAt).getTime()) < 3600000
        : false;

      console.log("[Nivel2] mismaIP:", mismaIP, "menosDeUnaHora:", menosDeUnaHora);
      console.log("[Nivel2] puntosNivel2 actuales:", nivel2Participante?.puntosNivel2);

      if (mismaIP || menosDeUnaHora) {
        // Mark as pending for review
        await prisma.participanteConcurso.update({
          where: { id: nivel2Participante.id },
          data: { puntosNivel2Pendientes: { increment: 1 } },
        });
      } else {
        // Check limit of 10 nivel 2 points
        if ((nivel2Participante.puntosNivel2 ?? 0) < 10) {
          await prisma.participanteConcurso.update({
            where: { id: nivel2Participante.id },
            data: {
              puntos: { increment: 1 },
              puntosNivel2: { increment: 1 },
            },
          });
          // Notification: nivel 2 point
          const concursoData = await prisma.concurso.findUnique({ where: { id: mp.concursoId }, select: { premio: true } });
          const refDirectoNombre = mp.referidorDirectoId
            ? await prisma.usuario.findUnique({ where: { id: mp.referidorDirectoId }, select: { nombre: true } })
            : null;
          prisma.notificacion.create({
            data: {
              usuarioId: mp.referidorNivel2Id!,
              tipo: "nivel2",
              mensaje: `La red de ${refDirectoNombre?.nombre?.split(" ")[0] ?? "tu referido"} te sumó +1 punto en "${concursoData?.premio ?? "un concurso"}" 🧞`,
            },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ ok: true, id: usuario.id, nombre: usuario.nombre, email: usuario.email, referidorNombre: referidorNombre || autoReferidorNombre, concursoSlug: concursoSlug || autoConcursoSlug });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
