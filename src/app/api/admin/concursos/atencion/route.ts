import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    const concursos = await prisma.concurso.findMany({
      where: {
        estado: { in: ["en_revision", "en_disputa"] },
      },
      include: {
        local: { select: { nombre: true, email: true } },
        ganadorActual: { select: { id: true, nombre: true, email: true } },
        ganador1: { select: { id: true, nombre: true } },
        ganador2: { select: { id: true, nombre: true } },
        ganador3: { select: { id: true, nombre: true } },
      },
      orderBy: { fechaFin: "desc" },
    });

    return NextResponse.json(concursos);
  } catch (error) {
    console.error("[Admin atencion]", error);
    return NextResponse.json([], { status: 500 });
  }
}
