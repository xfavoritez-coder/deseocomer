"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BotonFavorito from "@/components/BotonFavorito";

const CATEGORIAS = [
  "Todos", "Pizza", "Sushi", "Hamburguesa",
  "Vegano", "Café", "Almuerzo", "Pastas",
  "Mexicano", "Pollo",
];

function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}
function getInitials(nombre: string): string {
  return nombre.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const localesMock = [
  { id: "1", nombre: "Pizza Napoli", categoria: "Pizza", comuna: "Providencia", rating: 4.8, precio: "$$$", imagenUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600", logoUrl: null, descripcion: "La mejor pizza napolitana de Santiago, horno de leña importado de Italia.", verificado: true, horarios: null, createdAt: "2025-01-15", _count: { favoritos: 42, resenas: 18, concursos: 1, promociones: 2 } },
  { id: "2", nombre: "Sushi Oasis", categoria: "Sushi", comuna: "Las Condes", rating: 4.9, precio: "$$$$", imagenUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600", logoUrl: null, descripcion: "Omakase y rolls creativos con ingredientes del Pacífico.", verificado: true, horarios: null, createdAt: "2025-02-10", _count: { favoritos: 67, resenas: 24, concursos: 1, promociones: 1 } },
  { id: "3", nombre: "El Menú de Don Carlos", categoria: "Almuerzo", comuna: "Santiago Centro", rating: 4.7, precio: "$", imagenUrl: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600", logoUrl: null, descripcion: "Cocina casera chilena, almuerzo completo con sabor de abuela.", verificado: false, horarios: null, createdAt: "2025-03-01", _count: { favoritos: 31, resenas: 12, concursos: 1, promociones: 1 } },
  { id: "4", nombre: "Burger Desierto", categoria: "Hamburguesa", comuna: "Ñuñoa", rating: 4.6, precio: "$$", imagenUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600", logoUrl: null, descripcion: "Smash burgers artesanales con ingredientes locales y salsas únicas.", verificado: false, horarios: null, createdAt: "2025-01-20", _count: { favoritos: 28, resenas: 9, concursos: 0, promociones: 1 } },
  { id: "5", nombre: "Verde Oasis", categoria: "Vegano", comuna: "Vitacura", rating: 4.5, precio: "$$", imagenUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", logoUrl: null, descripcion: "Cocina plant-based de autor, menú cambiante según temporada.", verificado: true, horarios: null, createdAt: "2025-02-28", _count: { favoritos: 55, resenas: 15, concursos: 0, promociones: 0 } },
  { id: "6", nombre: "Café Arenas", categoria: "Café", comuna: "Bellavista", rating: 4.7, precio: "$", imagenUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600", logoUrl: null, descripcion: "Specialty coffee de origen, pastelería artesanal y ambiente íntimo.", verificado: false, horarios: null, createdAt: "2025-03-10", _count: { favoritos: 39, resenas: 11, concursos: 0, promociones: 1 } },
  { id: "7", nombre: "La Trattoria", categoria: "Pastas", comuna: "Lastarria", rating: 4.6, precio: "$$$", imagenUrl: "https://images.unsplash.com/photo-1551183053-bf91798d96f4?w=600", logoUrl: null, descripcion: "Pastas frescas artesanales y risotto al estilo de la nonna.", verificado: true, horarios: null, createdAt: "2025-01-05", _count: { favoritos: 48, resenas: 20, concursos: 0, promociones: 1 } },
  { id: "8", nombre: "Taquería del Desierto", categoria: "Mexicano", comuna: "Ñuñoa", rating: 4.4, precio: "$$", imagenUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600", logoUrl: null, descripcion: "Tacos al pastor auténticos, mezcal artesanal y ambiente festivo.", verificado: false, horarios: null, createdAt: "2025-02-15", _count: { favoritos: 22, resenas: 7, concursos: 0, promociones: 0 } },
  { id: "9", nombre: "Ramen Noche", categoria: "Sushi", comuna: "Providencia", rating: 4.8, precio: "$$", imagenUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600", logoUrl: null, descripcion: "Ramen tonkotsu cocido 18 horas, gyozas caseras y sake importado.", verificado: false, horarios: null, createdAt: "2025-03-05", _count: { favoritos: 35, resenas: 14, concursos: 0, promociones: 0 } },
  { id: "10", nombre: "Parrilla del Sur", categoria: "Almuerzo", comuna: "Maipú", rating: 4.5, precio: "$$", imagenUrl: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600", logoUrl: null, descripcion: "Cortes premium a las brasas, chimichurri secreto de la casa.", verificado: false, horarios: null, createdAt: "2025-01-25", _count: { favoritos: 19, resenas: 6, concursos: 0, promociones: 0 } },
  { id: "11", nombre: "Vegan Garden", categoria: "Vegano", comuna: "Providencia", rating: 4.3, precio: "$", imagenUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", logoUrl: null, descripcion: "Bowl therapy, wraps energéticos y jugos cold press.", verificado: false, horarios: null, createdAt: "2025-02-20", _count: { favoritos: 26, resenas: 8, concursos: 0, promociones: 0 } },
  { id: "12", nombre: "Espresso Duna", categoria: "Café", comuna: "Las Condes", rating: 4.6, precio: "$", imagenUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600", logoUrl: null, descripcion: "Café de especialidad de origen único, té de autor y cheesecake.", verificado: true, horarios: null, createdAt: "2025-03-12", _count: { favoritos: 44, resenas: 16, concursos: 0, promociones: 0 } },
];

export default function LocalesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [locales, setLocales] = useState<any[]>(localesMock);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [soloConConcursos, setSoloConConcursos] = useState(false);
  const [soloConPromociones, setSoloConPromociones] = useState(false);
  const [ordenamiento, setOrdenamiento] = useState("rating");

  useEffect(() => {
    fetch("/api/locales")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = data.map((l: any) => ({
            id: l.id,
            slug: l.slug,
            nombre: l.nombre ?? "",
            categoria: l.categoria ?? "Otro",
            comuna: l.comuna ?? "Santiago",
            rating: 4.5,
            precio: "$$",
            imagenUrl: l.portadaUrl ?? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
            logoUrl: l.logoUrl,
            descripcion: l.descripcion ?? "",
            verificado: l.verificado ?? false,
            horarios: l.horarios,
            createdAt: l.createdAt,
            _count: l._count ?? { favoritos: 0, resenas: 0, concursos: 0, promociones: 0 },
          }));
          setLocales(mapped.length > 0 ? [...mapped, ...localesMock] : localesMock);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const localesFiltrados = locales
    .filter(l => {
      if (busqueda) {
        const q = busqueda.toLowerCase();
        if (!l.nombre?.toLowerCase().includes(q) && !l.comuna?.toLowerCase().includes(q) && !l.categoria?.toLowerCase().includes(q) && !(l.tags && l.tags.some((t: string) => t.toLowerCase().includes(q)))) return false;
      }
      if (categoriaActiva !== "Todos") {
        const catMatch = l.categoria?.toLowerCase() === categoriaActiva.toLowerCase() || (l.tags && l.tags.some((t: string) => t.toLowerCase() === categoriaActiva.toLowerCase()));
        if (!catMatch) return false;
      }
      if (soloAbiertos && l.horarios) {
        const ahora = new Date();
        const dia = ahora.getDay();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const horarioDia = (l.horarios as any)?.[dia];
        if (horarioDia?.cerrado) return false;
      }
      if (soloConConcursos && (l._count?.concursos ?? 0) === 0) return false;
      if (soloConPromociones && (l._count?.promociones ?? 0) === 0) return false;
      return true;
    })
    .sort((a, b) => {
      if (ordenamiento === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (ordenamiento === "nuevo") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (ordenamiento === "favoritos") return (b._count?.favoritos ?? 0) - (a._count?.favoritos ?? 0);
      return 0;
    });

  const limpiarFiltros = () => {
    setBusqueda("");
    setCategoriaActiva("Todos");
    setSoloAbiertos(false);
    setSoloConConcursos(false);
    setSoloConPromociones(false);
  };

  const hayFiltros = busqueda || categoriaActiva !== "Todos" || soloAbiertos || soloConConcursos || soloConPromociones;

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section className="dc-lp-hero">
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 65%)" }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem, 2vw, 0.85rem)", letterSpacing: "0.45em", textTransform: "uppercase", color: "var(--oasis-bright)", marginBottom: "16px" }}>Locales</p>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(2.2rem, 7vw, 4.5rem)", fontWeight: 800, letterSpacing: "0.02em", color: "var(--accent)", textShadow: "0 0 60px color-mix(in srgb, var(--accent) 50%, transparent)", marginBottom: "20px", lineHeight: 1.1 }}>Descubre Dónde Comer</h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(1rem, 2.5vw, 1.15rem)", color: "var(--text-primary)", fontWeight: 400, maxWidth: "520px", margin: "0 auto", lineHeight: 1.8 }}>Los mejores locales gastronómicos de Santiago.</p>
        </div>
      </section>

      {/* Search + Filters */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 32px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar local, categoría o comuna..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ width: "100%", padding: "14px 16px 14px 44px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "12px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Fila 1 — Categorías */}
        <div className="dc-filtros-fila" style={{ marginBottom: "10px" }}>
          {CATEGORIAS.map(cat => {
            const active = categoriaActiva === cat;
            return (
              <button key={cat} onClick={() => setCategoriaActiva(cat)} style={{ padding: "8px 16px", borderRadius: "20px", border: active ? "1px solid var(--accent)" : "1px solid rgba(232,168,76,0.2)", background: active ? "rgba(232,168,76,0.15)" : "transparent", color: active ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap", textTransform: "uppercase", flexShrink: 0, minHeight: "36px", display: "flex", alignItems: "center" }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Fila 2 — Estado + Ordenamiento */}
        <div className="dc-filtros-fila">
          <button onClick={() => setSoloAbiertos(!soloAbiertos)} style={{ padding: "8px 16px", borderRadius: "20px", border: soloAbiertos ? "1px solid #3db89e" : "1px solid rgba(232,168,76,0.2)", background: soloAbiertos ? "rgba(61,184,158,0.12)" : "transparent", color: soloAbiertos ? "#3db89e" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, minHeight: "36px", display: "flex", alignItems: "center", gap: "6px" }}>
            {soloAbiertos && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3db89e", display: "inline-block" }} />}
            Abierto ahora
          </button>
          <button onClick={() => setSoloConConcursos(!soloConConcursos)} style={{ padding: "8px 16px", borderRadius: "20px", border: soloConConcursos ? "1px solid var(--accent)" : "1px solid rgba(232,168,76,0.2)", background: soloConConcursos ? "rgba(232,168,76,0.12)" : "transparent", color: soloConConcursos ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, minHeight: "36px", display: "flex", alignItems: "center", gap: "6px" }}>
            🏆 Con concursos
          </button>
          <button onClick={() => setSoloConPromociones(!soloConPromociones)} style={{ padding: "8px 16px", borderRadius: "20px", border: soloConPromociones ? "1px solid var(--accent)" : "1px solid rgba(232,168,76,0.2)", background: soloConPromociones ? "rgba(232,168,76,0.12)" : "transparent", color: soloConPromociones ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, minHeight: "36px", display: "flex", alignItems: "center", gap: "6px" }}>
            ⚡ Con promociones
          </button>
          <select value={ordenamiento} onChange={e => setOrdenamiento(e.target.value)} style={{ padding: "8px 32px 8px 16px", borderRadius: "20px", border: "1px solid rgba(232,168,76,0.2)", background: "rgba(255,255,255,0.04)", color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, cursor: "pointer", outline: "none", appearance: "none" as const, WebkitAppearance: "none" as const, whiteSpace: "nowrap", flexShrink: 0, minHeight: "36px", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23e8a84c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
            <option value="rating" style={{ background: "#0a0812", color: "#f0ead6" }}>⭐ Mejor valorados</option>
            <option value="nuevo" style={{ background: "#0a0812", color: "#f0ead6" }}>🆕 Más nuevos</option>
            <option value="favoritos" style={{ background: "#0a0812", color: "#f0ead6" }}>❤️ Más guardados</option>
          </select>
          {hayFiltros && (
            <button onClick={limpiarFiltros} style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid rgba(255,100,100,0.3)", background: "rgba(255,100,100,0.08)", color: "#ff8080", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, minHeight: "36px", display: "flex", alignItems: "center" }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 80px" }}>
        {loading ? (
          /* Skeleton */
          <div className="dc-loc-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", overflow: "hidden" }}>
                <div className="dc-loc-skeleton" style={{ height: "160px" }} />
                <div style={{ padding: "20px" }}>
                  <div className="dc-loc-skeleton" style={{ height: "20px", width: "60%", borderRadius: "8px", marginBottom: "12px" }} />
                  <div className="dc-loc-skeleton" style={{ height: "14px", width: "40%", borderRadius: "6px", marginBottom: "8px" }} />
                  <div className="dc-loc-skeleton" style={{ height: "14px", width: "90%", borderRadius: "6px", marginBottom: "6px" }} />
                  <div className="dc-loc-skeleton" style={{ height: "14px", width: "70%", borderRadius: "6px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : localesFiltrados.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            {hayFiltros ? (
              <>
                <p style={{ fontSize: "3rem", marginBottom: "12px" }}>🔍</p>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "6px" }}>Sin resultados</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Prueba con otros filtros o búsqueda</p>
                <button onClick={limpiarFiltros} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: "12px 28px", borderRadius: "30px", border: "1px solid var(--accent)", background: "transparent", color: "var(--accent)", cursor: "pointer" }}>
                  Limpiar filtros
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: "3rem", marginBottom: "12px" }}>🍽️</p>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "6px" }}>Pronto habrá locales aquí</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Estamos incorporando los primeros locales</p>
                <Link href="/solo-locales" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", textDecoration: "none", borderBottom: "1px solid rgba(232,168,76,0.3)", paddingBottom: "2px" }}>
                  ¿Tienes un local? →
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "20px" }}>
              {localesFiltrados.length} local{localesFiltrados.length !== 1 ? "es" : ""} encontrado{localesFiltrados.length !== 1 ? "s" : ""}
            </p>
            <div className="dc-loc-grid">
              {localesFiltrados.map(local => {
                const hue = nameToHue(local.nombre);
                const hasConcurso = (local._count?.concursos ?? 0) > 0;
                const hasPromo = (local._count?.promociones ?? 0) > 0;
                const linkHref = `/locales/${local.slug || local.id}`;

                return (
                  <Link key={local.id} href={linkHref} className="dc-loc-card" style={{ textDecoration: "none", display: "block", color: "inherit" }}>
                    {/* Photo */}
                    <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
                      <img src={local.imagenUrl} alt={local.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(8,13,24,0.5) 100%)" }} />

                      {/* Badges top-left */}
                      <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 2 }}>
                        {hasConcurso && (
                          <span style={{ background: "rgba(13,7,3,0.85)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "20px", padding: "8px 14px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.05em", color: "var(--accent)", backdropFilter: "blur(4px)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.85rem" }}>🏆</span> Concurso activo
                          </span>
                        )}
                        {hasPromo && (
                          <span style={{ background: "rgba(13,7,3,0.85)", border: "1px solid rgba(61,184,158,0.4)", borderRadius: "20px", padding: "8px 14px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.05em", color: "var(--oasis-bright)", backdropFilter: "blur(4px)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "0.85rem" }}>⚡</span> Oferta hoy
                          </span>
                        )}
                      </div>

                      {/* Favorito top-right */}
                      <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 2 }}>
                        <BotonFavorito localId={local.id} localData={{ categoria: local.categoria, comuna: local.comuna }} size="sm" />
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: "16px 20px 20px" }}>
                      {/* Row 1: Logo + Name */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        {local.logoUrl ? (
                          <img src={local.logoUrl} alt="" style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(232,168,76,0.2)" }} />
                        ) : (
                          <div style={{ width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0, background: `hsl(${hue}, 35%, 22%)`, border: `1px solid hsl(${hue}, 40%, 38%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem", color: `hsl(${hue}, 60%, 70%)` }}>
                            {getInitials(local.nombre)}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.15rem", fontWeight: 700, color: "#f5d080", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{local.nombre}</span>
                            {local.verificado && <span style={{ fontSize: "0.7rem", color: "#e8a84c" }}>✓</span>}
                          </p>
                        </div>
                      </div>

                      {/* Row 2: Location + Price */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "var(--oasis-bright, rgba(95,240,208,0.8))" }}>
                          📍 {local.comuna}
                        </span>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.88rem", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                          {local.precio}
                        </span>
                      </div>

                      {/* Row 3: Description (2 lines) */}
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "rgba(240,234,214,0.6)", lineHeight: 1.6, marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {local.descripcion}
                      </p>

                      {/* Row 4: Footer */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", background: "rgba(0,0,0,0.2)", padding: "5px 12px", borderRadius: "20px", border: "1px solid rgba(232,168,76,0.12)" }}>
                          {local.categoria}
                        </span>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "var(--accent)" }}>
                          ⭐ {local.rating}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>

      <Footer />

      <style>{`
        .dc-filtros-fila {
          display: flex;
          gap: 8px;
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 4px;
        }
        .dc-filtros-fila::-webkit-scrollbar { display: none; }
        .dc-lp-hero {
          position: relative;
          overflow: hidden;
          padding: 140px 60px 60px;
          text-align: center;
        }
        .dc-loc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }
        .dc-loc-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s;
        }
        .dc-loc-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent) !important;
        }
        .dc-loc-skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: dc-loc-shimmer 1.5s ease-in-out infinite;
        }
        @keyframes dc-loc-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 767px) {
          .dc-lp-hero { padding: 100px 20px 50px; }
          .dc-loc-grid { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-lp-hero { padding: 120px 40px 60px; }
          .dc-loc-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </main>
  );
}
