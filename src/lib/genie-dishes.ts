import { prisma } from "@/lib/prisma";

// Dietary restriction → ingredient names to exclude
const RESTRICTION_MAP: Record<string, string[]> = {
  "vegetariano": ["pollo", "carne", "cerdo", "vacuno", "cordero", "pavo", "tocino", "jamón", "salchicha", "chorizo"],
  "vegano": ["pollo", "carne", "cerdo", "vacuno", "cordero", "pavo", "tocino", "jamón", "salchicha", "chorizo", "queso", "crema", "mantequilla", "leche", "yogurt", "huevo", "miel"],
  "sin gluten": ["pan", "pasta", "harina", "trigo", "cebada"],
  "sin mariscos": ["camarón", "langostino", "pulpo", "calamar", "mejillón", "ostra", "almeja", "cangrejo", "jaiba"],
  "sin cerdo": ["cerdo", "tocino", "jamón", "chorizo", "salchicha"],
  "sin lácteos": ["queso", "crema", "mantequilla", "leche", "yogurt"],
  "sin frutos secos": ["maní", "nuez", "almendra", "avellana", "pistacho", "castaña"],
};

export async function getInitialDishes(userId?: string, sessionId?: string, excludeIds: string[] = []) {
  // Get user profile if exists
  let profile: { avoidIngredients: string[]; dietaryRestrictions: string[]; fitnessMode: string | null } | null = null;
  if (userId) {
    profile = await prisma.userTasteProfile.findUnique({
      where: { userId },
      select: { avoidIngredients: true, dietaryRestrictions: true, fitnessMode: true },
    });
  }

  // Build excluded ingredients from restrictions + profile
  const excludeIngredients = new Set<string>(profile?.avoidIngredients ?? []);
  for (const restriction of profile?.dietaryRestrictions ?? []) {
    const mapped = RESTRICTION_MAP[restriction.toLowerCase()];
    if (mapped) mapped.forEach(i => excludeIngredients.add(i));
  }

  // Get previously disliked dish ids
  const dislikedIds: string[] = [];
  if (userId || sessionId) {
    const disliked = await prisma.dishRating.findMany({
      where: {
        score: "DISLIKED",
        ...(userId ? { userId } : { sessionId: sessionId ?? "" }),
      },
      select: { menuItemId: true },
    });
    dislikedIds.push(...disliked.map(d => d.menuItemId));
  }

  const allExcludeIds = [...excludeIds, ...dislikedIds];

  // Fetch candidate dishes
  const dishes = await prisma.menuItem.findMany({
    where: {
      isAvailable: true,
      imagenUrl: { not: null },
      ...(allExcludeIds.length > 0 ? { id: { notIn: allExcludeIds } } : {}),
    },
    include: {
      ingredientTags: { include: { ingredient: true } },
      local: { select: { id: true, nombre: true, comuna: true, direccion: true, lat: true, lng: true, logoUrl: true, linkPedido: true } },
    },
    orderBy: [{ destacado: "desc" }, { totalLoved: "desc" }, { avgRating: "desc" }],
    take: 100,
  });

  // Filter out dishes containing excluded ingredients
  let filtered = dishes;
  if (excludeIngredients.size > 0) {
    filtered = dishes.filter(d => {
      const dishIngredients = [
        ...d.ingredients.map(i => i.toLowerCase()),
        ...d.ingredientTags.map(t => t.ingredient.name.toLowerCase()),
      ];
      return !dishIngredients.some(i => excludeIngredients.has(i));
    });
  }

  // Apply fitness mode ordering
  if (profile?.fitnessMode === "CUTTING") {
    filtered.sort((a, b) => {
      const aProtein = a.ingredientTags.filter(t => t.ingredient.category === "PROTEIN").length;
      const bProtein = b.ingredientTags.filter(t => t.ingredient.category === "PROTEIN").length;
      return bProtein - aProtein;
    });
  } else if (profile?.fitnessMode === "GAINING") {
    filtered.sort((a, b) => {
      const aHeavy = a.hungerLevel === "HEAVY" ? 1 : 0;
      const bHeavy = b.hungerLevel === "HEAVY" ? 1 : 0;
      return bHeavy - aHeavy;
    });
  }

  return filtered.slice(0, 9).map(d => ({
    id: d.id,
    nombre: d.nombre,
    categoria: d.categoria,
    descripcion: d.descripcion,
    precio: d.precio,
    imagenUrl: d.imagenUrl,
    hungerLevel: d.hungerLevel,
    avgRating: d.avgRating,
    totalLoved: d.totalLoved,
    ingredients: d.ingredientTags.map(t => t.ingredient.name),
    local: d.local,
  }));
}
