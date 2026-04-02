import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { monto, referencia } = await req.json();
    if (!monto || monto <= 0) return NextResponse.json({ error: "Monto inválido" }, { status: 400 });

    const pago = await prisma.pagoCaptador.create({
      data: { captadorId: id, monto, referencia: referencia || "" },
    });

    return NextResponse.json(pago, { status: 201 });
  } catch (error) {
    console.error("[API admin/captadores/[id]/pagar POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
