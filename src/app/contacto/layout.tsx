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
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
