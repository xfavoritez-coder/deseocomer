import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeConcursoSlug } from "@/lib/slugify";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const concursos = await prisma.concurso.findMany({
      where: {
        activo: true,
        local: {
          activo: true,
          direccion: { not: "" },
          categoria: { not: null },
        },
      },
      include: {
        local: { select: { id: true, nombre: true, slug: true, logoUrl: true, comuna: true } },
        _count: { select: { participantes: true } },
      },
      orderBy: { fechaFin: "asc" },
      take: limit,
      skip: offset,
    });
    return NextResponse.json(concursos);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { localId, premio, descripcion, condiciones, imagenUrl, fechaFin } = await req.json();
    if (!localId || !premio || !fechaFin) return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });

    // Get local name for slug
    const local = await prisma.local.findUnique({ where: { id: localId }, select: { nombre: true } });
    const slug = makeConcursoSlug(premio, local?.nombre ?? "local");

    const concurso = await prisma.concurso.create({
      data: { localId, slug, premio, descripcion, ...(condiciones && { condiciones }), imagenUrl, fechaFin: new Date(fechaFin) },
    });
    return NextResponse.json(concurso, { status: 201 });
  } catch (error) {
    console.error("[API /concursos POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
