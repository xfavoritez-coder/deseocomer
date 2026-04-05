import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const local = await prisma.local.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { nombre: true, comuna: true, categorias: true, descripcion: true, portadaUrl: true },
    });
    if (!local) return { title: "Local no encontrado — DeseoComer" };

    const nombre = local.nombre;
    const comuna = local.comuna || "";
    const categoria = (local.categorias as string[])?.[0] || "";
    const titulo = `${nombre}${comuna ? `, ${comuna}` : ""} — DeseoComer`;
    const desc = local.descripcion || `${categoria ? categoria + " en " : ""}${comuna || "Santiago"}. Descubre ${nombre} en DeseoComer.`;

    return {
      title: titulo,
      description: desc,
      openGraph: {
        title: `🍽️ ${nombre}${comuna ? ` — ${comuna}` : ""} | DeseoComer`,
        description: desc,
        ...(local.portadaUrl && { images: [{ url: local.portadaUrl }] }),
      },
    };
  } catch {
    return { title: "DeseoComer" };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
