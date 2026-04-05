import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lightweight API for Genie recommendations
// Returns max 20 locales filtered by optional categoria/comuna
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get("categoria");
    const comuna = searchParams.get("comuna");
    const modalidad = searchParams.get("modalidad");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      OR: [
        { activo: true },
        { estadoLocal: "ACTIVO", origenImportacion: "GOOGLE_PLACES" },
      ],
      nombre: { not: "" },
      categorias: { isEmpty: false },
      NOT: { estadoLocal: "RECHAZADO" },
    };

    if (categoria && categoria.toLowerCase() !== "sorpréndeme" && categoria.toLowerCase() !== "sorprendeme") {
      where.categorias = { has: categoria };
    }
    if (comuna) {
      where.comuna = { contains: comuna, mode: "insensitive" };
    }
    if (modalidad === "delivery") {
      where.tieneDelivery = true;
    }
    if (modalidad === "retiro") {
      // All physical locales qualify
      where.comuna = where.comuna ?? { not: "" };
    }

    const locales = await prisma.local.findMany({
      where,
      select: {
        id: true, slug: true, nombre: true, categorias: true, comuna: true,
        googleRating: true, estadoLocal: true,
        portadaUrl: true, logoUrl: true,
        tieneDelivery: true, comunasDelivery: true, tieneRetiro: true, linkPedido: true,
        _count: { select: { concursos: true } },
        concursos: { where: { activo: true, cancelado: false, fechaFin: { gt: new Date() } }, select: { id: true, slug: true, premio: true, fechaFin: true }, take: 1 },
        promociones: { where: { activa: true }, select: { id: true, titulo: true }, take: 1 },
      },
      orderBy: { googleRating: "desc" },
      take: 20,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const safe = locales.map(({ ...rest }) => ({
      id: String(rest.slug || rest.id),
      slug: rest.slug,
      nombre: rest.nombre,
      categoria: (rest.categorias[0] ?? "general").toLowerCase(),
      categorias: rest.categorias,
      comuna: rest.comuna ?? "Santiago",
      rating: 0,
      googleRating: rest.googleRating,
      estadoLocal: rest.estadoLocal,
      descuento: 0,
      foto: rest.portadaUrl,
      logoUrl: rest.logoUrl,
      portadaUrl: rest.portadaUrl,
      promociones: rest.promociones,
      concursos: rest.concursos,
      tieneConcurso: rest._count.concursos > 0,
      tieneDelivery: rest.tieneDelivery,
      comunasDelivery: rest.comunasDelivery,
      tieneRetiro: rest.tieneRetiro,
      linkPedido: rest.linkPedido ?? "",
    }));

    return NextResponse.json(safe);
  } catch (error) {
    console.error("[API /locales/recomendar]", error);
    return NextResponse.json([]);
  }
}
