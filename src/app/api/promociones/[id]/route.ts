import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const promocion = await prisma.promocion.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        local: { select: { id: true, slug: true, nombre: true, comuna: true, categorias: true, logoUrl: true, portadaUrl: true, instagram: true, telefono: true, direccion: true, linkPedido: true } },
      },
    });
    if (!promocion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    // Increment view count (raw query to avoid idle transactions in pooler)
    prisma.$executeRawUnsafe('UPDATE "Promocion" SET "vistas" = "vistas" + 1 WHERE "id" = $1', promocion.id).catch(() => {});
    return NextResponse.json(promocion);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const promocion = await prisma.promocion.update({
      where: { id },
      data: {
        ...(body.titulo !== undefined && { titulo: body.titulo }),
        ...(body.tipo !== undefined && { tipo: body.tipo }),
        ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
        ...(body.porcentajeDescuento !== undefined && { porcentajeDescuento: body.porcentajeDescuento }),
        ...(body.horaInicio !== undefined && { horaInicio: body.horaInicio }),
        ...(body.horaFin !== undefined && { horaFin: body.horaFin }),
        ...(body.diasSemana !== undefined && { diasSemana: body.diasSemana }),
        ...(body.imagenUrl !== undefined && { imagenUrl: body.imagenUrl }),
        ...(body.condiciones !== undefined && { condiciones: body.condiciones }),
        ...(body.activa !== undefined && { activa: body.activa }),
        ...(body.modalidad !== undefined && { modalidad: body.modalidad }),
        ...(body.fechaVencimiento !== undefined && { fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null }),
      },
    });
    return NextResponse.json(promocion);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.promocion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
