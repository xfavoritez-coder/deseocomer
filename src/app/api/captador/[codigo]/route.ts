import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  try {
    const captador = await prisma.captador.findUnique({
      where: { codigo },
      include: {
        locales: {
          select: {
            id: true, nombre: true, createdAt: true,
            concursos: { where: { activo: true, cancelado: false }, select: { id: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        pagos: { orderBy: { createdAt: "desc" }, select: { monto: true, referencia: true, createdAt: true } },
      },
    });
    if (!captador || !captador.activo) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (!captador.terminosAceptados) {
      return NextResponse.json({ requiereAceptarTerminos: true });
    }

    const totalLocales = captador.locales.length;
    const localesConConcurso = captador.locales.filter(l => l.concursos.length > 0).length;
    const totalGanado = totalLocales * 10000 + localesConConcurso * 5000;
    const totalPagado = captador.pagos.reduce((s, p) => s + p.monto, 0);

    return NextResponse.json({
      id: captador.id, nombre: captador.nombre, email: captador.email, codigo: captador.codigo, createdAt: captador.createdAt,
      locales: captador.locales, pagos: captador.pagos,
      totalLocales, localesConConcurso, totalGanado, totalPagado, pendiente: totalGanado - totalPagado,
    });
  } catch (error) {
    console.error("[API captador/[codigo] GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
