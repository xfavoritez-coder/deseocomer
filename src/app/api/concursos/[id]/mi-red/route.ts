import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

    // Find the contest
    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, premio: true, slug: true },
    });
    if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });

    // Get user's participation
    const miPart = await prisma.participanteConcurso.findUnique({
      where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: userId } },
      select: { puntos: true, puntosNivel2: true },
    });
    if (!miPart) return NextResponse.json({ error: "No participas" }, { status: 404 });

    // Level 1: people I referred directly
    const nivel1 = await prisma.participanteConcurso.findMany({
      where: { concursoId: concurso.id, referidorDirectoId: userId, estado: { not: "descalificado" } },
      select: {
        usuarioId: true,
        puntos: true,
        usuario: { select: { nombre: true, fotoUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Level 2: people referred by my referidos
    const nivel1Ids = nivel1.map(n => n.usuarioId);
    const nivel2 = nivel1Ids.length > 0 ? await prisma.participanteConcurso.findMany({
      where: { concursoId: concurso.id, referidorDirectoId: { in: nivel1Ids }, estado: { not: "descalificado" } },
      select: {
        usuarioId: true,
        referidorDirectoId: true,
        usuario: { select: { nombre: true, fotoUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    }) : [];

    // Build tree
    const red = nivel1.map(n1 => ({
      nombre: n1.usuario.nombre,
      fotoUrl: n1.usuario.fotoUrl || null,
      puntosAportados: 3,
      hijos: nivel2
        .filter(n2 => n2.referidorDirectoId === n1.usuarioId)
        .map(n2 => ({
          nombre: n2.usuario.nombre,
          fotoUrl: n2.usuario.fotoUrl || null,
          puntosAportados: 2,
        })),
    }));

    const totalPuntosRed = nivel1.length * 3 + nivel2.length * 2;

    return NextResponse.json({
      concurso: concurso.premio,
      misPuntos: miPart.puntos,
      puntosNivel2: miPart.puntosNivel2 ?? 0,
      totalRed: nivel1.length + nivel2.length,
      totalPuntosRed,
      red,
    }, {
      headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
