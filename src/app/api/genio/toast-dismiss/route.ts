import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: usuario marca un toast como "no mostrar más"
export async function POST(req: NextRequest) {
  try {
    const { usuarioId, toastId } = await req.json();
    if (!usuarioId || !toastId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    await prisma.toastDismissed.upsert({
      where: { usuarioId_toastId: { usuarioId, toastId } },
      create: { usuarioId, toastId },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
