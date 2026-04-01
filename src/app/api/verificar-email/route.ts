import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

    const usuario = await prisma.usuario.findFirst({ where: { tokenVerificacion: token } });
    if (!usuario) return NextResponse.json({ error: "Token inválido o ya usado" }, { status: 400 });

    // Reject tokens older than 48 hours
    const tokenAge = Date.now() - new Date(usuario.createdAt).getTime();
    if (tokenAge > 48 * 60 * 60 * 1000) return NextResponse.json({ error: "Este enlace ha expirado. Solicita uno nuevo." }, { status: 400 });

    await prisma.usuario.update({ where: { id: usuario.id }, data: { emailVerificado: true, tokenVerificacion: null } });

    // Mover puntos pendientes a reales en concursos activos
    const participaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: usuario.id, puntosPendientes: { gt: 0 } },
      include: { concurso: { select: { activo: true, fechaFin: true } } },
    });
    for (const p of participaciones) {
      if (p.concurso.activo && new Date(p.concurso.fechaFin) > new Date()) {
        await prisma.participanteConcurso.update({
          where: { id: p.id },
          data: { puntos: { increment: p.puntosPendientes }, puntosPendientes: 0 },
        });
      }
    }

    return NextResponse.json({ ok: true, id: usuario.id, nombre: usuario.nombre, email: usuario.email });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
