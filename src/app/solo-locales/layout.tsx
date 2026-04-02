import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registra tu local gratis — DeseoComer",
  description: "Llega a miles de personas en Santiago que buscan dónde comer hoy. Publica concursos, promociones y haz crecer tu local gratis.",
  openGraph: {
    title: "🏪 Registra tu local gratis — DeseoComer",
    description: "Llega a miles de personas en Santiago que buscan dónde comer hoy. Publica concursos, promociones y haz crecer tu local gratis.",
    url: "https://deseocomer.com/solo-locales",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
  },
};

export default function SoloLocalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
