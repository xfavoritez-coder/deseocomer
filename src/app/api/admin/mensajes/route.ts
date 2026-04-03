import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

// GET: listar mensajes + stats, o listar toasts dismissed
export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  const tipo = req.nextUrl.searchParams.get("tipo");

  try {
    // Toasts dismissed por usuarios
    if (tipo === "dismissed") {
      const dismissed = await prisma.toastDismissed.findMany({
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(dismissed);
    }

    // Mensajes del Genio con stats
    const mensajes = await prisma.mensajeGenio.findMany({
      include: {
        _count: { select: { vistas: true } },
        vistas: {
          include: { usuario: { select: { id: true, nombre: true, email: true } } },
          orderBy: { vistoAt: "desc" },
          take: 50,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(mensajes);
  } catch (error) {
    console.error("[Admin mensajes GET]", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: crear mensaje o acciones admin
export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();

    // Crear nuevo mensaje
    if (body.accion === "crear") {
      const mensaje = await prisma.mensajeGenio.create({
        data: {
          contenido: body.contenido,
          tipo: body.tipo || "info",
          destinatario: body.destinatario || "todos",
          fijo: body.fijo ?? false,
          duracion: body.duracion ? Number(body.duracion) : null,
        },
      });
      return NextResponse.json(mensaje);
    }

    // Desactivar mensaje
    if (body.accion === "desactivar" && body.mensajeId) {
      await prisma.mensajeGenio.update({ where: { id: body.mensajeId }, data: { activo: false } });
      return NextResponse.json({ ok: true });
    }

    // Reactivar mensaje
    if (body.accion === "reactivar" && body.mensajeId) {
      await prisma.mensajeGenio.update({ where: { id: body.mensajeId }, data: { activo: true } });
      // Limpiar los dismisses para que vuelva a verse
      await prisma.mensajeVisto.updateMany({ where: { mensajeId: body.mensajeId }, data: { noMostrar: false, dismissedAt: null } });
      return NextResponse.json({ ok: true });
    }

    // Reactivar toast dismissed de un usuario
    if (body.accion === "reactivar_toast" && body.dismissId) {
      await prisma.toastDismissed.delete({ where: { id: body.dismissId } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("[Admin mensajes POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
