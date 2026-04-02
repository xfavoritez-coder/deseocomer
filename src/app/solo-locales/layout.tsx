import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aumenta tus ventas y llega a más clientes — DeseoComer",
  description: "Llega a miles de personas en Santiago que buscan dónde comer hoy. Publica concursos, promociones y haz crecer tu local gratis.",
  openGraph: {
    title: "🚀 Aumenta tus ventas y llega a más clientes — DeseoComer",
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
