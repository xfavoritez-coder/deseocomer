import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esComunaValida } from "@/lib/comunas";

// Lightweight API: returns only valid comunas where we have locales + precomputed counts
export async function GET() {
  try {
    // Try to get precomputed counts first
    const cached = await prisma.configSite.findUnique({ where: { clave: "comunas_conteo" } }).catch(() => null);

    if (cached?.valor) {
      try {
        const data = JSON.parse(cached.valor) as { conteo: Record<string, number>; conteoDelivery: Record<string, number>; totalLocales?: number };
        const comunas = Object.keys(data.conteo).sort((a, b) => a.localeCompare(b));
        const comunasDelivery = Object.keys(data.conteoDelivery).sort((a, b) => a.localeCompare(b));
        return NextResponse.json({ comunas, comunasDelivery, conteo: data.conteo, conteoDelivery: data.conteoDelivery, totalLocales: data.totalLocales ?? 0 }, {
          headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        });
      } catch { /* fall through to live query */ }
    }

    // Fallback: live query
    const locales = await prisma.local.findMany({
      where: {
        OR: [
          { activo: true },
          { estadoLocal: "ACTIVO", origenImportacion: "GOOGLE_PLACES" },
        ],
        nombre: { not: "" },
        comuna: { not: "" },
        NOT: { estadoLocal: "RECHAZADO" },
      },
      select: { comuna: true, tieneDelivery: true, comunasDelivery: true },
    });

    const conteo: Record<string, number> = {};
    const conteoDelivery: Record<string, number> = {};

    for (const l of locales) {
      const c = l.comuna;
      if (c && esComunaValida(c)) {
        conteo[c] = (conteo[c] ?? 0) + 1;
      }
      if (l.tieneDelivery && c && esComunaValida(c)) {
        conteoDelivery[c] = (conteoDelivery[c] ?? 0) + 1;
      }
      for (const dc of l.comunasDelivery ?? []) {
        if (dc && esComunaValida(dc)) {
          conteoDelivery[dc] = (conteoDelivery[dc] ?? 0) + 1;
        }
      }
    }

    const comunas = Object.keys(conteo).sort((a, b) => a.localeCompare(b));
    const comunasDelivery = Object.keys(conteoDelivery).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ comunas, comunasDelivery, conteo, conteoDelivery, totalLocales: locales.length }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ comunas: [], comunasDelivery: [], conteo: {}, conteoDelivery: {}, totalLocales: 0 });
  }
}
