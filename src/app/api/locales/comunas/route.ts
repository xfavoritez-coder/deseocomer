import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lightweight API: returns only unique comunas and delivery comunas
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

    const comunas = [...new Set(locales.map(l => l.comuna).filter(Boolean))];
    const comunasDelivery = [...new Set(locales.flatMap(l => [...(l.comunasDelivery ?? []), ...(l.tieneDelivery ? [l.comuna] : [])]).filter(Boolean))];

    return NextResponse.json({ comunas, comunasDelivery });
  } catch {
    return NextResponse.json({ comunas: [], comunasDelivery: [] });
  }
}
