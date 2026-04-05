import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Support lookup by id or codigoRef
    const isCuid = id.length > 20;
    const usuario = await prisma.usuario.findFirst({
      where: isCuid ? { id } : { codigoRef: id },
      select: {
        id: true,
        nombre: true,
        fotoUrl: true,
        ciudad: true,
        codigoRef: true,
        createdAt: true,
        totalConcursosParticipados: true,
        totalConcursosGanados: true,
        mejorPosicion: true,
      },
    });

    if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Get concursos with details
    const participaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: usuario.id, estado: { not: "descalificado" } },
      include: {
        concurso: {
          select: {
            id: true,
            slug: true,
            premio: true,
            imagenUrl: true,
            fechaFin: true,
            estado: true,
            ganadorActualId: true,
            local: { select: { nombre: true, logoUrl: true } },
            _count: { select: { participantes: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Count total referidos across all concursos
    const totalReferidos = await prisma.participanteConcurso.aggregate({
      where: { referidorDirectoId: usuario.id },
      _count: true,
    });

    const concursos = participaciones.map(p => {
      const ended = new Date(p.concurso.fechaFin).getTime() <= Date.now();
      const esGanador = p.concurso.ganadorActualId === usuario.id;
      return {
        id: p.concurso.id,
        slug: p.concurso.slug,
        premio: p.concurso.premio,
        imagenUrl: p.concurso.imagenUrl,
        local: p.concurso.local.nombre,
        localLogo: p.concurso.local.logoUrl,
        puntos: p.puntos,
        desglose: {
          registro: 1,
          referidosNuevos: p.puntosReferidosNuevos ?? 0,
          referidosExistentes: p.puntosReferidosExistentes ?? 0,
          nivel2: p.puntosNivel2 ?? 0,
          madrugador: p.puntosMadrugador ?? 0,
          apoyos: Math.max(0, (p.puntos ?? 0) - 1 - (p.puntosReferidosNuevos ?? 0) - (p.puntosReferidosExistentes ?? 0) - (p.puntosNivel2 ?? 0) - (p.puntosMadrugador ?? 0)),
        },
        estado: esGanador ? "ganador" : ended ? "finalizado" : p.concurso.estado === "programado" ? "programado" : "activo",
        participantes: p.concurso._count.participantes,
      };
    });

    // Abbreviate name: "Juan Pérez" -> "Juan P."
    const parts = (usuario.nombre ?? "Usuario").trim().split(/\s+/);
    const nombrePublico = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];

    return NextResponse.json({
      id: usuario.id,
      codigoRef: usuario.codigoRef,
      nombre: nombrePublico,
      fotoUrl: usuario.fotoUrl,
      ciudad: usuario.ciudad,
      miembroDesde: usuario.createdAt,
      totalConcursos: usuario.totalConcursosParticipados ?? 0,
      totalGanados: usuario.totalConcursosGanados ?? 0,
      mejorPosicion: usuario.mejorPosicion,
      totalReferidos: totalReferidos._count ?? 0,
      concursos,
    });
  } catch (error) {
    console.error("[Perfil público]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
