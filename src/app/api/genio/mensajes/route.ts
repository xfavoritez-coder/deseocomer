import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: obtener mensajes activos para un usuario
export async function GET(req: NextRequest) {
  try {
    const usuarioId = req.nextUrl.searchParams.get("usuarioId");

    const mensajes = await prisma.mensajeGenio.findMany({
      where: {
        activo: true,
        OR: [
          { destinatario: "todos" },
          ...(usuarioId ? [{ destinatario: usuarioId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!usuarioId) return NextResponse.json(mensajes);

    // Filter out messages the user already dismissed
    const dismissed = await prisma.mensajeVisto.findMany({
      where: { usuarioId, noMostrar: true },
      select: { mensajeId: true },
    });
    const dismissedIds = new Set(dismissed.map(d => d.mensajeId));
    const filtered = mensajes.filter(m => !dismissedIds.has(m.id));

    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json([]);
  }
}

// POST: marcar mensaje como visto o dismissed
export async function POST(req: NextRequest) {
  try {
    const { mensajeId, usuarioId, accion } = await req.json();
    if (!mensajeId || !usuarioId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    if (accion === "visto") {
      await prisma.mensajeVisto.upsert({
        where: { mensajeId_usuarioId: { mensajeId, usuarioId } },
        create: { mensajeId, usuarioId, vistoAt: new Date() },
        update: { vistoAt: new Date() },
      });
    } else if (accion === "dismissed") {
      await prisma.mensajeVisto.upsert({
        where: { mensajeId_usuarioId: { mensajeId, usuarioId } },
        create: { mensajeId, usuarioId, dismissedAt: new Date() },
        update: { dismissedAt: new Date() },
      });
    } else if (accion === "no_mostrar") {
      await prisma.mensajeVisto.upsert({
        where: { mensajeId_usuarioId: { mensajeId, usuarioId } },
        create: { mensajeId, usuarioId, noMostrar: true, dismissedAt: new Date() },
        update: { noMostrar: true, dismissedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
