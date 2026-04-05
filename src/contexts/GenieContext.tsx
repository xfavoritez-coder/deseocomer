"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
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
  categorias?: string[];
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
  googleRating?: number | null;
  estadoLocal?: string | null;
  tieneConcurso?: boolean;
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
  comunasDelivery: string[];
  quickRec: LocalRecomendado | null;
  setQuickRec: (r: LocalRecomendado | null) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "deseocomer_genio_perfil";

const LOCALES_DB: LocalRecomendado[] = [
  { id: "1", nombre: "El Rincón del Sushi", categoria: "sushi", categorias: ["Sushi"], comuna: "Providencia", rating: 4.8, descuento: 20, foto: null },
  { id: "2", nombre: "La Pizzería Romana", categoria: "pizza", categorias: ["Pizza"], comuna: "Ñuñoa", rating: 4.5, descuento: 0, foto: null },
  { id: "3", nombre: "BurgerCraft", categoria: "hamburguesa", categorias: ["Hamburguesa"], comuna: "Las Condes", rating: 4.7, descuento: 15, foto: null },
  { id: "4", nombre: "Verde Natural", categoria: "saludable", categorias: ["Saludable", "Vegano"], comuna: "Providencia", rating: 4.6, descuento: 0, foto: null },
  { id: "5", nombre: "Tacos & Co", categoria: "mexicano", categorias: ["Mexicano"], comuna: "Santiago Centro", rating: 4.4, descuento: 10, foto: null },
  { id: "6", nombre: "Pasta Fresca Nonna", categoria: "pastas", categorias: ["Pastas"], comuna: "Ñuñoa", rating: 4.6, descuento: 0, foto: null },
  { id: "7", nombre: "El Pollo Dorado", categoria: "pollo", categorias: ["Pollo"], comuna: "Maipú", rating: 4.3, descuento: 5, foto: null },
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
    if (!raw) return createEmptyPerfil();
    const parsed = JSON.parse(raw);
    const empty = createEmptyPerfil();
    return {
      ...empty,
      ...parsed,
      gustos: { ...empty.gustos, ...parsed.gustos },
      comportamiento: { ...empty.comportamiento, ...parsed.comportamiento },
    };
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
  const [quickRec, setQuickRec] = useState<LocalRecomendado | null>(null);
  const [comunasFromDB, setComunasFromDB] = useState<string[]>([]);
  const [comunasDeliveryFromDB, setComunasDeliveryFromDB] = useState<string[]>([]);

  // Fetch only comunas (lightweight) instead of all locales
  useEffect(() => {
    fetch("/api/locales/comunas").then(r => r.json()).then(data => {
      if (data.comunas) setComunasFromDB(data.comunas);
      if (data.comunasDelivery) setComunasDeliveryFromDB(data.comunasDelivery);
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
        // Always verify with DB when user is logged in
        if (user?.id) {
          fetch(`/api/usuarios/${user.id}/cumpleanos-check`).then(r => r.json()).then(d => {
            if (d.tieneCumple) {
              // BD has birthday → sync to localStorage and mark as solicited
              localStorage.setItem(CUMPLE_SOLICITADO_KEY, "true");
              if (d.dia && d.mes) {
                localStorage.setItem("deseocomer_user_birthday", JSON.stringify({ dia: d.dia, mes: d.mes }));
              }
            } else {
              // BD does NOT have birthday → clear stale localStorage data
              localStorage.removeItem("deseocomer_user_birthday");
              // Only ask once per session, not on every page load
              const yaPreguntadoSesion = sessionStorage.getItem("cumple_preguntado");
              if (visitas >= 2 && !yaSolicitado && !yaPreguntadoSesion) {
                sessionStorage.setItem("cumple_preguntado", "1");
                setToastActivo({
                  id: "cumpleanos",
                  mensaje: "¿Cuándo es tu cumpleaños? 🎂 Así te aviso cuando los restaurantes tengan ofertas especiales para celebrar",
                  opciones: ["Cuéntale al Genio 🧞", "Después"],
                });
              }
            }
          }).catch(() => {});
        } else if (!yaSolicitado && visitas >= 2) {
          // Not logged in, no solicited flag → show toast
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
      const g = p.gustos ?? { categorias: {}, ocasiones: {}, comunas: {}, atributos: {}, precioPreferido: null, horario: {} };
      const c = p.comportamiento ?? { localesVisitados: [], promocionesAbiertas: [], concursosVistos: [], filtrosUsados: [], sesiones: [] };
      if (!c.localesVisitados) c.localesVisitados = [];
      if (!c.concursosVistos) c.concursosVistos = [];
      if (!c.promocionesAbiertas) c.promocionesAbiertas = [];
      if (!c.filtrosUsados) c.filtrosUsados = [];
      p.gustos = g;
      p.comportamiento = c;

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
        case "concurso_participado": {
          const cat = String(datos.categoria ?? "").toLowerCase();
          const com = String(datos.comuna ?? "").toLowerCase();
          if (cat) g.categorias[cat] = (g.categorias[cat] ?? 0) + 5;
          if (com) g.comunas[com] = (g.comunas[com] ?? 0) + 3;
          break;
        }
        case "concurso_visto": {
          const cat = String(datos.categoria ?? "").toLowerCase();
          const com = String(datos.comuna ?? "").toLowerCase();
          if (cat) g.categorias[cat] = (g.categorias[cat] ?? 0) + 1;
          if (com) g.comunas[com] = (g.comunas[com] ?? 0) + 1;
          const cid = String(datos.id ?? "");
          if (cid && !c.concursosVistos.includes(cid)) c.concursosVistos = [...c.concursosVistos.slice(-49), cid];
          break;
        }
        case "promocion_vista": {
          const cat = String(datos.categoria ?? "").toLowerCase();
          const com = String(datos.comuna ?? "").toLowerCase();
          if (cat) g.categorias[cat] = (g.categorias[cat] ?? 0) + 2;
          if (com) g.comunas[com] = (g.comunas[com] ?? 0) + 1;
          const pid = String(datos.id ?? "");
          if (pid && !c.promocionesAbiertas.includes(pid)) c.promocionesAbiertas = [...c.promocionesAbiertas.slice(-49), pid];
          break;
        }
        case "concurso_compartido": {
          const cat = String(datos.categoria ?? "").toLowerCase();
          if (cat) g.categorias[cat] = (g.categorias[cat] ?? 0) + 3;
          break;
        }
        case "busqueda": {
          const q = String(datos.query ?? "").toLowerCase();
          if (q) {
            g.atributos[q] = (g.atributos[q] ?? 0) + 2;
            const catMatch = Object.keys(g.categorias).find(k => q.includes(k));
            if (catMatch) g.categorias[catMatch] = (g.categorias[catMatch] ?? 0) + 2;
          }
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

  // Cache for API-fetched recommendations
  const recomendacionCache = useRef<Map<string, LocalRecomendado[]>>(new Map());

  const getRecomendacion = useCallback((categoria?: string, comuna?: string, excludeIds?: string[], modalidad?: string): LocalRecomendado | null => {
    const cacheKey = `${categoria ?? ""}|${comuna ?? ""}|${modalidad ?? ""}`;
    const cached = recomendacionCache.current.get(cacheKey);

    // If we have cached results from API, use those
    const candidates = cached ?? localesDB;
    let pool = [...candidates];
    if (excludeIds?.length) pool = pool.filter(l => !excludeIds.includes(l.id));

    // Prefer well-rated (≥4.0)
    const bienValorados = pool.filter(l => (l.googleRating ?? l.rating ?? 0) >= 4.0);
    if (bienValorados.length >= 3) pool = bienValorados;

    if (pool.length === 0) {
      // Trigger async fetch for next time
      const params = new URLSearchParams();
      if (categoria && categoria !== "Sorpréndeme") params.set("categoria", categoria);
      if (comuna) params.set("comuna", comuna);
      if (modalidad === "Delivery a domicilio") params.set("modalidad", "delivery");
      fetch(`/api/locales/recomendar?${params}`).then(r => r.json()).then(data => {
        if (Array.isArray(data) && data.length > 0) recomendacionCache.current.set(cacheKey, data);
      }).catch(() => {});
      return null;
    }

    const scored = pool.map(l => {
      const ratingBase = l.googleRating && l.rating === 0 ? l.googleRating : l.rating;
      let score = (ratingBase ?? 4) * 10;
      if (l.tieneConcurso) score += 20;
      const primaryCat = l.categorias?.[0]?.toLowerCase() ?? l.categoria;
      const catScore = perfil.gustos.categorias[primaryCat] ?? 0;
      const secScore = (l.categorias ?? []).slice(1).reduce((acc, c) => acc + (perfil.gustos.categorias[c.toLowerCase()] ?? 0), 0);
      const comScore = perfil.gustos.comunas[l.comuna.toLowerCase()] ?? 0;
      score += catScore * 2 + secScore + comScore;
      score += Math.random() * 20;
      if (l.estadoLocal === 'NO_RECLAMADO') score -= 5;
      return { ...l, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.min(5, scored.length));
    return top[Math.floor(Math.random() * top.length)] ?? null;
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
    <GenieContext.Provider value={{ perfil, isOpen, setIsOpen, toastActivo, setToastActivo, addInteraccion, addRespuestaGenio, getRecomendacion, isLoggedIn, userName, sessionCount, showFavoritoToast, comunasConLocales: comunasFromDB.length > 0 ? comunasFromDB : [...new Set(localesDB.map(l => l.comuna))], comunasDelivery: comunasDeliveryFromDB.length > 0 ? comunasDeliveryFromDB : [...new Set(localesDB.flatMap(l => [...(l.comunasDelivery ?? []), ...(l.tieneDelivery ? [l.comuna] : [])]))], quickRec, setQuickRec }}>
      {children}
    </GenieContext.Provider>
  );
}

export function useGenie(): GenieContextType {
  const ctx = useContext(GenieContext);
  if (!ctx) throw new Error("useGenie must be used within GenieProvider");
  return ctx;
}
