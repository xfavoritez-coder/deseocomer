import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  try {
    const { codigo } = await params;
    const usuario = await prisma.usuario.findFirst({
      where: { codigoRef: codigo.toUpperCase() },
      select: { id: true, nombre: true },
    });
    if (!usuario) return NextResponse.json({ existe: false });
    return NextResponse.json({ existe: true, id: usuario.id, nombre: usuario.nombre.split(" ")[0] });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
