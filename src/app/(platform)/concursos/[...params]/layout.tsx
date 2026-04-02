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

    const premioCorto = concurso.premio.length > 40
      ? concurso.premio.substring(0, 40).trim() + '...'
      : concurso.premio;
    const title = `🏆 Premio: ${premioCorto} — ${concurso.local.nombre} | DeseoComer`;
    const description = "Participa gratis y gana este premio. Invita amigos, suma puntos y gana. ¡Únete ahora en DeseoComer!";
    const image = concurso.imagenUrl?.startsWith('http')
      ? concurso.imagenUrl
      : concurso.imagenUrl
        ? `https://deseocomer.com${concurso.imagenUrl}`
        : concurso.local.portadaUrl?.startsWith('http')
          ? concurso.local.portadaUrl
          : concurso.local.portadaUrl
            ? `https://deseocomer.com${concurso.local.portadaUrl}`
            : null;
    const url = `https://deseocomer.com/concursos/${slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: "DeseoComer",
        ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: concurso.premio }] } : {}),
        type: "website",
        locale: "es_CL",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
      alternates: { canonical: url },
    };
  } catch {
    return {};
  }
}

export default function ConcursoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
