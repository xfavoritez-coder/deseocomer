import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promociones — Ofertas exclusivas | DeseoComer",
  description: "Descuentos, happy hours y promociones especiales de los mejores restaurantes de Santiago.",
  openGraph: {
    title: "⚡ Promociones — Ofertas exclusivas | DeseoComer",
    description: "Descuentos, happy hours y promociones especiales de los mejores restaurantes de Santiago.",
    url: "https://deseocomer.com/promociones",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
  },
};

export default function PromocionesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
