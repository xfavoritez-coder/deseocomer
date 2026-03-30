"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const categorias = ["Todos", "Pizza", "Sushi", "Almuerzo", "Burger", "Vegano", "Café", "Italiano", "Mexicano"];

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
  { id: 1,  nombre: "Pizza Napoli",          categoria: "Pizza",    barrio: "Providencia",     emoji: "🍕", rating: 4.8, precio: "$$$",  isOpen: true,  imagenUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600", descripcion: "La mejor pizza napolitana de Santiago, horno de leña importado de Italia." },
  { id: 2,  nombre: "Sushi Oasis",           categoria: "Sushi",    barrio: "Las Condes",      emoji: "🍣", rating: 4.9, precio: "$$$$", isOpen: true,  imagenUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600", descripcion: "Omakase y rolls creativos con ingredientes del Pacífico." },
  { id: 3,  nombre: "El Menú de Don Carlos", categoria: "Almuerzo", barrio: "Santiago Centro", emoji: "🍲", rating: 4.7, precio: "$",    isOpen: true,  imagenUrl: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600", descripcion: "Cocina casera chilena, almuerzo completo con sabor de abuela." },
  { id: 4,  nombre: "Burger Desierto",       categoria: "Burger",   barrio: "Ñuñoa",           emoji: "🍔", rating: 4.6, precio: "$$",   isOpen: false, imagenUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600", descripcion: "Smash burgers artesanales con ingredientes locales y salsas únicas." },
  { id: 5,  nombre: "Verde Oasis",           categoria: "Vegano",   barrio: "Vitacura",        emoji: "🥗", rating: 4.5, precio: "$$",   isOpen: false, imagenUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", descripcion: "Cocina plant-based de autor, menú cambiante según temporada." },
  { id: 6,  nombre: "Café Arenas",           categoria: "Café",     barrio: "Bellavista",      emoji: "☕", rating: 4.7, precio: "$",    isOpen: true,  imagenUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600", descripcion: "Specialty coffee de origen, pastelería artesanal y ambiente íntimo." },
  { id: 7,  nombre: "La Trattoria",          categoria: "Italiano", barrio: "Lastarria",       emoji: "🍝", rating: 4.6, precio: "$$$",  isOpen: true,  imagenUrl: "https://images.unsplash.com/photo-1551183053-bf91798d96f4?w=600", descripcion: "Pastas frescas artesanales y risotto al estilo de la nonna en pleno Lastarria." },
  { id: 8,  nombre: "Taquería del Desierto", categoria: "Mexicano", barrio: "Ñuñoa",           emoji: "🌮", rating: 4.4, precio: "$$",   isOpen: true,  imagenUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600", descripcion: "Tacos al pastor auténticos, mezcal artesanal y ambiente festivo." },
  { id: 9,  nombre: "Ramen Noche",           categoria: "Sushi",    barrio: "Providencia",     emoji: "🍜", rating: 4.8, precio: "$$",   isOpen: false, imagenUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600", descripcion: "Ramen tonkotsu cocido 18 horas, gyozas caseras y sake importado." },
  { id: 10, nombre: "Parrilla del Sur",      categoria: "Almuerzo", barrio: "Maipú",           emoji: "🥩", rating: 4.5, precio: "$$",   isOpen: true,  imagenUrl: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600", descripcion: "Cortes premium a las brasas, chimichurri secreto de la casa." },
  { id: 11, nombre: "Vegan Garden",          categoria: "Vegano",   barrio: "Providencia",     emoji: "🌱", rating: 4.3, precio: "$",    isOpen: true,  imagenUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600", descripcion: "Bowl therapy, wraps energéticos y jugos cold press." },
  { id: 12, nombre: "Espresso Duna",         categoria: "Café",     barrio: "Las Condes",      emoji: "☕", rating: 4.6, precio: "$",    isOpen: false, imagenUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600", descripcion: "Café de especialidad de origen único, té de autor y cheesecake de temporada." },
];

export default function LocalesPage() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [localesData, setLocalesData] = useState(localesMock);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/locales").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = data.map((l: any) => ({
          id: l.id, nombre: l.nombre ?? "", categoria: l.categoria ?? "Otro",
          barrio: l.comuna ?? l.ciudad ?? "Santiago", emoji: "🍽️",
          rating: 4.5, precio: "$$", isOpen: true,
          imagenUrl: l.portadaUrl ?? "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
          descripcion: l.descripcion ?? "",
        }));
        setLocalesData([...mapped, ...localesMock]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const localesFiltrados = localesData.filter(l => {
    const matchCat  = categoriaActiva === "Todos" || l.categoria === categoriaActiva;
    const matchBusc = busqueda.trim() === "" ||
      l.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.barrio.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusc;
  });

  return (
    <main style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", paddingTop: "80px" }}>
      <div className="dc-lp-wrap">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--oasis-bright)",
            marginBottom: "16px",
          }}>
            Explorador de Locales
          </p>
          <h1 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            color: "var(--accent)",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "20px",
          }}>
            Todos los Locales 🗺️
          </h1>
          <p style={{
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
            color: "var(--text-primary)",
            fontWeight: 300,
            maxWidth: "500px",
            margin: "0 auto",
            lineHeight: 1.8,
          }}>
            Los mejores locales gastronómicos de Santiago, curados y verificados.
          </p>
        </div>

        {/* Buscador */}
        <div style={{ maxWidth: "480px", margin: "0 auto 28px" }}>
          <input
            type="text"
            placeholder="Buscar local o barrio..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: "100%",
              fontFamily: "var(--font-lato)",
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
              color: "var(--text-primary)",
              background: "#1a1008",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "14px 20px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filtros */}
        <div className="dc-lp-filters">
          {categorias.map(cat => {
            const isActive = categoriaActiva === cat;
            return (
              <button key={cat}
                onClick={() => setCategoriaActiva(cat)}
                style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  borderRadius: "30px",
                  border: isActive ? "1px solid var(--accent)" : "1px solid var(--border-color)",
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "var(--bg-primary)" : "var(--text-primary)",
                  cursor: "pointer",
                  fontWeight: isActive ? 700 : 400,
                  whiteSpace: "nowrap",
                  padding: "10px 20px",
                  minHeight: "44px",
                }}>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Contador */}
        <p style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: "clamp(0.7rem, 2vw, 0.8rem)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "28px",
        }}>
          {localesFiltrados.length} local{localesFiltrados.length !== 1 ? "es" : ""} encontrado{localesFiltrados.length !== 1 ? "s" : ""}
        </p>

        {/* Grid */}
        {localesFiltrados.length > 0 ? (
          <div className="dc-lp-grid">
            {localesFiltrados.map(local => (
              <Link key={local.id} href={`/locales/${local.id}`} className="dc-lp-card" style={{
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "20px",
                textDecoration: "none",
                display: "block",
                overflow: "hidden",
              }}>
                {local.imagenUrl && (
                  <div style={{ height: "120px", overflow: "hidden", flexShrink: 0 }}>
                    <img src={local.imagenUrl} alt={local.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                )}
                <div style={{ padding: "20px 24px 24px" }}>
                {/* Línea 1: initials + nombre */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "50%", flexShrink: 0,
                    background: `hsl(${nameToHue(local.nombre)}, 38%, 26%)`,
                    border: `1px solid hsl(${nameToHue(local.nombre)}, 40%, 42%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem",
                    color: `hsl(${nameToHue(local.nombre)}, 65%, 72%)`,
                  }}>
                    {getInitials(local.nombre)}
                  </div>
                  <h2 style={{
                    fontFamily: "var(--font-cinzel-decorative)",
                    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                    color: "var(--accent)",
                    lineHeight: 1.2,
                    minWidth: 0,
                  }}>{local.nombre}</h2>
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
                  fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
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
                    <span className="dc-lp-arrow">→</span>
                  </span>
                </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🏜️</div>
            <p style={{
              fontFamily: "var(--font-cinzel-decorative)",
              fontSize: "1.1rem",
              color: "var(--accent)",
              marginBottom: "8px",
            }}>Sin resultados</p>
            <p style={{
              fontFamily: "var(--font-lato)",
              fontSize: "0.9rem",
              color: "var(--text-muted)",
            }}>Prueba con otro término o categoría</p>
          </div>
        )}
      </div>

      <style>{`
        .dc-lp-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 60px 80px;
        }
        .dc-lp-filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .dc-lp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }
        .dc-lp-card {
          border: 1px solid var(--border-color);
          padding: 0;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .dc-lp-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
        }
        .dc-lp-arrow {
          color: var(--accent);
          font-size: 1rem;
          display: inline-block;
          transition: transform 0.2s ease;
          opacity: 0.7;
        }
        .dc-lp-card:hover .dc-lp-arrow {
          transform: translateX(5px);
          opacity: 1;
        }

        @media (max-width: 767px) {
          .dc-lp-wrap    { padding: 40px 20px 60px; }
          .dc-lp-filters { gap: 8px; }
          .dc-lp-grid    { grid-template-columns: 1fr; gap: 14px; }
          .dc-lp-card p  { font-size: 0.95rem !important; line-height: 1.7 !important; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-lp-wrap { padding: 48px 40px 60px; }
          .dc-lp-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </main>
  );
}
