import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        local: { select: { id: true, nombre: true, slug: true, logoUrl: true, portadaUrl: true, comuna: true } },
        participantes: { include: { usuario: { select: { id: true, nombre: true } } }, orderBy: { puntos: "desc" } },
        _count: { select: { participantes: true } },
      },
    });
    if (!concurso) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(concurso);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
