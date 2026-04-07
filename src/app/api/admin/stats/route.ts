import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    // Single raw query for all counts — 1 DB roundtrip instead of 13
    const counts = await prisma.$queryRawUnsafe<{ key: string; val: number }[]>(`
      SELECT 'totalUsuarios' as key, COUNT(*)::int as val FROM "Usuario"
      UNION ALL SELECT 'totalLocales', COUNT(*)::int FROM "Local"
      UNION ALL SELECT 'localesActivos', COUNT(*)::int FROM "Local" WHERE "activo" = true OR ("estadoLocal" = 'ACTIVO' AND "origenImportacion" = 'GOOGLE_PLACES')
      UNION ALL SELECT 'localesManualesPendientes', COUNT(*)::int FROM "Local" WHERE "activo" = false AND "origenImportacion" IS NULL
      UNION ALL SELECT 'localesReclamadosPendientes', COUNT(*)::int FROM "Local" WHERE "reclamadoEn" IS NOT NULL AND "activo" = false
      UNION ALL SELECT 'concursosActivos', COUNT(*)::int FROM "Concurso" WHERE "activo" = true
      UNION ALL SELECT 'totalConcursos', COUNT(*)::int FROM "Concurso"
      UNION ALL SELECT 'totalPromociones', COUNT(*)::int FROM "Promocion"
      UNION ALL SELECT 'totalFavoritos', COUNT(*)::int FROM "Favorito"
      UNION ALL SELECT 'totalResenas', COUNT(*)::int FROM "Resena"
      UNION ALL SELECT 'listaEspera', COUNT(*)::int FROM "ListaEsperaLocal"
    `);

    const map: Record<string, number> = {};
    for (const row of counts) map[row.key] = row.val;

    // These 2 small queries are fine — they're just 5 rows each
    const ultimosUsuarios = await prisma.usuario.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, nombre: true, email: true, ciudad: true, createdAt: true } });
    const ultimosLocales = await prisma.local.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, nombre: true, email: true, ciudad: true, activo: true, createdAt: true } });

    return NextResponse.json({ ...map, ultimosUsuarios, ultimosLocales });
  } catch (error) {
    console.error("[Admin stats]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
