import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

    const notificaciones = await prisma.notificacion.findMany({
      where: { usuarioId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const noLeidas = await prisma.notificacion.count({
      where: { usuarioId: userId, leida: false },
    });
    return NextResponse.json({ notificaciones, noLeidas });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { notificacionId, marcarTodas, userId } = await req.json();
    if (marcarTodas && userId) {
      await prisma.notificacion.updateMany({
        where: { usuarioId: userId, leida: false },
        data: { leida: true },
      });
    } else if (notificacionId) {
      await prisma.notificacion.update({
        where: { id: notificacionId },
        data: { leida: true },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
