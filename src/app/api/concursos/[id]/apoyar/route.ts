import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supporterId, targetUsuarioId } = await req.json();
    if (!supporterId || !targetUsuarioId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    if (supporterId === targetUsuarioId) return NextResponse.json({ error: "No puedes apoyarte a ti mismo" }, { status: 400 });

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }], activo: true },
    });
    if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });
    if (new Date(concurso.fechaFin) <= new Date()) return NextResponse.json({ error: "Concurso finalizado" }, { status: 400 });

    const target = await prisma.participanteConcurso.findUnique({
      where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: targetUsuarioId } },
    });
    if (!target) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });

    await prisma.participanteConcurso.update({
      where: { id: target.id },
      data: { puntos: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
