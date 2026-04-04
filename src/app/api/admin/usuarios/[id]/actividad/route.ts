import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  const { id } = await params;

  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      email: true,
      geniePerfil: true,
    },
  });

  if (!usuario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Participaciones en concursos con desglose
  const participaciones = await prisma.participanteConcurso.findMany({
    where: { usuarioId: id },
    include: {
      concurso: { select: { premio: true, activo: true, fechaFin: true, local: { select: { nombre: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Personas que este usuario refirió
  const referidos = await prisma.participanteConcurso.findMany({
    where: { referidorDirectoId: id },
    select: {
      usuario: { select: { nombre: true, emailVerificado: true } },
      concurso: { select: { premio: true } },
      puntos: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Resolver IDs de concursos vistos y promociones a nombres con conteo
  const gp = usuario.geniePerfil as any;
  const concursosVistosIds: string[] = gp?.comportamiento?.concursosVistos ?? [];
  const promosIds: string[] = gp?.comportamiento?.promocionesAbiertas ?? [];

  // Contar frecuencia
  const countMap = (arr: string[]) => {
    const m: Record<string, number> = {};
    for (const id of arr) m[id] = (m[id] ?? 0) + 1;
    return m;
  };
  const concursosVistosCount = countMap(concursosVistosIds);
  const promosCount = countMap(promosIds);

  // Resolver nombres de concursos
  const uniqueConcursoIds = Object.keys(concursosVistosCount);
  const concursosNombres: Record<string, string> = {};
  if (uniqueConcursoIds.length > 0) {
    const concursosData = await prisma.concurso.findMany({
      where: { id: { in: uniqueConcursoIds } },
      select: { id: true, premio: true },
    });
    for (const c of concursosData) concursosNombres[c.id] = c.premio;
  }

  // Resolver nombres de promociones
  const uniquePromoIds = Object.keys(promosCount);
  const promosNombres: Record<string, string> = {};
  if (uniquePromoIds.length > 0) {
    const promosData = await prisma.promocion.findMany({
      where: { id: { in: uniquePromoIds } },
      select: { id: true, titulo: true },
    });
    for (const p of promosData) promosNombres[p.id] = p.titulo;
  }

  const concursosVistosResueltos = Object.entries(concursosVistosCount)
    .map(([cid, count]) => ({ nombre: concursosNombres[cid] ?? cid, veces: count }))
    .sort((a, b) => b.veces - a.veces);

  const promosResueltas = Object.entries(promosCount)
    .map(([pid, count]) => ({ nombre: promosNombres[pid] ?? pid, veces: count }))
    .sort((a, b) => b.veces - a.veces);

  return NextResponse.json({
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    geniePerfil: usuario.geniePerfil,
    concursosVistos: concursosVistosResueltos,
    promocionesAbiertas: promosResueltas,
    concursos: participaciones.map((p) => ({
      concurso: p.concurso.premio,
      local: p.concurso.local.nombre,
      activo: p.concurso.activo,
      fechaFin: p.concurso.fechaFin,
      puntos: p.puntos,
      puntosPendientes: p.puntosPendientes,
      puntosReferidosNuevos: p.puntosReferidosNuevos,
      puntosReferidosExistentes: p.puntosReferidosExistentes,
      puntosNivel2: p.puntosNivel2,
      puntosNivel2Pendientes: p.puntosNivel2Pendientes,
      puntosMadrugador: p.puntosMadrugador,
      esMadrugador: p.esMadrugador,
      createdAt: p.createdAt,
    })),
    referidos: referidos.map((r) => ({
      nombre: r.usuario.nombre,
      emailVerificado: r.usuario.emailVerificado,
      concurso: r.concurso.premio,
      puntos: r.puntos,
      fecha: r.createdAt,
    })),
  });
}
