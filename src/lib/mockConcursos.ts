// ─── Types ──────────────────────────────────────────────────────────────────

export interface RankingEntry {
  nombre: string;
  referidos: number;
  fotoUrl?: string;
}

export interface Concurso {
  id: number;
  slug: string;
  local: string;
  localId: string;
  imagen: string;
  imagenUrl: string;
  premio: string;
  descripcionPremio: string;
  participantes: number;
  endsAt: number; // Unix ms timestamp
  reglas: string[];
  descripcionLocal: string;
  ranking: RankingEntry[];
}

export interface ConcursoFinalizado {
  id: number;
  slug: string;
  local: string;
  localId: string;
  imagen: string;
  imagenUrl: string;
  premio: string;
  participantes: number;
  fechaFin: string;
  ganador: { nombre: string; referidos: number };
  ranking: RankingEntry[];
}

/** Get short ref code from userId (last 6 chars, uppercase) */
export function getRefCode(userId: string): string {
  return userId.slice(-6).toUpperCase();
}

/** Find concurso by slug or numeric id */
export function findConcurso(param: string): { concurso?: Concurso; finalizado?: ConcursoFinalizado } {
  const numId = Number(param);
  const concurso = !isNaN(numId)
    ? CONCURSOS.find(c => c.id === numId)
    : CONCURSOS.find(c => c.slug === param);
  const finalizado = !concurso
    ? (!isNaN(numId)
      ? CONCURSOS_FINALIZADOS.find(c => c.id === numId)
      : CONCURSOS_FINALIZADOS.find(c => c.slug === param))
    : undefined;
  return { concurso, finalizado };
}

// Helper: hours from the moment the module is first loaded (client-side)
const h = (hours: number) => Date.now() + hours * 3_600_000;

// ─── Active contests ─────────────────────────────────────────────────────────

export const CONCURSOS: Concurso[] = [];

const _CONCURSOS_EJEMPLO: Concurso[] = [
  {
    id: 1,
    slug: "pizza-napoli",
    local: "Pizza Napoli",
    localId: "pizza-napoli",
    imagen: "🍕",
    imagenUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
    premio: "Pizza familiar + bebidas para 4",
    descripcionPremio:
      "Una pizza familiar a elección del menú completo más 4 bebidas, válido para comer en el local o con delivery dentro de la Región Metropolitana. Incluye ingredientes importados de Italia.",
    participantes: 342,
    endsAt: h(18),
    reglas: [
      "Debes estar registrado en DeseoComer para participar.",
      "Cada persona que se registre usando tu link cuenta como 1 referido.",
      "El ganador es quien más referidos válidos tenga al cierre del concurso.",
      "Los referidos deben ser cuentas nuevas y verificadas.",
      "El premio no es canjeable por efectivo.",
      "El ganador será contactado por email dentro de las 24h siguientes al cierre.",
    ],
    descripcionLocal:
      "La mejor pizza napolitana de Santiago, con ingredientes importados directamente de Italia. Masa madre, mozzarella fior di latte y 15 años de tradición.",
    ranking: [
      { nombre: "Valentina R.", referidos: 47 },
      { nombre: "Diego M.",     referidos: 38 },
      { nombre: "Sofía L.",     referidos: 29 },
      { nombre: "Matías C.",    referidos: 24 },
      { nombre: "Isidora P.",   referidos: 19 },
      { nombre: "Tomás A.",     referidos: 15 },
      { nombre: "Catalina V.",  referidos: 11 },
      { nombre: "Benjamín S.",  referidos:  8 },
    ],
  },
  {
    id: 2,
    slug: "sushi-oasis",
    local: "Sushi Oasis",
    localId: "sushi-oasis",
    imagen: "🍣",
    imagenUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600",
    premio: "Menú omakase para 2 personas",
    descripcionPremio:
      "Experiencia omakase completa para 2: 14 piezas seleccionadas por el chef, entradas, dessert japonés y bebida incluida. Valor referencial $65.000.",
    participantes: 218,
    endsAt: h(4),
    reglas: [
      "Concurso abierto a mayores de 18 años.",
      "Se requiere reserva previa para usar el premio.",
      "El premio es válido por 60 días desde la fecha de notificación.",
      "No aplica los días sábado y domingo.",
      "Máximo 1 participación por cuenta.",
      "El local se reserva el derecho de verificar la identidad del ganador.",
    ],
    descripcionLocal:
      "Sushi Oasis trae la tradición japonesa al corazón de Providencia. Pescado fresco diariamente y maestros sushiman con formación en Japón.",
    ranking: [
      { nombre: "Matías C.",    referidos: 61 },
      { nombre: "Isidora P.",   referidos: 44 },
      { nombre: "Tomás A.",     referidos: 31 },
      { nombre: "Renata F.",    referidos: 28 },
      { nombre: "Sebastián G.", referidos: 21 },
      { nombre: "Carla M.",     referidos: 17 },
      { nombre: "Felipe O.",    referidos: 12 },
      { nombre: "Daniela V.",   referidos:  9 },
      { nombre: "Andrés C.",    referidos:  6 },
    ],
  },
  {
    id: 3,
    slug: "menu-don-carlos",
    local: "El Menú de Don Carlos",
    localId: "menu-don-carlos",
    imagen: "🍲",
    imagenUrl: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600",
    premio: "Almuerzo semanal gratis (5 días)",
    descripcionPremio:
      "Almuerzo completo de lunes a viernes durante 1 semana: sopa o entrada + plato de fondo + postre + jugo natural. La mejor comida casera de Barrio Italia.",
    participantes: 589,
    endsAt: h(42),
    reglas: [
      "El premio aplica de lunes a viernes en horario de almuerzo (12:00–15:00).",
      "No transferible a otra persona.",
      "El ganador tiene 2 semanas para agendar su semana de almuerzos.",
      "Cada referido debe ser una cuenta nueva en DeseoComer.",
      "En caso de empate gana quien consiguió los referidos primero.",
      "Aplican restricciones por disponibilidad del local.",
    ],
    descripcionLocal:
      "Desde 1998, Don Carlos lleva el sabor de la cocina chilena de abuela a las mesas de Barrio Italia. Almuerzo casero sin comparación en toda la ciudad.",
    ranking: [
      { nombre: "Catalina V.",  referidos: 93 },
      { nombre: "Benjamín S.",  referidos: 77 },
      { nombre: "Antonia F.",   referidos: 65 },
      { nombre: "Roberto M.",   referidos: 58 },
      { nombre: "Paula T.",     referidos: 44 },
      { nombre: "Ignacio H.",   referidos: 37 },
      { nombre: "Francisca L.", referidos: 29 },
      { nombre: "Gonzalo P.",   referidos: 22 },
      { nombre: "Bárbara C.",   referidos: 18 },
      { nombre: "Nicolás A.",   referidos: 14 },
    ],
  },
  {
    id: 4,
    slug: "burger-bros",
    local: "Burger Bros",
    localId: "burger-bros",
    imagen: "🍔",
    imagenUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
    premio: "Ultimate Burger Experience",
    descripcionPremio:
      "La combo épica: 2 burgers dobles a elección, 2 papas fritas grandes, 2 bebidas medianas y 2 milkshakes de temporada. El sueño de todo foodie.",
    participantes: 431,
    endsAt: h(5.5),
    reglas: [
      "Premio válido para consumir en local o con delivery dentro de Santiago.",
      "Se pueden elegir libremente las 2 burgers del menú disponible.",
      "El ganador tiene 30 días para usar el premio.",
      "No aplica con otras promociones ni descuentos.",
      "El código del premio llegará al email registrado.",
      "Cada referido debe completar su registro y verificar su email.",
    ],
    descripcionLocal:
      "Burger Bros nació en 2019 en Las Condes y ya tiene 4 locales en Santiago. Carne angus premium, panes brioche horneados diariamente y salsas secretas de la casa.",
    ranking: [
      { nombre: "Rodrigo B.",  referidos: 52 },
      { nombre: "Camila F.",   referidos: 39 },
      { nombre: "Javier M.",   referidos: 27 },
      { nombre: "Natalia S.",  referidos: 23 },
      { nombre: "Luis P.",     referidos: 18 },
      { nombre: "Ana C.",      referidos: 14 },
      { nombre: "Ricardo V.",  referidos: 10 },
    ],
  },
  {
    id: 5,
    slug: "cafe-buen-dia",
    local: "Café Buen Día",
    localId: "cafe-buen-dia",
    imagen: "☕",
    imagenUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
    premio: "Café premium ilimitado por un mes",
    descripcionPremio:
      "30 días de café de especialidad gratis: un americano, cortado o latte al día a tu elección. El ritual matutino perfecto para 1 mes completo.",
    participantes: 276,
    endsAt: h(72),
    reglas: [
      "Un café diario de lunes a viernes durante 30 días.",
      "Se debe presentar el código QR ganador en caja.",
      "No aplica los fines de semana ni festivos.",
      "Los días no utilizados no se acumulan.",
      "Aplica para café de 200ml (americano, cortado, latte).",
      "El premio es personal e intransferible.",
    ],
    descripcionLocal:
      "Café Buen Día es el café de especialidad de Ñuñoa con más de 200 reseñas 5 estrellas. Granos de origen, baristas certificados y el mejor croissant de la ciudad.",
    ranking: [
      { nombre: "Alejandra M.", referidos: 34 },
      { nombre: "Carlos B.",    referidos: 28 },
      { nombre: "Patricia V.",  referidos: 21 },
      { nombre: "Hernán C.",    referidos: 16 },
      { nombre: "Lorena F.",    referidos: 13 },
      { nombre: "Eduardo S.",   referidos:  9 },
      { nombre: "Viviana P.",   referidos:  7 },
      { nombre: "Marcos A.",    referidos:  5 },
    ],
  },
  {
    id: 6,
    slug: "la-trattoria",
    local: "La Trattoria",
    localId: "la-trattoria",
    imagen: "🍝",
    imagenUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    premio: "Cena romántica para 2 + vino",
    descripcionPremio:
      "Menú de degustación para 2: entrada, pasta fresca a elección, secondo piatto, dessert de la casa y botella de vino tinto importado. Una noche perfecta.",
    participantes: 198,
    endsAt: h(3),
    reglas: [
      "La cena debe ser reservada con 48 horas de anticipación.",
      "Válido de martes a jueves únicamente.",
      "No aplica en fechas especiales (San Valentín, Año Nuevo, etc.).",
      "El ganador tiene 90 días para usar el premio.",
      "Se requiere presentar identificación.",
      "El premio no es transferible.",
    ],
    descripcionLocal:
      "Auténtica cocina italiana en el corazón de Vitacura. Pastas frescas elaboradas cada mañana, risottos cremosos y el ambiente más romántico de Santiago.",
    ranking: [
      { nombre: "Fernanda L.",  referidos: 41 },
      { nombre: "Esteban O.",   referidos: 33 },
      { nombre: "Gabriela C.",  referidos: 25 },
      { nombre: "Mauricio T.",  referidos: 19 },
      { nombre: "Sandra B.",    referidos: 14 },
      { nombre: "Pablo N.",     referidos: 10 },
    ],
  },
];

// ─── Local profile images (foto del local, no del premio) ─────────────────────

export const LOCAL_IMAGES: Record<string, string> = {
  "pizza-napoli":      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
  "sushi-oasis":       "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
  "menu-don-carlos":   "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400",
  "burger-bros":       "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400",
  "cafe-buen-dia":     "https://images.unsplash.com/photo-1559305616-3f99cd43e353?w=400",
  "la-trattoria":      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
  "taco-fiesta":       "https://images.unsplash.com/photo-1653748440266-18e4ffd3fc5e?w=400",
  "rincon-marino":     "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=400",
  "vegano-feliz":      "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400",
  "chilenitos-bbq":    "https://images.unsplash.com/photo-1558030006-450675393462?w=400",
  "ramen-tokio":       "https://images.unsplash.com/photo-1554679665-f5537f187268?w=400",
  "creperia-la-boheme":"https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400",
};

// ─── Finished contests ────────────────────────────────────────────────────────

export const CONCURSOS_FINALIZADOS: ConcursoFinalizado[] = [
  {
    id: 101,
    slug: "taco-fiesta",
    local: "Taco Fiesta",
    localId: "taco-fiesta",
    imagen: "🌮",
    imagenUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600",
    premio: "Pack de tacos para 4 amigos",
    participantes: 312,
    fechaFin: "23 Mar 2026",
    ganador: { nombre: "Valentina R.", referidos: 87 },
    ranking: [
      { nombre: "Valentina R.", referidos: 87 },
      { nombre: "Matías C.",    referidos: 72 },
      { nombre: "Sofía L.",     referidos: 61 },
    ],
  },
  {
    id: 102,
    slug: "rincon-marino",
    local: "El Rincón Marino",
    localId: "rincon-marino",
    imagen: "🦞",
    imagenUrl: "https://images.unsplash.com/photo-1559742811-822873691df8?w=600",
    premio: "Paila marina para 2 + vino",
    participantes: 445,
    fechaFin: "16 Mar 2026",
    ganador: { nombre: "Diego M.", referidos: 118 },
    ranking: [
      { nombre: "Diego M.",    referidos: 118 },
      { nombre: "Camila F.",   referidos:  94 },
      { nombre: "Roberto M.",  referidos:  77 },
    ],
  },
  {
    id: 103,
    slug: "vegano-feliz",
    local: "Vegano Feliz",
    localId: "vegano-feliz",
    imagen: "🥗",
    imagenUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
    premio: "Plan alimentario vegano semanal",
    participantes: 267,
    fechaFin: "8 Mar 2026",
    ganador: { nombre: "Catalina V.", referidos: 143 },
    ranking: [
      { nombre: "Catalina V.",  referidos: 143 },
      { nombre: "Alejandra M.", referidos: 118 },
      { nombre: "Patricia V.",  referidos:  92 },
    ],
  },
  {
    id: 104,
    slug: "chilenitos-bbq",
    local: "Chilenito's BBQ",
    localId: "chilenitos-bbq",
    imagen: "🥩",
    imagenUrl: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600",
    premio: "Asado completo para 6 personas",
    participantes: 628,
    fechaFin: "28 Feb 2026",
    ganador: { nombre: "Benjamín S.", referidos: 201 },
    ranking: [
      { nombre: "Benjamín S.", referidos: 201 },
      { nombre: "Rodrigo B.",  referidos: 167 },
      { nombre: "Ignacio H.",  referidos: 134 },
    ],
  },
  {
    id: 105,
    slug: "ramen-tokio",
    local: "Ramen Tokio",
    localId: "ramen-tokio",
    imagen: "🍜",
    imagenUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600",
    premio: "Ramen ilimitado para 2",
    participantes: 389,
    fechaFin: "19 Feb 2026",
    ganador: { nombre: "Isidora P.", referidos: 96 },
    ranking: [
      { nombre: "Isidora P.", referidos: 96 },
      { nombre: "Felipe O.",  referidos: 81 },
      { nombre: "Andrés C.",  referidos: 67 },
    ],
  },
  {
    id: 106,
    slug: "creperia-la-boheme",
    local: "Crepería La Bohème",
    localId: "creperia-la-boheme",
    imagen: "🥞",
    imagenUrl: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600",
    premio: "Brunch dominical para 4",
    participantes: 224,
    fechaFin: "10 Feb 2026",
    ganador: { nombre: "Lorena F.", referidos: 74 },
    ranking: [
      { nombre: "Lorena F.",  referidos: 74 },
      { nombre: "Viviana P.", referidos: 58 },
      { nombre: "Marcos A.",  referidos: 47 },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTimeLeft(endsAt: number) {
  const diff = Math.max(0, endsAt - Date.now());
  const total = Math.floor(diff / 1000);
  return {
    dias:     Math.floor(total / 86400),
    horas:    Math.floor((total % 86400) / 3600),
    minutos:  Math.floor((total % 3600) / 60),
    segundos: total % 60,
    ended:    diff === 0,
  };
}

export function isSoonEnding(endsAt: number) {
  return endsAt - Date.now() <= 24 * 3_600_000;
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}
