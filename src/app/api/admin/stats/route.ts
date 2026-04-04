import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const [
      totalUsuarios, totalLocales, localesActivos,
      totalConcursos, concursosActivos, totalPromociones,
      totalFavoritos, totalResenas, listaEspera,
      ultimosUsuarios, ultimosLocales,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.local.count(),
      prisma.local.count({ where: { activo: true } }),
      prisma.concurso.count(),
      prisma.concurso.count({ where: { activo: true } }),
      prisma.promocion.count(),
      prisma.favorito.count(),
      prisma.resena.count(),
      prisma.listaEsperaLocal.count(),
      prisma.usuario.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, nombre: true, email: true, ciudad: true, createdAt: true } }),
      prisma.local.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, nombre: true, email: true, ciudad: true, activo: true, createdAt: true } }),
    ]);
    return NextResponse.json({ totalUsuarios, totalLocales, localesActivos, totalConcursos, concursosActivos, totalPromociones, totalFavoritos, totalResenas, listaEspera, ultimosUsuarios, ultimosLocales });
  } catch (error) {
    console.error("[Admin stats]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
