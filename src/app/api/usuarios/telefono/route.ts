import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { usuarioId, telefono } = await req.json();
    if (!usuarioId || !telefono?.trim()) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const tel = telefono.trim().replace(/\s+/g, "");
    if (tel.length < 8) {
      return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { telefono: tel },
    });

    return NextResponse.json({ ok: true, telefono: tel });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
