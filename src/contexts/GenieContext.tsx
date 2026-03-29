"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeniePerfil {
  version: string;
  updatedAt: number;
  gustos: {
    categorias: Record<string, number>;
    ocasiones: Record<string, number>;
    comunas: Record<string, number>;
    atributos: Record<string, number>;
    precioPreferido: string | null;
    horario: Record<string, number>;
  };
  comportamiento: {
    localesVisitados: Array<{ id: string; nombre: string; categoria: string; comuna: string; timestamp: number }>;
    promocionesAbiertas: string[];
    concursosVistos: string[];
    filtrosUsados: string[];
    sesiones: Array<{ inicio: number; fin: number; hora: number }>;
  };
  respuestasGenio: Array<{ pregunta: string; respuesta: string; timestamp: number }>;
}

export interface LocalRecomendado {
  id: string;
  nombre: string;
  categoria: string;
  comuna: string;
  rating: number;
  descuento: number;
  foto: string | null;
}

interface GenieContextType {
  perfil: GeniePerfil;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  toastActivo: { mensaje: string; opciones: string[]; id: string } | null;
  setToastActivo: (t: { mensaje: string; opciones: string[]; id: string } | null) => void;
  addInteraccion: (tipo: string, datos: Record<string, string | number>) => void;
  addRespuestaGenio: (pregunta: string, respuesta: string) => void;
  getRecomendacion: (categoria?: string, comuna?: string) => LocalRecomendado;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "deseocomer_genio_perfil";

const LOCALES_DB: LocalRecomendado[] = [
  { id: "1", nombre: "El Rincón del Sushi", categoria: "sushi", comuna: "Providencia", rating: 4.8, descuento: 20, foto: null },
  { id: "2", nombre: "La Pizzería Romana", categoria: "pizza", comuna: "Ñuñoa", rating: 4.5, descuento: 0, foto: null },
  { id: "3", nombre: "BurgerCraft", categoria: "hamburguesa", comuna: "Las Condes", rating: 4.7, descuento: 15, foto: null },
  { id: "4", nombre: "Verde Natural", categoria: "saludable", comuna: "Providencia", rating: 4.6, descuento: 0, foto: null },
  { id: "5", nombre: "Tacos & Co", categoria: "mexicano", comuna: "Santiago Centro", rating: 4.4, descuento: 10, foto: null },
  { id: "6", nombre: "Pasta Fresca Nonna", categoria: "pastas", comuna: "Ñuñoa", rating: 4.6, descuento: 0, foto: null },
  { id: "7", nombre: "El Pollo Dorado", categoria: "pollo", comuna: "Maipú", rating: 4.3, descuento: 5, foto: null },
];

function createEmptyPerfil(): GeniePerfil {
  return {
    version: "1.0",
    updatedAt: Date.now(),
    gustos: { categorias: {}, ocasiones: {}, comunas: {}, atributos: {}, precioPreferido: null, horario: {} },
    comportamiento: { localesVisitados: [], promocionesAbiertas: [], concursosVistos: [], filtrosUsados: [], sesiones: [] },
    respuestasGenio: [],
  };
}

function loadPerfil(): GeniePerfil {
  if (typeof window === "undefined") return createEmptyPerfil();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GeniePerfil) : createEmptyPerfil();
  } catch { return createEmptyPerfil(); }
}

function savePerfil(p: GeniePerfil) {
  try {
    p.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    console.log("[Genio] Perfil actualizado:", p);
  } catch { /* noop */ }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const GenieContext = createContext<GenieContextType | null>(null);

export function GenieProvider({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<GeniePerfil>(createEmptyPerfil);
  const [isOpen, setIsOpen] = useState(false);
  const [toastActivo, setToastActivo] = useState<GenieContextType["toastActivo"]>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setPerfil(loadPerfil());
  }, []);

  const updatePerfil = useCallback((updater: (p: GeniePerfil) => GeniePerfil) => {
    setPerfil(prev => {
      const next = updater({ ...prev, gustos: { ...prev.gustos }, comportamiento: { ...prev.comportamiento } });
      savePerfil(next);
      return next;
    });
  }, []);

  const addInteraccion = useCallback((tipo: string, datos: Record<string, string | number>) => {
    updatePerfil(p => {
      const g = p.gustos;
      const c = p.comportamiento;

      switch (tipo) {
        case "local_visitado": {
          const cat = String(datos.categoria ?? "").toLowerCase();
          const com = String(datos.comuna ?? "").toLowerCase();
          if (cat) g.categorias[cat] = (g.categorias[cat] ?? 0) + 1;
          if (com) g.comunas[com] = (g.comunas[com] ?? 0) + 1;
          c.localesVisitados = [
            ...c.localesVisitados.slice(-49),
            { id: String(datos.id), nombre: String(datos.nombre), categoria: cat, comuna: com, timestamp: Date.now() },
          ];
          break;
        }
        case "favorito_guardado": {
          const cat = String(datos.categoria ?? "").toLowerCase();
          const com = String(datos.comuna ?? "").toLowerCase();
          if (cat) g.categorias[cat] = (g.categorias[cat] ?? 0) + 3;
          if (com) g.comunas[com] = (g.comunas[com] ?? 0) + 2;
          break;
        }
        case "ocasion_seleccionada": {
          const oc = String(datos.ocasion ?? "").toLowerCase();
          if (oc) g.ocasiones[oc] = (g.ocasiones[oc] ?? 0) + 2;
          break;
        }
        case "comuna_seleccionada": {
          const com = String(datos.comuna ?? "").toLowerCase();
          if (com) g.comunas[com] = (g.comunas[com] ?? 0) + 3;
          break;
        }
        case "categoria_seleccionada": {
          const cat = String(datos.categoria ?? "").toLowerCase();
          if (cat) g.categorias[cat] = (g.categorias[cat] ?? 0) + 3;
          break;
        }
        case "filtro_usado": {
          const f = String(datos.filtro ?? "");
          if (f) c.filtrosUsados = [...c.filtrosUsados.slice(-19), f];
          break;
        }
      }

      // Track horario
      const h = new Date().getHours();
      const periodo = h < 7 ? "madrugada" : h < 12 ? "manana" : h < 16 ? "mediodia" : h < 20 ? "tarde" : "noche";
      g.horario[periodo] = (g.horario[periodo] ?? 0) + 1;

      return p;
    });
  }, [updatePerfil]);

  const addRespuestaGenio = useCallback((pregunta: string, respuesta: string) => {
    updatePerfil(p => {
      p.respuestasGenio = [...p.respuestasGenio.slice(-29), { pregunta, respuesta, timestamp: Date.now() }];
      return p;
    });
  }, [updatePerfil]);

  const getRecomendacion = useCallback((categoria?: string, comuna?: string): LocalRecomendado => {
    let candidates = [...LOCALES_DB];

    // Filter by category if specified
    if (categoria && categoria !== "sorprendeme") {
      const catLower = categoria.toLowerCase();
      const filtered = candidates.filter(l => l.categoria === catLower);
      if (filtered.length > 0) candidates = filtered;
    }

    // Filter by comuna if specified
    if (comuna) {
      const comLower = comuna.toLowerCase();
      const filtered = candidates.filter(l => l.comuna.toLowerCase() === comLower);
      if (filtered.length > 0) candidates = filtered;
    }

    // Score each candidate
    const scored = candidates.map(l => {
      let score = l.rating * 10;
      const catScore = perfil.gustos.categorias[l.categoria] ?? 0;
      const comScore = perfil.gustos.comunas[l.comuna.toLowerCase()] ?? 0;
      score += catScore * 2 + comScore;
      if (l.descuento > 0) score += l.descuento * 0.5;
      // Add randomness to avoid always showing the same
      score += Math.random() * 5;
      return { ...l, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0] ?? LOCALES_DB[0];
  }, [perfil.gustos]);

  return (
    <GenieContext.Provider value={{ perfil, isOpen, setIsOpen, toastActivo, setToastActivo, addInteraccion, addRespuestaGenio, getRecomendacion }}>
      {children}
    </GenieContext.Provider>
  );
}

export function useGenie(): GenieContextType {
  const ctx = useContext(GenieContext);
  if (!ctx) throw new Error("useGenie must be used within GenieProvider");
  return ctx;
}
