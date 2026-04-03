import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { primerParticipanteHtml } from "@/emails/PrimerParticipanteEmail";

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

    // Build referral chain
    let referidorDirectoId: string | null = null;
    let referidorNivel2Id: string | null = null;

    if (referidoPor) {
      referidorDirectoId = referidoPor;
      // Check if the direct referrer has their own referrer (level 2)
      const refDirecto = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidoPor } },
      });
      if (refDirecto?.referidorDirectoId) {
        referidorNivel2Id = refDirecto.referidorDirectoId;
      }
    }

    // Create participation (+1 por unirse)
    const participante = await prisma.participanteConcurso.create({
      data: { concursoId: concurso.id, usuarioId, referidoPor, puntos: 1, referidorDirectoId, referidorNivel2Id },
    });

    // Email al local: primer participante (una sola vez por cuenta de local)
    try {
      const local = await prisma.local.findUnique({ where: { id: concurso.localId }, select: { id: true, nombre: true, email: true, primerParticipanteNotificado: true } });
      if (local && !local.primerParticipanteNotificado) {
        const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId }, select: { nombre: true } });
        const emailResult = await resend.emails.send({
          from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
          to: local.email,
          subject: `🎉 ¡Tu concurso tiene su primer participante! — ${concurso.premio}`,
          html: primerParticipanteHtml({
            nombreLocal: local.nombre,
            premioConcurso: concurso.premio,
            nombreParticipante: usuario?.nombre ?? "Un usuario",
          }),
        });
        console.log(`[Email primer participante] Enviado a ${local.email} para concurso ${concurso.premio}`, emailResult);
        // Solo marcar como notificado si el email se envió correctamente
        await prisma.local.update({ where: { id: local.id }, data: { primerParticipanteNotificado: true } });
      }
    } catch (emailErr) {
      console.error("[Email primer participante] Error:", emailErr);
    }

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
