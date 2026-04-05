// ─── COMUNAS MAESTRAS DE CHILE ──────────────────────────────────────────
// Fuente única de verdad para todas las comunas válidas.
// Cualquier import, API o display debe usar esta lista.

export const COMUNAS_MAESTRAS = [
  // Santiago
  "Providencia", "Santiago Centro", "Ñuñoa", "Las Condes", "Vitacura",
  "San Miguel", "Maipú", "La Florida", "Pudahuel", "Peñalolén", "Macul",
  "La Reina", "Lo Barnechea", "Huechuraba", "Recoleta", "Independencia",
  "Estación Central", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque",
  "La Cisterna", "La Granja", "La Pintana", "Lo Espejo", "Lo Prado",
  "Quilicura", "Quinta Normal", "Renca", "San Bernardo", "San Joaquín",
  "San Ramón", "Padre Hurtado", "Puente Alto", "Pirque", "Colina", "Lampa",
  "Melipilla", "Talagante", "Pedro Aguirre Cerda", "Buin",
  // Valparaíso
  "Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "Con Con",
  "Reñaca", "Casablanca",
  // Concepción
  "Concepción", "Talcahuano", "Hualpén", "San Pedro de la Paz", "Chiguayante",
  // Otras ciudades
  "La Serena", "Coquimbo", "Antofagasta", "Calama", "Temuco", "Pucón",
  "Villarrica", "Rancagua", "Talca", "Chillán", "Osorno", "Puerto Montt",
  "Iquique", "Arica",
] as const;

export type ComunaValida = (typeof COMUNAS_MAESTRAS)[number];

// Aliases comunes → comuna maestra
const ALIASES: Record<string, string> = {
  "santiago": "Santiago Centro",
  "stgo": "Santiago Centro",
  "stgo centro": "Santiago Centro",
  "las condes": "Las Condes",
  "la florida": "La Florida",
  "maipu": "Maipú",
  "nunoa": "Ñuñoa",
  "ñuñoa": "Ñuñoa",
  "estacion central": "Estación Central",
  "est. central": "Estación Central",
  "lo barnechea": "Lo Barnechea",
  "san bernardo": "San Bernardo",
  "san miguel": "San Miguel",
  "san joaquin": "San Joaquín",
  "san ramon": "San Ramón",
  "quinta normal": "Quinta Normal",
  "pedro aguirre cerda": "Pedro Aguirre Cerda",
  "puente alto": "Puente Alto",
  "cerro navia": "Cerro Navia",
  "la cisterna": "La Cisterna",
  "la granja": "La Granja",
  "la pintana": "La Pintana",
  "la reina": "La Reina",
  "lo espejo": "Lo Espejo",
  "lo prado": "Lo Prado",
  "el bosque": "El Bosque",
  "padre hurtado": "Padre Hurtado",
  "vina del mar": "Viña del Mar",
  "viña del mar": "Viña del Mar",
  "villa alemana": "Villa Alemana",
  "con con": "Con Con",
  "concon": "Con Con",
  "san pedro de la paz": "San Pedro de la Paz",
  "puerto montt": "Puerto Montt",
};

/**
 * Normaliza una comuna cruda a una comuna maestra válida.
 * Busca en el texto de comuna y en la dirección como fallback.
 * Retorna la comuna limpia o null si no matchea ninguna.
 */
export function normalizarComuna(comunaCruda: string | null, direccion?: string | null): string | null {
  if (!comunaCruda) return null;

  // 1. Limpiar: quitar códigos postales, comas, "Región Metropolitana", etc.
  const limpia = comunaCruda
    .replace(/,.*$/, '')
    .replace(/\s*\d{5,}/g, '')
    .replace(/\s*local\s*\d+/gi, '')
    .replace(/región\s*metropolitana.*/gi, '')
    .trim();

  // 2. Match exacto
  const exacto = COMUNAS_MAESTRAS.find(c => c.toLowerCase() === limpia.toLowerCase());
  if (exacto) return exacto;

  // 3. Alias
  const alias = ALIASES[limpia.toLowerCase()];
  if (alias) return alias;

  // 4. Contiene una comuna maestra
  for (const c of COMUNAS_MAESTRAS) {
    if (comunaCruda.toLowerCase().includes(c.toLowerCase())) return c;
  }

  // 5. Buscar en dirección como fallback
  if (direccion) {
    for (const c of COMUNAS_MAESTRAS) {
      if (direccion.toLowerCase().includes(c.toLowerCase())) return c;
    }
  }

  // 6. No encontrada
  return null;
}

/**
 * Verifica si una comuna es válida (está en la lista maestra)
 */
export function esComunaValida(comuna: string): boolean {
  return COMUNAS_MAESTRAS.some(c => c.toLowerCase() === comuna.toLowerCase());
}
