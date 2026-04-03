import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { usuarioId, dia, mes, anio } = await req.json();
    if (!usuarioId || !dia || !mes) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        cumpleDia: Number(dia),
        cumpleMes: Number(mes),
        ...(anio ? { cumpleAnio: Number(anio) } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
