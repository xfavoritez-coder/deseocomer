import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const participaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: id },
      select: {
        concursoId: true,
        puntos: true,
        esMadrugador: true,
        puntosNivel2: true,
        puntosNivel2Pendientes: true,
        puntosMadrugador: true,
        puntosReferidosNuevos: true,
        puntosReferidosExistentes: true,
        referidorDirectoId: true,
        concurso: {
          select: {
            slug: true, premio: true, fechaFin: true, estado: true,
            ganadorActualId: true,
            local: { select: { nombre: true, logoUrl: true } },
            _count: { select: { participantes: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(participaciones.map(p => {
      const ended = new Date(p.concurso.fechaFin).getTime() <= Date.now();
      const esGanador = p.concurso.ganadorActualId === id;
      const bonusRef = p.referidorDirectoId ? 3 : 0;
      const apoyos = Math.max(0, p.puntos - 1 - bonusRef - (p.puntosMadrugador ?? 0) - (p.puntosReferidosNuevos ?? 0) - (p.puntosReferidosExistentes ?? 0) - (p.puntosNivel2 ?? 0));
      return {
        concursoId: p.concursoId,
        slug: p.concurso.slug,
        premio: p.concurso.premio,
        local: p.concurso.local.nombre,
        localLogo: p.concurso.local.logoUrl,
        participantes: p.concurso._count.participantes,
        estado: esGanador ? "ganador" : ended ? "finalizado" : "activo",
        puntos: p.puntos,
        esMadrugador: p.esMadrugador,
        bonusRef,
        puntosNivel2: p.puntosNivel2 ?? 0,
        puntosNivel2Pendientes: p.puntosNivel2Pendientes ?? 0,
        puntosMadrugador: p.puntosMadrugador ?? 0,
        puntosReferidosNuevos: p.puntosReferidosNuevos ?? 0,
        puntosReferidosExistentes: p.puntosReferidosExistentes ?? 0,
        apoyos,
      };
    }));
  } catch {
    return NextResponse.json([]);
  }
}
