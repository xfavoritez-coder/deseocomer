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
        puntosNivel2: true,
        puntosNivel2Pendientes: true,
        puntosMadrugador: true,
        puntosReferidosNuevos: true,
        puntosReferidosExistentes: true,
      },
    });
    return NextResponse.json(participaciones.map(p => ({
      concursoId: p.concursoId,
      puntos: p.puntos,
      puntosNivel2: p.puntosNivel2 ?? 0,
      puntosNivel2Pendientes: p.puntosNivel2Pendientes ?? 0,
      puntosMadrugador: p.puntosMadrugador ?? 0,
      puntosReferidosNuevos: p.puntosReferidosNuevos ?? 0,
      puntosReferidosExistentes: p.puntosReferidosExistentes ?? 0,
    })));
  } catch {
    return NextResponse.json([]);
  }
}
