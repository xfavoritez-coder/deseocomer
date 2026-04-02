import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const captador = await prisma.captador.findUnique({
      where: { id },
      include: {
        locales: {
          select: {
            id: true, nombre: true, createdAt: true,
            concursos: { where: { activo: true, cancelado: false }, select: { id: true } },
          },
        },
        pagos: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!captador) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const totalLocales = captador.locales.length;
    const localesConConcurso = captador.locales.filter(l => l.concursos.length > 0).length;
    const totalGanado = totalLocales * 10000 + localesConConcurso * 5000;
    const totalPagado = captador.pagos.reduce((s, p) => s + p.monto, 0);

    return NextResponse.json({ ...captador, totalLocales, localesConConcurso, totalGanado, totalPagado, pendiente: totalGanado - totalPagado });
  } catch (error) {
    console.error("[API admin/captadores/[id] GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { activo } = body;
    const captador = await prisma.captador.update({ where: { id }, data: { activo } });
    return NextResponse.json(captador);
  } catch (error) {
    console.error("[API admin/captadores/[id] PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
