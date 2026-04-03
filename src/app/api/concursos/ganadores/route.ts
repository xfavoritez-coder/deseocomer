import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ganadores = await prisma.concurso.findMany({
      where: { estado: "completado" },
      include: {
        local: { select: { nombre: true, categoria: true } },
        ganadorActual: { select: { nombre: true } },
      },
      orderBy: { premioConfirmadoAt: "desc" },
    });

    return NextResponse.json(
      ganadores.map(g => ({
        id: g.id,
        slug: g.slug,
        premio: g.premio,
        imagenUrl: g.imagenUrl,
        local: g.local.nombre,
        categoria: g.local.categoria,
        ganador: g.ganadorActual?.nombre ?? "Ganador",
        fechaFin: g.premioConfirmadoAt?.toLocaleDateString("es-CL") ?? "",
        participantes: 0,
      })),
    );
  } catch (error) {
    console.error("[API ganadores]", error);
    return NextResponse.json([]);
  }
}
