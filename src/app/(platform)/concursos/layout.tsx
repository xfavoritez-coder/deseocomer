import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Concursos — Gana comida gratis | DeseoComer",
  description: "Participa gratis en concursos de los mejores restaurantes. Invita amigos, sube en el ranking y gana premios de comida.",
  openGraph: {
    title: "🏆 Concursos — Gana comida gratis | DeseoComer",
    description: "Participa gratis en concursos de los mejores restaurantes. Invita amigos, sube en el ranking y gana premios de comida.",
    url: "https://deseocomer.com/concursos",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
  },
};

export default function ConcursosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
