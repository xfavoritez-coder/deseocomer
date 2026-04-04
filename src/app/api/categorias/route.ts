import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categorias = await prisma.categoriaComida.findMany({
      where: { visible: true },
      orderBy: { orden: "asc" },
    });
    return NextResponse.json(categorias);
  } catch (e) {
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}
