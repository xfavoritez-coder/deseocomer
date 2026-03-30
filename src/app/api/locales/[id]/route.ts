import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const local = await prisma.local.findUnique({
      where: { id },
      include: {
        menuItems: true,
        concursos: { include: { participantes: { include: { usuario: { select: { id: true, nombre: true } } }, orderBy: { puntos: "desc" } }, _count: { select: { participantes: true } } }, orderBy: { createdAt: "desc" } },
        promociones: { where: { activa: true } },
        resenas: { include: { usuario: { select: { id: true, nombre: true } } } },
        _count: { select: { favoritos: true, resenas: true } },
      },
    });
    if (!local) return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
    const { password: _, ...safe } = local;
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const local = await prisma.local.update({
      where: { id },
      data: {
        nombre: body.nombre, categoria: body.categoria, descripcion: body.descripcion,
        historia: body.historia, telefono: body.telefono, instagram: body.instagram,
        direccion: body.direccion, comuna: body.comuna, lat: body.lat, lng: body.lng,
        horarios: body.horarios, logoUrl: body.logoUrl, portadaUrl: body.portadaUrl,
        galeria: body.galeria, tieneMenu: body.tieneMenu,
      },
    });
    const { password: _, ...safe } = local;
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
