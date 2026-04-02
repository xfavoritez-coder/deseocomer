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
  },
};

export default function UneteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
