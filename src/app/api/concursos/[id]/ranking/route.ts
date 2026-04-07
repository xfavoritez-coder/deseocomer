import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const participantes = await prisma.participanteConcurso.findMany({
      where: { concurso: { OR: [{ id }, { slug: id }] }, estado: { not: "descalificado" } },
      include: { usuario: { select: { id: true, nombre: true, fotoUrl: true, codigoRef: true } } },
      orderBy: { puntos: "desc" },
    });
    return NextResponse.json({ participantes });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
