import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  try {
    await prisma.captador.update({
      where: { codigo },
      data: { terminosAceptados: true, terminosAceptadosAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API captador terminos PATCH]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
