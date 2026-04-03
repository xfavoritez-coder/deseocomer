// ─── Types ───────────────────────────────────────────────────────────────────

export interface Horario {
  dia: string;
  abre: string;
  cierra: string;
  cerrado: boolean;
}

export interface ItemMenu {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen?: string;
  destacado?: boolean;
}

export interface Resena {
  id: number;
  usuario: string;
  avatar: string | null;
  rating: number;
  fecha: string;
  comentario: string;
  respuestaLocal?: string;
  fechaRespuesta?: string;
  likes: number;
}

export interface Local {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  historia: string;
  barrio: string;
  direccion: string;
  telefono: string;
  instagram: string;
  sitioWeb: string;
  rating: number;
  totalResenas: number;
  precio: string;
  isOpen: boolean;
  totalFavoritos: number;
  imagenPortada: string | null;
  imagenLogo: string | null;
  galeria: string[];
  tieneMenu: boolean;
  menu: { categoria: string; items: ItemMenu[] }[];
  horarios: Horario[];
  resenas: Resena[];
  lat: number;
  lng: number;
  tieneDelivery?: boolean;
  comunasDelivery?: string[];
  tieneRetiro?: boolean;
  sirveEnMesa?: boolean;
  linkPedido?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function horaSem(abre: string, cierra: string, cerradoDias: number[] = []): Horario[] {
  return DIAS.map((dia, i) => ({
    dia,
    abre: cerradoDias.includes(i) ? "" : abre,
    cierra: cerradoDias.includes(i) ? "" : cierra,
    cerrado: cerradoDias.includes(i),
  }));
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const LOCALES: Local[] = [
  {
    id: 1,
    nombre: "Pizza Napoli",
    categoria: "Pizza",
    descripcion: "La mejor pizza napolitana de Santiago, con ingredientes importados directamente de Italia. Masa madre de 72 horas, mozzarella fior di latte y el horno de leña que marca la diferencia.",
    historia: "Fundada en 2015 por la familia Ferretti, llegados desde Nápoles con la receta de la nonna. Lo que empezó como un pequeño local de barrio hoy es referencia obligada para los amantes de la pizza artesanal en Providencia.",
    barrio: "Providencia",
    direccion: "Av. Providencia 1234, Providencia",
    telefono: "+56 2 2345 6789",
    instagram: "@pizzanapoli.cl", sitioWeb: "",
    rating: 4.8,
    totalResenas: 247,
    precio: "$$$",
    isOpen: true,
    totalFavoritos: 1832,
    imagenPortada: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",
    imagenLogo: null,
    galeria: [
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
      "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=800",
    ],
    tieneMenu: true,
    menu: [
      {
        categoria: "Pizzas",
        items: [
          { id: 1, nombre: "Margherita DOP", descripcion: "Tomate San Marzano, mozzarella fior di latte, albahaca fresca", precio: 12900, categoria: "Pizzas", destacado: true },
          { id: 2, nombre: "Diávola", descripcion: "Salame picante, mozzarella, tomate, aceite de oliva extra virgen", precio: 13900, categoria: "Pizzas" },
          { id: 3, nombre: "Quattro Formaggi", descripcion: "Mozzarella, gorgonzola, parmesano, fontina", precio: 14900, categoria: "Pizzas", destacado: true },
          { id: 4, nombre: "Prosciutto e Rúcula", descripcion: "Jamón crudo italiano, rúcula fresca, parmesano en láminas", precio: 15900, categoria: "Pizzas" },
        ],
      },
      {
        categoria: "Pastas",
        items: [
          { id: 5, nombre: "Spaghetti Cacio e Pepe", descripcion: "La receta romana clásica con pecorino y pimienta negra", precio: 11900, categoria: "Pastas" },
          { id: 6, nombre: "Ravioli de Ricotta", descripcion: "Ravioli caseros rellenos de ricotta con salsa de tomate", precio: 12900, categoria: "Pastas", destacado: true },
          { id: 7, nombre: "Penne all'Arrabbiata", descripcion: "Penne con salsa de tomate picante y ajo", precio: 10900, categoria: "Pastas" },
        ],
      },
      {
        categoria: "Bebidas",
        items: [
          { id: 8, nombre: "Agua San Pellegrino", descripcion: "750ml", precio: 4900, categoria: "Bebidas" },
          { id: 9, nombre: "Birra Moretti", descripcion: "Cerveza italiana 330ml", precio: 4500, categoria: "Bebidas" },
          { id: 10, nombre: "Vino de la Casa", descripcion: "Copa de vino tinto o blanco italiano", precio: 5900, categoria: "Bebidas" },
        ],
      },
    ],
    horarios: [
      { dia: "Lunes", abre: "12:00", cierra: "23:00", cerrado: false },
      { dia: "Martes", abre: "12:00", cierra: "23:00", cerrado: false },
      { dia: "Miércoles", abre: "12:00", cierra: "23:00", cerrado: false },
      { dia: "Jueves", abre: "12:00", cierra: "23:00", cerrado: false },
      { dia: "Viernes", abre: "12:00", cierra: "23:00", cerrado: false },
      { dia: "Sábado", abre: "12:00", cierra: "00:00", cerrado: false },
      { dia: "Domingo", abre: "12:00", cierra: "00:00", cerrado: false },
    ],
    resenas: [
      { id: 1, usuario: "Valentina R.", avatar: null, rating: 5, fecha: "2026-03-20", comentario: "La mejor pizza que he probado en Chile, sin exagerar. La margherita es perfecta.", respuestaLocal: "¡Gracias Valentina! Nos alegra mucho que hayas disfrutado. Te esperamos pronto 🍕", fechaRespuesta: "2026-03-21", likes: 24 },
      { id: 2, usuario: "Diego M.", avatar: null, rating: 5, fecha: "2026-03-15", comentario: "Increíble calidad. El horno de leña hace toda la diferencia. Los ingredientes se sienten frescos.", likes: 18 },
      { id: 3, usuario: "Sofía L.", avatar: null, rating: 4, fecha: "2026-03-10", comentario: "Muy buena pizza pero a veces hay que esperar bastante. Vale la pena la espera eso sí.", respuestaLocal: "Sofía, gracias por tu paciencia. Estamos ampliando la cocina para mejorar los tiempos 🙏", fechaRespuesta: "2026-03-11", likes: 12 },
      { id: 4, usuario: "Matías C.", avatar: null, rating: 5, fecha: "2026-02-28", comentario: "La quattro formaggi es adictiva. Vengo cada semana y nunca decepciona.", likes: 31 },
    ],
    lat: -33.4312,
    lng: -70.6108,
  },
  {
    id: 2,
    nombre: "Sushi Oasis",
    categoria: "Sushi",
    descripcion: "Sushi de autor con ingredientes del Pacífico. Omakase y rolls creativos preparados por maestros sushiman con formación en Japón.",
    historia: "Nace en 2018 de la mano del chef Kenji Yamamoto, formado en Tokio. Su visión: fusionar la tradición japonesa con los mejores pescados chilenos del Pacífico sur.",
    barrio: "Las Condes",
    direccion: "Isidora Goyenechea 3456, Las Condes",
    telefono: "+56 2 2456 7890",
    instagram: "@sushioasis.cl", sitioWeb: "",
    rating: 4.9,
    totalResenas: 189,
    precio: "$$$$",
    isOpen: true,
    totalFavoritos: 2104,
    imagenPortada: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200",
    imagenLogo: null,
    galeria: [
      "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800",
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800",
      "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800",
    ],
    tieneMenu: true,
    menu: [
      {
        categoria: "Rolls",
        items: [
          { id: 11, nombre: "Dragon Roll", descripcion: "Tempura de langostino, palta, anguila glaseada", precio: 14900, categoria: "Rolls", destacado: true },
          { id: 12, nombre: "Oasis Roll", descripcion: "Salmón flameado, cream cheese, palta, salsa de maracuyá", precio: 13900, categoria: "Rolls", destacado: true },
          { id: 13, nombre: "Spicy Tuna", descripcion: "Atún picante, pepino, sésamo, mayo sriracha", precio: 12900, categoria: "Rolls" },
          { id: 14, nombre: "California Roll", descripcion: "Kanikama, palta, pepino, sésamo", precio: 9900, categoria: "Rolls" },
          { id: 15, nombre: "Rainbow Roll", descripcion: "Salmón, atún, palta, langostino sobre california", precio: 16900, categoria: "Rolls" },
        ],
      },
      {
        categoria: "Omakase",
        items: [
          { id: 16, nombre: "Omakase 10 piezas", descripcion: "Selección del chef: nigiri de temporada con pescado fresco del día", precio: 32900, categoria: "Omakase", destacado: true },
          { id: 17, nombre: "Omakase Premium 14 piezas", descripcion: "La experiencia completa: 14 piezas con sake y postre japonés", precio: 45900, categoria: "Omakase" },
        ],
      },
    ],
    horarios: [
      { dia: "Lunes", abre: "13:00", cierra: "23:00", cerrado: false },
      { dia: "Martes", abre: "", cierra: "", cerrado: true },
      { dia: "Miércoles", abre: "13:00", cierra: "23:00", cerrado: false },
      { dia: "Jueves", abre: "13:00", cierra: "23:00", cerrado: false },
      { dia: "Viernes", abre: "13:00", cierra: "23:00", cerrado: false },
      { dia: "Sábado", abre: "13:00", cierra: "23:00", cerrado: false },
      { dia: "Domingo", abre: "13:00", cierra: "23:00", cerrado: false },
    ],
    resenas: [
      { id: 5, usuario: "Isidora P.", avatar: null, rating: 5, fecha: "2026-03-22", comentario: "El omakase es una experiencia. Cada pieza es una obra de arte. El chef Kenji es un genio.", respuestaLocal: "Isidora, ¡qué honor! Le transmitiremos tus palabras al chef. Arigato gozaimasu 🙏", fechaRespuesta: "2026-03-22", likes: 42 },
      { id: 6, usuario: "Tomás A.", avatar: null, rating: 5, fecha: "2026-03-18", comentario: "El mejor sushi de Santiago, lejos. El Dragon Roll es adictivo.", likes: 28 },
      { id: 7, usuario: "Renata F.", avatar: null, rating: 4, fecha: "2026-03-12", comentario: "Excelente calidad pero los precios son altos. Para ocasiones especiales perfecto.", likes: 15 },
    ],
    lat: -33.4089,
    lng: -70.5694,
  },
  {
    id: 3,
    nombre: "El Menú de Don Carlos",
    categoria: "Almuerzo",
    descripcion: "Cocina casera chilena, almuerzo completo con sabor de abuela. Sopa, plato de fondo, postre y jugo natural incluidos.",
    historia: "Desde 1998, Don Carlos y su esposa Marta llevan el sabor de la cocina chilena de abuela a Santiago Centro. El menú cambia cada día según lo que hay fresco en la feria.",
    barrio: "Santiago Centro",
    direccion: "Compañía 567, Santiago Centro",
    telefono: "+56 2 2567 8901",
    instagram: "@doncarlos.menu", sitioWeb: "",
    rating: 4.7,
    totalResenas: 312,
    precio: "$",
    isOpen: true,
    totalFavoritos: 945,
    imagenPortada: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=1200",
    imagenLogo: null,
    galeria: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=800",
    ],
    tieneMenu: false,
    menu: [],
    horarios: horaSem("12:00", "16:00", [5, 6]),
    resenas: [
      { id: 8, usuario: "Catalina V.", avatar: null, rating: 5, fecha: "2026-03-25", comentario: "El mejor almuerzo relación precio-calidad de Santiago. La cazuela del miércoles es legendaria.", likes: 56 },
      { id: 9, usuario: "Roberto M.", avatar: null, rating: 5, fecha: "2026-03-20", comentario: "Sabor de casa. Don Carlos te atiende como si fueras de la familia.", respuestaLocal: "¡Gracias Roberto! Aquí siempre tendrás un plato esperándote 😊", fechaRespuesta: "2026-03-20", likes: 38 },
      { id: 10, usuario: "Paula T.", avatar: null, rating: 4, fecha: "2026-03-15", comentario: "Riquísimo pero el local es pequeño y a veces no hay mesa. Llegar temprano.", likes: 22 },
      { id: 11, usuario: "Ignacio H.", avatar: null, rating: 5, fecha: "2026-03-08", comentario: "Las empanadas de los viernes son imperdibles. Mejor que las de mi abuela.", likes: 44 },
      { id: 12, usuario: "Francisca L.", avatar: null, rating: 4, fecha: "2026-02-28", comentario: "Muy rico todo, solo que el jugo a veces es muy dulce. El plato de fondo siempre bueno.", likes: 11 },
    ],
    lat: -33.4378,
    lng: -70.6505,
  },
  {
    id: 4,
    nombre: "Burger Desierto",
    categoria: "Burger",
    descripcion: "Smash burgers artesanales con ingredientes locales y salsas únicas. Papas fritas cortadas a mano y milkshakes de temporada.",
    historia: "Dos amigos, un food truck en 2020 y una pasión por la hamburguesa perfecta. Hoy Burger Desierto es el local de burgers más querido de Ñuñoa.",
    barrio: "Ñuñoa",
    direccion: "Irarrázaval 2345, Ñuñoa",
    telefono: "+56 2 2678 9012",
    instagram: "@burgerdesierto", sitioWeb: "",
    rating: 4.6,
    totalResenas: 156,
    precio: "$$",
    isOpen: false,
    totalFavoritos: 1203,
    imagenPortada: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200",
    imagenLogo: null,
    galeria: [
      "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=800",
      "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800",
      "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800",
    ],
    tieneMenu: true,
    menu: [
      {
        categoria: "Burgers",
        items: [
          { id: 18, nombre: "Clásica Desierto", descripcion: "Doble smash patty, cheddar, cebolla caramelizada, salsa secreta", precio: 8900, categoria: "Burgers", destacado: true },
          { id: 19, nombre: "BBQ Ahumada", descripcion: "Patty ahumado, bacon, cheddar, aros de cebolla, BBQ casera", precio: 10900, categoria: "Burgers" },
          { id: 20, nombre: "Veggie Oasis", descripcion: "Patty de porotos negros, palta, tomate, mayo vegana", precio: 8900, categoria: "Burgers" },
        ],
      },
      {
        categoria: "Acompañamientos",
        items: [
          { id: 21, nombre: "Papas Fritas Artesanales", descripcion: "Cortadas a mano con sal de mar", precio: 3900, categoria: "Acompañamientos" },
          { id: 22, nombre: "Milkshake", descripcion: "Chocolate, vainilla o frutilla. Hecho con helado artesanal", precio: 4500, categoria: "Acompañamientos", destacado: true },
        ],
      },
    ],
    horarios: horaSem("12:00", "22:00", [0]),
    resenas: [
      { id: 13, usuario: "Javier M.", avatar: null, rating: 5, fecha: "2026-03-19", comentario: "La mejor smash burger de Santiago. La salsa secreta es adictiva.", likes: 33 },
      { id: 14, usuario: "Camila F.", avatar: null, rating: 4, fecha: "2026-03-14", comentario: "Buenísimas burgers. Solo que las papas a veces llegan frías.", likes: 9 },
    ],
    lat: -33.4534,
    lng: -70.6012,
  },
  {
    id: 5,
    nombre: "Verde Oasis",
    categoria: "Vegano",
    descripcion: "Cocina plant-based de autor, menú cambiante según temporada. Bowls energéticos, wraps creativos y postres sin culpa.",
    historia: "Verde Oasis nació en 2021 cuando la chef Macarena decidió demostrar que la comida vegana puede ser tan indulgente como cualquier otra. Cada plato es una obra de arte.",
    barrio: "Vitacura",
    direccion: "Nueva Costanera 4567, Vitacura",
    telefono: "+56 2 2789 0123",
    instagram: "@verdeoasis.cl", sitioWeb: "",
    rating: 4.5,
    totalResenas: 98,
    precio: "$$",
    isOpen: false,
    totalFavoritos: 678,
    imagenPortada: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200",
    imagenLogo: null,
    galeria: [
      "https://images.unsplash.com/photo-1540914124281-342587941389?w=800",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    ],
    tieneMenu: true,
    menu: [
      {
        categoria: "Bowls",
        items: [
          { id: 23, nombre: "Buddha Bowl", descripcion: "Quinoa, garbanzos, palta, kale, hummus, semillas", precio: 9900, categoria: "Bowls", destacado: true },
          { id: 24, nombre: "Açaí Power", descripcion: "Açaí, granola casera, frutas de temporada, miel de agave", precio: 7900, categoria: "Bowls" },
        ],
      },
      {
        categoria: "Wraps & Sandwiches",
        items: [
          { id: 25, nombre: "Wrap Mediterráneo", descripcion: "Falafel, hummus, tomate, pepino, salsa tahini", precio: 7900, categoria: "Wraps", destacado: true },
          { id: 26, nombre: "Sándwich de Tempeh", descripcion: "Tempeh marinado, palta, rúcula, mayo de chipotle", precio: 8500, categoria: "Wraps" },
        ],
      },
    ],
    horarios: horaSem("09:00", "20:00", [6]),
    resenas: [
      { id: 15, usuario: "Alejandra M.", avatar: null, rating: 5, fecha: "2026-03-21", comentario: "Increíble que sea todo vegano. El Buddha Bowl es espectacular.", likes: 19 },
      { id: 16, usuario: "Carlos B.", avatar: null, rating: 4, fecha: "2026-03-16", comentario: "Rico pero las porciones son un poco chicas para el precio.", likes: 7 },
    ],
    lat: -33.3978,
    lng: -70.5889,
  },
  {
    id: 6,
    nombre: "Café Arenas",
    categoria: "Café",
    descripcion: "Specialty coffee de origen, pastelería artesanal y ambiente íntimo. El lugar perfecto para trabajar o conversar.",
    historia: "Café Arenas abrió en 2019 en el corazón de Bellavista. Los granos vienen directamente de pequeños productores en Colombia y Etiopía, tostados semanalmente en Santiago.",
    barrio: "Bellavista",
    direccion: "Constitución 234, Bellavista",
    telefono: "+56 2 2890 1234",
    instagram: "@cafearenas.cl", sitioWeb: "",
    rating: 4.7,
    totalResenas: 134,
    precio: "$",
    isOpen: true,
    totalFavoritos: 891,
    imagenPortada: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200",
    imagenLogo: null,
    galeria: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800",
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=800",
    ],
    tieneMenu: true,
    menu: [
      {
        categoria: "Café",
        items: [
          { id: 27, nombre: "Espresso", descripcion: "Shot doble de café de especialidad", precio: 2500, categoria: "Café" },
          { id: 28, nombre: "Flat White", descripcion: "Espresso doble con leche texturizada", precio: 3500, categoria: "Café", destacado: true },
          { id: 29, nombre: "Cold Brew", descripcion: "Café frío de 18 horas, servido con hielo", precio: 3900, categoria: "Café" },
        ],
      },
      {
        categoria: "Pastelería",
        items: [
          { id: 30, nombre: "Croissant de Mantequilla", descripcion: "Hojaldrado francés con mantequilla premium", precio: 3200, categoria: "Pastelería", destacado: true },
          { id: 31, nombre: "Cheesecake del Día", descripcion: "Sabor cambiante. Pregunta por el de hoy.", precio: 4500, categoria: "Pastelería" },
        ],
      },
    ],
    horarios: horaSem("08:00", "21:00", []),
    resenas: [
      { id: 17, usuario: "Lorena F.", avatar: null, rating: 5, fecha: "2026-03-24", comentario: "El mejor café de Santiago. El flat white es perfecto y el croissant es adictivo.", likes: 27 },
      { id: 18, usuario: "Eduardo S.", avatar: null, rating: 5, fecha: "2026-03-18", comentario: "Ambiente increíble para trabajar. WiFi rápido, enchufes y café de verdad.", respuestaLocal: "Eduardo, ¡siempre bienvenido! Nos encanta ser tu oficina favorita ☕", fechaRespuesta: "2026-03-19", likes: 21 },
      { id: 19, usuario: "Viviana P.", avatar: null, rating: 4, fecha: "2026-03-10", comentario: "Muy rico todo. Solo que a veces está muy lleno y no hay mesa.", likes: 8 },
    ],
    lat: -33.4321,
    lng: -70.6312,
  },
];

export function getLocalById(id: number): Local | undefined {
  return LOCALES.find(l => l.id === id);
}
