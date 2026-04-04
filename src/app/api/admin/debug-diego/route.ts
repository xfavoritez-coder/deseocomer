import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const diego = await prisma.usuario.findFirst({
    where: { email: "diegomatiasjorquera@gmail.com" },
    select: { id: true, nombre: true, emailVerificado: true, ipRegistro: true, createdAt: true },
  });

  if (!diego) return NextResponse.json({ error: "No encontrado" });

  const participaciones = await prisma.participanteConcurso.findMany({
    where: { usuarioId: diego.id },
    include: { concurso: { select: { premio: true } } },
  });

  const comoReferido = await prisma.participanteConcurso.findMany({
    where: { referidorDirectoId: diego.id },
    include: {
      usuario: { select: { nombre: true, emailVerificado: true, ipRegistro: true } },
      concurso: { select: { premio: true } },
    },
  });

  return NextResponse.json({
    usuario: diego,
    participaciones: participaciones.map((p) => ({
      concurso: p.concurso.premio,
      puntos: p.puntos,
      puntosPendientes: p.puntosPendientes,
      puntosReferidosNuevos: p.puntosReferidosNuevos,
      puntosReferidosExistentes: p.puntosReferidosExistentes,
      puntosNivel2: p.puntosNivel2,
      puntosMadrugador: p.puntosMadrugador,
      esMadrugador: p.esMadrugador,
      referidorDirectoId: p.referidorDirectoId,
      referidorNivel2Id: p.referidorNivel2Id,
    })),
    personasQueElReferio: comoReferido.map((p) => ({
      nombre: p.usuario.nombre,
      emailVerificado: p.usuario.emailVerificado,
      ipRegistro: p.usuario.ipRegistro,
      concurso: p.concurso.premio,
      puntos: p.puntos,
    })),
  });
}
