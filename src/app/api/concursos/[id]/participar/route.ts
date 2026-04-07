import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { primerParticipanteHtml } from "@/emails/PrimerParticipanteEmail";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { usuarioId, referidoPor } = await req.json();
    if (!usuarioId) return NextResponse.json({ error: "Falta usuarioId" }, { status: 400 });

    // Verify user has confirmed email and is not blocked
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { emailVerificado: true, telefonoVerificado: true, tipo: true } });
    if (usuario?.tipo === "bloqueado") {
      return NextResponse.json({ error: "Tu cuenta ha sido suspendida por actividad fraudulenta. No puedes participar en concursos.", codigo: "CUENTA_BLOQUEADA" }, { status: 403 });
    }
    if (!usuario?.emailVerificado) {
      return NextResponse.json({ error: "Debes verificar tu email para participar. Revisa tu bandeja de entrada.", codigo: "EMAIL_NO_VERIFICADO" }, { status: 403 });
    }

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }], activo: true },
    });
    if (!concurso) return NextResponse.json({ error: "Concurso no encontrado o inactivo" }, { status: 404 });
    if (new Date(concurso.fechaFin) <= new Date()) return NextResponse.json({ error: "Concurso finalizado" }, { status: 400 });

    // Phone verification required for all contests
    if (!usuario.telefonoVerificado) {
      return NextResponse.json({ error: "Debes verificar tu número de celular para participar.", codigo: "TELEFONO_NO_VERIFICADO" }, { status: 403 });
    }

    // Check if already participating
    const existing = await prisma.participanteConcurso.findUnique({
      where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId } },
    });
    if (existing) return NextResponse.json({ error: "Ya participas en este concurso" }, { status: 400 });

    // Build referral chain — skip if referrer is blocked/descalificado
    let referidorDirectoId: string | null = null;
    let referidorNivel2Id: string | null = null;
    let refBloqueado = false;

    if (referidoPor) {
      const refUser = await prisma.usuario.findUnique({ where: { id: referidoPor }, select: { tipo: true } });
      const refParticipacion = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidoPor } },
      });

      if (refUser?.tipo === "bloqueado" || refParticipacion?.estado === "descalificado") {
        // Referrer is blocked — let user participate but without referral bonus
        refBloqueado = true;
      } else if (refParticipacion) {
        referidorDirectoId = referidoPor;
        if (refParticipacion.referidorDirectoId) {
          referidorNivel2Id = refParticipacion.referidorDirectoId;
        }
      }
    }

    // Rate limit: if referrer got 5+ referrals in last 15 min, mark as suspicious
    if (referidorDirectoId) {
      const hace15min = new Date(Date.now() - 15 * 60 * 1000);
      const refRecientes = await prisma.participanteConcurso.count({
        where: { concursoId: concurso.id, referidorDirectoId, createdAt: { gte: hace15min } },
      });
      if (refRecientes >= 5) {
        // Mark referrer as suspicious
        await prisma.participanteConcurso.updateMany({
          where: { concursoId: concurso.id, usuarioId: referidorDirectoId, estado: "activo" },
          data: { estado: "sospechoso" },
        });
      }
    }

    // Bonus madrugador: primeros 10 participantes
    const totalParticipantes = await prisma.participanteConcurso.count({
      where: { concursoId: concurso.id }
    });
    const esMadrugador = totalParticipantes < 10;

    // Create participation: 1 base + 3 bonus referido + 2 bonus madrugador
    const puntosBase = 1;
    const puntosRefBonus = (referidorDirectoId && !refBloqueado) ? 3 : 0;
    const puntosMadrugador = esMadrugador ? 2 : 0;
    const participante = await prisma.participanteConcurso.create({
      data: {
        concursoId: concurso.id, usuarioId, referidoPor: referidoPor || null, puntos: puntosBase + puntosRefBonus + puntosMadrugador,
        referidorDirectoId: referidorDirectoId || null, referidorNivel2Id: referidorNivel2Id || null,
        esMadrugador, puntosMadrugador, bonusRef: puntosRefBonus,
      },
    });

    // Notificación al entrar al concurso
    const totalPts = puntosBase + puntosRefBonus + puntosMadrugador;
    const premioCorto = concurso.premio.length > 30 ? concurso.premio.substring(0, 30) + "..." : concurso.premio;
    const msgEntrada = referidoPor
      ? `¡Entraste a "${premioCorto}" con ${totalPts} puntos! (+1 base, +3 por link de referido${esMadrugador ? ", +2 madrugador" : ""}) 🎉`
      : `¡Entraste a "${premioCorto}" con ${totalPts} punto${totalPts > 1 ? "s" : ""}!${esMadrugador ? " (+2 bonus madrugador ⚡)" : " Invita amigos para sumar más 🚀"}`;
    prisma.notificacion.create({ data: { usuarioId, tipo: "entrada_concurso", mensaje: msgEntrada, datos: { concursoSlug: concurso.slug || concurso.id } } }).catch(() => {});

    // Incrementar totalConcursosParticipados
    prisma.usuario.update({
      where: { id: usuarioId },
      data: { totalConcursosParticipados: { increment: 1 } }
    }).catch(() => {});

    // Email al local: primer participante (una sola vez por cuenta de local)
    try {
      const local = await prisma.local.findUnique({ where: { id: concurso.localId }, select: { id: true, nombre: true, email: true, primerParticipanteNotificado: true } });
      if (local && !local.primerParticipanteNotificado) {
        const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nombre: true } });
        const emailResult = await resend.emails.send({
          from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
          to: local.email,
          subject: `🎉 ¡Tu concurso tiene su primer participante! — ${concurso.premio}`,
          html: primerParticipanteHtml({
            nombreLocal: local.nombre,
            premioConcurso: concurso.premio,
            nombreParticipante: usuario?.nombre ?? "Un usuario",
          }),
        });
        console.log(`[Email primer participante] Enviado a ${local.email} para concurso ${concurso.premio}`, emailResult);
        // Solo marcar como notificado si el email se envió correctamente
        await prisma.local.update({ where: { id: local.id }, data: { primerParticipanteNotificado: true } });
      }
    } catch (emailErr) {
      console.error("[Email primer participante] Error:", emailErr);
    }

    // Referral points: +3 si referido es nuevo (< 7 días), +1 si existente
    if (referidoPor) {
      const refParticipante = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidoPor } },
      });
      if (refParticipante) {
        const referidoUser = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { createdAt: true, emailVerificado: true, ipRegistro: true } });
        const esNuevo = referidoUser && (Date.now() - new Date(referidoUser.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
        const puntosRef = esNuevo ? 3 : 1;

        if (referidoUser?.emailVerificado) {
          // Usuario ya verificado → acreditar puntos directamente
          await prisma.participanteConcurso.update({
            where: { id: refParticipante.id },
            data: {
              puntos: { increment: puntosRef },
              ...(esNuevo ? { puntosReferidosNuevos: { increment: puntosRef } } : { puntosReferidosExistentes: { increment: puntosRef } }),
            },
          });
        } else {
          // Usuario no verificado → puntos pendientes hasta que verifique
          await prisma.participanteConcurso.update({
            where: { id: refParticipante.id },
            data: {
              puntosPendientes: { increment: puntosRef },
              ...(esNuevo ? { puntosReferidosNuevos: { increment: puntosRef } } : { puntosReferidosExistentes: { increment: puntosRef } }),
            },
          });
        }

        // Notification (con dedup)
        const refNombre = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nombre: true } });
        const msgRef = esNuevo
          ? `${refNombre?.nombre?.split(" ")[0] ?? "Alguien"} se registró con tu link en "${premioCorto}". +${puntosRef} pts para ti 🎉`
          : `${refNombre?.nombre?.split(" ")[0] ?? "Alguien"} participó con tu código en "${premioCorto}". +${puntosRef} pts 👏`;
        const yaNotifRef = await prisma.notificacion.findFirst({ where: { usuarioId: referidoPor, mensaje: { contains: refNombre?.nombre?.split(" ")[0] ?? "" }, createdAt: { gte: new Date(Date.now() - 60000) } } });
        if (!yaNotifRef) prisma.notificacion.create({ data: { usuarioId: referidoPor, tipo: esNuevo ? "referido_nuevo" : "referido_existente", mensaje: msgRef, datos: { concursoSlug: concurso.slug || concurso.id } } }).catch(() => {});
      }
    }

    // Nivel 2: si el usuario ya está verificado, acreditar inmediatamente
    if (usuario.emailVerificado && referidorNivel2Id) {
      const nivel2Part = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidorNivel2Id } },
      });
      if (nivel2Part) {
        const usuarioCompleto = await prisma.usuario.findUnique({
          where: { id: usuarioId }, select: { ipRegistro: true, createdAt: true }
        });
        const refDirectoUser = referidorDirectoId
          ? await prisma.usuario.findUnique({ where: { id: referidorDirectoId }, select: { ipRegistro: true, createdAt: true } })
          : null;
        const nivel2User = await prisma.usuario.findUnique({
          where: { id: referidorNivel2Id }, select: { ipRegistro: true }
        });

        const mismaIP = usuarioCompleto?.ipRegistro && usuarioCompleto.ipRegistro !== "unknown" && usuarioCompleto.ipRegistro !== "" &&
          (usuarioCompleto.ipRegistro === refDirectoUser?.ipRegistro || usuarioCompleto.ipRegistro === nivel2User?.ipRegistro);
        const menosDeUnaHora = refDirectoUser?.createdAt
          ? Date.now() - new Date(refDirectoUser.createdAt).getTime() < 3600000
          : false;

        if (mismaIP || menosDeUnaHora) {
          await prisma.participanteConcurso.update({
            where: { id: nivel2Part.id },
            data: { puntosNivel2Pendientes: { increment: 1 } },
          });
        } else if ((nivel2Part.puntosNivel2 ?? 0) < 10) {
          await prisma.participanteConcurso.update({
            where: { id: nivel2Part.id },
            data: { puntos: { increment: 1 }, puntosNivel2: { increment: 1 } },
          });
          const refDirectoNombre = referidorDirectoId
            ? await prisma.usuario.findUnique({ where: { id: referidorDirectoId }, select: { nombre: true } })
            : null;
          const msgN2 = `+1 punto — ${refDirectoNombre?.nombre?.split(" ")[0] ?? "tu referido"} trajo a alguien a tu red 🧞`;
          const yaNotifN2 = await prisma.notificacion.findFirst({ where: { usuarioId: referidorNivel2Id, mensaje: msgN2, createdAt: { gte: new Date(Date.now() - 60000) } } });
          if (!yaNotifN2) prisma.notificacion.create({ data: { usuarioId: referidorNivel2Id, tipo: "nivel2", mensaje: msgN2 } }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ ...participante, esMadrugador, totalParticipantes: totalParticipantes + 1 }, { status: 201 });
  } catch (error) {
    console.error("[API /concursos/[id]/participar]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
