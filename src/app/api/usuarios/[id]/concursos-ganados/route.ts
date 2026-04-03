import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const concursos = await prisma.concurso.findMany({
      where: { ganadorActualId: id },
      select: {
        id: true,
        slug: true,
        premio: true,
        estado: true,
        codigoEntrega: true,
        premioConfirmadoAt: true,
        disputaAt: true,
        local: { select: { nombre: true } },
      },
      orderBy: { fechaFin: "desc" },
    });

    return NextResponse.json(concursos);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
