import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { localId } = await req.json();
    if (!localId) return NextResponse.json({ error: "Falta localId" }, { status: 400 });

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }], localId },
    });
    if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });
    if (new Date(concurso.fechaFin) > new Date()) return NextResponse.json({ error: "El concurso aún no ha finalizado" }, { status: 400 });
    if (concurso.premioEntregado) return NextResponse.json({ error: "El premio ya fue confirmado" }, { status: 400 });

    await prisma.concurso.update({
      where: { id: concurso.id },
      data: { premioEntregado: true, premioEntregadoAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
