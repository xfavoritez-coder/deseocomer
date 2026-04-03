import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const participaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: id },
      select: { concursoId: true },
    });
    return NextResponse.json(participaciones.map(p => p.concursoId));
  } catch {
    return NextResponse.json([]);
  }
}
