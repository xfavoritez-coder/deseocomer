import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ params: string[] }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { params: segments } = await params;
  const slug = segments[0] ?? "";

  try {
    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: { premio: true, descripcion: true, imagenUrl: true, local: { select: { nombre: true, portadaUrl: true } } },
    });

    if (!concurso) return {};

    const title = `🏆 ${concurso.premio} — ${concurso.local.nombre} | DeseoComer`;
    const description = concurso.descripcion || `Participa gratis en el concurso de ${concurso.local.nombre} y gana: ${concurso.premio}`;
    const image = concurso.imagenUrl || concurso.local.portadaUrl || "https://deseocomer.com/og-default.png";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: image, width: 1200, height: 630 }],
        type: "website",
        siteName: "DeseoComer",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {};
  }
}

export default function ConcursoLayout({ children }: Props) {
  return children;
}
