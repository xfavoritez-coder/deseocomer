import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ganadores = await prisma.concurso.findMany({
      where: { estado: { in: ["completado", "finalizado", "en_revision"] }, ganadorActualId: { not: null } },
      include: {
        local: { select: { nombre: true, categorias: true, logoUrl: true } },
        ganadorActual: { select: { id: true, nombre: true } },
        _count: { select: { participantes: true } },
      },
      orderBy: { fechaFin: "desc" },
    });

    return NextResponse.json(ganadores.map(g => ({
        id: g.id,
        slug: g.slug,
        premio: g.premio,
        imagenUrl: g.imagenUrl,
        fotoGanador: g.fotoGanador,
        local: g.local.nombre,
        localLogo: g.local.logoUrl,
        categoria: g.local.categorias?.[0] ?? "",
        ganador: (() => { const n = g.ganadorActual?.nombre ?? "Ganador"; const p = n.trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length-1][0]}.` : p[0]; })(),
        ganadorId: g.ganadorActualId,
        estado: g.estado,
        fechaFin: g.premioConfirmadoAt?.toLocaleDateString("es-CL") ?? g.fechaFin?.toLocaleDateString("es-CL") ?? "",
        participantes: g._count.participantes,
      })), {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("[API ganadores]", error);
    return NextResponse.json([]);
  }
}
