// ─── Types ───────────────────────────────────────────────────────────────────

export type TipoPromocion = "descuento" | "2x1" | "cupon" | "precio_especial" | "happy_hour";
export type CategoriaPromocion = "almuerzo" | "cena" | "desayuno" | "bebidas" | "postres";

export interface Promocion {
  id: number;
  localId: string;
  local: string;
  comuna: string;
  tipo: TipoPromocion;
  categoria: CategoriaPromocion;
  imagen: string;          // emoji
  imagenUrl: string;
  titulo: string;
  descripcion: string;
  precioOriginal?: number;
  precioDescuento?: number;
  porcentajeDescuento?: number;
  codigoCupon?: string;
  diasSemana: number[];    // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  horaInicio: string;      // "HH:MM"
  horaFin: string;         // "HH:MM"
  fechaVencimiento: string; // "YYYY-MM-DD"
  limiteUsos?: number;
  usosActuales?: number;
  activa: boolean;
  // Info del local para la página de detalle
  direccion?: string;
  telefono?: string;
  horarioLocal?: string;
  descripcionLocal?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const PROMOCIONES: Promocion[] = [
  {
    id: 1,
    localId: "pizza-napoli",
    local: "Pizza Napoli",
    comuna: "Providencia",
    tipo: "happy_hour",
    categoria: "bebidas",
    imagen: "🍕",
    imagenUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
    titulo: "Happy Hour: Pizza + Cerveza 30% OFF",
    descripcion: "30% de descuento en toda la carta de pizzas y cervezas artesanales. El mejor Happy Hour de Providencia.",
    precioOriginal: 2500,
    precioDescuento: 1750,
    porcentajeDescuento: 30,
    diasSemana: [1, 2, 3, 4, 5], // Lun-Vie
    horaInicio: "17:00",
    horaFin: "20:00",
    fechaVencimiento: "2026-04-30",
    activa: true,
    direccion: "Av. Providencia 2124, Providencia",
    telefono: "+56 2 2345 6789",
    horarioLocal: "Lun-Vie 12:00-23:00 | Sáb-Dom 12:00-00:00",
    descripcionLocal: "La mejor pizza napolitana de Santiago, con ingredientes importados directamente de Italia. Masa madre, mozzarella fior di latte y 15 años de tradición.",
  },
  {
    id: 2,
    localId: "sushi-oasis",
    local: "Sushi Oasis",
    comuna: "Providencia",
    tipo: "2x1",
    categoria: "almuerzo",
    imagen: "🍣",
    imagenUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600",
    titulo: "2x1 en Rolls de Entrada — Almuerzo",
    descripcion: "Lleva 2 rolls de entrada pagando solo 1. Válido en todo el menú de rolls durante el almuerzo. ¡El sushi nunca fue tan conveniente!",
    precioOriginal: 6500,
    diasSemana: [1, 2, 3, 4, 5], // Lun-Vie
    horaInicio: "12:00",
    horaFin: "15:30",
    fechaVencimiento: "2026-04-15",
    activa: true,
    direccion: "Av. Ossa 145, Providencia",
    telefono: "+56 2 2789 0123",
    horarioLocal: "Lun-Vie 12:00-22:30 | Sáb-Dom 13:00-23:00",
    descripcionLocal: "Sushi Oasis trae la tradición japonesa al corazón de Providencia. Pescado fresco diariamente y maestros sushiman con formación en Japón.",
  },
  {
    id: 3,
    localId: "menu-don-carlos",
    local: "El Menú de Don Carlos",
    comuna: "Barrio Italia",
    tipo: "precio_especial",
    categoria: "almuerzo",
    imagen: "🍲",
    imagenUrl: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600",
    titulo: "Almuerzo Completo — Solo $3.990",
    descripcion: "Sopa o entrada + plato de fondo + postre + jugo natural por solo $3.990. La comida casera más sabrosa de Barrio Italia.",
    precioOriginal: 5900,
    precioDescuento: 3990,
    porcentajeDescuento: 32,
    diasSemana: [1, 2, 3, 4, 5], // Lun-Vie
    horaInicio: "12:00",
    horaFin: "15:00",
    fechaVencimiento: "2026-05-30",
    limiteUsos: 50,
    usosActuales: 31,
    activa: true,
    direccion: "Av. Italia 1256, Providencia",
    telefono: "+56 2 2456 7890",
    horarioLocal: "Lun-Vie 12:00-15:30",
    descripcionLocal: "Desde 1998, Don Carlos lleva el sabor de la cocina chilena de abuela a las mesas de Barrio Italia. Almuerzo casero sin comparación en toda la ciudad.",
  },
  {
    id: 4,
    localId: "cafe-buen-dia",
    local: "Café Buen Día",
    comuna: "Ñuñoa",
    tipo: "cupon",
    categoria: "desayuno",
    imagen: "☕",
    imagenUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
    titulo: "25% OFF en Desayuno con Cupón",
    descripcion: "Usa el código y obtén 25% de descuento en cualquier combo de desayuno. Incluye café de especialidad + pastelería seleccionada.",
    precioOriginal: 4500,
    precioDescuento: 3375,
    porcentajeDescuento: 25,
    codigoCupon: "BUENOS25",
    diasSemana: [2, 3, 4, 5, 6], // Mar-Sáb
    horaInicio: "08:00",
    horaFin: "11:30",
    fechaVencimiento: "2026-04-30",
    limiteUsos: 200,
    usosActuales: 87,
    activa: true,
    direccion: "Av. Irarrázaval 2345, Ñuñoa",
    telefono: "+56 2 2567 8901",
    horarioLocal: "Lun-Sáb 07:30-20:00 | Dom 09:00-18:00",
    descripcionLocal: "Café Buen Día es el café de especialidad de Ñuñoa con más de 200 reseñas 5 estrellas. Granos de origen, baristas certificados y el mejor croissant de la ciudad.",
  },
  {
    id: 5,
    localId: "la-trattoria",
    local: "La Trattoria",
    comuna: "Vitacura",
    tipo: "2x1",
    categoria: "cena",
    imagen: "🍝",
    imagenUrl: "https://images.unsplash.com/photo-1551183053-bf91798d96f4?w=600",
    titulo: "2x1 en Pastas Frescas — Cena",
    descripcion: "Paga una pasta y lleva dos. Aplica en toda la carta de pastas frescas elaboradas cada mañana. Ideal para compartir en pareja.",
    precioOriginal: 12500,
    diasSemana: [2, 3, 4], // Mar, Mié, Jue
    horaInicio: "19:30",
    horaFin: "22:30",
    fechaVencimiento: "2026-04-20",
    activa: true,
    direccion: "El Bosque Norte 234, Vitacura",
    telefono: "+56 2 2901 2345",
    horarioLocal: "Mar-Dom 12:30-15:30 y 19:00-23:30",
    descripcionLocal: "Auténtica cocina italiana en el corazón de Vitacura. Pastas frescas elaboradas cada mañana, risottos cremosos y el ambiente más romántico de Santiago.",
  },
  {
    id: 6,
    localId: "burger-bros",
    local: "Burger Bros",
    comuna: "Las Condes",
    tipo: "descuento",
    categoria: "almuerzo",
    imagen: "🍔",
    imagenUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
    titulo: "Bebida Gratis con Cualquier Burger",
    descripcion: "Pide cualquier burger de la carta y llévate una bebida mediana gratis. ¡El combo perfecto para el fin de semana!",
    precioOriginal: 11500,
    precioDescuento: 9500,
    porcentajeDescuento: 17,
    diasSemana: [0, 6], // Sáb-Dom
    horaInicio: "13:00",
    horaFin: "18:00",
    fechaVencimiento: "2026-04-30",
    activa: true,
    direccion: "Av. Apoquindo 4501, Las Condes",
    telefono: "+56 2 2678 9012",
    horarioLocal: "Todos los días 12:00-23:00",
    descripcionLocal: "Burger Bros nació en 2019 en Las Condes y ya tiene 4 locales en Santiago. Carne angus premium, panes brioche horneados diariamente y salsas secretas de la casa.",
  },
  {
    id: 7,
    localId: "heladeria-dulce-vida",
    local: "Heladería Dulce Vida",
    comuna: "Ñuñoa",
    tipo: "2x1",
    categoria: "postres",
    imagen: "🍦",
    imagenUrl: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600",
    titulo: "2x1 en Helados y Postres Artesanales",
    descripcion: "Todos los días en la tarde, lleva 2 helados o postres pagando solo 1. Más de 30 sabores artesanales para elegir.",
    precioOriginal: 3200,
    diasSemana: [0, 1, 2, 3, 4, 5, 6], // Todos los días
    horaInicio: "15:00",
    horaFin: "20:00",
    fechaVencimiento: "2026-06-30",
    activa: true,
    direccion: "Av. Irarrázaval 1890, Ñuñoa",
    telefono: "+56 2 2456 1234",
    horarioLocal: "Todos los días 11:00-21:30",
    descripcionLocal: "Helados 100% artesanales elaborados con frutas frescas de la estación. Premiados como los mejores helados de Santiago tres años consecutivos.",
  },
  {
    id: 8,
    localId: "terraza-bar-mirador",
    local: "Terraza Bar Mirador",
    comuna: "Bellavista",
    tipo: "happy_hour",
    categoria: "bebidas",
    imagen: "🍹",
    imagenUrl: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=600",
    titulo: "Happy Hour: Cócteles a Mitad de Precio",
    descripcion: "Cócteles de autor al 50% de descuento. Mojitos, Negronis, Aperol Spritz y más. La mejor terraza de Bellavista.",
    precioOriginal: 9500,
    precioDescuento: 4750,
    porcentajeDescuento: 50,
    diasSemana: [2, 3, 4, 5, 6], // Mar-Sáb
    horaInicio: "18:00",
    horaFin: "21:00",
    fechaVencimiento: "2026-05-15",
    activa: true,
    direccion: "Pío Nono 380, Bellavista, Recoleta",
    telefono: "+56 2 2789 3456",
    horarioLocal: "Mar-Vie 18:00-02:00 | Sáb-Dom 15:00-02:00",
    descripcionLocal: "La terraza con mejor vista de Bellavista. Cócteles de autor, tapas gourmet y música en vivo los fines de semana. El lugar favorito del barrio.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Checks if a promotion is currently active (day + time window). */
export function isPromocionActivaAhora(promo: Promocion): boolean {
  if (!promo.activa) return false;
  const now = new Date();
  const diaSemana = now.getDay();
  const horaActual = now.getHours() * 60 + now.getMinutes();
  const [hIni, mIni] = promo.horaInicio.split(":").map(Number);
  const [hFin, mFin] = promo.horaFin.split(":").map(Number);
  const inicioMin = hIni * 60 + mIni;
  const finMin = hFin * 60 + mFin;
  return promo.diasSemana.includes(diaSemana) && horaActual >= inicioMin && horaActual <= finMin;
}

/** Returns minutes until the current window closes (only meaningful if active). */
export function getMinutosParaTerminar(promo: Promocion): number {
  const now = new Date();
  const [hFin, mFin] = promo.horaFin.split(":").map(Number);
  const finHoy = new Date();
  finHoy.setHours(hFin, mFin, 0, 0);
  return Math.max(0, Math.floor((finHoy.getTime() - now.getTime()) / 60000));
}

/** True if promotion is active AND ends in less than 2 hours. */
export function terminaEnMenos2Horas(promo: Promocion): boolean {
  return isPromocionActivaAhora(promo) && getMinutosParaTerminar(promo) <= 120;
}

/** Returns hh:mm:ss remaining in the current active window. */
export function getTimerHastaFin(promo: Promocion): { horas: number; minutos: number; segundos: number } {
  const now = new Date();
  const [hFin, mFin] = promo.horaFin.split(":").map(Number);
  const finHoy = new Date();
  finHoy.setHours(hFin, mFin, 0, 0);
  const diff = Math.max(0, finHoy.getTime() - now.getTime());
  const total = Math.floor(diff / 1000);
  return {
    horas: Math.floor(total / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
  };
}

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export const TIPO_LABELS: Record<TipoPromocion, string> = {
  descuento: "Descuento",
  "2x1": "2x1",
  cupon: "Cupón",
  precio_especial: "Precio Especial",
  happy_hour: "Happy Hour",
};

export const TIPO_ICONS: Record<TipoPromocion, string> = {
  descuento: "🏷️",
  "2x1": "🔁",
  cupon: "🎟️",
  precio_especial: "⭐",
  happy_hour: "⚡",
};

export const CATEGORIA_LABELS: Record<CategoriaPromocion, string> = {
  almuerzo: "Almuerzo",
  cena: "Cena",
  desayuno: "Desayuno",
  bebidas: "Bebidas",
  postres: "Postres",
};

export const DIAS_SHORT = ["D", "L", "M", "M", "J", "V", "S"];
export const DIAS_FULL  = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const COMUNAS_SANTIAGO = [
  "Barrio Italia",
  "Bellavista",
  "La Florida",
  "Las Condes",
  "Maipú",
  "Miraflores",
  "Ñuñoa",
  "Providencia",
  "Santiago Centro",
  "Vitacura",
];

export type RangoPrecio = "todos" | "0-3000" | "3000-6000" | "6000+";
