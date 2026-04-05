import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const hace5min = new Date(Date.now() - 5 * 60 * 1000);

    const recientes = await prisma.participanteConcurso.findMany({
      where: {
        createdAt: { gte: hace5min },
        concurso: { activo: true, fechaFin: { gt: new Date() } },
      },
      select: {
        id: true,
        usuarioId: true,
        createdAt: true,
        usuario: { select: { nombre: true } },
        concurso: { select: { premio: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json(recientes.map((p) => {
        const parts = p.usuario.nombre.trim().split(/\s+/);
        const nombreCorto = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
        return {
          id: p.id,
          usuarioId: p.usuarioId,
          nombre: nombreCorto,
          premio: p.concurso.premio,
          slug: p.concurso.slug,
          timestamp: p.createdAt.getTime(),
        };
      }), {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json([]);
  }
}
