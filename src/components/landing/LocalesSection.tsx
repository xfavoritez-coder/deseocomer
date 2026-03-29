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

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
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
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            color: "var(--accent)",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "20px",
          }}>
            Descubre Dónde Comer 🗺️
          </h2>
          <p style={{
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(1rem, 2vw, 1.1rem)",
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
            <Link key={local.id} href={`/locales/${local.id}`} className="dc-loc-card" style={{
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "20px",
              textDecoration: "none",
              display: "block",
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
                fontSize: "0.95rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
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
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  ⭐ {local.rating}
                  <span className="dc-loc-arrow">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link href="/locales" style={{
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
          </Link>
        </div>
      </div>

      <style>{`
        .dc-loc-section { padding: 64px 60px 32px; }

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
        }

        .dc-loc-card {
          border: 1px solid var(--border-color);
          padding: 24px;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .dc-loc-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
        }

        .dc-loc-arrow {
          color: var(--accent);
          font-size: 1rem;
          display: inline-block;
          transition: transform 0.2s ease;
          opacity: 0.7;
        }
        .dc-loc-card:hover .dc-loc-arrow {
          transform: translateX(5px);
          opacity: 1;
        }

        @media (max-width: 767px) {
          .dc-loc-section { padding: 48px 20px 24px; }
          .dc-filters     { justify-content: flex-start; margin-bottom: 28px; }
          .dc-filter-btn  { padding: 10px 18px; font-size: 0.65rem !important; }
          .dc-loc-grid    { grid-template-columns: 1fr; gap: 14px; }
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
