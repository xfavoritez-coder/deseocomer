import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto — DeseoComer",
  description: "¿Tienes dudas o quieres registrar tu local? Escríbenos y te respondemos en 24 horas.",
  openGraph: {
    title: "Contacto — DeseoComer",
    description: "¿Tienes dudas o quieres registrar tu local? Escríbenos y te respondemos en 24 horas.",
    url: "https://deseocomer.com/contacto",
    siteName: "DeseoComer",
    type: "website",
    locale: "es_CL",
    images: [{ url: "/api/og?title=Cont%C3%A1ctanos&subtitle=%C2%BFTienes+dudas%3F+Escr%C3%ADbenos+y+te+respondemos+en+24+horas", width: 1200, height: 630 }],
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
