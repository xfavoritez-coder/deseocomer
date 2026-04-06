import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { esComunaValida } from "@/lib/comunas";

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

    // Count locals per comuna (only valid comunas)
    const conteo: Record<string, number> = {};
    const conteoDelivery: Record<string, number> = {};

    for (const l of locales) {
      const c = l.comuna;
      if (c && esComunaValida(c)) {
        conteo[c] = (conteo[c] ?? 0) + 1;
      }
      // Delivery: count the local's own comuna + all delivery comunas
      if (l.tieneDelivery && c && esComunaValida(c)) {
        conteoDelivery[c] = (conteoDelivery[c] ?? 0) + 1;
      }
      for (const dc of l.comunasDelivery ?? []) {
        if (dc && esComunaValida(dc)) {
          conteoDelivery[dc] = (conteoDelivery[dc] ?? 0) + 1;
        }
      }
    }

    const data = JSON.stringify({ conteo, conteoDelivery, totalLocales: locales.length, updatedAt: new Date().toISOString() });

    await prisma.configSite.upsert({
      where: { clave: "comunas_conteo" },
      update: { valor: data },
      create: { clave: "comunas_conteo", valor: data },
    });

    return NextResponse.json({ ok: true, comunas: Object.keys(conteo).length, total: locales.length });
  } catch (e) {
    console.error("Error contando comunas:", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
