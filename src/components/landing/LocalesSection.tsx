"use client";
import { useState } from "react";

const categorias = ["Todos", "Pizza", "Sushi", "Almuerzo", "Burger", "Vegano", "Café"];

const localesMock = [
  { id: 1, nombre: "Pizza Napoli",          categoria: "Pizza",    barrio: "Providencia",     emoji: "🍕", rating: 4.8, concursoActivo: true,  descripcion: "La mejor pizza napolitana de Santiago, horno de leña importado de Italia." },
  { id: 2, nombre: "Sushi Oasis",           categoria: "Sushi",    barrio: "Las Condes",      emoji: "🍣", rating: 4.9, concursoActivo: true,  descripcion: "Omakase y rolls creativos con ingredientes del Pacífico." },
  { id: 3, nombre: "El Menú de Don Carlos", categoria: "Almuerzo", barrio: "Santiago Centro", emoji: "🍲", rating: 4.7, concursoActivo: true,  descripcion: "Cocina casera chilena, almuerzo completo con sabor de abuela." },
  { id: 4, nombre: "Burger Desierto",       categoria: "Burger",   barrio: "Ñuñoa",           emoji: "🍔", rating: 4.6, concursoActivo: false, descripcion: "Smash burgers artesanales con ingredientes locales y salsas únicas." },
  { id: 5, nombre: "Verde Oasis",           categoria: "Vegano",   barrio: "Vitacura",        emoji: "🥗", rating: 4.5, concursoActivo: false, descripcion: "Cocina plant-based de autor, menú cambiante según temporada." },
  { id: 6, nombre: "Café Arenas",           categoria: "Café",     barrio: "Bellavista",      emoji: "☕", rating: 4.7, concursoActivo: false, descripcion: "Specialty coffee de origen, pastelería artesanal y ambiente íntimo." },
];

export default function LocalesSection() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");

  const localesFiltrados = categoriaActiva === "Todos"
    ? localesMock
    : localesMock.filter(l => l.categoria === categoriaActiva);

  return (
    <section className="dc-loc-section" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.7rem",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--oasis-bright)",
            marginBottom: "16px",
          }}>
            Explorador de Locales
          </p>
          <h2 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            color: "var(--accent)",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "20px",
          }}>
            Descubre Dónde Comer 🗺️
          </h2>
          <p style={{
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            color: "var(--text-primary)",
            fontWeight: 300,
            maxWidth: "500px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            Los mejores locales gastronómicos de Santiago, curados y verificados.
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
                  fontSize: "0.7rem",
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
        <div className="dc-loc-grid">
          {localesFiltrados.map(local => (
            <div key={local.id}
              className="dc-loc-card"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(-4px)";
                el.style.setProperty("border-color", "var(--accent)");
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(0)";
                el.style.setProperty("border-color", "var(--border-color)");
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                  <span style={{ fontSize: "2.5rem", flexShrink: 0 }}>{local.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-cinzel-decorative)",
                      fontSize: "1rem",
                      color: "var(--accent)",
                      marginBottom: "4px",
                    }}>{local.nombre}</p>
                    <p style={{
                      fontFamily: "var(--font-lato)",
                      fontSize: "0.8rem",
                      color: "var(--oasis-bright)",
                    }}>📍 {local.barrio}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: "8px" }}>
                  <p style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.9rem",
                    color: "var(--accent)",
                  }}>⭐ {local.rating}</p>
                  {local.concursoActivo && (
                    <span style={{
                      display: "inline-block",
                      marginTop: "4px",
                      fontFamily: "var(--font-lato)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      background: "rgba(61,184,158,0.12)",
                      color: "var(--oasis-bright)",
                      padding: "3px 10px",
                      borderRadius: "20px",
                      border: "1px solid rgba(61,184,158,0.3)",
                      whiteSpace: "nowrap",
                    }}>
                      🎪 Activo
                    </span>
                  )}
                </div>
              </div>

              <p style={{
                fontFamily: "var(--font-lato)",
                fontSize: "0.9rem",
                color: "var(--text-primary)",
                lineHeight: 1.6,
                fontWeight: 300,
                marginBottom: "20px",
              }}>
                {local.descripcion}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  background: "rgba(0,0,0,0.2)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  border: "1px solid var(--border-color)",
                }}>
                  {local.categoria}
                </span>
                <a href={`/locales/${local.id}`} style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  color: "var(--oasis-bright)",
                  textDecoration: "none",
                  paddingLeft: "12px",
                  whiteSpace: "nowrap",
                }}>
                  Ver local →
                </a>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <a href="/locales" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.8rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--oasis-bright)",
            textDecoration: "none",
            borderBottom: "1px solid rgba(61,184,158,0.4)",
            paddingBottom: "4px",
          }}>
            Explorar todos los locales →
          </a>
        </div>
      </div>

      <style>{`
        .dc-loc-section { padding: 120px 60px; }

        .dc-filters {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 60px;
        }
        .dc-filter-btn {
          padding: 12px 22px;
          min-height: 44px;
        }

        .dc-loc-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }
        .dc-loc-card { padding: 28px; }

        @media (max-width: 767px) {
          .dc-loc-section { padding: 72px 20px; }
          .dc-filters     { justify-content: flex-start; flex-wrap: wrap; margin-bottom: 40px; }
          .dc-filter-btn  { padding: 10px 18px; font-size: 0.65rem !important; }
          .dc-loc-grid    { grid-template-columns: 1fr; gap: 14px; }
          .dc-loc-card    { padding: 20px; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-loc-section { padding: 100px 40px; }
          .dc-loc-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
}
