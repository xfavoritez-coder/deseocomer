import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin") !== "true") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // QUERY 1 — Top 10 usuarios con más referidos
  const usuariosConReferidos = await prisma.participanteConcurso.groupBy({
    by: ["referidorDirectoId"],
    where: { referidorDirectoId: { not: null } },
    _count: { referidorDirectoId: true },
    orderBy: { _count: { referidorDirectoId: "desc" } },
    take: 10,
  });

  const top10Referidores = [];
  for (const u of usuariosConReferidos) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: u.referidorDirectoId! },
      select: { nombre: true, email: true },
    });
    top10Referidores.push({
      nombre: usuario?.nombre ?? "?",
      email: usuario?.email ?? "?",
      referidos: u._count.referidorDirectoId,
    });
  }

  // QUERY 2 — Cuántos usuarios tienen al menos 1 referido
  const conAlMenosUno = await prisma.participanteConcurso.groupBy({
    by: ["referidorDirectoId"],
    where: { referidorDirectoId: { not: null } },
    _count: { referidorDirectoId: true },
  });
  const totalReferidores = conAlMenosUno.length;
  const totalUsuarios = await prisma.usuario.count();
  const totalSinReferidos = totalUsuarios - totalReferidores;

  // QUERY 3 — Participantes por concurso activo
  const concursos = await prisma.concurso.findMany({
    where: { activo: true },
    include: {
      _count: { select: { participantes: true } },
      local: { select: { nombre: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const concursosActivos = concursos.map((c) => ({
    local: c.local.nombre,
    premio: c.premio,
    participantes: c._count.participantes,
  }));

  // QUERY 4 — Top 10 participantes por puntos
  const topParticipantes = await prisma.participanteConcurso.findMany({
    orderBy: { puntos: "desc" },
    take: 10,
    include: {
      usuario: { select: { nombre: true } },
      concurso: { select: { premio: true } },
    },
  });
  const top10Participantes = topParticipantes.map((p) => ({
    nombre: p.usuario.nombre,
    concurso: p.concurso.premio,
    puntos: p.puntos,
    referidosNuevos: p.puntosReferidosNuevos,
    referidosExistentes: p.puntosReferidosExistentes,
    nivel2: p.puntosNivel2,
    madrugador: p.puntosMadrugador,
  }));

  // QUERY 5 — Tasa de conversión general
  const totalParticipaciones = await prisma.participanteConcurso.count();
  const totalConReferidos = await prisma.participanteConcurso.count({
    where: { referidorDirectoId: { not: null } },
  });
  const totalPuntosNivel2 = await prisma.participanteConcurso.aggregate({
    _sum: { puntosNivel2: true },
  });

  return NextResponse.json({
    top10Referidores,
    referidores: {
      conAlMenosUnReferido: totalReferidores,
      sinNingunReferido: totalSinReferidos,
    },
    concursosActivos,
    top10Participantes,
    general: {
      totalUsuarios,
      totalParticipaciones,
      participacionesConReferido: totalConReferidos,
      porcentajeReferidos: totalParticipaciones > 0 ? Math.round((totalConReferidos / totalParticipaciones) * 100) : 0,
      totalPuntosNivel2: totalPuntosNivel2._sum.puntosNivel2 ?? 0,
    },
  });
}
