"use client";
import { useState } from "react";
import Link from "next/link";

const categorias = ["Todos", "Pizza", "Sushi", "Almuerzo", "Burger", "Vegano", "Café"];

const localesMock = [
  { id: 1, nombre: "Pizza Napoli",          categoria: "Pizza",    barrio: "Providencia",     emoji: "🍕", rating: 4.8, precio: "$$$",  isOpen: true,  descripcion: "La mejor pizza napolitana de Santiago, horno de leña importado de Italia." },
  { id: 2, nombre: "Sushi Oasis",           categoria: "Sushi",    barrio: "Las Condes",      emoji: "🍣", rating: 4.9, precio: "$$$$", isOpen: true,  descripcion: "Omakase y rolls creativos con ingredientes del Pacífico." },
  { id: 3, nombre: "El Menú de Don Carlos", categoria: "Almuerzo", barrio: "Santiago Centro", emoji: "🍲", rating: 4.7, precio: "$",    isOpen: true,  descripcion: "Cocina casera chilena, almuerzo completo con sabor de abuela." },
  { id: 4, nombre: "Burger Desierto",       categoria: "Burger",   barrio: "Ñuñoa",           emoji: "🍔", rating: 4.6, precio: "$$",   isOpen: false, descripcion: "Smash burgers artesanales con ingredientes locales y salsas únicas." },
  { id: 5, nombre: "Verde Oasis",           categoria: "Vegano",   barrio: "Vitacura",        emoji: "🥗", rating: 4.5, precio: "$$",   isOpen: false, descripcion: "Cocina plant-based de autor, menú cambiante según temporada." },
  { id: 6, nombre: "Café Arenas",           categoria: "Café",     barrio: "Bellavista",      emoji: "☕", rating: 4.7, precio: "$",    isOpen: true,  descripcion: "Specialty coffee de origen, pastelería artesanal y ambiente íntimo." },
];

export default function LocalesSection() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");

  const localesFiltrados = categoriaActiva === "Todos"
    ? localesMock
    : localesMock.filter(l => l.categoria === categoriaActiva);

  return (
    <section className="dc-loc-section" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "48px" }}>
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
            <div key={local.id} className="dc-loc-card" style={{
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "20px",
            }}>
              {/* Línea 1: emoji + nombre */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <span style={{ fontSize: "2rem", flexShrink: 0, lineHeight: 1 }}>{local.emoji}</span>
                <h3 style={{
                  fontFamily: "var(--font-cinzel-decorative)",
                  fontSize: "1rem",
                  color: "var(--accent)",
                  lineHeight: 1.2,
                  minWidth: 0,
                }}>{local.nombre}</h3>
              </div>

              {/* Línea 2: pin + barrio / precio */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{
                  fontFamily: "var(--font-lato)",
                  fontSize: "0.8rem",
                  color: "var(--oasis-bright)",
                }}>📍 {local.barrio}</span>
                <span style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  letterSpacing: "0.05em",
                }}>{local.precio}</span>
              </div>

              {/* Línea 3: descripción */}
              <p style={{
                fontFamily: "var(--font-lato)",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                lineHeight: 1.55,
                fontWeight: 300,
                marginBottom: "18px",
              }}>{local.descripcion}</p>

              {/* Línea 4: footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  background: "rgba(0,0,0,0.2)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  border: "1px solid var(--border-color)",
                }}>{local.categoria}</span>

                <span style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: local.isOpen ? "#3db89e" : "#ff6b6b",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}>
                  <span style={{
                    width: "6px", height: "6px", borderRadius: "50%",
                    background: local.isOpen ? "#3db89e" : "#ff6b6b",
                    display: "inline-block",
                    flexShrink: 0,
                  }} />
                  {local.isOpen ? "Abierto" : "Cerrado"}
                </span>

                <span style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.75rem",
                  color: "var(--accent)",
                }}>⭐ {local.rating}</span>
              </div>

              {/* Hover: Ver local */}
              <Link href={`/locales/${local.id}`} className="dc-loc-hover-btn">
                Ver local →
              </Link>
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
        .dc-loc-section { padding: 72px 60px; }

        .dc-filters {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 48px;
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

        .dc-loc-card {
          border: 1px solid var(--border-color);
          padding: 24px 24px 20px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease;
          cursor: pointer;
        }
        .dc-loc-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
        }

        .dc-loc-hover-btn {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          transform: translateY(100%);
          transition: transform 0.25s ease;
          padding: 14px 24px;
          text-align: center;
          background: linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright));
          color: var(--bg-primary);
          font-family: var(--font-cinzel);
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
        }
        .dc-loc-card:hover .dc-loc-hover-btn {
          transform: translateY(0);
        }

        @media (max-width: 767px) {
          .dc-loc-section { padding: 72px 20px; }
          .dc-filters     { justify-content: flex-start; flex-wrap: wrap; margin-bottom: 32px; }
          .dc-filter-btn  { padding: 10px 18px; font-size: 0.65rem !important; }
          .dc-loc-grid    { grid-template-columns: 1fr; gap: 14px; }
          .dc-loc-hover-btn { position: static; transform: none !important; margin-top: 16px; border-radius: 10px; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-loc-section { padding: 60px 40px; }
          .dc-loc-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
}
