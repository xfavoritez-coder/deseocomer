import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const participantes = await prisma.participanteConcurso.findMany({
      where: { concurso: { OR: [{ id }, { slug: id }] }, estado: { not: "descalificado" } },
      select: {
        id: true,
        usuarioId: true,
        puntos: true,
        usuario: { select: { id: true, nombre: true, fotoUrl: true, codigoRef: true } },
      },
      orderBy: { puntos: "desc" },
      take: 20,
    });
    return NextResponse.json({ participantes }, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
      },
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
