"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BotonFavorito from "@/components/BotonFavorito";

const categorias = ["Todos", "Pizza", "Sushi", "Almuerzo", "Burger", "Vegano", "Café"];

function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
function getInitials(nombre: string): string {
  return nombre.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const localesMock = [
  { id: 1, nombre: "Pizza Napoli",          categoria: "Pizza",    barrio: "Providencia",     emoji: "🍕", rating: 0, precio: "", isOpen: true, descripcion: "La mejor pizza napolitana de Santiago, horno de leña importado de Italia.",       imagenUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600", logoUrl: null as string | null },
  { id: 2, nombre: "Sushi Oasis",           categoria: "Sushi",    barrio: "Las Condes",      emoji: "🍣", rating: 0, precio: "", isOpen: true, descripcion: "Omakase y rolls creativos con ingredientes del Pacífico.",                          imagenUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600", logoUrl: null as string | null },
  { id: 3, nombre: "El Menú de Don Carlos", categoria: "Almuerzo", barrio: "Santiago Centro", emoji: "🍲", rating: 0, precio: "", isOpen: true, descripcion: "Cocina casera chilena, almuerzo completo con sabor de abuela.",                     imagenUrl: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600", logoUrl: null as string | null },
  { id: 4, nombre: "Burger Desierto",       categoria: "Burger",   barrio: "Ñuñoa",           emoji: "🍔", rating: 0, precio: "", isOpen: true, descripcion: "Smash burgers artesanales con ingredientes locales y salsas únicas.",              imagenUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600", logoUrl: null as string | null },
  { id: 5, nombre: "Verde Oasis",           categoria: "Vegano",   barrio: "Vitacura",        emoji: "🥗", rating: 0, precio: "", isOpen: true, descripcion: "Cocina plant-based de autor, menú cambiante según temporada.",                     imagenUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", logoUrl: null as string | null },
  { id: 6, nombre: "Café Arenas",           categoria: "Café",     barrio: "Bellavista",      emoji: "☕", rating: 0, precio: "", isOpen: true, descripcion: "Specialty coffee de origen, pastelería artesanal y ambiente íntimo.",              imagenUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600", logoUrl: null as string | null },
];

export default function LocalesSection() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [locales, setLocales] = useState(localesMock);

  useEffect(() => {
    fetch("/api/locales").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setLocales(data.slice(0, 6).map((l: any) => ({
          id: l.slug || l.id, nombre: l.nombre ?? "", categoria: l.categoria ?? "Otro",
          barrio: l.comuna ?? "Santiago", emoji: "🍽️",
          rating: l._count?.resenas > 0 ? 4.5 : 0, precio: "", isOpen: true,
          descripcion: l.descripcion ?? "",
          imagenUrl: l.portadaUrl ?? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
          logoUrl: l.logoUrl ?? null,
        })));
      }
    }).catch(() => {});
  }, []);

  const localesFiltrados = categoriaActiva === "Todos"
    ? locales
    : locales.filter(l => l.categoria === categoriaActiva);

  return (
    <section className="dc-loc-section" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--color-label)",
            marginBottom: "16px",
          }}>
            Explora Locales
          </p>
          <h2 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            fontWeight: 800, letterSpacing: "0.02em",
            color: "#f5d080",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "20px",
          }}>
            Descubre Dónde Comer
          </h2>
          <p className="section-description">
            Los mejores locales gastronómicos de Santiago.
          </p>
        </div>

        {/* Filtros */}
        <div className="dc-filters">
          {categorias.map(cat => {
            const isActive = categoriaActiva === cat;
            return (
              <button key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className="dc-filter-btn"
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.78rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  borderRadius: "30px",
                  border: isActive ? "1px solid var(--accent)" : "1px solid var(--border-color)",
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "var(--bg-primary)" : "var(--text-primary)",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 400,
                  whiteSpace: "nowrap",
                }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {localesFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ fontSize: "2rem", marginBottom: "12px" }}>🍽️</p>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.95rem", color: "var(--accent)", marginBottom: "6px" }}>Aún no hay locales de {categoriaActiva}</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>Estamos incorporando nuevos locales cada semana</p>
          </div>
        ) : (
        <div className="dc-loc-grid">
          {localesFiltrados.map(local => (
            <Link key={local.id} href={`/locales/${local.id}`} className="dc-loc-card" aria-label={`Ver local ${local.nombre}`} style={{
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: "20px",
              textDecoration: "none",
              display: "block",
            }}>
              <div style={{ height: "120px", overflow: "hidden", borderRadius: "20px 20px 0 0", flexShrink: 0, position: "relative" }}>
                <img src={local.imagenUrl} alt={local.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <BotonFavorito localId={String(local.id)} localData={{ categoria: local.categoria, comuna: local.barrio }} size="sm" style={{ position: "absolute", top: "8px", right: "8px", zIndex: 3 }} />
              </div>
              <div style={{ padding: local.descripcion ? "16px 20px 20px" : "16px 20px 16px" }}>
                {/* Header: logo + nombre + meta + rating */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: local.descripcion ? "10px" : "0" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                      background: local.logoUrl ? "transparent" : `hsl(${nameToHue(local.nombre)}, 38%, 26%)`,
                      border: local.logoUrl ? "2px solid rgba(232,168,76,0.3)" : `1px solid hsl(${nameToHue(local.nombre)}, 40%, 42%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.8rem",
                      color: `hsl(${nameToHue(local.nombre)}, 65%, 72%)`,
                      overflow: "hidden",
                    }}>
                      {local.logoUrl ? <img src={local.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : getInitials(local.nombre)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(0.9rem, 2.5vw, 1rem)", color: "#f5d080", lineHeight: 1.2, margin: 0 }}>{local.nombre}</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                        <span className="dc-comuna">{local.barrio}</span>
                        <span className="dc-sep">·</span>
                        <span className="dc-categoria">{local.categoria}</span>
                      </div>
                    </div>
                  </div>
                  {local.rating > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, paddingTop: "2px" }}>
                      <span style={{ color: "var(--accent)" }}>★</span>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--sand-gold, #f5d080)" }}>{local.rating.toFixed ? local.rating.toFixed(1) : local.rating}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: "13px", color: "rgba(240,234,214,0.28)", fontStyle: "italic", flexShrink: 0, paddingTop: "2px", fontFamily: "var(--font-lato)" }}>Sin reseñas</span>
                  )}
                </div>

                {/* Descripción */}
                {local.descripcion && <p style={{
                  fontFamily: "var(--font-lato)",
                  fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  fontWeight: 400,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                }}>{local.descripcion}</p>}
              </div>
            </Link>
          ))}
        </div>
        )}

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/locales" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--color-link)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(61,184,158,0.4)",
            paddingBottom: "4px",
          }}>
            Explorar todos los locales →
          </Link>
        </div>
      </div>

      <style>{`
        .dc-loc-section { padding: 100px 60px 80px; }

        .dc-filters {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 40px;
        }
        .dc-filter-btn {
          padding: 12px 22px;
          min-height: 44px;
        }

        .dc-loc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
          align-items: start;
        }

        .dc-loc-card {
          border: 1px solid var(--border-color);
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .dc-loc-card:hover {
          border-color: var(--accent);
        }

        .dc-comuna { font-family: var(--font-lato); font-size: 12px; color: rgba(240,234,214,0.4); font-weight: 400; }
        .dc-sep { font-size: 11px; color: rgba(240,234,214,0.2); }
        .dc-categoria { font-family: var(--font-lato); font-size: 12px; color: var(--oasis-bright, #3db89e); font-weight: 500; }

        @media (max-width: 767px) {
          .dc-loc-section { padding: 72px 20px 48px; }
          .dc-filters     { justify-content: flex-start; margin-bottom: 28px; overflow-x: auto; flex-wrap: nowrap; scrollbar-width: none; -ms-overflow-style: none; }
          .dc-filters::-webkit-scrollbar { display: none; }
          .dc-filter-btn  { padding: 10px 18px; font-size: 0.65rem !important; flex-shrink: 0; }
          .dc-loc-grid    { display: flex !important; flex-direction: row; overflow-x: auto; gap: 12px; padding-bottom: 8px; scrollbar-width: none; -ms-overflow-style: none; }
          .dc-loc-grid::-webkit-scrollbar { display: none; }
          .dc-loc-card    { flex-shrink: 0; width: 280px; }
          .dc-loc-card p  { font-size: 0.95rem !important; line-height: 1.7 !important; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-loc-section { padding: 56px 40px 28px; }
          .dc-loc-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
}
