import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarCodigoSMS } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    const { userId, codigo } = await req.json();
    if (!userId || !codigo) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { telefono: true, codigoSMSExpira: true, telefonoVerificado: true },
    });

    if (!user || !user.telefono) {
      return NextResponse.json({ error: "No hay número pendiente de verificar" }, { status: 400 });
    }

    if (user.telefonoVerificado) {
      return NextResponse.json({ ok: true, yaVerificado: true });
    }

    // Check expiration
    if (user.codigoSMSExpira && new Date(user.codigoSMSExpira) < new Date()) {
      return NextResponse.json({ error: "El código expiró. Solicita uno nuevo." }, { status: 410 });
    }

    // Verify with Twilio
    const valid = await verificarCodigoSMS(user.telefono, codigo);
    if (!valid) {
      return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
    }

    // Mark as verified
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        telefonoVerificado: true,
        telefonoVerificadoAt: new Date(),
        codigoSMS: null,
        codigoSMSExpira: null,
      },
    });

    // Credit pending referral points now that phone is verified
    let puntosAcreditados = 0;
    try {
      // 1. Credit this user's pending points in all active contests
      const misParticipaciones = await prisma.participanteConcurso.findMany({
        where: { usuarioId: userId, puntosPendientes: { gt: 0 } },
        include: { concurso: { select: { activo: true, fechaFin: true, premio: true, slug: true, id: true } } },
      });
      for (const p of misParticipaciones) {
        if (p.concurso.activo && new Date(p.concurso.fechaFin) > new Date()) {
          await prisma.participanteConcurso.update({
            where: { id: p.id },
            data: { puntos: { increment: p.puntosPendientes }, puntosPendientes: 0 },
          });
          puntosAcreditados += p.puntosPendientes;
        }
      }

      // 2. Credit referrer's pending points from this user
      const misRefs = await prisma.participanteConcurso.findMany({
        where: { usuarioId: userId, referidorDirectoId: { not: null } },
        select: { concursoId: true, referidorDirectoId: true, referidorNivel2Id: true },
      });
      for (const mr of misRefs) {
        if (!mr.referidorDirectoId) continue;
        const conc = await prisma.concurso.findUnique({
          where: { id: mr.concursoId },
          select: { activo: true, fechaFin: true, premio: true, slug: true },
        });
        if (!conc?.activo || new Date(conc.fechaFin) <= new Date()) continue;

        const refPart = await prisma.participanteConcurso.findUnique({
          where: { concursoId_usuarioId: { concursoId: mr.concursoId, usuarioId: mr.referidorDirectoId } },
        });
        if (refPart && refPart.puntosPendientes > 0) {
          await prisma.participanteConcurso.update({
            where: { id: refPart.id },
            data: { puntos: { increment: refPart.puntosPendientes }, puntosPendientes: 0, puntosReferidosNuevos: { increment: refPart.puntosPendientes } },
          });
          const premioCorto = conc.premio && conc.premio.length > 30 ? conc.premio.substring(0, 30) + "..." : (conc.premio || "un concurso");
          const nombreRef = user.telefono ? (await prisma.usuario.findUnique({ where: { id: userId }, select: { nombre: true } }))?.nombre?.split(" ")[0] ?? "Alguien" : "Alguien";
          prisma.notificacion.create({ data: { usuarioId: mr.referidorDirectoId, tipo: "referido_nuevo", mensaje: `${nombreRef} verificó su cuenta. ¡+${refPart.puntosPendientes} puntos para ti en "${premioCorto}"! 🎉` } }).catch(() => {});
        }

        // Credit nivel 2 pending points
        if (mr.referidorNivel2Id) {
          const nivel2Part = await prisma.participanteConcurso.findUnique({
            where: { concursoId_usuarioId: { concursoId: mr.concursoId, usuarioId: mr.referidorNivel2Id } },
          });
          if (nivel2Part && (nivel2Part.puntosNivel2Pendientes ?? 0) > 0) {
            const n2pend = nivel2Part.puntosNivel2Pendientes ?? 0;
            if ((nivel2Part.puntosNivel2 ?? 0) + n2pend <= 20) {
              await prisma.participanteConcurso.update({
                where: { id: nivel2Part.id },
                data: { puntos: { increment: n2pend }, puntosNivel2: { increment: n2pend }, puntosNivel2Pendientes: 0 },
              });
            }
          }
        }
      }

      // Notify user about credited points
      if (puntosAcreditados > 0) {
        prisma.notificacion.create({ data: { usuarioId: userId, tipo: "verificacion", mensaje: `¡Celular verificado! Se acreditaron +${puntosAcreditados} puntos de referido en tus concursos 🎉` } }).catch(() => {});
      }
    } catch (e) { console.error("[SMS verificar] Error acreditando puntos:", e); }

    return NextResponse.json({ ok: true, puntosAcreditados });
  } catch (error) {
    console.error("[SMS verificar]", error);
    return NextResponse.json({ error: "Error al verificar. Intenta de nuevo." }, { status: 500 });
  }
}
