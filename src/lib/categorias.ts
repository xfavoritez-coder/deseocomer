export const CATEGORIAS = [
  "Sushi", "Pizza", "Hamburguesa", "Mexicano",
  "Vegano", "Vegetariano", "Saludable", "Pastas",
  "Pollo", "Mariscos", "Carnes / Parrilla", "Árabe",
  "Peruano", "India", "Coreano", "Mediterráneo", "Thai",
  "Ramen", "Fusión", "Sin gluten", "Café",
  "Postres", "Brunch", "Chifa",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const CATEGORIA_EMOJI: Record<string, string> = {
  "Sushi": "🍣",
  "Pizza": "🍕",
  "Hamburguesa": "🍔",
  "Mexicano": "🌮",
  "Vegano": "🌿",
  "Vegetariano": "🥗",
  "Saludable": "🥦",
  "Pastas": "🍝",
  "Pollo": "🍗",
  "Mariscos": "🦐",
  "Carnes / Parrilla": "🥩",
  "Árabe": "🧆",
  "Peruano": "🫙",
  "India": "🍛",
  "Coreano": "🍱",
  "Mediterráneo": "🫒",
  "Thai": "🍜",
  "Ramen": "🍜",
  "Fusión": "✨",
  "Sin gluten": "🌾",
  "Café": "☕",
  "Postres": "🍰",
  "Brunch": "🥐",
  "Chifa": "🥢",
};
