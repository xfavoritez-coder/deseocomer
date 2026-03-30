"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { PROMOCIONES, TIPO_LABELS, isPromocionActivaAhora, type Promocion } from "@/lib/mockPromociones";

const TIPOS = ["happy_hour", "descuento", "2x1", "cupon", "precio_especial", "cumpleanos"] as const;
const TIPO_LABEL: Record<string, string> = { happy_hour: "Happy Hour", descuento: "Descuento", "2x1": "2×1", cupon: "Cupón", precio_especial: "Especial", cumpleanos: "Cumpleaños" };

function getSello(promo: Promocion): { text: string; color: string } | null {
  if (promo.tipo === "happy_hour") return { text: "HAPPY HOUR", color: "#d4a017" };
  if (promo.tipo === "cumpleanos") return { text: "CUMPLEA\u00d1OS", color: "#e05090" };
  if (promo.tipo === "2x1") return { text: "2\u00d71", color: "#3db89e" };
  if (promo.porcentajeDescuento) return { text: `-${promo.porcentajeDescuento}%`, color: "#ff6644" };
  if (promo.tipo === "cupon") return { text: "CUP\u00d3N", color: "#8040d0" };
  return { text: "REGALO", color: "#e8a84c" };
}

export default function PromocionesPage() {
  const { isAuthenticated } = useAuth();
  const [promos, setPromos] = useState<Promocion[]>(PROMOCIONES.filter(p => p.activa));
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivas, setFiltroActivas] = useState(false);
  const [filtrosTipo, setFiltrosTipo] = useState<string[]>([]);
  const [filtroComuna, setFiltroComuna] = useState("");
  const [esCumple, setEsCumple] = useState(false);

  // Fetch from BD and merge
  useEffect(() => {
    fetch("/api/promociones").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        console.log("[Promos] BD:", data.length);
      }
    }).catch(() => {});
  }, []);

  // Detect birthday
  useEffect(() => {
    try {
      const birthday = JSON.parse(localStorage.getItem("deseocomer_user_birthday") || "{}");
      if (birthday?.dia && birthday?.mes) {
        const hoy = new Date();
        setEsCumple(hoy.getDate() === Number(birthday.dia) && (hoy.getMonth() + 1) === Number(birthday.mes));
      }
    } catch {}
  }, []);

  const toggleTipo = (t: string) => setFiltrosTipo(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const comunasDisponibles = Array.from(new Set(promos.filter(p => p.comuna).map(p => p.comuna))).sort();

  const filtered = promos.filter(p => {
    if (busqueda) { const q = busqueda.toLowerCase(); if (!p.titulo.toLowerCase().includes(q) && !p.local.toLowerCase().includes(q)) return false; }
    if (filtroActivas && !isPromocionActivaAhora(p)) return false;
    if (filtrosTipo.length > 0 && !filtrosTipo.includes(p.tipo)) return false;
    if (filtroComuna && p.comuna !== filtroComuna) return false;
    return true;
  });

  // Birthday: show birthday promos first
  const promosCumple = esCumple ? filtered.filter(p => p.esCumpleanos) : [];
  const promosNormales = esCumple ? filtered.filter(p => !p.esCumpleanos) : filtered;

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <section style={{ padding: "120px 24px 40px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(2rem, 6vw, 3.5rem)", color: "var(--color-title, #f5d080)", marginBottom: "12px" }}>Promociones</h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)", color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto", lineHeight: 1.7 }}>
          Descuentos reales, happy hours y cupones exclusivos en los mejores locales
        </p>
      </section>

      {/* Search + Filters */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px 32px" }}>
        {/* Fila 1 — Buscador */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
          <input type="text" placeholder="Buscar promociones o locales..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ width: "100%", padding: "14px 16px 14px 44px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "12px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
            onFocus={e => { e.target.style.borderColor = "var(--accent)"; }} onBlur={e => { e.target.style.borderColor = "rgba(232,168,76,0.2)"; }} />
        </div>

        {/* Fila 2 — Filtros de tipo */}
        <div className="dc-filtros-tipo" style={{ display: "flex", gap: "8px", overflowX: "auto", flexWrap: "nowrap", marginBottom: "12px", paddingBottom: "4px", scrollbarWidth: "none" }}>
          {[
            { key: "activas", label: "Activas ahora", color: "var(--oasis-bright)" },
            { key: "happy_hour", label: "Happy Hour", color: "#d4a017" },
            { key: "descuento", label: "Descuento", color: "#ff6644" },
            { key: "2x1", label: "2\u00d71", color: "#3db89e" },
            { key: "cupon", label: "Cupón", color: "#8040d0" },
            { key: "precio_especial", label: "Especial", color: "#e8a84c" },
            { key: "cumpleanos", label: "Cumpleaños", color: "#e05090" },
          ].map(({ key, label, color }) => {
            const isActive = key === "activas" ? filtroActivas : filtrosTipo.includes(key);
            return (
              <button key={key} onClick={() => { if (key === "activas") setFiltroActivas(!filtroActivas); else toggleTipo(key); }} style={{ padding: "8px 16px", borderRadius: "20px", border: isActive ? `1px solid ${color}` : "1px solid rgba(232,168,76,0.2)", background: isActive ? `color-mix(in srgb, ${color} 12%, transparent)` : "transparent", color: isActive ? color : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s" }}>
                {key === "activas" && isActive && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, display: "inline-block", animation: "dc-ps-blink 1.5s infinite" }} />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Fila 3 — Comuna + Limpiar */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select value={filtroComuna} onChange={e => setFiltroComuna(e.target.value)} style={{ padding: "8px 32px 8px 14px", borderRadius: "20px", border: filtroComuna ? "1px solid var(--accent)" : "1px solid rgba(232,168,76,0.2)", background: filtroComuna ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.04)", color: filtroComuna ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, cursor: "pointer", outline: "none", appearance: "none" as const, WebkitAppearance: "none" as const, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23e8a84c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", minHeight: "36px", flexShrink: 0 }}>
            <option value="" style={{ background: "#0a0812", color: "#f0ead6" }}>{"\ud83d\udccd"} Todas las comunas</option>
            {comunasDisponibles.map(c => <option key={c} value={c} style={{ background: "#0a0812", color: "#f0ead6" }}>{c}</option>)}
          </select>
          {(filtrosTipo.length > 0 || filtroActivas || busqueda || filtroComuna) && (
            <button onClick={() => { setFiltrosTipo([]); setFiltroActivas(false); setBusqueda(""); setFiltroComuna(""); }} style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid rgba(255,100,100,0.3)", background: "rgba(255,100,100,0.08)", color: "#ff8080", fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "0.08em" }}>✕ Limpiar</button>
          )}
        </div>
      </div>

      {/* Birthday section — only for authenticated users */}
      {isAuthenticated && esCumple && promosCumple.length > 0 && (
        <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 48px" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(232,168,76,0.1), rgba(180,30,100,0.1))", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "20px", padding: "32px", textAlign: "center", marginBottom: "0" }}>
            <p style={{ fontSize: "2.5rem", margin: "0 0 12px" }}>🎂</p>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", color: "var(--accent)", fontSize: "clamp(1.3rem, 4vw, 1.8rem)", margin: "0 0 8px" }}>¡Hoy es tu día especial!</h2>
            <p style={{ fontFamily: "var(--font-lato)", color: "var(--color-text, rgba(240,234,214,0.8))", fontSize: "1rem", marginBottom: "24px" }}>Estos locales tienen ofertas exclusivas para celebrar tu cumpleaños</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", textAlign: "left" }}>
              {promosCumple.map(promo => (
                <Link key={promo.id} href={`/promociones/${promo.id}`} style={{ background: "rgba(8,13,24,0.7)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "14px", overflow: "hidden", textDecoration: "none", display: "block", transition: "transform 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  {promo.imagenUrl && (
                    <div style={{ height: "120px", overflow: "hidden" }}>
                      <img src={promo.imagenUrl} alt={promo.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                  <div style={{ padding: "14px" }}>
                    <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "#f5d080", marginBottom: "4px" }}>{promo.titulo}</p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.6)" }}>{promo.local} · {promo.comuna}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 80px" }}>
        {promosNormales.length === 0 && promosCumple.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: "3rem", marginBottom: "12px" }}>⚡</p>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)" }}>Sin promociones con estos filtros</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "8px" }}>Prueba cambiando los filtros</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {promosNormales.map(promo => {
              const activa = isPromocionActivaAhora(promo);
              const sello = getSello(promo);
              return (
                <Link key={promo.id} href={`/promociones/${promo.id}`} style={{
                  background: "rgba(8,13,24,0.85)", border: "1px solid rgba(232,168,76,0.15)",
                  borderRadius: "16px", overflow: "hidden", textDecoration: "none", display: "block",
                  borderLeft: activa ? "3px solid var(--oasis-bright)" : "3px solid transparent",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  {promo.imagenUrl && (
                    <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
                      <img src={promo.imagenUrl} alt={promo.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      {sello && (
                        <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 3, pointerEvents: "none", background: "rgba(13,7,3,0.88)", border: `1px solid ${sello.color}`, borderRadius: "20px", padding: "5px 12px" }}>
                          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", fontWeight: 700, color: sello.color, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{sello.text}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ padding: "16px" }}>
                    {activa && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "20px", background: "rgba(61,184,158,0.12)", border: "1px solid rgba(61,184,158,0.35)", marginBottom: "8px" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--oasis-bright)", display: "inline-block", animation: "dc-ps-blink 1.5s infinite" }} />
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.15em", color: "var(--oasis-bright)", textTransform: "uppercase" }}>Activa ahora</span>
                      </div>
                    )}
                    <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.95rem", color: "#f5d080", marginBottom: "4px" }}>{promo.titulo}</p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.65)", marginBottom: "6px" }}>{promo.local} · {promo.comuna}</p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{promo.descripcion?.slice(0, 80)}{(promo.descripcion?.length ?? 0) > 80 ? "..." : ""}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Footer />

      <style>{`
        @keyframes dc-ps-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .dc-filtros-tipo::-webkit-scrollbar { display: none; }
        @media (max-width: 767px) {
          section:first-of-type { padding: 96px 20px 32px !important; }
        }
      `}</style>
    </main>
  );
}
