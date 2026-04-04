"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { boostScore } from "@/lib/personalizacion";
import { useGenie } from "@/contexts/GenieContext";
import { PROMOCIONES, TIPO_LABELS, isPromocionActivaAhora, normalizeTipo, type Promocion } from "@/lib/mockPromociones";

const TIPOS = ["happy_hour", "descuento", "2x1", "cupon", "precio_especial", "cumpleanos"] as const;
const DIAS_NOMBRE = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatDias(dias: number[]): string {
  if (dias.length === 0) return "";
  if (dias.length === 7) return "Todos los días";
  const sorted = [...dias].sort((a, b) => a - b);
  // Check consecutive weekdays (1-5)
  const weekdays = [1, 2, 3, 4, 5];
  if (sorted.length === 5 && weekdays.every(d => sorted.includes(d))) return "Lun a Vie";
  // Check consecutive weekend (0,6)
  if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return "Sáb y Dom";
  return sorted.map(d => DIAS_NOMBRE[d]).join(", ");
}
const TIPO_LABEL: Record<string, string> = { happy_hour: "Happy Hour", descuento: "Descuento", "2x1": "2×1", promo: "Promo", cumpleanos: "Cumpleaños" };

function getSello(promo: Promocion): { text: string; color: string } | null {
  const t = promo.tipo?.toLowerCase() ?? "";
  if (t === "happy_hour" || t === "happy hour") return { text: "HAPPY HOUR", color: "#d4a017" };
  if (t === "cumpleanos" || t === "cumpleaños") return { text: "CUMPLEAÑOS", color: "#e05090" };
  if (t === "2x1") return { text: "2×1", color: "#3db89e" };
  if (t === "descuento" || t === "descuento %" || promo.porcentajeDescuento) return { text: promo.porcentajeDescuento ? `-${promo.porcentajeDescuento}%` : "DESCUENTO", color: "#ff6644" };
  if (t === "cupon" || t === "cupón") return { text: "PROMO", color: "#e8a84c" };
  if (t === "precio_especial" || t === "especial") return { text: "PROMO", color: "#e8a84c" };
  if (t === "combo" || t === "promo") return { text: "PROMO", color: "#e8a84c" };
  if (t === "regalo") return { text: "REGALO", color: "#e8a84c" };
  return { text: promo.tipo?.toUpperCase() ?? "PROMO", color: "#e8a84c" };
}

export default function PromocionesPage() {
  const { addInteraccion } = useGenie();
  const { isAuthenticated } = useAuth();
  const [promos, setPromos] = useState<Promocion[]>(PROMOCIONES.filter(p => p.activa));
  const [busqueda, setBusqueda] = useState("");
  const [filtroActivas, setFiltroActivas] = useState(false);
  const [filtrosTipo, setFiltrosTipo] = useState<string[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(() => {
    const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    return dias[new Date().getDay()];
  });
  const [esCumple, setEsCumple] = useState(false);
  const [filtroComuna, setFiltroComuna] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [ordenamiento, setOrdenamiento] = useState("para_ti");
  const comunasDisponibles = [...new Set(promos.map(p => p.comuna).filter(Boolean))].sort();
  const categoriasComida = [...new Set(promos.map(p => (p as any).localCategoria).filter(Boolean))].sort();

  // Fetch from BD
  useEffect(() => {
    fetch("/api/promociones").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = data.map((p: any) => ({
          id: p.id, slug: p.slug ?? null, localId: p.localId, local: p.local?.nombre ?? "Local",
          logoUrl: p.local?.logoUrl ?? "",
          comuna: p.local?.comuna ?? "", tipo: normalizeTipo(p.tipo ?? ""),
          categoria: "cena" as const, imagen: "⚡", imagenUrl: p.imagenUrl ?? "",
          titulo: p.titulo ?? "", descripcion: p.descripcion ?? "",
          porcentajeDescuento: p.porcentajeDescuento ?? undefined,
          precioOriginal: p.precioOriginal ?? undefined,
          precioDescuento: p.precioDescuento ?? undefined,
          diasSemana: Array.isArray(p.diasSemana) ? p.diasSemana.map((v: boolean, i: number) => v ? i : -1).filter((n: number) => n >= 0) : [],
          horaInicio: p.horaInicio ?? "12:00", horaFin: p.horaFin ?? "22:00",
          fechaVencimiento: "2099-12-31", activa: p.activa ?? true,
          esCumpleanos: p.esCumpleanos ?? false,
          condiciones: p.condiciones ?? undefined,
          modalidad: Array.isArray(p.modalidad) ? p.modalidad : [],
          vistas: p.vistas ?? 0,
          localCategoria: p.local?.categoria ?? "",
        }));
        setPromos(mapped);
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

  useEffect(() => {
    if (busqueda.length >= 3) {
      const timer = setTimeout(() => {
        addInteraccion("busqueda", { query: busqueda });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [busqueda]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTipo = (t: string) => setFiltrosTipo(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const filtered = promos.filter(p => {
    if (busqueda) { const q = busqueda.toLowerCase(); if (!p.titulo?.toLowerCase().includes(q) && !p.local?.toLowerCase().includes(q) && !p.comuna?.toLowerCase().includes(q) && !p.tipo?.toLowerCase().includes(q)) return false; }
    if (filtroActivas && !isPromocionActivaAhora(p)) return false;
    if (filtrosTipo.length > 0 && !filtrosTipo.includes(p.tipo)) return false;
    if (filtroComuna && p.comuna?.toLowerCase() !== filtroComuna.toLowerCase()) return false;
    if (filtroCategoria) {
      const catLower = filtroCategoria.toLowerCase();
      if (!(p as any).localCategoria?.toLowerCase().includes(catLower)) return false;
    }
    // Day filter
    if (diaSeleccionado !== "Todos") {
      const diaIndex: Record<string, number> = { "Lun": 0, "Mar": 1, "Mié": 2, "Jue": 3, "Vie": 4, "Sáb": 5, "Dom": 6 };
      const targetDay = diaSeleccionado === "Hoy" ? diaIndex[["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][new Date().getDay()]] : diaIndex[diaSeleccionado];
      if (targetDay !== undefined && Array.isArray(p.diasSemana) && !p.diasSemana.includes(targetDay)) return false;
    }
    return true;
  });

  // Birthday: show birthday promos first
  const promosCumple = esCumple ? filtered.filter(p => p.esCumpleanos) : [];
  const promosNormales = (esCumple ? filtered.filter(p => !p.esCumpleanos) : [...filtered]).sort((a, b) => {
    const boostDiff = boostScore(null, b.comuna) - boostScore(null, a.comuna);
    if (ordenamiento === "para_ti") return boostDiff;
    if (ordenamiento === "nuevas") return 0; // already sorted by createdAt desc from API
    if (ordenamiento === "visitadas") return ((b as unknown as Record<string, number>).vistas ?? 0) - ((a as unknown as Record<string, number>).vistas ?? 0);
    return boostDiff;
  });

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section className="dc-pp-hero">
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 65%)" }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem, 2vw, 0.85rem)", letterSpacing: "0.45em", textTransform: "uppercase", color: "var(--oasis-bright)", marginBottom: "16px" }}>Promociones</p>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.8rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "0.02em", color: "var(--accent)", textShadow: "0 0 60px color-mix(in srgb, var(--accent) 50%, transparent)", marginBottom: "20px", lineHeight: 1.1 }}>Ofertas Exclusivas ⚡</h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(1rem, 2.5vw, 1.15rem)", color: "var(--text-primary)", fontWeight: 400, maxWidth: "520px", margin: "0 auto", lineHeight: 1.8 }}>Descuentos, happy hours y promociones especiales de los mejores restaurantes de Chile.</p>
        </div>
      </section>

      {/* Search + Filters */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px 32px" }}>
        {/* Fila 1 — Buscador */}
        <div style={{ position: "relative", marginBottom: "12px" }}>
          <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
          <input type="text" placeholder="Buscar por local, tipo o comuna..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ width: "100%", padding: "14px 16px 14px 44px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "12px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
            onFocus={e => { e.target.style.borderColor = "var(--accent)"; }} onBlur={e => { e.target.style.borderColor = "rgba(232,168,76,0.2)"; }} />
        </div>

        {/* Fila 2 — Filtros de tipo */}
        <div className="dc-filtros-tipo" style={{ display: "flex", gap: "8px", overflowX: "auto", flexWrap: "wrap", marginBottom: "12px", paddingBottom: "4px", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {[
            { key: "activas", label: "Activas ahora", color: "var(--oasis-bright)" },
            { key: "happy_hour", label: "Happy Hour", color: "#d4a017" },
            { key: "descuento", label: "Descuento", color: "#ff6644" },
            { key: "2x1", label: "2\u00d71", color: "#3db89e" },
            { key: "promo", label: "Promo", color: "#e8a84c" },
            { key: "cumpleanos", label: "Cumpleaños", color: "#e05090" },
          ].map(({ key, label, color }) => {
            const isActive = key === "activas" ? filtroActivas : filtrosTipo.includes(key);
            return (
              <button key={key} onClick={() => { if (key === "activas") setFiltroActivas(!filtroActivas); else toggleTipo(key); }} style={{ padding: "8px 16px", borderRadius: "20px", border: isActive ? `1px solid ${color}` : "1px solid rgba(232,168,76,0.2)", background: isActive ? `color-mix(in srgb, ${color} 12%, transparent)` : "transparent", color: isActive ? color : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, display: "flex", alignItems: "center", gap: "5px", transition: "all 0.2s" }}>
                {key === "activas" && isActive && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, display: "inline-block", animation: "dc-ps-blink 1.5s infinite" }} />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Fila 3 — Filtro por día */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          {["Hoy", "Todos", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => {
            const isHoy = d === "Hoy";
            const active = diaSeleccionado === d || (d === "Hoy" && diaSeleccionado === ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][new Date().getDay()]);
            const sel = diaSeleccionado === d;
            return (
              <button key={d} onClick={() => setDiaSeleccionado(d)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-lato)", border: sel ? (isHoy ? "1px solid rgba(61,184,158,0.35)" : "1px solid rgba(232,168,76,0.3)") : "1px solid rgba(232,168,76,0.12)", background: sel ? (isHoy ? "rgba(61,184,158,0.12)" : "rgba(232,168,76,0.12)") : "rgba(255,255,255,0.02)", color: sel ? (isHoy ? "#3db89e" : "#e8a84c") : "rgba(240,234,214,0.45)", fontWeight: sel ? 700 : 400, transition: "all 0.2s" }}>
                {d}
              </button>
            );
          })}
        </div>

        {/* Fila 4 — Comuna + Ordenamiento */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <select value={filtroComuna} onChange={e => setFiltroComuna(e.target.value)} style={{ padding: "8px 14px", borderRadius: "20px", border: "1px solid rgba(232,168,76,0.2)", background: filtroComuna ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.02)", color: filtroComuna ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.06em", cursor: "pointer", outline: "none" }}>
            <option value="" style={{ background: "#0a0812", color: "#f0ead6" }}>Todas las comunas</option>
            {comunasDisponibles.map(c => <option key={c} value={c} style={{ background: "#0a0812", color: "#f0ead6" }}>{c}</option>)}
          </select>
          <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} style={{ padding: "8px 14px", borderRadius: "20px", border: "1px solid rgba(232,168,76,0.2)", background: filtroCategoria ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.02)", color: filtroCategoria ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.06em", cursor: "pointer", outline: "none" }}>
            <option value="" style={{ background: "#0a0812", color: "#f0ead6" }}>Tipo de comida</option>
            {categoriasComida.map(c => <option key={c} value={c} style={{ background: "#0a0812", color: "#f0ead6" }}>{c}</option>)}
          </select>
          <select value={ordenamiento} onChange={e => setOrdenamiento(e.target.value)} style={{ padding: "8px 14px", borderRadius: "20px", border: "1px solid rgba(232,168,76,0.2)", background: "rgba(255,255,255,0.02)", color: "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.06em", cursor: "pointer", outline: "none", marginLeft: "auto" }}>
            <option value="para_ti" style={{ background: "#0a0812", color: "#f0ead6" }}>Para ti ✨</option>
            <option value="nuevas" style={{ background: "#0a0812", color: "#f0ead6" }}>Más nuevas</option>
            <option value="visitadas" style={{ background: "#0a0812", color: "#f0ead6" }}>Más visitadas</option>
          </select>
        </div>

        {/* Fila 5 — Limpiar */}
        {(filtrosTipo.length > 0 || filtroActivas || busqueda || filtroComuna || filtroCategoria) && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button onClick={() => { setFiltrosTipo([]); setFiltroActivas(false); setBusqueda(""); setDiaSeleccionado("Hoy"); setFiltroComuna(""); setFiltroCategoria(""); setOrdenamiento("para_ti"); }} style={{ padding: "8px 16px", borderRadius: "20px", border: "1px solid rgba(255,100,100,0.3)", background: "rgba(255,100,100,0.08)", color: "#ff8080", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.08em" }}>✕ Limpiar</button>
          </div>
        )}
      </div>

      {/* Birthday section — only for authenticated users */}
      {isAuthenticated && esCumple && (
        <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 32px" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(232,168,76,0.1), rgba(180,30,100,0.1))", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "20px", padding: "28px 24px", textAlign: "center" }}>
            <div style={{ position: "relative", overflow: "hidden" }}>
              {["🎊", "✨", "🎉", "🎈", "🎊"].map((e, i) => (
                <span key={i} style={{ position: "absolute", top: "50%", left: `${5 + i * 22}%`, transform: "translateY(-50%)", fontSize: "1.3rem", opacity: 0.2, pointerEvents: "none" }}>{e}</span>
              ))}
              <div style={{ position: "relative", zIndex: 1 }}>
                <p style={{ fontSize: "2.2rem", margin: "0 0 8px" }}>🎂</p>
                <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", color: "var(--accent)", fontSize: "clamp(1.2rem, 4vw, 1.6rem)", margin: "0 0 6px" }}>¡Feliz cumpleaños!</h2>
                <p style={{ fontFamily: "var(--font-lato)", color: "var(--color-text, rgba(240,234,214,0.7))", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>Hoy es tu día especial. Disfruta todas las promociones y pásala increíble.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid */}
      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px 80px" }}>
        {promosNormales.length === 0 && promosCumple.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🔍</p>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "var(--color-title)", marginBottom: "10px" }}>Sin resultados</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "300px", margin: "0 auto 20px" }}>
              {busqueda ? `No encontramos promociones para "${busqueda}". Puedes buscar por local, tipo o comuna` : "No hay promociones con estos filtros"}
            </p>
            <button onClick={() => { setBusqueda(""); setFiltrosTipo([]); setFiltroActivas(false); }} style={{ padding: "10px 20px", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "20px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.1em", color: "var(--accent)", cursor: "pointer", textTransform: "uppercase" }}>
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {promosNormales.map(promo => {
              const activa = isPromocionActivaAhora(promo);
              const sello = getSello(promo);
              const isHH = promo.tipo === "happy_hour";
              const accentColor = isHH ? "#d4a017" : "var(--accent)";
              const logoUrl = (promo as unknown as Record<string, unknown>).logoUrl as string | undefined;
              const cumpleBorder = esCumple ? "1px solid rgba(224,80,144,0.35)" : "";
              return (
                <a key={promo.id} href={`/promociones/${(promo as any).slug || promo.id}`} style={{
                  backgroundColor: "rgba(45,26,8,0.85)",
                  border: cumpleBorder || (isHH ? "1px solid rgba(212,160,23,0.25)" : "1px solid var(--border-color)"),
                  borderRadius: "20px", cursor: "pointer", position: "relative", overflow: "hidden",
                  textDecoration: "none", display: "block", color: "inherit",
                  transition: "border-color 0.2s",
                  boxShadow: esCumple ? "0 0 16px rgba(224,80,144,0.1)" : "none",
                }}>
                  {isHH && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #c8850a, #d4a017, #f0c040, #d4a017, #c8850a)", zIndex: 1 }} />}

                  {promo.imagenUrl && (
                    <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
                      <img src={promo.imagenUrl} alt={promo.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      {sello && (
                        <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 3, background: "rgba(13,7,3,0.88)", border: `1px solid ${sello.color}`, borderRadius: "20px", padding: "5px 12px" }}>
                          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", fontWeight: 700, color: sello.color, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{sello.text}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Local info */}
                  <div style={{ padding: "16px 24px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(232,168,76,0.2)" }} />
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, rgba(232,168,76,0.25), rgba(232,168,76,0.08))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", border: "1px solid rgba(232,168,76,0.2)", flexShrink: 0 }}>{(promo.local ?? "L").charAt(0).toUpperCase()}</div>
                    )}
                    <div>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: isHH ? "#d4a017" : "var(--text-primary)", fontWeight: 600 }}>{promo.local}</p>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>{promo.comuna}</p>
                    </div>
                  </div>

                  <div style={{ padding: "16px 28px 28px" }}>
                    <h3 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(0.9rem, 2.5vw, 1rem)", color: "var(--color-title)", marginBottom: "6px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                      {promo.titulo}
                    </h3>

                    {promo.descripcion && (
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                        {promo.descripcion}
                      </p>
                    )}

                    {/* Modalidad badges */}
                    {Array.isArray((promo as any).modalidad) && (promo as any).modalidad.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                        {(promo as any).modalidad.map((m: string) => (
                          <span key={m} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", padding: "3px 10px", borderRadius: "12px", background: m === "delivery" ? "rgba(61,184,158,0.12)" : m === "retiro" ? "rgba(128,64,208,0.12)" : "rgba(232,168,76,0.12)", border: `1px solid ${m === "delivery" ? "rgba(61,184,158,0.3)" : m === "retiro" ? "rgba(128,64,208,0.3)" : "rgba(232,168,76,0.3)"}`, color: m === "delivery" ? "#3db89e" : m === "retiro" ? "#a070e0" : "#e8a84c", textTransform: "uppercase" }}>
                            {m === "en_local" ? "En local" : m === "delivery" ? "Delivery" : "Retiro"}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Días + Horario */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "10px" }}>
                      <span style={{ fontSize: "0.85rem" }}>🕐</span>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4, margin: 0 }}>
                        <span style={{ color: accentColor, fontWeight: 600 }}>{formatDias(promo.diasSemana)}</span>
                        {" · "}{promo.horaInicio} – {promo.horaFin}
                      </p>
                    </div>
                    {/* Day dots */}
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
                      {promo.diasSemana.length === 7 ? (
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: "#3db89e" }}>Todos los días</span>
                      ) : (
                        ["L", "M", "M", "J", "V", "S", "D"].map((letra, idx) => {
                          const activo = promo.diasSemana.includes(idx);
                          return (
                            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: activo ? "#e8a84c" : "rgba(232,168,76,0.15)" }} />
                              <span style={{ fontSize: 8, color: activo ? "rgba(240,234,214,0.5)" : "rgba(240,234,214,0.15)" }}>{letra}</span>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div style={{ width: "100%", background: isHH ? "linear-gradient(135deg, #c8850a, #d4a017)" : "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))", borderRadius: "16px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#07040f", fontWeight: 700, minHeight: "46px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      Ver promoción
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      <Footer />

      <style>{`
        .dc-pp-hero {
          position: relative;
          overflow: hidden;
          padding: 140px 60px 60px;
          text-align: center;
        }
        @keyframes dc-ps-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .dc-filtros-tipo::-webkit-scrollbar { display: none; }
        @media (max-width: 767px) {
          .dc-pp-hero { padding: 100px 20px 50px; }
          .dc-filtros-tipo { flex-wrap: nowrap !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-pp-hero { padding: 120px 40px 60px; }
        }
      `}</style>
    </main>
  );
}
