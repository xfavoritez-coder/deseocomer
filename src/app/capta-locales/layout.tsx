import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gana dinero captando locales — DeseoComer",
  description: "Visita restaurantes, muéstrales DeseoComer y gana $10.000 por cada local registrado. Sin horarios fijos, sin jefe, a tu ritmo.",
  openGraph: {
    title: "🤝 Gana dinero captando locales — DeseoComer",
    description: "Visita restaurantes, muéstrales DeseoComer y gana $10.000 por cada local registrado.",
    url: "https://deseocomer.com/capta-locales",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
    images: [{ url: "/api/og?title=Gana+dinero+captando+locales&subtitle=Gana+%2410.000+por+cada+local+registrado.+Sin+horarios%2C+a+tu+ritmo", width: 1200, height: 630 }],
  },
};

export default function CaptaLocalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
