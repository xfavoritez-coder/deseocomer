import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = _req.nextUrl.searchParams.get("userId");
    const participantes = await prisma.participanteConcurso.findMany({
      where: { concurso: { OR: [{ id }, { slug: id }] }, estado: { not: "descalificado" } },
      select: {
        id: true,
        usuarioId: true,
        puntos: true,
        usuario: { select: { id: true, nombre: true, fotoUrl: true, codigoRef: true } },
      },
      orderBy: { puntos: "desc" },
    });
    // If the requesting user isn't in the top 20, check if they're participating
    let meParticipating = false;
    if (userId && !participantes.some(p => p.usuarioId === userId)) {
      const myPart = await prisma.participanteConcurso.findFirst({
        where: { concurso: { OR: [{ id }, { slug: id }] }, usuarioId: userId, estado: { not: "descalificado" } },
        select: { id: true },
      });
      meParticipating = !!myPart;
    }
    return NextResponse.json({ participantes, meParticipating }, {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
      },
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
