import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { COMUNAS_MAESTRAS, esComunaValida } from "@/lib/comunas";

// Lightweight API: returns only valid comunas where we have locales
export async function GET() {
  try {
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

    // Only return comunas that are in the master list
    const comunasRaw = [...new Set(locales.map(l => l.comuna).filter(Boolean))] as string[];
    const comunas = comunasRaw.filter(c => esComunaValida(c)).sort((a, b) => a.localeCompare(b));
    const comunasDeliveryRaw = [...new Set(locales.flatMap(l => [...(l.comunasDelivery ?? []), ...(l.tieneDelivery ? [l.comuna] : [])]).filter(Boolean))] as string[];
    const comunasDelivery = comunasDeliveryRaw.filter(c => esComunaValida(c)).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ comunas, comunasDelivery }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ comunas: [], comunasDelivery: [] });
  }
}
