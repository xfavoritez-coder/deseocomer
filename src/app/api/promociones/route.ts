import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const promociones = await prisma.promocion.findMany({
      where: { activa: true },
      include: { local: { select: { id: true, nombre: true, comuna: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(promociones);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { localId, tipo, titulo, descripcion, porcentajeDescuento, precioOriginal, precioDescuento, horaInicio, horaFin, diasSemana, esCumpleanos, imagenUrl } = await req.json();
    if (!localId || !tipo || !titulo || !horaInicio || !horaFin) return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    const promocion = await prisma.promocion.create({
      data: { localId, tipo, titulo, descripcion, porcentajeDescuento, precioOriginal, precioDescuento, horaInicio, horaFin, diasSemana: diasSemana || [], esCumpleanos: esCumpleanos || false, imagenUrl },
    });
    return NextResponse.json(promocion, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
