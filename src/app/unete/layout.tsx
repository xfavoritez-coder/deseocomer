import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Únete a DeseoComer — Registra tu local gratis",
  description: "Registra tu local en DeseoComer en menos de 3 minutos. Llega a miles de personas que buscan dónde comer.",
  openGraph: {
    title: "🧞 Únete a DeseoComer — Registra tu local gratis",
    description: "Registra tu local en DeseoComer en menos de 3 minutos. Llega a miles de personas que buscan dónde comer.",
    url: "https://deseocomer.com/unete",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
    images: [{ url: "/api/og?title=Registra+tu+local+gratis&subtitle=Llega+a+miles+de+personas+que+buscan+d%C3%B3nde+comer+en+Santiago", width: 1200, height: 630 }],
  },
};

export default function UneteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
