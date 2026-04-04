import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CATEGORIAS_INICIALES = [
  // Principales (aparecen en filtros de locales)
  { nombre: "Pizza", slug: "pizza", emoji: "🍕", tipo: "principal", orden: 1 },
  { nombre: "Sushi", slug: "sushi", emoji: "🍣", tipo: "principal", orden: 2, estiloExcluido: ["vegano"] },
  { nombre: "Hamburguesa", slug: "hamburguesa", emoji: "🍔", tipo: "principal", orden: 3 },
  { nombre: "Vegano", slug: "vegano", emoji: "🌿", tipo: "principal", orden: 4 },
  { nombre: "Café", slug: "cafe", emoji: "☕", tipo: "principal", orden: 5 },
  { nombre: "Almuerzo", slug: "almuerzo", emoji: "🍱", tipo: "principal", orden: 6 },
  { nombre: "Pastas", slug: "pastas", emoji: "🍝", tipo: "principal", orden: 7 },
  { nombre: "Mexicano", slug: "mexicano", emoji: "🌮", tipo: "principal", orden: 8 },
  { nombre: "Mariscos", slug: "mariscos", emoji: "🦐", tipo: "principal", orden: 9, estiloExcluido: ["vegano"] },
  { nombre: "Pollo", slug: "pollo", emoji: "🍗", tipo: "principal", orden: 10, estiloExcluido: ["vegano", "vegetariano"] },
  // Tags (solo aparecen en tags y preferencias)
  { nombre: "Vegetariano", slug: "vegetariano", emoji: "🌱", tipo: "tag", orden: 11 },
  { nombre: "Saludable", slug: "saludable", emoji: "🥗", tipo: "tag", orden: 12 },
  { nombre: "Parrilla", slug: "parrilla", emoji: "🥩", tipo: "tag", orden: 13, estiloExcluido: ["vegano", "vegetariano"] },
  { nombre: "Árabe", slug: "arabe", emoji: "🧆", tipo: "tag", orden: 14 },
  { nombre: "Peruano", slug: "peruano", emoji: "🇵🇪", tipo: "tag", orden: 15 },
  { nombre: "India", slug: "india", emoji: "🍛", tipo: "tag", orden: 16 },
  { nombre: "Coreano", slug: "coreano", emoji: "🥘", tipo: "tag", orden: 17 },
  { nombre: "Mediterráneo", slug: "mediterraneo", emoji: "🫒", tipo: "tag", orden: 18 },
  { nombre: "Thai", slug: "thai", emoji: "🍜", tipo: "tag", orden: 19 },
  { nombre: "Ramen", slug: "ramen", emoji: "🍜", tipo: "tag", orden: 20 },
  { nombre: "Fusión", slug: "fusion", emoji: "🎌", tipo: "tag", orden: 21 },
  { nombre: "Sin gluten", slug: "sin-gluten", emoji: "🌾", tipo: "tag", orden: 22 },
  { nombre: "Postres", slug: "postres", emoji: "🍰", tipo: "tag", orden: 23 },
  { nombre: "Brunch", slug: "brunch", emoji: "🥞", tipo: "tag", orden: 24 },
];

export async function POST() {
  try {
    let creadas = 0;
    let existentes = 0;
    for (const cat of CATEGORIAS_INICIALES) {
      const existe = await prisma.categoriaComida.findUnique({ where: { slug: cat.slug } });
      if (existe) { existentes++; continue; }
      await prisma.categoriaComida.create({
        data: {
          nombre: cat.nombre,
          slug: cat.slug,
          emoji: cat.emoji,
          tipo: cat.tipo,
          orden: cat.orden,
          estiloExcluido: cat.estiloExcluido || [],
        },
      });
      creadas++;
    }
    return NextResponse.json({ ok: true, creadas, existentes });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
