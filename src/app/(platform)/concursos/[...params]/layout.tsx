import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ params: string[] }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { params: segments } = await params;
  const slug = segments[0] ?? "";
  const refName = segments[1] ? decodeURIComponent(segments[1]) : null;

  try {
    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: { premio: true, descripcion: true, imagenUrl: true, local: { select: { nombre: true, portadaUrl: true } } },
    });

    if (!concurso) return {};

    const premioCorto = concurso.premio.length > 40
      ? concurso.premio.substring(0, 40).trim() + "..."
      : concurso.premio;

    // Personalizar título si viene de un link de referido
    const refNameCapitalized = refName ? refName.charAt(0).toUpperCase() + refName.slice(1) : null;
    const title = refNameCapitalized
      ? `${refNameCapitalized} te invita a ganar ${premioCorto} | DeseoComer`
      : `🏆 Premio: ${premioCorto} — ${concurso.local.nombre} | DeseoComer`;
    const description = refNameCapitalized
      ? `${refNameCapitalized} está participando por ${premioCorto} en ${concurso.local.nombre}. Regístrate gratis, súmale puntos y tú también entras a ganar.`
      : "Participa gratis y gana este premio. Invita amigos, suma puntos y gana. ¡Únete ahora en DeseoComer!";

    // OG image: use concurso/local image if available, fallback to static
    const ogImage = concurso.imagenUrl || concurso.local.portadaUrl || "https://deseocomer.com/og-default.png";

    const url = `https://deseocomer.com/concursos/${slug}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        siteName: "DeseoComer",
        images: [{ url: ogImage, width: 1200, height: 630, alt: concurso.premio }],
        type: "website",
        locale: "es_CL",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
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
