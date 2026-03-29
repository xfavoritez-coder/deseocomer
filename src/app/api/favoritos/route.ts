import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
