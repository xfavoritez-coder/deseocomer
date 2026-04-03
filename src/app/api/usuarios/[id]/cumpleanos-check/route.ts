import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { cumpleDia: true, cumpleMes: true, cumpleAnio: true },
    });
    if (!usuario) return NextResponse.json({ tieneCumple: false });
    return NextResponse.json({
      tieneCumple: !!(usuario.cumpleDia && usuario.cumpleMes),
      dia: usuario.cumpleDia,
      mes: usuario.cumpleMes,
      anio: usuario.cumpleAnio,
    });
  } catch {
    return NextResponse.json({ tieneCumple: false });
  }
}
