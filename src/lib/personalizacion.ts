// Personalization boost based on geniePerfil (localStorage)
// Works for all visitors (logged in or not) on the same browser

interface GustosPerfil {
  categorias: Record<string, number>;
  comunas: Record<string, number>;
}

function getGustos(): GustosPerfil | null {
  try {
    const raw = localStorage.getItem("deseocomer_genio_perfil");
    if (!raw) return null;
    const perfil = JSON.parse(raw);
    const gustos = perfil?.gustos;
    if (!gustos) return null;
    const cats = gustos.categorias ?? {};
    const coms = gustos.comunas ?? {};
    // Only personalize if there's meaningful data
    if (Object.keys(cats).length === 0 && Object.keys(coms).length === 0) return null;
    return { categorias: cats, comunas: coms };
  } catch {
    return null;
  }
}

/**
 * Calculate a personalization boost score for an item.
 * Higher score = more relevant to the user's preferences.
 *
 * @param categoria - The item's category (e.g. "Sushi", "Pizza")
 * @param comuna - The item's comuna/location
 * @param tags - Optional tags array for additional matching
 */
export function boostScore(categoria?: string | null, comuna?: string | null, tags?: string[]): number {
  const gustos = getGustos();
  if (!gustos) return 0;

  let score = 0;

  // Helper: case-insensitive lookup in a record
  const lookup = (record: Record<string, number>, key: string): number => {
    const lower = key.toLowerCase();
    for (const [k, v] of Object.entries(record)) {
      if (k.toLowerCase() === lower) return v;
    }
    return 0;
  };

  // Category match (strongest signal)
  if (categoria) {
    score += lookup(gustos.categorias, categoria) * 3;
  }

  // Tags match (check each tag against categories)
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      score += lookup(gustos.categorias, tag) * 1.5;
    }
  }

  // Comuna match
  if (comuna) {
    score += lookup(gustos.comunas, comuna) * 2;
  }

  return score;
}

/**
 * Sort an array with personalization boost.
 * Items are sorted by: baseScore + boostScore.
 * Items with no boost keep their original relative order.
 *
 * @param items - Array to sort
 * @param getCategoria - Function to extract category from item
 * @param getComuna - Function to extract comuna from item
 * @param getTags - Optional function to extract tags from item
 * @param getBaseScore - Optional function for base score (default 0)
 */
export function personalizarOrden<T>(
  items: T[],
  getCategoria: (item: T) => string | null | undefined,
  getComuna: (item: T) => string | null | undefined,
  getTags?: (item: T) => string[] | undefined,
  getBaseScore?: (item: T) => number,
): T[] {
  const gustos = getGustos();
  if (!gustos) return items; // No personalization data, keep original order

  return [...items].sort((a, b) => {
    const boostA = boostScore(getCategoria(a), getComuna(a), getTags?.(a));
    const boostB = boostScore(getCategoria(b), getComuna(b), getTags?.(b));
    const baseA = getBaseScore?.(a) ?? 0;
    const baseB = getBaseScore?.(b) ?? 0;
    return (baseB + boostB) - (baseA + boostA);
  });
}

/**
 * Check if personalization data exists (for UI hints)
 */
export function tienePreferencias(): boolean {
  return getGustos() !== null;
}
