import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const items = await prisma.menuItem.findMany({ where: { localId: id }, orderBy: { categoria: "asc" } });
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { categoria, nombre, descripcion, precio, imagenUrl, destacado } = await req.json();
    const item = await prisma.menuItem.create({
      data: { localId: id, categoria, nombre, descripcion, precio: parseFloat(precio), imagenUrl, destacado: destacado || false },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
