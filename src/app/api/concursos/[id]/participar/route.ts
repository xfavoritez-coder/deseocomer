import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { usuarioId, referidoPor } = await req.json();
    if (!usuarioId) return NextResponse.json({ error: "Falta usuarioId" }, { status: 400 });

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }], activo: true },
    });
    if (!concurso) return NextResponse.json({ error: "Concurso no encontrado o inactivo" }, { status: 404 });
    if (new Date(concurso.fechaFin) <= new Date()) return NextResponse.json({ error: "Concurso finalizado" }, { status: 400 });

    // Check if already participating
    const existing = await prisma.participanteConcurso.findUnique({
      where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId } },
    });
    if (existing) return NextResponse.json({ error: "Ya participas en este concurso" }, { status: 400 });

    // Create participation (+1 por unirse)
    const participante = await prisma.participanteConcurso.create({
      data: { concursoId: concurso.id, usuarioId, referidoPor, puntos: 1 },
    });

    // Acreditar +2 al referidor si existe
    if (referidoPor) {
      const referidor = await prisma.usuario.findUnique({ where: { id: referidoPor } });
      if (referidor) {
        const refParticipante = await prisma.participanteConcurso.findUnique({
          where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidoPor } },
        });
        if (refParticipante) {
          if (referidor.emailVerificado) {
            // Acreditar puntos directamente
            await prisma.participanteConcurso.update({
              where: { id: refParticipante.id },
              data: { puntos: { increment: 2 } },
            });
          } else {
            // Guardar como pendientes hasta verificación
            await prisma.participanteConcurso.update({
              where: { id: refParticipante.id },
              data: { puntosPendientes: { increment: 2 } },
            });
          }
        }
      }
    }

    return NextResponse.json(participante, { status: 201 });
  } catch (error) {
    console.error("[API /concursos/[id]/participar]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
