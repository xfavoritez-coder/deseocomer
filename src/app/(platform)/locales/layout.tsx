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
  },
};

export default function LocalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
