"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  PROMOCIONES,
  COMUNAS_SANTIAGO,
  TIPO_ICONS,
  TIPO_LABELS,
  CATEGORIA_LABELS,
  DIAS_SHORT,
  pad2,
  isPromocionActivaAhora,
  terminaEnMenos2Horas,
  getTimerHastaFin,
  type Promocion,
  type TipoPromocion,
  type CategoriaPromocion,
  type RangoPrecio,
} from "@/lib/mockPromociones";

// ─── Timer per promotion ─────────────────────────────────────────────────────

interface TimerState {
  horas: number;
  minutos: number;
  segundos: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PromocionesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Filters
  const [busqueda, setBusqueda]               = useState("");
  const [tipoFiltro, setTipoFiltro]           = useState<TipoPromocion | "todos">("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaPromocion | "todos">("todos");
  const [comunaFiltro, setComunaFiltro]       = useState<string>("todas");
  const [precioFiltro, setPrecioFiltro]       = useState<RangoPrecio>("todos");
  const [soloActivasAhora, setSoloActivasAhora] = useState(false);
  const [panelAbierto, setPanelAbierto]       = useState(false);
  const panelRef                              = useRef<HTMLDivElement>(null);

  // Count non-default filters for the badge (excluding soloActivasAhora which is always visible)
  const filtrosActivos = [
    tipoFiltro !== "todos",
    categoriaFiltro !== "todos",
    comunaFiltro !== "todas",
    precioFiltro !== "todos",
  ].filter(Boolean).length;

  const limpiarFiltros = () => {
    setTipoFiltro("todos");
    setCategoriaFiltro("todos");
    setComunaFiltro("todas");
    setPrecioFiltro("todos");
  };

  // Timers map
  const [timers, setTimers] = useState<Record<number, TimerState>>({});
  const [activasAhora, setActivasAhora] = useState(0);

  const updateTimers = useCallback(() => {
    const next: Record<number, TimerState> = {};
    let activas = 0;
    for (const p of PROMOCIONES) {
      if (isPromocionActivaAhora(p)) {
        next[p.id] = getTimerHastaFin(p);
        activas++;
      }
    }
    setTimers(next);
    setActivasAhora(activas);
  }, []);

  useEffect(() => {
    setMounted(true);
    updateTimers();
    const id = setInterval(updateTimers, 1000);
    return () => clearInterval(id);
  }, [updateTimers]);

  // Close panel on outside click
  useEffect(() => {
    if (!panelAbierto) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelAbierto(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelAbierto]);

  // Filtering
  const q = busqueda.trim().toLowerCase();
  const filtered = PROMOCIONES.filter((p) => {
    if (!p.activa) return false;
    if (q && !p.titulo.toLowerCase().includes(q) && !p.local.toLowerCase().includes(q) && !p.descripcion.toLowerCase().includes(q)) return false;
    if (tipoFiltro !== "todos" && p.tipo !== tipoFiltro) return false;
    if (categoriaFiltro !== "todos" && p.categoria !== categoriaFiltro) return false;
    if (comunaFiltro !== "todas" && p.comuna !== comunaFiltro) return false;
    if (soloActivasAhora && !isPromocionActivaAhora(p)) return false;
    if (precioFiltro !== "todos") {
      const precio = p.precioDescuento ?? p.precioOriginal ?? 0;
      if (precioFiltro === "0-3000" && precio > 3000) return false;
      if (precioFiltro === "3000-6000" && (precio < 3000 || precio > 6000)) return false;
      if (precioFiltro === "6000+" && precio < 6000) return false;
    }
    return true;
  });

  const tiposPromocion: Array<{ key: TipoPromocion | "todos"; label: string; icon?: string }> = [
    { key: "todos",          label: "Todos los tipos" },
    { key: "happy_hour",     label: "Happy Hour",      icon: "⚡" },
    { key: "descuento",      label: "Descuento %",     icon: "🏷️" },
    { key: "2x1",            label: "2x1",             icon: "🔁" },
    { key: "cupon",          label: "Cupón",           icon: "🎟️" },
    { key: "precio_especial", label: "Precio Especial", icon: "⭐" },
  ];

  const categorias: Array<{ key: CategoriaPromocion | "todos"; label: string }> = [
    { key: "todos",    label: "Todas" },
    { key: "almuerzo", label: "🥗 Almuerzo" },
    { key: "cena",     label: "🌙 Cena" },
    { key: "desayuno", label: "🌅 Desayuno" },
    { key: "bebidas",  label: "🍺 Bebidas" },
    { key: "postres",  label: "🍰 Postres" },
  ];

  const rangosPrecios: Array<{ key: RangoPrecio; label: string }> = [
    { key: "todos",    label: "Cualquier precio" },
    { key: "0-3000",   label: "Hasta $3.000" },
    { key: "3000-6000", label: "$3.000 – $6.000" },
    { key: "6000+",    label: "$6.000+" },
  ];

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="dc-promo-hero">
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 65%)",
        }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--oasis-bright)",
            marginBottom: "14px",
          }}>
            Ofertas exclusivas
          </p>
          <h1 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            color: "var(--accent)",
            textShadow: "0 0 60px color-mix(in srgb, var(--accent) 50%, transparent)",
            marginBottom: "20px",
            lineHeight: 1.1,
          }}>
            Promociones de Hoy 🏷️
          </h1>
          <p style={{
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
            color: "var(--text-primary)",
            fontWeight: 300,
            maxWidth: "540px",
            margin: "0 auto 40px",
            lineHeight: 1.8,
          }}>
            Descuentos reales, happy hours y cupones exclusivos en los mejores locales de Santiago. Activos ahora mismo.
          </p>

          {/* Stats */}
          <div className="dc-promo-hero-stats">
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontFamily: "var(--font-cinzel-decorative)",
                fontSize: "2.2rem",
                color: "var(--accent)",
                lineHeight: 1,
              }}>
                {PROMOCIONES.filter(p => p.activa).length}
              </p>
              <p style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}>
                Promociones activas
              </p>
            </div>
            <div style={{ width: "1px", background: "var(--border-color)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontFamily: "var(--font-cinzel-decorative)",
                fontSize: "2.2rem",
                color: mounted ? "#d4a017" : "var(--accent)",
                lineHeight: 1,
              }}>
                {mounted ? activasAhora : "—"}
              </p>
              <p style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}>
                Activas ahora mismo
              </p>
            </div>
            <div style={{ width: "1px", background: "var(--border-color)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{
                fontFamily: "var(--font-cinzel-decorative)",
                fontSize: "2.2rem",
                color: "var(--oasis-bright)",
                lineHeight: 1,
              }}>
                {PROMOCIONES.filter(p => p.tipo === "happy_hour").length}
              </p>
              <p style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}>
                Happy Hours hoy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filters bar ────────────────────────────────────────────────── */}
      <section className="dc-promo-filters-section">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

          {/* Single bar */}
          <div className="dc-promo-bar">

            {/* Search */}
            <div className="dc-promo-search-wrap">
              <span className="dc-promo-search-icon">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por local, plato, descuento..."
                className="dc-promo-search"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="dc-promo-search-clear"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Toggle always visible */}
            <button
              onClick={() => setSoloActivasAhora(v => !v)}
              className={`dc-promo-toggle${soloActivasAhora ? " dc-promo-toggle--on" : ""}`}
            >
              <span className={`dc-promo-toggle-track${soloActivasAhora ? " dc-promo-toggle-track--on" : ""}`}>
                <span className={`dc-promo-toggle-thumb${soloActivasAhora ? " dc-promo-toggle-thumb--on" : ""}`} />
              </span>
              <span className="dc-promo-toggle-label">⚡ Activas ahora</span>
            </button>

            {/* Filters button + dropdown */}
            <div style={{ position: "relative" }} ref={panelRef}>
              <button
                onClick={() => setPanelAbierto(v => !v)}
                className={`dc-promo-filtros-btn${panelAbierto ? " dc-promo-filtros-btn--open" : ""}${filtrosActivos > 0 ? " dc-promo-filtros-btn--active" : ""}`}
              >
                {/* Sliders icon */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="5" cy="4" r="1.5" fill="currentColor"/>
                  <circle cx="11" cy="8" r="1.5" fill="currentColor"/>
                  <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
                </svg>
                Filtros
                {filtrosActivos > 0 && (
                  <span className="dc-promo-badge">{filtrosActivos}</span>
                )}
              </button>

              {/* Dropdown panel */}
              {panelAbierto && (
                <div className="dc-promo-panel">
                  {/* Panel header */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                  }}>
                    <p style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: "var(--accent)",
                    }}>
                      Filtros
                    </p>
                    {filtrosActivos > 0 && (
                      <button
                        onClick={limpiarFiltros}
                        style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.58rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "20px",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#ff8080"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                      >
                        Limpiar todo
                      </button>
                    )}
                  </div>

                  {/* Tipo */}
                  <div className="dc-promo-panel-group">
                    <p className="dc-promo-panel-label">Tipo de promoción</p>
                    <div className="dc-promo-panel-pills">
                      {tiposPromocion.map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setTipoFiltro(t.key as TipoPromocion | "todos")}
                          className={`dc-promo-pill${tipoFiltro === t.key ? " dc-promo-pill--active" : ""}`}
                          style={tipoFiltro === t.key && t.key === "happy_hour" ? {
                            background: "linear-gradient(135deg, #c8850a, #d4a017)",
                            borderColor: "#d4a017",
                            color: "#07040f",
                          } : undefined}
                        >
                          {t.icon && <span>{t.icon}</span>}
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Categoría */}
                  <div className="dc-promo-panel-group">
                    <p className="dc-promo-panel-label">Categoría</p>
                    <div className="dc-promo-panel-pills">
                      {categorias.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => setCategoriaFiltro(c.key as CategoriaPromocion | "todos")}
                          className={`dc-promo-pill${categoriaFiltro === c.key ? " dc-promo-pill--active" : ""}`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comuna */}
                  <div className="dc-promo-panel-group">
                    <p className="dc-promo-panel-label">Comuna</p>
                    <select
                      value={comunaFiltro}
                      onChange={(e) => setComunaFiltro(e.target.value)}
                      className="dc-promo-select"
                      style={{ width: "100%" }}
                    >
                      <option value="todas">Todas las comunas</option>
                      {COMUNAS_SANTIAGO.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Precio */}
                  <div className="dc-promo-panel-group" style={{ marginBottom: 0 }}>
                    <p className="dc-promo-panel-label">Precio máximo</p>
                    <div className="dc-promo-panel-pills">
                      {rangosPrecios.map((r) => (
                        <button
                          key={r.key}
                          onClick={() => setPrecioFiltro(r.key)}
                          className={`dc-promo-pill${precioFiltro === r.key ? " dc-promo-pill--active" : ""}`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Result count + active chips */}
          <div className="dc-promo-bar-meta">
            <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {filtered.length === 0
                ? "Sin resultados"
                : `${filtered.length} promoción${filtered.length !== 1 ? "es" : ""}`
              }
            </span>
            {/* Active filter chips */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {tipoFiltro !== "todos" && (
                <span className="dc-promo-chip" onClick={() => setTipoFiltro("todos")}>
                  {TIPO_ICONS[tipoFiltro as TipoPromocion]} {TIPO_LABELS[tipoFiltro as TipoPromocion]} ✕
                </span>
              )}
              {categoriaFiltro !== "todos" && (
                <span className="dc-promo-chip" onClick={() => setCategoriaFiltro("todos")}>
                  {CATEGORIA_LABELS[categoriaFiltro as CategoriaPromocion]} ✕
                </span>
              )}
              {comunaFiltro !== "todas" && (
                <span className="dc-promo-chip" onClick={() => setComunaFiltro("todas")}>
                  📍 {comunaFiltro} ✕
                </span>
              )}
              {precioFiltro !== "todos" && (
                <span className="dc-promo-chip" onClick={() => setPrecioFiltro("todos")}>
                  💰 {precioFiltro === "0-3000" ? "Hasta $3.000" : precioFiltro === "3000-6000" ? "$3.000–$6.000" : "$6.000+"} ✕
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Grid ───────────────────────────────────────────────────────── */}
      <section className="dc-promo-grid-section">
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "80px 20px",
              color: "var(--text-muted)",
            }}>
              <p style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</p>
              <p style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "1rem",
                letterSpacing: "0.1em",
                color: "var(--text-primary)",
              }}>
                Sin promociones con estos filtros
              </p>
              <p style={{ fontFamily: "var(--font-lato)", marginTop: "8px" }}>
                Prueba cambiando los filtros o desactiva "Solo activas ahora"
              </p>
            </div>
          ) : (
            <div className="dc-promo-grid">
              {filtered.map((promo) => (
                <PromoCard
                  key={promo.id}
                  promo={promo}
                  timer={timers[promo.id]}
                  isActiva={mounted ? isPromocionActivaAhora(promo) : false}
                  isUltimasHoras={mounted ? terminaEnMenos2Horas(promo) : false}
                  onVerPromocion={() => router.push(`/promociones/${promo.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      <style>{`
        /* Hero */
        .dc-promo-hero {
          position: relative;
          padding: 160px 60px 80px;
          overflow: hidden;
        }
        .dc-promo-hero-stats {
          display: inline-flex;
          gap: 48px;
          align-items: center;
          background: rgba(0,0,0,0.3);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 28px 48px;
        }

        /* Filters section */
        .dc-promo-filters-section {
          padding: 0 60px 24px;
          border-bottom: 1px solid var(--border-color);
        }

        /* Single bar */
        .dc-promo-bar {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 20px 0 16px;
        }

        /* Search */
        .dc-promo-search-wrap {
          position: relative;
          flex: 1;
          min-width: 0;
        }
        .dc-promo-search-icon {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          display: flex; align-items: center;
          pointer-events: none;
        }
        .dc-promo-search {
          width: 100%;
          font-family: var(--font-lato);
          font-size: 0.88rem;
          color: var(--text-primary);
          background: color-mix(in srgb, var(--bg-secondary) 80%, transparent);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 11px 36px 11px 40px;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
        }
        .dc-promo-search::placeholder { color: var(--text-muted); }
        .dc-promo-search:focus {
          border-color: var(--accent);
          background: var(--bg-secondary);
        }
        .dc-promo-search-clear {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: var(--text-muted); cursor: pointer;
          font-size: 0.75rem; padding: 4px;
          line-height: 1; transition: color 0.15s;
        }
        .dc-promo-search-clear:hover { color: var(--text-primary); }

        /* Toggle (iOS-style switch) */
        .dc-promo-toggle {
          display: flex;
          align-items: center;
          gap: 9px;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 30px;
          padding: 9px 16px 9px 10px;
          cursor: pointer;
          transition: border-color 0.25s, background 0.25s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .dc-promo-toggle--on {
          border-color: rgba(212,160,23,0.6);
          background: rgba(212,160,23,0.08);
        }
        .dc-promo-toggle-track {
          width: 32px; height: 18px;
          border-radius: 9px;
          background: color-mix(in srgb, var(--border-color) 80%, transparent);
          border: 1px solid var(--border-color);
          position: relative;
          flex-shrink: 0;
          transition: background 0.25s, border-color 0.25s;
        }
        .dc-promo-toggle-track--on {
          background: rgba(212,160,23,0.35);
          border-color: rgba(212,160,23,0.5);
        }
        .dc-promo-toggle-thumb {
          position: absolute;
          top: 2px; left: 2px;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: var(--text-muted);
          transition: transform 0.25s ease, background 0.25s;
        }
        .dc-promo-toggle-thumb--on {
          transform: translateX(14px);
          background: #d4a017;
          box-shadow: 0 0 8px rgba(212,160,23,0.7);
        }
        .dc-promo-toggle-label {
          font-family: var(--font-cinzel);
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-primary);
        }

        /* Filters button */
        .dc-promo-filtros-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-cinzel);
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .dc-promo-filtros-btn:hover,
        .dc-promo-filtros-btn--open {
          border-color: var(--accent);
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 8%, transparent);
        }
        .dc-promo-filtros-btn--active {
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Badge on filters button */
        .dc-promo-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--accent);
          color: var(--bg-primary);
          font-size: 0.6rem;
          font-weight: 700;
          line-height: 1;
        }

        /* Dropdown panel */
        .dc-promo-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          background: color-mix(in srgb, var(--bg-secondary) 97%, black);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 16px 60px rgba(0,0,0,0.5);
          z-index: 50;
          animation: dc-promo-panel-in 0.18s ease;
        }
        @keyframes dc-promo-panel-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dc-promo-panel-group {
          margin-bottom: 20px;
        }
        .dc-promo-panel-label {
          font-family: var(--font-cinzel);
          font-size: 0.56rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .dc-promo-panel-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        /* Pills (shared) */
        .dc-promo-pill {
          font-family: var(--font-cinzel);
          font-size: clamp(0.75rem, 2vw, 0.85rem);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 7px 13px;
          border-radius: 30px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          min-height: 44px;
        }
        .dc-promo-pill:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .dc-promo-pill--active {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--bg-primary);
          font-weight: 700;
        }

        /* Select inside panel */
        .dc-promo-select {
          font-family: var(--font-lato);
          font-size: 0.82rem;
          padding: 9px 36px 9px 14px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: rgba(0,0,0,0.2);
          color: var(--text-primary);
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          outline: none;
          transition: border-color 0.2s;
        }
        .dc-promo-select:focus { border-color: var(--accent); }
        .dc-promo-select option {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        /* Meta bar (result count + chips) */
        .dc-promo-bar-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 8px;
          flex-wrap: wrap;
          min-height: 28px;
        }

        /* Active filter chips */
        .dc-promo-chip {
          font-family: var(--font-cinzel);
          font-size: 0.58rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 20px;
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
          color: var(--accent);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: background 0.15s;
        }
        .dc-promo-chip:hover {
          background: color-mix(in srgb, var(--accent) 22%, transparent);
        }

        /* Grid */
        .dc-promo-grid-section { padding: 40px 60px 120px; }
        .dc-promo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 28px;
        }

        @media (max-width: 767px) {
          .dc-promo-hero            { padding: 120px 20px 60px; }
          .dc-promo-hero-stats      { gap: 24px; padding: 20px 24px; flex-direction: column; }
          .dc-promo-filters-section { padding: 0 20px 20px; }
          .dc-promo-bar             { gap: 8px; flex-wrap: wrap; }
          .dc-promo-panel           { width: calc(100vw - 40px); right: 0; left: auto; }
          .dc-promo-grid-section    { padding: 28px 20px 80px; }
          .dc-promo-grid            { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-promo-hero            { padding: 140px 40px 70px; }
          .dc-promo-filters-section { padding: 0 40px 24px; }
          .dc-promo-grid-section    { padding: 36px 40px 100px; }
          .dc-promo-grid            { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </main>
  );
}

// ─── PromoCard ────────────────────────────────────────────────────────────────

function PromoCard({
  promo,
  timer,
  isActiva,
  isUltimasHoras,
  onVerPromocion,
}: {
  promo: Promocion;
  timer?: TimerState;
  isActiva: boolean;
  isUltimasHoras: boolean;
  onVerPromocion: () => void;
}) {
  const isHappyHour = promo.tipo === "happy_hour";

  const cardBorder = isUltimasHoras
    ? "1px solid rgba(212,160,23,0.6)"
    : isHappyHour && isActiva
    ? "1px solid rgba(212,160,23,0.35)"
    : "1px solid var(--border-color)";

  const cardGlow = isUltimasHoras
    ? "0 0 30px rgba(212,160,23,0.2), 0 4px 20px rgba(0,0,0,0.4)"
    : "0 4px 20px rgba(0,0,0,0.3)";

  return (
    <div
      className="dc-promo-card"
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: cardBorder,
        borderRadius: "20px",
        cursor: "pointer",
        transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
        boxShadow: cardGlow,
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-6px)";
        el.style.borderColor = isHappyHour ? "#d4a017" : "var(--accent)";
        el.style.boxShadow = isHappyHour
          ? "0 8px 40px rgba(212,160,23,0.25)"
          : "0 8px 40px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.borderColor = isUltimasHoras ? "rgba(212,160,23,0.6)" : isHappyHour && isActiva ? "rgba(212,160,23,0.35)" : "var(--border-color)";
        el.style.boxShadow = cardGlow;
      }}
    >
      {/* Happy hour golden top stripe */}
      {isHappyHour && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "3px",
          background: "linear-gradient(90deg, #c8850a, #d4a017, #f0c040, #d4a017, #c8850a)",
        }} />
      )}

      <div className="dc-promo-card-inner">
        {/* Top row: image + local info + badges */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "12px" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", minWidth: 0 }}>
            <span style={{ fontSize: "2.8rem", flexShrink: 0, lineHeight: 1 }}>{promo.imagen}</span>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "3px",
              }}>
                {promo.comuna}
              </p>
              <p style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.85rem",
                color: isHappyHour ? "#d4a017" : "var(--oasis-bright)",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}>
                {promo.local}
              </p>
            </div>
          </div>

          {/* Tipo badge */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.55rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "5px 10px",
              borderRadius: "30px",
              border: isHappyHour ? "1px solid rgba(212,160,23,0.5)" : "1px solid var(--border-color)",
              color: isHappyHour ? "#d4a017" : "var(--accent)",
              background: isHappyHour ? "rgba(212,160,23,0.08)" : "transparent",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
              {TIPO_ICONS[promo.tipo]} {TIPO_LABELS[promo.tipo]}
            </span>
            {isActiva && (
              <span style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.5rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "4px 8px",
                borderRadius: "30px",
                background: "rgba(61,184,158,0.15)",
                border: "1px solid rgba(61,184,158,0.4)",
                color: "var(--oasis-bright)",
              }}>
                ● Activa ahora
              </span>
            )}
          </div>
        </div>

        {/* Título + descripción */}
        <h3 style={{
          fontFamily: "var(--font-cinzel-decorative)",
          fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
          color: "var(--accent)",
          marginBottom: "8px",
          lineHeight: 1.3,
        }}>
          {promo.titulo}
        </h3>
        <p style={{
          fontFamily: "var(--font-lato)",
          fontSize: "clamp(0.85rem, 2vw, 0.9rem)",
          color: "var(--text-muted)",
          lineHeight: 1.7,
          marginBottom: "20px",
        }}>
          {promo.descripcion}
        </p>

        {/* Precio */}
        {(promo.precioOriginal || promo.precioDescuento) && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}>
            {promo.precioOriginal && (
              <span style={{
                fontFamily: "var(--font-lato)",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                textDecoration: "line-through",
              }}>
                ${promo.precioOriginal.toLocaleString("es-CL")}
              </span>
            )}
            {promo.precioDescuento && (
              <span style={{
                fontFamily: "var(--font-cinzel-decorative)",
                fontSize: "1.25rem",
                color: isHappyHour ? "#d4a017" : "var(--oasis-bright)",
                fontWeight: 700,
              }}>
                ${promo.precioDescuento.toLocaleString("es-CL")}
              </span>
            )}
            {promo.porcentajeDescuento && (
              <span style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "20px",
                background: isHappyHour ? "rgba(212,160,23,0.2)" : "rgba(255,100,50,0.2)",
                color: isHappyHour ? "#d4a017" : "#ff8860",
                border: isHappyHour ? "1px solid rgba(212,160,23,0.4)" : "1px solid rgba(255,100,50,0.3)",
              }}>
                -{promo.porcentajeDescuento}%
              </span>
            )}
          </div>
        )}

        {/* Horario */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
          padding: "10px 14px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "10px",
        }}>
          <span style={{ fontSize: "0.9rem" }}>🕐</span>
          <span style={{
            fontFamily: "var(--font-lato)",
            fontSize: "0.8rem",
            color: "var(--text-primary)",
          }}>
            Válido hoy de{" "}
            <strong style={{ color: isHappyHour ? "#d4a017" : "var(--accent)" }}>
              {promo.horaInicio}
            </strong>{" "}
            a{" "}
            <strong style={{ color: isHappyHour ? "#d4a017" : "var(--accent)" }}>
              {promo.horaFin}
            </strong>
          </span>
        </div>

        {/* Días de la semana */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
          {DIAS_SHORT.map((dia, idx) => (
            <span
              key={idx}
              style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.55rem",
                letterSpacing: "0.05em",
                width: "26px", height: "26px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                border: promo.diasSemana.includes(idx)
                  ? isHappyHour ? "1px solid rgba(212,160,23,0.6)" : "1px solid var(--accent)"
                  : "1px solid var(--border-color)",
                background: promo.diasSemana.includes(idx)
                  ? isHappyHour ? "rgba(212,160,23,0.15)" : "color-mix(in srgb, var(--accent) 15%, transparent)"
                  : "transparent",
                color: promo.diasSemana.includes(idx)
                  ? isHappyHour ? "#d4a017" : "var(--accent)"
                  : "var(--text-muted)",
                fontWeight: promo.diasSemana.includes(idx) ? 700 : 400,
              }}
            >
              {dia}
            </span>
          ))}
        </div>

        {/* Timer countdown — solo si activa y últimas horas */}
        {isUltimasHoras && timer && (
          <div className="dc-promo-timer-box">
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}>
              <span className="dc-promo-ultimas-badge">
                ⚡ ¡Últimas horas!
              </span>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              {[
                { val: timer.horas,    lbl: "Horas" },
                { val: timer.minutos,  lbl: "Min" },
                { val: timer.segundos, lbl: "Seg" },
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{ textAlign: "center" }}>
                  <p style={{
                    fontFamily: "var(--font-cinzel-decorative)",
                    fontSize: "1.8rem",
                    color: "#d4a017",
                    lineHeight: 1,
                    textShadow: "0 0 20px rgba(212,160,23,0.6)",
                  }}>
                    {pad2(val)}
                  </p>
                  <p style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.48rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}>
                    {lbl}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onVerPromocion}
          style={{
            width: "100%",
            background: isHappyHour
              ? "linear-gradient(135deg, #c8850a, #d4a017)"
              : "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
            border: "none",
            borderRadius: "16px",
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#07040f",
            fontWeight: 700,
            cursor: "pointer",
            minHeight: "56px",
            transition: "opacity 0.2s",
            marginTop: isUltimasHoras ? "0" : "0",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          Ver Promoción →
        </button>
      </div>

      <style>{`
        .dc-promo-card-inner { padding: 28px; }
        .dc-promo-timer-box {
          background: rgba(212,160,23,0.08);
          border: 1px solid rgba(212,160,23,0.3);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 16px;
          animation: dc-promo-glow-pulse 2s ease-in-out infinite;
        }
        @keyframes dc-promo-glow-pulse {
          0%, 100% { box-shadow: 0 0 10px rgba(212,160,23,0.2); }
          50%       { box-shadow: 0 0 24px rgba(212,160,23,0.45); }
        }
        .dc-promo-ultimas-badge {
          font-family: var(--font-cinzel);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #d4a017;
          font-weight: 700;
        }
        @media (max-width: 767px) {
          .dc-promo-card-inner { padding: 20px; }
        }
      `}</style>
    </div>
  );
}
