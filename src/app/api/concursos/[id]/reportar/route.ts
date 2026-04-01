import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { participanteId, localId } = await req.json();
    if (!participanteId || !localId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const participante = await prisma.participanteConcurso.findUnique({
      where: { id: participanteId },
      include: {
        concurso: { select: { localId: true } },
      },
    });
    if (!participante) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });
    if (participante.concurso.localId !== localId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    // Marcar como sospechoso
    await prisma.participanteConcurso.update({
      where: { id: participanteId },
      data: { estado: "sospechoso" },
    });


    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API reportar]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
