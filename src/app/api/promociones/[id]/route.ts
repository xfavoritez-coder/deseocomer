import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const promocion = await prisma.promocion.findUnique({
      where: { id },
      include: {
        local: { select: { id: true, nombre: true, comuna: true, logoUrl: true, portadaUrl: true, instagram: true, telefono: true } },
      },
    });
    if (!promocion) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json(promocion);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
