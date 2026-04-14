import { prisma } from "@/lib/prisma";

interface GenieContext {
  selectedDishIds: string[];
  ctxCompany?: string;
  ctxHunger?: string;
  ctxBudget?: number;
  ctxOccasion?: string;
  userLat?: number;
  userLng?: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

const HUNGER_MAP: Record<string, string[]> = {
  LIGHT: ["LIGHT"],
  MEDIUM: ["LIGHT", "MEDIUM"],
  HEAVY: ["MEDIUM", "HEAVY"],
};

export async function getRecommendations(ctx: GenieContext, userId?: string, sessionId?: string) {
  // 1. Get selected dishes and their ingredients
  const selectedDishes = await prisma.menuItem.findMany({
    where: { id: { in: ctx.selectedDishIds } },
    include: { ingredientTags: { include: { ingredient: true } } },
  });

  // Build session profile: ingredients + categories of selected dishes
  const ingredientCounts: Record<string, number> = {};
  const ingredientCategories: Record<string, string> = {};
  const selectedCategoryCounts: Record<string, number> = {};
  const selectedLocalIds = new Set<string>();

  for (const dish of selectedDishes) {
    // Track dish categories as fallback when no ingredients
    selectedCategoryCounts[dish.categoria] = (selectedCategoryCounts[dish.categoria] ?? 0) + 1;
    selectedLocalIds.add(dish.localId);
    for (const tag of dish.ingredientTags) {
      const name = tag.ingredient.name;
      ingredientCounts[name] = (ingredientCounts[name] ?? 0) + 1;
      ingredientCategories[name] = tag.ingredient.category;
    }
  }
  const hasIngredientData = Object.keys(ingredientCounts).length > 0;

  // Get user profile
  let profile: { avoidIngredients: string[]; dietaryRestrictions: string[]; fitnessMode: string | null } | null = null;
  if (userId) {
    profile = await prisma.userTasteProfile.findUnique({
      where: { userId },
      select: { avoidIngredients: true, dietaryRestrictions: true, fitnessMode: true },
    });
  }
  const avoidSet = new Set(profile?.avoidIngredients?.map(i => i.toLowerCase()) ?? []);

  // Get previously loved ingredient names
  const lovedIngredients = new Set<string>();
  if (userId || sessionId) {
    const loved = await prisma.dishRating.findMany({
      where: { score: "LOVED", ...(userId ? { userId } : { sessionId: sessionId ?? "" }) },
      select: { menuItem: { select: { ingredientTags: { select: { ingredient: { select: { name: true } } } } } } },
    });
    for (const r of loved) {
      for (const t of r.menuItem.ingredientTags) lovedIngredients.add(t.ingredient.name);
    }
  }

  // Determine hunger filter
  const hungerKey = ctx.ctxHunger?.toUpperCase() ?? "MEDIUM";
  const allowedHunger = HUNGER_MAP[hungerKey] ?? ["LIGHT", "MEDIUM", "HEAVY"];

  // 2. Fetch candidates
  const candidates = await prisma.menuItem.findMany({
    where: {
      isAvailable: true,
      imagenUrl: { not: null },
      id: { notIn: ctx.selectedDishIds },
    },
    include: {
      ingredientTags: { include: { ingredient: true } },
      local: { select: { id: true, nombre: true, slug: true, comuna: true, direccion: true, lat: true, lng: true, logoUrl: true, linkPedido: true } },
      _count: { select: { ratings: true } },
    },
    take: 200,
  });

  // 3. Score each candidate
  const scored = candidates
    .filter(c => {
      // Filter out dishes with avoid ingredients
      const ings = c.ingredientTags.map(t => t.ingredient.name.toLowerCase());
      if (ings.some(i => avoidSet.has(i))) return false;
      // Budget filter
      if (ctx.ctxBudget && c.precio > ctx.ctxBudget) return false;
      return true;
    })
    .map(c => {
      let score = 0;
      const ings = c.ingredientTags.map(t => t.ingredient.name);
      const ingCats = c.ingredientTags.map(t => t.ingredient.category);

      // Shared ingredients with session profile
      for (const ing of ings) {
        if (ingredientCounts[ing]) score += 3;
      }

      // Category match fallback (when dishes have no ingredient data)
      if (selectedCategoryCounts[c.categoria]) {
        score += hasIngredientData ? 1 : 5; // Strong boost when no ingredient data
      }

      // Same local boost (user liked dishes from this local)
      if (selectedLocalIds.has(c.localId)) score += 2;

      // Hunger level match
      if (c.hungerLevel && allowedHunger.includes(c.hungerLevel)) score += 2;

      // Loved history bonus
      for (const ing of ings) {
        if (lovedIngredients.has(ing)) score += 1;
      }

      // Fitness mode
      if (profile?.fitnessMode === "CUTTING") {
        const proteinCount = ingCats.filter(c => c === "PROTEIN").length;
        const carbCount = ingCats.filter(c => c === "CARB").length;
        if (proteinCount > carbCount) score += 2;
        if (carbCount > proteinCount) score -= 2;
      } else if (profile?.fitnessMode === "GAINING") {
        if (c.hungerLevel === "HEAVY") score += 2;
      }

      // Distance
      let distanceKm: number | null = null;
      if (ctx.userLat && ctx.userLng && c.local.lat && c.local.lng) {
        distanceKm = haversineKm(ctx.userLat, ctx.userLng, c.local.lat, c.local.lng);
      }

      // Tags
      const tags: string[] = [];
      if (c.totalLoved > 5) tags.push("Mas pedido");
      if (ings.some(i => ingredientCounts[i])) tags.push("Coincide con tus gustos");
      if (c.hungerLevel === "LIGHT") tags.push("Liviano");
      if (c.hungerLevel === "HEAVY") tags.push("Abundante");
      if (distanceKm !== null && distanceKm < 2) tags.push("Cerca tuyo");

      return {
        id: c.id,
        nombre: c.nombre,
        categoria: c.categoria,
        descripcion: c.descripcion,
        precio: c.precio,
        imagenUrl: c.imagenUrl,
        hungerLevel: c.hungerLevel,
        avgRating: c.avgRating,
        totalRatings: c._count.ratings,
        totalLoved: c.totalLoved,
        ingredients: ings,
        local: c.local,
        distanceKm,
        distanceLabel: distanceKm !== null ? formatDistance(distanceKm) : null,
        tags,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  // If no results, relax filters and try again
  if (scored.length === 0) {
    // Return any available dishes
    const fallback = candidates.slice(0, 3).map(c => {
      let distanceKm: number | null = null;
      if (ctx.userLat && ctx.userLng && c.local.lat && c.local.lng) {
        distanceKm = haversineKm(ctx.userLat, ctx.userLng, c.local.lat, c.local.lng);
      }
      return {
        id: c.id, nombre: c.nombre, categoria: c.categoria, descripcion: c.descripcion,
        precio: c.precio, imagenUrl: c.imagenUrl, hungerLevel: c.hungerLevel,
        avgRating: c.avgRating, totalRatings: c._count.ratings, totalLoved: c.totalLoved,
        ingredients: c.ingredientTags.map(t => t.ingredient.name),
        local: c.local, distanceKm,
        distanceLabel: distanceKm !== null ? formatDistance(distanceKm) : null,
        tags: [], score: 0,
      };
    });
    return fallback;
  }

  return scored.slice(0, 3);
}
