import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CLAVE = "stats_locales";

interface StatsData {
  busquedas: Record<string, number>;
  comunas: Record<string, number>;
  categorias: Record<string, number>;
  paginas: Record<string, number>;
  promocionesVistas: Record<string, number>;
  totalBusquedas: number;
  totalFiltrosComunas: number;
  totalFiltrosCategorias: number;
  totalPromocionesVistas: number;
  updatedAt: string;
}

function emptyStats(): StatsData {
  return { busquedas: {}, comunas: {}, categorias: {}, paginas: {}, promocionesVistas: {}, totalBusquedas: 0, totalFiltrosComunas: 0, totalFiltrosCategorias: 0, totalPromocionesVistas: 0, updatedAt: new Date().toISOString() };
}

// POST: receive events and merge into stats (atomic upsert)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventos: { tipo: string; valor: string }[] = body.eventos;
    if (!Array.isArray(eventos) || eventos.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const batch = eventos.slice(0, 50);

    // Atomic read-modify-write using Prisma transaction
    await prisma.$transaction(async (tx) => {
      const row = await tx.configSite.findUnique({ where: { clave: CLAVE } });
      const stats: StatsData = row?.valor ? JSON.parse(row.valor) : emptyStats();

      for (const e of batch) {
        const val = (e.valor ?? "").toLowerCase().trim();
        if (!val || val.length > 100) continue;

        switch (e.tipo) {
          case "busqueda":
            stats.busquedas[val] = (stats.busquedas[val] ?? 0) + 1;
            stats.totalBusquedas++;
            break;
          case "comuna":
            stats.comunas[val] = (stats.comunas[val] ?? 0) + 1;
            stats.totalFiltrosComunas++;
            break;
          case "categoria":
            stats.categorias[val] = (stats.categorias[val] ?? 0) + 1;
            stats.totalFiltrosCategorias++;
            break;
          case "pagina":
            stats.paginas[val] = (stats.paginas[val] ?? 0) + 1;
            break;
          case "promocion_vista":
            stats.promocionesVistas[val] = (stats.promocionesVistas[val] ?? 0) + 1;
            stats.totalPromocionesVistas++;
            break;
        }
      }

      // Keep only top 200 per category
      for (const key of ["busquedas", "comunas", "categorias", "paginas", "promocionesVistas"] as const) {
        const entries = Object.entries(stats[key]);
        if (entries.length > 200) {
          entries.sort((a, b) => b[1] - a[1]);
          stats[key] = Object.fromEntries(entries.slice(0, 200));
        }
      }

      stats.updatedAt = new Date().toISOString();

      await tx.configSite.upsert({
        where: { clave: CLAVE },
        update: { valor: JSON.stringify(stats) },
        create: { id: CLAVE, clave: CLAVE, valor: JSON.stringify(stats) },
      });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// GET: return stats for admin
export async function GET() {
  try {
    const row = await prisma.configSite.findUnique({ where: { clave: CLAVE } });
    const stats: StatsData = row?.valor ? JSON.parse(row.valor) : emptyStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch {
    return NextResponse.json(emptyStats());
  }
}
