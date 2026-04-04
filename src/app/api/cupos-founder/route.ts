import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [configTotal, configUsados] = await Promise.all([
      prisma.configSite.findUnique({ where: { clave: "cupos_founder_total" } }),
      prisma.configSite.findUnique({ where: { clave: "cupos_founder_usados" } }),
    ]);
    const total = configTotal ? parseInt(configTotal.valor) : 50;
    const usados = configUsados ? parseInt(configUsados.valor) : 0;
    return NextResponse.json({ total, usados, restantes: Math.max(0, total - usados) });
  } catch {
    return NextResponse.json({ total: 50, usados: 0, restantes: 50 });
  }
}
