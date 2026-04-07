import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    // Sequential queries to avoid saturating connection pool
    const totalUsuarios = await prisma.usuario.count();
    const totalLocales = await prisma.local.count();
    const localesActivos = await prisma.local.count({ where: { OR: [{ activo: true }, { estadoLocal: "ACTIVO", origenImportacion: "GOOGLE_PLACES" }] } });
    const localesManualesPendientes = await prisma.local.count({ where: { activo: false, origenImportacion: null } });
    const localesReclamadosPendientes = await prisma.local.count({ where: { reclamadoEn: { not: null }, activo: false } });
    const concursosActivos = await prisma.concurso.count({ where: { activo: true } });
    const totalConcursos = await prisma.concurso.count();
    const totalPromociones = await prisma.promocion.count();
    const totalFavoritos = await prisma.favorito.count();
    const totalResenas = await prisma.resena.count();
    const listaEspera = await prisma.listaEsperaLocal.count();
    const ultimosUsuarios = await prisma.usuario.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, nombre: true, email: true, ciudad: true, createdAt: true } });
    const ultimosLocales = await prisma.local.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, nombre: true, email: true, ciudad: true, activo: true, createdAt: true } });

    return NextResponse.json({ totalUsuarios, totalLocales, localesActivos, localesManualesPendientes, localesReclamadosPendientes, totalConcursos, concursosActivos, totalPromociones, totalFavoritos, totalResenas, listaEspera, ultimosUsuarios, ultimosLocales });
  } catch (error) {
    console.error("[Admin stats]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
