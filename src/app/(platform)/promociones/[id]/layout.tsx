import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const promo = await prisma.promocion.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { titulo: true, tipo: true, descripcion: true, imagenUrl: true, local: { select: { nombre: true, comuna: true } } },
    });
    if (!promo) return { title: "Promoción no encontrada — DeseoComer" };

    const localNombre = promo.local.nombre;
    const comuna = promo.local.comuna || "";
    const titulo = `${promo.titulo} — ${localNombre} | DeseoComer`;
    const desc = promo.descripcion || `${promo.titulo} en ${localNombre}${comuna ? `, ${comuna}` : ""}. Descubre promociones en DeseoComer.`;

    return {
      title: titulo,
      description: desc,
      openGraph: {
        title: `⚡ ${promo.titulo} — ${localNombre} | DeseoComer`,
        description: desc,
        images: [{ url: promo.imagenUrl || "https://deseocomer.com/og-default.png", width: 1200, height: 630 }],
      },
    };
  } catch {
    return { title: "DeseoComer" };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
