import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://deseocomer.com";

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/locales`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/concursos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/promociones`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/concursos/como-funciona`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/concursos/ganadores`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/que-es-deseocomer`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/unete`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contacto`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terminos`, changeFrequency: "monthly", priority: 0.2 },
  ];

  // Locales dinámicos
  const locales = await prisma.local.findMany({
    where: {
      OR: [
        { activo: true },
        { estadoLocal: "ACTIVO", origenImportacion: "GOOGLE_PLACES" },
      ],
      nombre: { not: "" },
      categorias: { isEmpty: false },
      NOT: { estadoLocal: "RECHAZADO" },
    },
    select: { slug: true, id: true, updatedAt: true },
  });

  const localesPages: MetadataRoute.Sitemap = locales.map(l => ({
    url: `${baseUrl}/locales/${l.slug || l.id}`,
    lastModified: l.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Concursos activos
  const concursos = await prisma.concurso.findMany({
    where: { activo: true, cancelado: false },
    select: { slug: true, id: true, fechaInicio: true },
  });

  const concursosPages: MetadataRoute.Sitemap = concursos.map(c => ({
    url: `${baseUrl}/concursos/${c.slug || c.id}`,
    lastModified: c.fechaInicio,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Promociones activas
  const promociones = await prisma.promocion.findMany({
    where: { activa: true },
    select: { slug: true, id: true, createdAt: true },
  });

  const promosPages: MetadataRoute.Sitemap = promociones.map(p => ({
    url: `${baseUrl}/promociones/${p.slug || p.id}`,
    lastModified: p.createdAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...localesPages, ...concursosPages, ...promosPages];
}
