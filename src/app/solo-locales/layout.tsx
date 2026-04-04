import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aumenta tus ventas y llega a más clientes — DeseoComer",
  description: "Conecta con personas en Santiago que buscan dónde comer hoy. Publica concursos, promociones y haz crecer tu local sin costo.",
  openGraph: {
    title: "🚀 Aumenta tus ventas y llega a más clientes — DeseoComer",
    description: "Conecta con personas en Santiago que buscan dónde comer hoy. Publica concursos, promociones y haz crecer tu local sin costo.",
    url: "https://deseocomer.com/solo-locales",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
    images: [{ url: "/api/og?title=Haz+crecer+tu+local&subtitle=Publica+concursos+y+promociones+para+llegar+a+m%C3%A1s+clientes", width: 1200, height: 630 }],
  },
};

export default function SoloLocalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
