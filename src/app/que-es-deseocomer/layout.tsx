import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "¿Qué es DeseoComer? — La plataforma gastronómica de Chile",
  description: "Descubre dónde comer en Santiago, participa en concursos y gana comida gratis. La forma más fácil de encontrar restaurantes.",
  openGraph: {
    title: "🧞 ¿Qué es DeseoComer? — La plataforma gastronómica de Chile",
    description: "Descubre dónde comer en Santiago, participa en concursos y gana comida gratis.",
    url: "https://deseocomer.com/que-es-deseocomer",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
