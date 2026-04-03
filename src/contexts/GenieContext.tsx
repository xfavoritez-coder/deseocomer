"use client";
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  slug?: string;
  nombre: string;
  categoria: string;
  comuna: string;
  rating: number;
  descuento: number;
  foto: string | null;
  logoUrl?: string | null;
  portadaUrl?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  promociones?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  concursos?: any[];
  tieneDelivery?: boolean;
  comunasDelivery?: string[];
  tieneRetiro?: boolean;
  linkPedido?: string;
}

interface GenieContextType {
  perfil: GeniePerfil;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  toastActivo: { mensaje: string; opciones: string[]; id: string } | null;
  setToastActivo: (t: { mensaje: string; opciones: string[]; id: string } | null) => void;
  addInteraccion: (tipo: string, datos: Record<string, string | number>) => void;
  addRespuestaGenio: (pregunta: string, respuesta: string) => void;
  getRecomendacion: (categoria?: string, comuna?: string, excludeIds?: string[], modalidad?: string) => LocalRecomendado | null;
  isLoggedIn: boolean;
  userName: string | null;
  sessionCount: number;
  showFavoritoToast: () => void;
  comunasConLocales: string[];
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

function savePerfil(p: GeniePerfil, userId?: string | null) {
  try {
    p.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    // Sync to DB if user is logged in (debounced via caller)
    if (userId) {
      syncToDBDebounced(userId, p);
    }
  } catch { /* noop */ }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
function syncToDBDebounced(userId: string, perfil: GeniePerfil) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fetch("/api/usuarios/genio-perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: userId, perfil }),
    }).catch(() => {});
  }, 5000);
}

// ─── Context ─────────────────────────────────────────────────────────────────

const GenieContext = createContext<GenieContextType | null>(null);

const SESSIONS_KEY = "deseocomer_genio_sessions";
const SESSION_COUNTED_KEY = "deseocomer_genio_session_counted";
const FAV_TOAST_COUNT_KEY = "genio_favoritos_toast_count";
const VISITAS_LOGUEADO_KEY = "genio_visitas_logueado";
const CUMPLE_SOLICITADO_KEY = "genio_cumple_solicitado";

function getSessionCount(): number {
  try { return Number(localStorage.getItem(SESSIONS_KEY) ?? "0"); }
  catch { return 0; }
}

export function GenieProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const isLoggedIn = isAuthenticated && !!user;
  const userName = user?.nombre?.split(" ")[0] ?? null;

  const [perfil, setPerfil] = useState<GeniePerfil>(createEmptyPerfil);
  const [isOpen, setIsOpen] = useState(false);
  const [toastActivo, setToastActivo] = useState<GenieContextType["toastActivo"]>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [localesDB, setLocalesDB] = useState<LocalRecomendado[]>(LOCALES_DB);

  // Fetch real locales from API
  useEffect(() => {
    fetch("/api/locales").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setLocalesDB(data.map((l: Record<string, unknown>) => ({
          id: String(l.slug || l.id), slug: l.slug as string, nombre: l.nombre as string,
          categoria: ((l.categoria as string) ?? "general").toLowerCase(),
          comuna: (l.comuna as string) ?? "Santiago", rating: 4.5, descuento: 0,
          foto: (l.portadaUrl as string) ?? null,
          logoUrl: (l.logoUrl as string) ?? null,
          portadaUrl: (l.portadaUrl as string) ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          promociones: (l.promociones as any[]) ?? [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          concursos: (l.concursos as any[]) ?? [],
          tieneDelivery: (l.tieneDelivery as boolean) ?? false,
          comunasDelivery: (l.comunasDelivery as string[]) ?? [],
          tieneRetiro: (l.tieneRetiro as boolean) ?? false,
          linkPedido: (l.linkPedido as string) ?? "",
        })));
      }
    }).catch(() => {});
  }, []);

  // Load from localStorage on mount + sync to DB if logged in
  useEffect(() => {
    const localPerfil = loadPerfil();
    setPerfil(localPerfil);
    // Sync existing localStorage data to DB on first load if logged in
    if (user?.id && (Object.keys(localPerfil.gustos.categorias).length > 0 || localPerfil.comportamiento.localesVisitados.length > 0)) {
      syncToDBDebounced(user.id, localPerfil);
    }
    const count = getSessionCount();
    setSessionCount(count);
    if (!isLoggedIn) {
      const alreadyCounted = sessionStorage.getItem(SESSION_COUNTED_KEY);
      if (!alreadyCounted) {
        const newCount = count + 1;
        localStorage.setItem(SESSIONS_KEY, String(newCount));
        sessionStorage.setItem(SESSION_COUNTED_KEY, "1");
        setSessionCount(newCount);
      }
    }

    if (isLoggedIn) {
      const yaContada = sessionStorage.getItem("genio_visita_logueado_contada");
      if (!yaContada) {
        const visitas = Number(localStorage.getItem(VISITAS_LOGUEADO_KEY) ?? "0") + 1;
        localStorage.setItem(VISITAS_LOGUEADO_KEY, String(visitas));
        sessionStorage.setItem("genio_visita_logueado_contada", "1");

        const yaSolicitado = localStorage.getItem(CUMPLE_SOLICITADO_KEY);
        const yaTieneFecha = localStorage.getItem("deseocomer_user_birthday");
        if (visitas >= 2 && !yaSolicitado && !yaTieneFecha) {
          setTimeout(() => {
            setToastActivo({
              id: "cumpleanos",
              mensaje: "¿Cuándo es tu cumpleaños? 🎂 Así te aviso cuando los restaurantes tengan ofertas especiales para celebrar",
              opciones: ["Cuéntale al Genio 🧞", "Después"],
            });
          }, 5000);
        }
      }
    }
  }, [isLoggedIn, setToastActivo]);

  const userId = user?.id ?? null;

  const updatePerfil = useCallback((updater: (p: GeniePerfil) => GeniePerfil) => {
    setPerfil(prev => {
      const next = updater({ ...prev, gustos: { ...prev.gustos }, comportamiento: { ...prev.comportamiento } });
      savePerfil(next, userId);
      return next;
    });
  }, [userId]);

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

  const getRecomendacion = useCallback((categoria?: string, comuna?: string, excludeIds?: string[], modalidad?: string): LocalRecomendado | null => {
    let candidates = [...localesDB];
    if (excludeIds?.length) candidates = candidates.filter(l => !excludeIds.includes(l.id));

    // Filter by modalidad
    if (modalidad === "Delivery a domicilio") {
      candidates = candidates.filter(l => l.tieneDelivery === true);
      if (comuna) candidates = candidates.filter(l => l.comunasDelivery?.includes(comuna));
    } else if (modalidad === "Retiro en local") {
      candidates = candidates.filter(l => l.tieneRetiro === true);
    }

    // Filter by category STRICTLY (also check tags)
    if (categoria && categoria.toLowerCase() !== "sorpréndeme" && categoria.toLowerCase() !== "sorprendeme") {
      const catLower = categoria.toLowerCase();
      candidates = candidates.filter(l => {
        if (l.categoria.toLowerCase() === catLower) return true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tags = (l as any).tags as string[] | undefined;
        return Array.isArray(tags) && tags.some(t => t.toLowerCase().includes(catLower) || catLower.includes(t.toLowerCase()));
      });
    }

    // Filter by comuna STRICTLY
    if (comuna) {
      const comLower = comuna.toLowerCase();
      candidates = candidates.filter(l => l.comuna.toLowerCase() === comLower);
    }

    // If no candidates, return null
    if (candidates.length === 0) return null;

    // Score each candidate
    const scored = candidates.map(l => {
      let score = (l.rating ?? 4) * 10;
      const catScore = perfil.gustos.categorias[l.categoria] ?? 0;
      const comScore = perfil.gustos.comunas[l.comuna.toLowerCase()] ?? 0;
      score += catScore * 2 + comScore;
      if (l.descuento > 0) score += l.descuento * 0.5;
      score += Math.random() * 5;
      return { ...l, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0] ?? null;
  }, [perfil.gustos, localesDB]);

  const showFavoritoToast = useCallback(() => {
    if (isLoggedIn) return;
    try {
      const count = Number(localStorage.getItem(FAV_TOAST_COUNT_KEY) ?? "0");
      if (count >= 3) return;
      localStorage.setItem(FAV_TOAST_COUNT_KEY, String(count + 1));
      setToastActivo({
        id: "favorito_guardado",
        mensaje: "Guardado 🧞 Regístrate para no perder tus favoritos si cambias de dispositivo",
        opciones: ["Entendido"],
      });
    } catch { /* noop */ }
  }, [isLoggedIn, setToastActivo]);

  // Listen for favorito events from useFavoritos hook
  useEffect(() => {
    const handleFav = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.categoria || d?.comuna) addInteraccion("favorito_guardado", { categoria: d.categoria || "", comuna: d.comuna || "" });
    };
    const handleNoLogin = () => showFavoritoToast();
    window.addEventListener("favorito_guardado", handleFav);
    window.addEventListener("favorito_sin_login", handleNoLogin);
    return () => { window.removeEventListener("favorito_guardado", handleFav); window.removeEventListener("favorito_sin_login", handleNoLogin); };
  }, [addInteraccion, showFavoritoToast]);

  return (
    <GenieContext.Provider value={{ perfil, isOpen, setIsOpen, toastActivo, setToastActivo, addInteraccion, addRespuestaGenio, getRecomendacion, isLoggedIn, userName, sessionCount, showFavoritoToast, comunasConLocales: [...new Set(localesDB.map(l => l.comuna))] }}>
      {children}
    </GenieContext.Provider>
  );
}

export function useGenie(): GenieContextType {
  const ctx = useContext(GenieContext);
  if (!ctx) throw new Error("useGenie must be used within GenieProvider");
  return ctx;
}
