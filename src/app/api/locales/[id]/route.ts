import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeLocalSlug } from "@/lib/slugify";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Support both CUID and slug lookup
    const local = await prisma.local.findFirst({
      where: { OR: [{ id }, { slug: id }] },
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

    // Generate slug if missing
    const existing = await prisma.local.findUnique({ where: { id }, select: { slug: true, comuna: true } });
    let slugUpdate: { slug?: string } = {};
    if (existing && !existing.slug && body.nombre) {
      const slug = makeLocalSlug(body.nombre, body.comuna ?? existing.comuna ?? undefined);
      const taken = await prisma.local.findUnique({ where: { slug }, select: { id: true } });
      if (!taken) slugUpdate = { slug };
    }

    const local = await prisma.local.update({
      where: { id },
      data: {
        nombre: body.nombre, categoria: body.categoria, descripcion: body.descripcion,
        historia: body.historia, telefono: body.telefono, instagram: body.instagram,
        direccion: body.direccion, comuna: body.comuna, ciudad: body.ciudad,
        ...(body.nombreDueno !== undefined && { nombreDueno: body.nombreDueno }),
        ...(body.celularDueno !== undefined && { celularDueno: body.celularDueno }),
        ...(body.sitioWeb !== undefined && { sitioWeb: body.sitioWeb }),
        lat: body.lat, lng: body.lng,
        horarios: body.horarios, logoUrl: body.logoUrl, portadaUrl: body.portadaUrl,
        galeria: body.galeria, tieneMenu: body.tieneMenu,
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.tieneDelivery !== undefined && { tieneDelivery: body.tieneDelivery }),
        ...(body.comunasDelivery !== undefined && { comunasDelivery: body.comunasDelivery }),
        ...(body.tieneRetiro !== undefined && { tieneRetiro: body.tieneRetiro }),
        ...(body.linkPedido !== undefined && { linkPedido: body.linkPedido }),
        ...slugUpdate,
      },
    });
    const { password: _, ...safe } = local;
    return NextResponse.json(safe);
  } catch (err) {
    console.error("[PUT /api/locales] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
