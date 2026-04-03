import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, nombre: true, email: true, tipo: true, telefono: true, fotoUrl: true,
        emailVerificado: true, emailVerificadoAt: true, geniePerfil: true, ipRegistro: true,
        cumpleDia: true, cumpleMes: true, cumpleAnio: true, createdAt: true,
        _count: { select: { favoritos: true, resenas: true, participaciones: true } },
        participaciones: {
          select: {
            id: true, puntos: true, puntosNivel2: true, puntosNivel2Pendientes: true, estado: true, createdAt: true,
            referidoPor: true, referidorDirectoId: true, referidorNivel2Id: true,
            concurso: { select: { id: true, slug: true, premio: true, fechaFin: true, estado: true, local: { select: { nombre: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("[Admin usuarios]", error);
    return NextResponse.json([], { status: 500 });
  }
}
