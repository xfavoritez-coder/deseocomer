import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makePromoSlug } from "@/lib/slugify";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const localId = searchParams.get("localId");

    const promociones = await prisma.promocion.findMany({
      where: localId
        ? { localId }
        : { activa: true, local: { activo: true }, OR: [{ fechaVencimiento: null }, { fechaVencimiento: { gte: new Date() } }] },
      include: { local: { select: { id: true, nombre: true, comuna: true, slug: true, logoUrl: true, categoria: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(promociones);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { localId, tipo, titulo, descripcion, condiciones, porcentajeDescuento, precioOriginal, precioDescuento, horaInicio, horaFin, diasSemana, esCumpleanos, imagenUrl, fechaVencimiento, modalidad } = await req.json();
    if (!localId || !tipo || !titulo || !horaInicio || !horaFin) return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    const local = await prisma.local.findUnique({ where: { id: localId }, select: { nombre: true } });
    const slug = makePromoSlug(titulo, local?.nombre ?? "local");
    const promocion = await prisma.promocion.create({
      data: { localId, tipo, titulo, descripcion, condiciones, porcentajeDescuento, precioOriginal, precioDescuento, horaInicio, horaFin, diasSemana: diasSemana || [], esCumpleanos: esCumpleanos || false, imagenUrl, modalidad: modalidad || [], slug, ...(fechaVencimiento && { fechaVencimiento: new Date(fechaVencimiento) }) },
    });
    return NextResponse.json(promocion, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
