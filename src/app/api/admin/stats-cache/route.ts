import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

const CLAVE = "admin_stats_cache";

// GET: return precalculated stats (lightweight read)
export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    const row = await prisma.configSite.findUnique({ where: { clave: CLAVE } });
    if (!row?.valor) return NextResponse.json({ sospechosos: [], usuarios: null, registros: null });
    return NextResponse.json(JSON.parse(row.valor), {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch {
    return NextResponse.json({ sospechosos: [], usuarios: null, registros: null });
  }
}
