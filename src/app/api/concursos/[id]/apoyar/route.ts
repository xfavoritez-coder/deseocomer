import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { primerApoyoHtml } from "@/emails/primerApoyoHtml";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supporterId, targetUsuarioId } = await req.json();
    if (!supporterId || !targetUsuarioId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    if (supporterId === targetUsuarioId) return NextResponse.json({ error: "No puedes apoyarte a ti mismo" }, { status: 400 });

    // Verificar que el usuario que apoya tenga email verificado
    const supporter = await prisma.usuario.findUnique({ where: { id: supporterId }, select: { emailVerificado: true } });
    if (!supporter?.emailVerificado) {
      return NextResponse.json({ error: "Debes verificar tu correo antes de poder apoyar a otros participantes." }, { status: 403 });
    }

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }], activo: true },
      include: { local: { select: { nombre: true } } },
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

    // Email primer apoyo recibido (una sola vez por usuario)
    try {
      const targetUser = await prisma.usuario.findUnique({ where: { id: targetUsuarioId }, select: { nombre: true, email: true, primerApoyoNotificado: true } });
      if (targetUser && !targetUser.primerApoyoNotificado) {
        await resend.emails.send({
          from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
          to: targetUser.email,
          subject: `❤️ ¡Alguien te apoya en tu concurso! — ${concurso.premio}`,
          html: primerApoyoHtml({
            nombreUsuario: targetUser.nombre,
            premioConcurso: concurso.premio,
            nombreLocal: concurso.local?.nombre ?? "un local",
          }),
        });
        await prisma.usuario.update({ where: { id: targetUsuarioId }, data: { primerApoyoNotificado: true } });
      }
    } catch (emailErr) {
      console.error("[Email primer apoyo]", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
