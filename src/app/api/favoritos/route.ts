import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const usuarioId = searchParams.get("usuarioId");
    if (!usuarioId) return NextResponse.json({ error: "Falta usuarioId" }, { status: 400 });
    const favoritos = await prisma.favorito.findMany({
      where: { usuarioId },
      include: { local: { select: { id: true, nombre: true, categoria: true, comuna: true, logoUrl: true, portadaUrl: true, descripcion: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(favoritos);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { usuarioId, localId } = await req.json();
    const existe = await prisma.favorito.findUnique({
      where: { usuarioId_localId: { usuarioId, localId } },
    });
    if (existe) {
      await prisma.favorito.delete({ where: { usuarioId_localId: { usuarioId, localId } } });
      return NextResponse.json({ accion: "eliminado" });
    }
    const favorito = await prisma.favorito.create({ data: { usuarioId, localId } });
    return NextResponse.json({ accion: "agregado", favorito });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
