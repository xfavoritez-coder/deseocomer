import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const locales = await prisma.local.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, slug: true, nombre: true, nombreDueno: true, celularDueno: true, email: true, telefono: true, ciudad: true, comuna: true, direccion: true, categoria: true, logoUrl: true, activo: true, verificado: true, createdAt: true, _count: { select: { concursos: true, promociones: true, favoritos: true, resenas: true } } },
    });
    return NextResponse.json(locales);
  } catch (error) {
    console.error("[Admin locales]", error);
    return NextResponse.json([], { status: 500 });
  }
}
