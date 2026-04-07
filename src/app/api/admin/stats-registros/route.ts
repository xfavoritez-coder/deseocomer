import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    // Last 30 days of registrations grouped by day
    const desde = new Date();
    desde.setDate(desde.getDate() - 30);

    const usuarios = await prisma.usuario.findMany({
      where: { createdAt: { gte: desde } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const porDia: Record<string, number> = {};
    for (const u of usuarios) {
      const dia = new Date(u.createdAt).toISOString().split("T")[0];
      porDia[dia] = (porDia[dia] ?? 0) + 1;
    }

    // Fill in missing days with 0
    const result: { dia: string; registros: number }[] = [];
    const current = new Date(desde);
    const hoy = new Date();
    while (current <= hoy) {
      const dia = current.toISOString().split("T")[0];
      result.push({ dia, registros: porDia[dia] ?? 0 });
      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({
      total: usuarios.length,
      porDia: result,
    });
  } catch (error) {
    console.error("[Admin stats-registros]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
