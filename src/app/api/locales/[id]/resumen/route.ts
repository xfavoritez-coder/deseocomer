import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const local = await prisma.local.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: {
        id: true, slug: true, nombre: true, logoUrl: true,
        comuna: true, ciudad: true, direccion: true,
        categorias: true,
        horarios: true, horarioGoogle: true,
        origenImportacion: true,
      },
    });
    if (!local) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Count pending contest deliveries (lightweight count query)
    const concursosPendientes = await prisma.concurso.count({
      where: { localId: local.id, estado: "finalizado", premioEntregado: false },
    });

    return NextResponse.json({ ...local, concursosPendientes });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
