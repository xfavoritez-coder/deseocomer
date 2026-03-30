import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const locales = await prisma.local.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, nombre: true, email: true, telefono: true, ciudad: true, categoria: true, activo: true, verificado: true, createdAt: true, _count: { select: { concursos: true, promociones: true, favoritos: true } } },
    });
    return NextResponse.json(locales);
  } catch { return NextResponse.json([]); }
}
