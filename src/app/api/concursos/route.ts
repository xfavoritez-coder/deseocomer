import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const concursos = await prisma.concurso.findMany({
      where: { activo: true },
      include: {
        local: { select: { id: true, nombre: true, logoUrl: true, comuna: true } },
        _count: { select: { participantes: true } },
      },
      orderBy: { fechaFin: "asc" },
    });
    return NextResponse.json(concursos);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { localId, premio, descripcion, imagenUrl, fechaFin } = await req.json();
    if (!localId || !premio || !fechaFin) return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    const concurso = await prisma.concurso.create({
      data: { localId, premio, descripcion, imagenUrl, fechaFin: new Date(fechaFin) },
    });
    return NextResponse.json(concurso, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
