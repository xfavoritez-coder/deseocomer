import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gana dinero captando locales — DeseoComer",
  description: "Visita restaurantes, muéstrales DeseoComer y gana $10.000 por cada local registrado. Sin horarios fijos, sin jefe, a tu ritmo.",
  openGraph: {
    title: "🤝 Gana dinero captando locales — DeseoComer",
    description: "Visita restaurantes, muéstrales DeseoComer y gana $10.000 por cada local registrado. Sin horarios fijos, sin jefe, a tu ritmo.",
    url: "https://deseocomer.com/capta-locales",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
  },
};

export default function CaptaLocalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
