import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const conNivel2 = await prisma.participanteConcurso.findMany({
    where: { referidorNivel2Id: { not: null } },
    include: {
      usuario: { select: { nombre: true, emailVerificado: true } },
      concurso: { select: { premio: true, activo: true } },
    },
    take: 10,
  });

  const casos = [];
  for (const p of conNivel2) {
    const nivel2Part = await prisma.participanteConcurso.findUnique({
      where: {
        concursoId_usuarioId: {
          concursoId: p.concursoId,
          usuarioId: p.referidorNivel2Id!,
        },
      },
      select: {
        puntos: true,
        puntosNivel2: true,
        puntosNivel2Pendientes: true,
        usuario: { select: { nombre: true } },
      },
    });

    let diagnostico: "OK" | "SIN_PUNTOS" | "PENDIENTE" = "SIN_PUNTOS";
    if (nivel2Part) {
      if (nivel2Part.puntosNivel2 > 0) diagnostico = "OK";
      else if (nivel2Part.puntosNivel2Pendientes > 0) diagnostico = "PENDIENTE";
    }

    casos.push({
      participante: p.usuario.nombre,
      emailVerificado: p.usuario.emailVerificado,
      concurso: p.concurso.premio,
      concursoActivo: p.concurso.activo,
      nivel2Usuario: nivel2Part?.usuario.nombre ?? "NO ENCONTRADO",
      nivel2Puntos: nivel2Part?.puntos ?? 0,
      nivel2PuntosAcumulados: nivel2Part?.puntosNivel2 ?? 0,
      nivel2Pendientes: nivel2Part?.puntosNivel2Pendientes ?? 0,
      diagnostico,
    });
  }

  return NextResponse.json({
    totalConNivel2: conNivel2.length,
    casos,
  });
}
