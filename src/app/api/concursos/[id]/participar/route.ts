import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { primerParticipanteHtml } from "@/emails/PrimerParticipanteEmail";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { usuarioId, referidoPor } = await req.json();
    if (!usuarioId) return NextResponse.json({ error: "Falta usuarioId" }, { status: 400 });

    // Verify user has confirmed email
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { emailVerificado: true } });
    if (!usuario?.emailVerificado) {
      return NextResponse.json({ error: "Debes verificar tu email para participar. Revisa tu bandeja de entrada.", codigo: "EMAIL_NO_VERIFICADO" }, { status: 403 });
    }

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }], activo: true },
    });
    if (!concurso) return NextResponse.json({ error: "Concurso no encontrado o inactivo" }, { status: 404 });
    if (new Date(concurso.fechaFin) <= new Date()) return NextResponse.json({ error: "Concurso finalizado" }, { status: 400 });

    // Check if already participating
    const existing = await prisma.participanteConcurso.findUnique({
      where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId } },
    });
    if (existing) return NextResponse.json({ error: "Ya participas en este concurso" }, { status: 400 });

    // Build referral chain
    let referidorDirectoId: string | null = null;
    let referidorNivel2Id: string | null = null;

    if (referidoPor) {
      referidorDirectoId = referidoPor;
      // Check if the direct referrer has their own referrer (level 2)
      const refDirecto = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidoPor } },
      });
      if (refDirecto?.referidorDirectoId) {
        referidorNivel2Id = refDirecto.referidorDirectoId;
      }
    }

    // Bonus madrugador: primeros 10 participantes
    const totalParticipantes = await prisma.participanteConcurso.count({
      where: { concursoId: concurso.id }
    });
    const esMadrugador = totalParticipantes < 10;

    // Create participation (+1 por unirse, +2 bonus madrugador si aplica)
    const participante = await prisma.participanteConcurso.create({
      data: {
        concursoId: concurso.id, usuarioId, referidoPor: referidoPor || null, puntos: esMadrugador ? 3 : 1,
        referidorDirectoId: referidorDirectoId || null, referidorNivel2Id: referidorNivel2Id || null,
        esMadrugador, puntosMadrugador: esMadrugador ? 2 : 0,
      },
    });

    // Notificación madrugador (con dedup)
    if (esMadrugador) {
      const yaNotifMad = await prisma.notificacion.findFirst({ where: { usuarioId, tipo: "madrugador", createdAt: { gte: new Date(Date.now() - 60000) } } });
      if (!yaNotifMad) prisma.notificacion.create({ data: { usuarioId, tipo: "madrugador", mensaje: "¡Entraste entre los primeros 10! +2 pts bonus ⚡" } }).catch(() => {});
    }

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

    // Referral points: +3 si referido es nuevo (< 7 días), +2 si existente
    if (referidoPor) {
      const refParticipante = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidoPor } },
      });
      if (refParticipante) {
        const referidoUser = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { createdAt: true, emailVerificado: true, ipRegistro: true } });
        const esNuevo = referidoUser && (Date.now() - new Date(referidoUser.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
        const puntosRef = esNuevo ? 3 : 2;

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
          ? `${refNombre?.nombre?.split(" ")[0] ?? "Alguien"} se registró con tu link. +${puntosRef} pts para ti 🎉`
          : `${refNombre?.nombre?.split(" ")[0] ?? "Alguien"} participó con tu código. +${puntosRef} pts 👏`;
        const yaNotifRef = await prisma.notificacion.findFirst({ where: { usuarioId: referidoPor, mensaje: msgRef, createdAt: { gte: new Date(Date.now() - 60000) } } });
        if (!yaNotifRef) prisma.notificacion.create({ data: { usuarioId: referidoPor, tipo: esNuevo ? "referido_nuevo" : "referido_existente", mensaje: msgRef } }).catch(() => {});
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
