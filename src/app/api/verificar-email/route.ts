import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

    const usuario = await prisma.usuario.findFirst({ where: { tokenVerificacion: token } });
    if (!usuario) return NextResponse.json({ error: "Token inválido o ya usado" }, { status: 400 });

    // Reject tokens older than 48 hours (use updatedAt since token is regenerated on resend)
    const tokenAge = Date.now() - new Date(usuario.updatedAt).getTime();
    if (tokenAge > 48 * 60 * 60 * 1000) return NextResponse.json({ error: "Este enlace ha expirado. Solicita uno nuevo." }, { status: 400 });

    await prisma.usuario.update({ where: { id: usuario.id }, data: { emailVerificado: true, emailVerificadoAt: new Date(), tokenVerificacion: null } });

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

    // Acreditar +2 al referidor directo ahora que este usuario verificó email
    const misParticipaciones2 = await prisma.participanteConcurso.findMany({
      where: { usuarioId: usuario.id, referidorDirectoId: { not: null } },
      select: { concursoId: true, referidorDirectoId: true },
    });
    for (const mp of misParticipaciones2) {
      if (!mp.referidorDirectoId) continue;
      const conc = await prisma.concurso.findUnique({
        where: { id: mp.concursoId },
        select: { activo: true, fechaFin: true },
      });
      if (!conc?.activo || new Date(conc.fechaFin) <= new Date()) continue;

      const refPart = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: mp.concursoId, usuarioId: mp.referidorDirectoId } },
      });
      if (refPart && refPart.puntosPendientes >= 2) {
        await prisma.participanteConcurso.update({
          where: { id: refPart.id },
          data: { puntos: { increment: 2 }, puntosPendientes: { decrement: 2 } },
        });
      }
    }

    // --- NIVEL 2: Acreditar puntos por referidos de referidos ---
    // Find all participations where this user was referred by someone
    const misParticipaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: usuario.id },
      select: { concursoId: true, referidorDirectoId: true, referidorNivel2Id: true },
    });

    for (const mp of misParticipaciones) {
      if (!mp.referidorNivel2Id) continue;

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
        }
      }
    }

    return NextResponse.json({ ok: true, id: usuario.id, nombre: usuario.nombre, email: usuario.email });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
