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
      data: { puntos: { increment: 1 }, puntosApoyos: { increment: 1 } },
    });

    // Get supporter name (used for notification and email)
    const supporterUser = await prisma.usuario.findUnique({ where: { id: supporterId }, select: { nombre: true } });
    const supporterNombre = supporterUser?.nombre?.split(" ")[0] ?? "Alguien";

    // Email primer apoyo recibido (una sola vez por usuario, fire-and-forget)
    prisma.usuario.findUnique({ where: { id: targetUsuarioId }, select: { nombre: true, email: true, primerApoyoNotificado: true } })
      .then(async (targetUser) => {
        if (!targetUser || targetUser.primerApoyoNotificado) return;
        await prisma.usuario.update({ where: { id: targetUsuarioId }, data: { primerApoyoNotificado: true } });
        await resend.emails.send({
          from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
          to: targetUser.email,
          subject: `💛 ${supporterNombre} cree en ti — tu primer apoyo en "${concurso.premio}"`,
          html: primerApoyoHtml({
            nombreUsuario: targetUser.nombre,
            premioConcurso: concurso.premio,
            nombreLocal: concurso.local?.nombre ?? "un local",
            nombreApoyo: supporterUser?.nombre,
          }),
        });
      })
      .catch((emailErr: unknown) => {
        console.error("[Email primer apoyo]", emailErr);
      });
    const premioCorto = concurso.premio.length > 25 ? concurso.premio.substring(0, 25) + "..." : concurso.premio;
    const msgApoyo = `${supporterNombre} te apoyó en "${premioCorto}". +1 pt 💛`;
    const yaNotifApoyo = await prisma.notificacion.findFirst({ where: { usuarioId: targetUsuarioId, tipo: "apoyo_recibido", createdAt: { gte: new Date(Date.now() - 60000) } } });
    if (!yaNotifApoyo) prisma.notificacion.create({ data: { usuarioId: targetUsuarioId, tipo: "apoyo_recibido", mensaje: msgApoyo, datos: { concursoSlug: concurso.slug || concurso.id } } }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
