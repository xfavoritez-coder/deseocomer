import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "¿Qué es DeseoComer? — La plataforma gastronómica de Chile",
  description: "Descubre dónde comer, participa en concursos y gana comida gratis. La forma más fácil de encontrar restaurantes.",
  openGraph: {
    title: "🧞 ¿Qué es DeseoComer? — La plataforma gastronómica de Chile",
    description: "Descubre dónde comer, participa en concursos y gana comida gratis.",
    url: "https://deseocomer.com/que-es-deseocomer",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
    images: [{ url: "/api/og?title=%C2%BFQu%C3%A9+es+DeseoComer%3F&subtitle=La+plataforma+gastron%C3%B3mica+donde+ganas+comida+gratis", width: 1200, height: 630 }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
