import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { estiloAlimentario: true, comidasFavoritas: true, cumpleDia: true, cumpleMes: true, cumpleAnio: true, codigoRef: true, emailVerificado: true },
    });
    if (!usuario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(usuario);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
