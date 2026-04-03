import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const concursos = await prisma.concurso.findMany({
      where: {
        estado: { in: ["finalizado", "en_revision", "completado", "expirado"] },
      },
      include: {
        local: { select: { id: true, nombre: true, slug: true, logoUrl: true, comuna: true } },
        ganadorActual: { select: { nombre: true } },
        _count: { select: { participantes: true } },
      },
      orderBy: { fechaFin: "desc" },
      take: 50,
    });

    return NextResponse.json(concursos);
  } catch (error) {
    console.error("[API concursos/finalizados]", error);
    return NextResponse.json([]);
  }
}
