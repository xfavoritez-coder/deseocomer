import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Locales — Descubre dónde comer | DeseoComer",
  description: "Los mejores restaurantes, cafeterías y locales de comida de Santiago. Encuentra dónde comer hoy.",
  openGraph: {
    title: "🍽️ Locales — Descubre dónde comer | DeseoComer",
    description: "Los mejores restaurantes, cafeterías y locales de comida de Santiago. Encuentra dónde comer hoy.",
    url: "https://deseocomer.com/locales",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
    images: [{ url: "/api/og?title=Descubre+d%C3%B3nde+comer&subtitle=Los+mejores+restaurantes+y+locales+de+comida+de+Santiago", width: 1200, height: 630 }],
  },
};

export default function LocalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
