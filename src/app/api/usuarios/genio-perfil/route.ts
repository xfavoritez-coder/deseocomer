import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { usuarioId, perfil } = await req.json();
    if (!usuarioId || !perfil) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: { geniePerfil: perfil },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const usuarioId = searchParams.get("usuarioId");
    if (!usuarioId) return NextResponse.json({ error: "Falta usuarioId" }, { status: 400 });

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { geniePerfil: true },
    });

    return NextResponse.json({ perfil: usuario?.geniePerfil ?? null });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
