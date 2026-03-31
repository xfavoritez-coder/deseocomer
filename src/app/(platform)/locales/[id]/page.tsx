"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useGenie } from "@/contexts/GenieContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFavoritos } from "@/hooks/useFavoritos";
import { getLocalById, LOCALES, type Local, type Resena } from "@/lib/mockLocales";
import { CONCURSOS } from "@/lib/mockConcursos";

const MapaLocal = dynamic(() => import("@/components/MapaLocal"), {
  ssr: false,
  loading: () => (
    <div style={{
      width: "100%", height: "220px", borderRadius: "12px",
      background: "rgba(45,26,8,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid rgba(232,168,76,0.2)",
    }}>
      <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
        Cargando mapa...
      </span>
    </div>
  ),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? "es" : ""}`;
}

function formatPrice(n: number): string {
  return "$" + n.toLocaleString("es-CL");
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizarHorarios(horarios: any): Array<{ dia: string; abre: string; cierra: string; cerrado: boolean }> {
  if (!horarios || !Array.isArray(horarios)) return [];
  const DIAS_N = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return horarios.map((h: any, i: number) => {
    if (h?.dia) return h;
    return { dia: DIAS_N[i] ?? `Día ${i + 1}`, abre: h?.abre ?? "12:00", cierra: h?.cierra ?? "22:00", cerrado: h?.activo === false };
  });
}

const COLORS = ["#2a7a6f", "#7c3fa8", "#c4853a", "#2d6a8f", "#8f2d5a", "#4a7a2a"];
function getColor(name: string): string {
  return COLORS[name.charCodeAt(0) % COLORS.length];
}

type Tab = "Información" | "Menú" | "Reseñas" | "Fotos" | "Concursos" | "Promociones";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LocalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { addInteraccion, perfil } = useGenie();
  const { isAuthenticated } = useAuth();
  const [esLocal, setEsLocal] = useState(false);
  const mockLocal = getLocalById(Number(id));
  const [dbLocal, setDbLocal] = useState<Record<string, unknown> | null>(null);
  const [tab, setTab] = useState<Tab>("Información");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [esPropioDueno, setEsPropioDueno] = useState(false);
  const { toggleFavorito, esFavorito } = useFavoritos();

  // If not a mock local (CUID), fetch from API
  useEffect(() => {
    if (mockLocal) return;
    fetch(`/api/locales/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDbLocal(data); })
      .catch(() => {});
  }, [id, mockLocal]);

  // Build a unified local object
  const local = mockLocal ?? (dbLocal ? {
    id: Number(id) || 0,
    nombre: dbLocal.nombre as string ?? "",
    categoria: dbLocal.categoria as string ?? "Otro",
    descripcion: dbLocal.descripcion as string ?? "",
    historia: "",
    barrio: dbLocal.comuna as string ?? "Santiago",
    direccion: dbLocal.direccion as string ?? "",
    telefono: dbLocal.telefono as string ?? "",
    instagram: dbLocal.instagram as string ?? "",
    sitioWeb: dbLocal.sitioWeb as string ?? "",
    rating: 0,
    totalResenas: (dbLocal._count as Record<string, number>)?.resenas ?? 0,
    precio: "$$",
    isOpen: true,
    verificado: dbLocal.verificado as boolean ?? false,
    totalFavoritos: (dbLocal._count as Record<string, number>)?.favoritos ?? 0,
    imagenPortada: dbLocal.portadaUrl as string ?? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",
    imagenLogo: dbLocal.logoUrl as string ?? null,
    galeria: (dbLocal.galeria as string[]) ?? [],
    tieneMenu: dbLocal.tieneMenu as boolean ?? false,
    menu: [],
    horarios: normalizarHorarios(dbLocal.horarios),
    resenas: ((dbLocal.resenas as Resena[]) ?? []),
    lat: dbLocal.lat as number ?? -33.43,
    lng: dbLocal.lng as number ?? -70.65,
  } : null);

  // Detect owner / local session
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (s?.loggedIn) setEsLocal(true);
      if (s?.id && (String(s.id) === String(id) || s?.slug === id || (local && s.nombre === local.nombre))) setEsPropioDueno(true);
    } catch {}
  }, [id, local?.nombre]);

  // Track visit
  useEffect(() => {
    if (!local) return;
    addInteraccion("local_visitado", { id: String(id), nombre: local.nombre, categoria: local.categoria, comuna: local.barrio });
  }, [id, local?.nombre]);

  if (!local) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "160px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</p>
          <p style={{ fontFamily: "var(--font-cinzel)", color: "var(--accent)", fontSize: "1.2rem" }}>Local no encontrado</p>
          <Link href="/locales" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--oasis-bright)", textDecoration: "none", marginTop: "16px", display: "inline-block" }}>← Volver a locales</Link>
        </div>
        <Footer />
      </main>
    );
  }

  const todayName = DAY_NAMES[new Date().getDay()];
  const concursosLocal = CONCURSOS.filter(c => c.local === local.nombre);
  const similares = LOCALES.filter(l => l.categoria === local.categoria && l.id !== local.id).slice(0, 3);
  const tieneHorarios = local.horarios && local.horarios.length > 0 && local.horarios.some(h => !h.cerrado);
  const tieneUbicacion = !!(local.direccion || local.lat);
  const tieneSidebar = tieneHorarios || tieneUbicacion;

  // Calculate if currently open based on horarios
  const estaAbierto = (() => {
    if (!tieneHorarios) return false;
    const now = new Date();
    const hoy = local.horarios.find(h => h.dia === todayName);
    if (!hoy || hoy.cerrado) return false;
    const [aH, aM] = hoy.abre.split(":").map(Number);
    const [cH, cM] = hoy.cierra.split(":").map(Number);
    const minNow = now.getHours() * 60 + now.getMinutes();
    const minAbre = aH * 60 + aM;
    const minCierra = cH * 60 + cM;
    if (minCierra > minAbre) return minNow >= minAbre && minNow < minCierra;
    // Cierra después de medianoche (ej: 20:00 - 02:00)
    return minNow >= minAbre || minNow < minCierra;
  })();
  const mostrarAbierto = tieneHorarios && estaAbierto;

  // Genie recommendation text
  const catScore = perfil.gustos.categorias[local.categoria.toLowerCase()] ?? 0;
  const comScore = perfil.gustos.comunas[local.barrio.toLowerCase()] ?? 0;
  const genieText = catScore > 0
    ? `Te recomendamos ${local.nombre} porque te gusta ${local.categoria.toLowerCase()}`
    : comScore > 0
    ? `Está en ${local.barrio}, una de tus zonas preferidas`
    : `Uno de los mejor valorados en ${local.barrio}`;

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section style={{ position: "relative", height: "clamp(240px, 40vw, 420px)", overflow: "hidden" }}>
        <img src={local.imagenPortada} alt={local.nombre} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.65 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,8,18,0.1) 0%, rgba(10,8,18,0.95) 100%)" }} />
        <Link href="/locales" style={{ position: "absolute", top: "clamp(80px, 12vw, 100px)", left: "clamp(16px, 4vw, 32px)", zIndex: 3, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "6px 14px", fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,234,214,0.75)", textDecoration: "none" }}>← Locales</Link>
        <button onClick={() => toggleFavorito(String(local.id), { categoria: local.categoria, comuna: local.barrio })} style={{ position: "absolute", top: "80px", right: "16px", zIndex: 10, width: "44px", height: "44px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {esFavorito(String(local.id)) ? "❤️" : "🤍"}
        </button>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "clamp(16px, 4vw, 32px)", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", marginBottom: "10px" }}>
            <div style={{ width: "clamp(44px, 8vw, 56px)", height: "clamp(44px, 8vw, 56px)", borderRadius: "50%", background: "linear-gradient(135deg, #2a7a6f, #3db89e)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.9rem, 2vw, 1.1rem)", fontWeight: 700, color: "#fff", border: "2px solid rgba(255,255,255,0.15)", flexShrink: 0 }}>
              {getInitials(local.nombre)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.3rem, 4vw, 2rem)", fontWeight: 900, color: "#f5d080", lineHeight: 1.1, margin: 0 }}>{local.nombre}</h1>
                {local.rating > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "20px", padding: "3px 10px", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.75rem", color: "#e8a84c" }}>★</span>
                    <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", fontWeight: 700, color: "#e8a84c" }}>{local.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "rgba(240,234,214,0.55)" }}>{local.categoria}</span>
                <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(240,234,214,0.3)", display: "inline-block" }} />
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "rgba(240,234,214,0.55)" }}>{local.barrio}</span>
                {tieneHorarios && (<>
                  <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(240,234,214,0.3)", display: "inline-block" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: estaAbierto ? "#3db89e" : "#ff6b6b" }} />
                    <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", color: estaAbierto ? "#3db89e" : "#ff6b6b", letterSpacing: "0.1em" }}>{estaAbierto ? "Abierto" : "Cerrado"}</span>
                  </div>
                </>)}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Tabs */}
      <div className="dc-tabs-sticky" style={{ position: "sticky", top: "64px", zIndex: 50, background: "var(--bg-primary)", borderBottom: "1px solid var(--border-color)", display: "flex", overflowX: "auto", scrollbarWidth: "none", padding: "0 24px" }}>
        {[
          { key: "Información" as Tab, label: "Información", count: null, countColor: "", countBg: "" },
          { key: "Menú" as Tab, label: "Menú", count: null, countColor: "", countBg: "" },
          { key: "Reseñas" as Tab, label: "Reseñas", count: local.totalResenas > 0 ? local.totalResenas : null, countColor: "rgba(240,234,214,0.4)", countBg: "rgba(240,234,214,0.1)" },
          { key: "Fotos" as Tab, label: "Fotos", count: null, countColor: "", countBg: "" },
          { key: "Concursos" as Tab, label: "Concursos", count: concursosLocal.length > 0 ? concursosLocal.length : null, countColor: "#1a0e05", countBg: "#e8a84c" },
          { key: "Promociones" as Tab, label: "Promociones", count: null, countColor: "", countBg: "" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: tab === t.key ? "var(--accent)" : "var(--text-muted)", background: "none", border: "none", borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent", padding: "14px 14px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px" }}>
            {t.label}
            {t.count !== null && <span style={{ background: tab === t.key ? (t.countBg || "rgba(232,168,76,0.2)") : "rgba(255,255,255,0.08)", color: tab === t.key ? (t.countColor || "var(--accent)") : "rgba(240,234,214,0.35)", fontSize: "0.6rem", fontWeight: 700, borderRadius: "10px", padding: "1px 6px", minWidth: "16px", textAlign: "center", transition: "all 0.2s" }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px 80px" }}>
        <div className="dc-ld-layout">
          <div className="dc-ld-main">

            {/* TAB: Información */}
            {tab === "Información" && (
              <div className={tieneSidebar ? "dc-local-layout" : "dc-local-single"}>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Descripción */}
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.1)", borderRadius: "14px", padding: "20px 24px" }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "14px" }}>Sobre el local</p>
                    <p style={bodyStyle}>{local.descripcion}</p>
                    {local.historia && <p style={{ ...bodyStyle, marginTop: "12px" }}>{local.historia}</p>}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(local as any).tags?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "14px" }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(local as any).tags.map((tag: string) => (
                          <span key={tag} style={{ padding: "4px 12px", borderRadius: "20px", border: "1px solid rgba(232,168,76,0.15)", background: "rgba(232,168,76,0.06)", fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.55)" }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Concursos activos */}
                  {concursosLocal.length > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.1)", borderRadius: "14px", padding: "20px 24px" }}>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "14px" }}>Concursos activos</p>
                      {concursosLocal.map(c => (
                        <Link key={c.id} href={`/concursos/${c.slug || c.id}`} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.18)", borderRadius: "12px", marginBottom: "8px", textDecoration: "none" }}>
                          <span style={{ fontSize: "1.5rem" }}>🏆</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.82rem", color: "#f0ead6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>{c.premio}</p>
                            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.4)" }}>{c.participantes} participantes</p>
                          </div>
                          <span style={{ color: "rgba(240,234,214,0.25)", fontSize: "0.9rem", flexShrink: 0 }}>→</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Reseñas preview */}
                  {local.resenas.length === 0 ? (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(232,168,76,0.08)", borderRadius: "12px", padding: "28px 24px", textAlign: "center" }}>
                      <div style={{ fontSize: "2rem", marginBottom: "10px" }}>✍️</div>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "rgba(240,234,214,0.5)", marginBottom: "6px" }}>Sin reseñas aún</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", lineHeight: 1.6, marginBottom: "16px" }}>Sé el primero en compartir tu experiencia</p>
                      {isAuthenticated ? (
                        <button onClick={() => setTab("Reseñas")} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "var(--accent)", color: "var(--bg-primary)", border: "none", borderRadius: "20px", padding: "10px 24px", cursor: "pointer", fontWeight: 700 }}>Escribir reseña →</button>
                      ) : !esLocal ? (
                        <Link href={`/login?next=/locales/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)", color: "var(--accent)", borderRadius: "20px", padding: "10px 24px", textDecoration: "none", fontWeight: 700 }}>Inicia sesión para comentar →</Link>
                      ) : null}
                    </div>
                  ) : (
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.1)", borderRadius: "14px", padding: "20px 24px" }}>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "14px" }}>Reseñas</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                        <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "3rem", fontWeight: 700, color: "#e8a84c", lineHeight: 1 }}>{local.rating?.toFixed(1) ?? "—"}</div>
                        <div>
                          <div style={{ color: "#e8a84c", fontSize: "1rem", marginBottom: "4px", letterSpacing: "2px" }}>{"★".repeat(Math.round(local.rating ?? 0))}</div>
                          <div style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)" }}>Basado en {local.totalResenas} reseñas</div>
                        </div>
                      </div>
                      {local.resenas.slice(0, 2).map(r => (
                        <div key={r.id} style={{ paddingBottom: "12px", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: getColor(r.usuario), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{getInitials(r.usuario)}</div>
                            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-primary)" }}>{r.usuario}</span>
                            <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.65rem", color: "var(--text-muted)" }}>{"★".repeat(r.rating)} · {timeAgo(r.fecha)}</span>
                          </div>
                          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.7)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{r.comentario}</p>
                        </div>
                      ))}
                      <button onClick={() => setTab("Reseñas")} style={{ background: "none", border: "none", fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--oasis-bright)", cursor: "pointer", padding: 0 }}>Ver todas las reseñas →</button>
                    </div>
                  )}
                </div>

                {/* Sidebar: horarios + ubicación — only if content exists */}
                {tieneSidebar && (
                <div className="dc-local-sidebar" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {tieneHorarios && (
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.1)", borderRadius: "14px", padding: "20px 24px" }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "14px" }}>Horarios</p>
                    {local.horarios.map(h => {
                      const esHoy = h.dia === todayName;
                      return (
                        <div key={h.dia} style={{ display: "flex", justifyContent: "space-between", padding: esHoy ? "9px 8px" : "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", background: esHoy ? "rgba(61,184,158,0.04)" : "transparent", borderRadius: esHoy ? "6px" : 0 }}>
                          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: esHoy ? "#3db89e" : "rgba(240,234,214,0.55)", fontWeight: esHoy ? 700 : 400 }}>{h.dia}{esHoy ? " · hoy" : ""}</span>
                          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: h.cerrado ? "rgba(255,100,100,0.6)" : (esHoy ? "#3db89e" : "#f0ead6"), fontWeight: esHoy ? 700 : 400 }}>{h.cerrado ? "Cerrado" : `${h.abre} - ${h.cierra}`}</span>
                        </div>
                      );
                    })}
                  </div>
                  )}
                  {tieneUbicacion && (
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.1)", borderRadius: "14px", padding: "20px 24px" }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "14px" }}>Ubicación</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
                      {local.direccion && <p style={bodyStyle}>📍 {local.direccion}{local.barrio ? `, ${local.barrio}` : ""}</p>}
                      {local.telefono && <p style={bodyStyle}>📞 {local.telefono}</p>}
                      {local.instagram && <p style={bodyStyle}>📷 <a href={`https://instagram.com/${local.instagram.replace("@", "")}`} target="_blank" rel="noopener" style={{ color: "var(--oasis-bright)", textDecoration: "none" }}>{local.instagram}</a></p>}
                      {local.sitioWeb && <p style={bodyStyle}>🌐 <a href={local.sitioWeb.startsWith("http") ? local.sitioWeb : `https://${local.sitioWeb}`} target="_blank" rel="noopener" style={{ color: "var(--oasis-bright)", textDecoration: "none" }}>{local.sitioWeb.replace(/^https?:\/\//, "")}</a></p>}
                    </div>
                    <div style={{ overflow: "hidden", borderRadius: "14px", position: "relative", width: "100%", maxWidth: "100%" }}>
                      <MapaLocal lat={local.lat} lng={local.lng} nombre={local.nombre} />
                    </div>
                  </div>
                  )}
                </div>
                )}

              </div>
            )}

            {/* TAB: Menú */}
            {tab === "Menú" && (
              local.tieneMenu && local.menu.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                  {local.menu.map(cat => (
                    <div key={cat.categoria}>
                      <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
                        {cat.categoria}
                      </h3>
                      <div className="dc-ld-menu-grid">
                        {cat.items.map(item => (
                          <div key={item.id} style={{ background: "rgba(45,26,8,0.85)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border-color)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: "4px" }}>
                                  {item.nombre} {item.destacado && <span style={{ fontSize: "0.7rem" }}>⭐</span>}
                                </p>
                                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{item.descripcion}</p>
                              </div>
                              <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "var(--accent)", flexShrink: 0, marginLeft: "12px" }}>
                                {formatPrice(item.precio)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="🍽️" title="Menú no disponible" text="Este local no ha publicado su menú aún. Visítanos para conocer nuestras opciones del día." />
              )
            )}

            {/* TAB: Reseñas */}
            {tab === "Reseñas" && <ResenasTab local={local} isAuth={isAuthenticated} esLocal={esLocal} />}

            {/* TAB: Fotos */}
            {tab === "Fotos" && (
              local.galeria.length > 0 ? (
                <div className="dc-ld-gallery">
                  {local.galeria.map((foto, i) => (
                    <div key={i} onClick={() => setLightbox(foto)} style={{ cursor: "pointer", height: "200px", borderRadius: "12px", overflow: "hidden" }}>
                      <img src={foto} alt={`${local.nombre} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="📷" title="Sin fotos" text="Este local aún no ha subido fotos" />
              )
            )}

            {/* TAB: Concursos */}
            {tab === "Concursos" && (
              concursosLocal.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {concursosLocal.map(c => (
                    <Link key={c.id} href={`/concursos/${c.id}`} style={{
                      display: "flex", alignItems: "center", gap: "14px",
                      background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)",
                      borderRadius: "14px", padding: "16px", textDecoration: "none",
                    }}>
                      <span style={{ fontSize: "2rem" }}>{c.imagen}</span>
                      <div>
                        <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)" }}>{c.premio}</p>
                        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "var(--oasis-bright)" }}>{c.participantes} participantes</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon="🏆" title="Sin concursos" text="No hay concursos activos en este momento" />
              )
            )}

            {/* TAB: Promociones */}
            {tab === "Promociones" && (
              <EmptyState icon="⚡" title="Sin promociones activas" text="Este local no tiene promociones activas en este momento." />
            )}
          </div>

        </div>

        {/* Similares */}
        {similares.length > 0 && (
          <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid rgba(232,168,76,0.08)" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", marginBottom: "6px" }}>También te puede gustar</p>
            <h3 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.1rem, 3vw, 1.4rem)", color: "var(--accent)", marginBottom: "20px" }}>Locales similares</h3>
            <div style={{ display: "flex", gap: "14px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "8px" }}>
              {similares.map(s => (
                <Link key={s.id} href={`/locales/${s.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                  <div style={{ width: "200px", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.1)", borderRadius: "16px", overflow: "hidden", transition: "transform 0.2s, border-color 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,168,76,0.35)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,168,76,0.1)"; }}>
                    <div style={{ height: "100px", background: s.imagenPortada ? "transparent" : `linear-gradient(135deg, ${getColor(s.nombre)}, ${getColor(s.nombre)}88)`, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s.imagenPortada ? (<><img src={s.imagenPortada} alt={s.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /><div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(10,8,18,0.6) 100%)" }} /></>) : <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.8rem", fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{getInitials(s.nombre)}</span>}
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#f5d080", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nombre}</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.4)", marginBottom: "8px" }}>{s.barrio}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.4)", background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(232,168,76,0.1)", borderRadius: "20px", padding: "2px 8px" }}>{s.categoria}</span>
                        {s.rating > 0 && <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "#e8a84c" }}>★ {s.rating}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", borderRadius: "12px" }} />
          <button style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#fff", fontSize: "2rem", cursor: "pointer" }}>✕</button>
        </div>
      )}

      <Footer />

      <style>{`
        .dc-ld-layout { display: block; }
        .dc-ld-main { min-width: 0; }
        .dc-local-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
        .dc-local-single { max-width: 680px; }
        .dc-local-sidebar { position: sticky; top: 100px; }
        .dc-ld-menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .dc-ld-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
        @media (max-width: 1023px) {
          .dc-local-layout { grid-template-columns: 1fr; }
          .dc-local-sidebar { position: static; }
        }
        @media (max-width: 767px) {
          .dc-ld-menu-grid { grid-template-columns: 1fr; }
          .dc-ld-gallery { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .dc-tabs-sticky { top: 56px !important; }
        }
      `}</style>
    </main>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = { fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "1rem" }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>{text}</span>
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: "3rem", marginBottom: "12px" }}>{icon}</div>
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "8px" }}>{title}</p>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "360px", margin: "0 auto" }}>{text}</p>
    </div>
  );
}

function ResenasTab({ local, isAuth, esLocal }: { local: Local; isAuth: boolean; esLocal?: boolean }) {
  const [resenas, setResenas] = useState<Resena[]>(local.resenas);
  const [writing, setWriting] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  const handlePublish = () => {
    if (stars === 0 || comment.length < 20) return;
    const nueva: Resena = { id: Date.now(), usuario: "Tú", avatar: null, rating: stars, fecha: new Date().toISOString().slice(0, 10), comentario: comment, likes: 0 };
    setResenas(prev => [nueva, ...prev]);
    setWriting(false);
    setStars(0);
    setComment("");
  };

  // Rating distribution
  const dist = [5, 4, 3, 2, 1].map(s => ({ stars: s, count: resenas.filter(r => r.rating === s).length }));
  const maxCount = Math.max(...dist.map(d => d.count), 1);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "3rem", color: "var(--accent)", lineHeight: 1 }}>{local.rating}</p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "var(--text-muted)" }}>{local.totalResenas} reseñas</p>
        </div>
        <div style={{ flex: 1, minWidth: "150px" }}>
          {dist.map(d => (
            <div key={d.stars} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "var(--text-muted)", width: "14px" }}>{d.stars}</span>
              <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.3)" }}>
                <div style={{ height: "100%", borderRadius: "3px", background: "var(--accent)", width: `${(d.count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        {isAuth && !writing && (
          <button onClick={() => setWriting(true)} style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase",
            background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700,
            border: "none", borderRadius: "10px", padding: "10px 20px", cursor: "pointer",
          }}>Escribir reseña</button>
        )}
      </div>

      {!isAuth && !esLocal && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.1)", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "rgba(240,234,214,0.5)", margin: 0 }}>¿Visitaste este local? Comparte tu experiencia</p>
          <Link href="/login" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "var(--accent)", color: "var(--bg-primary)", borderRadius: "20px", padding: "8px 18px", textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap" }}>Iniciar sesión →</Link>
        </div>
      )}

      {/* Write form */}
      {writing && (
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "20px", marginBottom: "24px", animation: "genieSlideUp 0.3s ease" }}>
          <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setStars(s)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", opacity: s <= stars ? 1 : 0.3 }}>
                ★
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Escribe tu experiencia (mínimo 20 caracteres)..." rows={3}
            style={{ width: "100%", background: "#1a1008", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "12px", fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button onClick={handlePublish} disabled={stars === 0 || comment.length < 20} style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", background: stars > 0 && comment.length >= 20 ? "var(--accent)" : "rgba(232,168,76,0.2)",
              color: stars > 0 && comment.length >= 20 ? "var(--bg-primary)" : "var(--text-muted)", border: "none", borderRadius: "8px", padding: "8px 16px", cursor: stars > 0 && comment.length >= 20 ? "pointer" : "default", fontWeight: 700,
            }}>Publicar</button>
            <button onClick={() => setWriting(false)} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", background: "none", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px 16px", color: "var(--text-muted)", cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {resenas.map(r => (
          <div key={r.id} style={{ paddingBottom: "16px", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: getColor(r.usuario), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {getInitials(r.usuario)}
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--text-primary)" }}>{r.usuario}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {timeAgo(r.fecha)}
                </p>
              </div>
            </div>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "8px" }}>{r.comentario}</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "var(--text-muted)" }}>👍 {r.likes}</p>
            {r.respuestaLocal && (
              <div style={{ marginTop: "12px", marginLeft: "20px", padding: "12px 16px", background: "rgba(45,26,8,0.6)", borderRadius: "10px", borderLeft: "2px solid var(--accent)" }}>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", color: "var(--accent)", marginBottom: "4px" }}>💬 Respuesta del local · {r.fechaRespuesta && timeAgo(r.fechaRespuesta)}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{r.respuestaLocal}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`@keyframes genieSlideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
