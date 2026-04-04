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

  return NextResponse.json({
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
    geniePerfil: usuario.geniePerfil,
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
