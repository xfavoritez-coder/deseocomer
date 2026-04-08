import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        local: { select: { id: true, nombre: true, slug: true, logoUrl: true, portadaUrl: true, comuna: true, direccion: true, telefono: true, email: true, categorias: true } },
        participantes: { where: { estado: { not: "descalificado" } }, include: { usuario: { select: { id: true, nombre: true, fotoUrl: true, codigoRef: true } } }, orderBy: { puntos: "desc" }, take: 6 },
        ganadorActual: { select: { id: true, nombre: true } },
        _count: { select: { participantes: { where: { estado: { not: "descalificado" } } }, listaEspera: true } },
      },
    });
    if (!concurso) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Fire-and-forget view count
    prisma.$executeRawUnsafe('UPDATE "Concurso" SET "vistas" = "vistas" + 1 WHERE "id" = $1', concurso.id).catch(() => {});

    return NextResponse.json(concurso, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("[API /concursos/[id]] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Check participants
    const existing = await prisma.concurso.findUnique({
      where: { id },
      include: { _count: { select: { participantes: true } } },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Cancel action
    if (body.cancelar === true) {
      if ((existing._count?.participantes ?? 0) > 0) {
        return NextResponse.json({ error: "No puedes cancelar un concurso con participantes activos" }, { status: 403 });
      }
      const updated = await prisma.concurso.update({
        where: { id },
        data: { cancelado: true, activo: false, estado: "cancelado", motivoCancelacion: body.motivo ?? "" },
      });
      return NextResponse.json(updated);
    }

    // Edit action — block if has participants
    if ((existing._count?.participantes ?? 0) > 0) {
      return NextResponse.json({ error: "No puedes editar un concurso con participantes activos" }, { status: 403 });
    }

    const concurso = await prisma.concurso.update({
      where: { id },
      data: {
        ...(body.premio !== undefined && { premio: body.premio }),
        ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
        ...(body.imagenUrl !== undefined && { imagenUrl: body.imagenUrl }),
        ...(body.fechaFin !== undefined && { fechaFin: new Date(body.fechaFin) }),
        ...(body.condiciones !== undefined && { condiciones: body.condiciones }),
      },
    });
    return NextResponse.json(concurso);
  } catch (error) {
    console.error("[API /concursos/[id] PUT] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
