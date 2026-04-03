"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useGenie } from "@/contexts/GenieContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DIAS_SHORT,
  isPromocionActivaAhora,
  terminaEnMenos2Horas,
  getTimerHastaFin,
  normalizeTipo,
  type Promocion,
} from "@/lib/mockPromociones";
import { boostScore } from "@/lib/personalizacion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PromoFromDB { id: string; slug?: string | null; localId: string; local: string; logoUrl: string; comuna: string; tipo: string; imagenUrl: string; titulo: string; descripcion: string; porcentajeDescuento: number | null; precioOriginal: number | null; precioDescuento: number | null; diasSemana: boolean[]; horaInicio: string; horaFin: string; activa: boolean; esCumpleanos: boolean; condiciones: string | null; }

function mapDBToPromocion(p: PromoFromDB): Promocion {
  return {
    id: p.id as unknown as number, slug: p.slug ?? undefined, localId: p.localId, local: p.local,
    comuna: p.comuna, tipo: normalizeTipo(p.tipo),
    categoria: "cena" as const, imagen: "⚡", imagenUrl: p.imagenUrl,
    titulo: p.titulo, descripcion: p.descripcion,
    porcentajeDescuento: p.porcentajeDescuento ?? undefined,
    precioOriginal: p.precioOriginal ?? undefined,
    precioDescuento: p.precioDescuento ?? undefined,
    diasSemana: Array.isArray(p.diasSemana) ? p.diasSemana.map((v: boolean, i: number) => v ? i : -1).filter((n: number) => n >= 0) : [],
    horaInicio: p.horaInicio, horaFin: p.horaFin,
    fechaVencimiento: "2099-12-31", activa: p.activa,
    esCumpleanos: p.esCumpleanos,
    condiciones: p.condiciones ?? undefined,
  };
}

const DIAS_NOMBRE = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
function formatDias(dias: number[]): string {
  if (dias.length === 0) return "";
  if (dias.length === 7) return "Todos los días";
  const sorted = [...dias].sort((a, b) => a - b);
  const weekdays = [1, 2, 3, 4, 5];
  if (sorted.length === 5 && weekdays.every(d => sorted.includes(d))) return "Lun a Vie";
  if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return "Sáb y Dom";
  return sorted.map(d => DIAS_NOMBRE[d]).join(", ");
}

function checkBirthday(): boolean {
  try {
    const raw = localStorage.getItem("deseocomer_user_birthday");
    if (!raw) return false;
    const b = JSON.parse(raw);
    if (!b?.dia || !b?.mes) return false;
    const hoy = new Date();
    return hoy.getDate() === Number(b.dia) && (hoy.getMonth() + 1) === Number(b.mes);
  } catch { return false; }
}

interface TimerState { horas: number; minutos: number; segundos: number }

export default function PromocionesSection({ initialData = [] }: { initialData?: PromoFromDB[] }) {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted]   = useState(false);
  const [esCumple, setEsCumple] = useState(false);

  // Map server data immediately — no client fetch needed
  const allPromos = initialData.map(mapDBToPromocion);
  const promosSorted = [...allPromos].sort((a, b) => boostScore(null, b.comuna) - boostScore(null, a.comuna));
  const promos = promosSorted.slice(0, 3);

  const [timers, setTimers]     = useState<Record<string, TimerState>>({});
  const [activasAhora, setActivasAhora] = useState(0);

  useEffect(() => {
    setMounted(true);
    setEsCumple(isAuthenticated && checkBirthday());
  }, [isAuthenticated]);

  // Update timers
  useEffect(() => {
    if (promos.length === 0) return;
    const update = () => {
      const next: Record<string, TimerState> = {};
      let activas = 0;
      for (const p of promos) {
        if (isPromocionActivaAhora(p)) {
          next[p.id] = getTimerHastaFin(p);
          activas++;
        }
      }
      setTimers(next);
      setActivasAhora(activas);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData.length]);

  return (
    <section className="dc-ps-section" style={{ backgroundColor: "var(--bg-secondary)", borderTop: "1px solid rgba(61,184,158,0.08)", borderBottom: "1px solid rgba(61,184,158,0.08)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--color-label)",
            marginBottom: "16px",
          }}>
            Ofertas de hoy
          </p>
          <h2 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            fontWeight: 800, letterSpacing: "0.02em",
            color: "#f5d080",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "20px",
          }}>
            Promociones Activas
          </h2>
          <p className="section-description" style={{ marginBottom: "24px" }}>
            Descuentos, happy hours y cupones exclusivos en los mejores locales de Chile.
          </p>

          {mounted && activasAhora > 0 && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "8px 20px",
              borderRadius: "30px",
              background: "rgba(212,160,23,0.1)",
              border: "1px solid rgba(212,160,23,0.35)",
              color: "#d4a017",
            }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#d4a017",
                animation: "dc-ps-blink 1.5s ease-in-out infinite",
              }} />
              {activasAhora} activa{activasAhora !== 1 ? "s" : ""} ahora mismo
            </div>
          )}
        </div>

        {/* Cards grid */}
        {/* Birthday section */}
        <BirthdayBanner esCumpleHoy={esCumple} />

        {promos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⚡</p>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.1rem, 3vw, 1.4rem)", color: "var(--color-title)", marginBottom: "10px" }}>Próximamente</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem, 2vw, 1rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: "400px", margin: "0 auto" }}>Estamos preparando promociones exclusivas con los mejores locales de Chile. Muy pronto aquí.</p>
          </div>
        ) : (
        <div className="dc-ps-grid">
          {promos.map((promo) => {
            const isActiva     = mounted ? isPromocionActivaAhora(promo) : false;
            const isUltimas    = mounted ? terminaEnMenos2Horas(promo)   : false;
            const timer        = timers[promo.id];
            const isHH         = promo.tipo === "happy_hour";
            const accentColor  = isHH ? "#d4a017" : "var(--accent)";
            const tLower       = promo.tipo?.toLowerCase() ?? "";
            const badge        = isHH || tLower === "happy hour"
              ? { text: "HAPPY HOUR", color: "#d4a017" }
              : tLower === "cumpleanos" || tLower === "cumpleaños"
              ? { text: "CUMPLEAÑOS", color: "#e05090" }
              : tLower === "2x1"
              ? { text: "2×1", color: "#3db89e" }
              : tLower === "descuento" || tLower === "descuento %" || promo.porcentajeDescuento
              ? { text: promo.porcentajeDescuento ? `-${promo.porcentajeDescuento}%` : "DESCUENTO", color: "#ff6644" }
              : tLower === "cupon" || tLower === "cupón"
              ? { text: "PROMO", color: "#e8a84c" }
              : tLower === "precio_especial" || tLower === "especial"
              ? { text: "ESPECIAL", color: "#e8a84c" }
              : tLower === "combo" || tLower === "promo"
              ? { text: "PROMO", color: "#e8a84c" }
              : tLower === "regalo"
              ? { text: "REGALO", color: "#e8a84c" }
              : null;

            return (
              <a
                key={promo.id}
                href={`/promociones/${(promo as any).slug || promo.id}`}
                className={`dc-ps-card${isHH ? " dc-ps-card--hh" : ""}${isUltimas ? " dc-ps-card--urgent" : ""}`}
                style={{
                  backgroundColor: "rgba(45,26,8,0.85)",
                  border: isUltimas
                    ? "1px solid rgba(212,160,23,0.6)"
                    : isHH ? "1px solid rgba(212,160,23,0.25)" : "1px solid var(--border-color)",
                  borderRadius: "20px",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                  position: "relative",
                  overflow: "hidden",
                  textDecoration: "none",
                  display: "block",
                  color: "inherit",
                }}
              >
                {/* Happy hour gold stripe */}
                {isHH && (
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, #c8850a, #d4a017, #f0c040, #d4a017, #c8850a)",
                    zIndex: 1,
                    pointerEvents: "none",
                  }} />
                )}

                {promo.imagenUrl && (
                  <div style={{ position: "relative", height: "160px", overflow: "hidden", flexShrink: 0, pointerEvents: "none" }}>
                    <img src={promo.imagenUrl} alt={promo.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    {badge && (
                      <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 3, pointerEvents: "none", background: "rgba(13,7,3,0.88)", border: `1px solid ${badge.color}`, borderRadius: "20px", padding: "5px 12px" }}>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", fontWeight: 700, color: badge.color, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{badge.text}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Local info below image */}
                <div style={{
                  padding: "16px 24px 0",
                  display: "flex", alignItems: "center", gap: "10px",
                  pointerEvents: "none",
                }}>
                  {initialData.find(d => d.id === String(promo.id))?.logoUrl ? (
                    <img src={initialData.find(d => d.id === String(promo.id))!.logoUrl} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(232,168,76,0.2)" }} />
                  ) : (
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, rgba(232,168,76,0.25), rgba(232,168,76,0.08))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", border: "1px solid rgba(232,168,76,0.2)", flexShrink: 0 }}>{(promo.local ?? "L").charAt(0).toUpperCase()}</div>
                  )}
                  <div>
                    <p style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.85rem",
                      color: isHH ? "#d4a017" : "var(--text-primary)",
                      fontWeight: 600,
                    }}>
                      {promo.local}
                    </p>
                    <p style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.68rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                    }}>
                      {promo.comuna}
                    </p>
                  </div>
                </div>

                <div className="dc-ps-card-inner" style={{ pointerEvents: "none" }}>
                  {/* Título */}
                  <h3 style={{
                    fontFamily: "var(--font-cinzel-decorative)",
                    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                    color: "var(--color-title)",
                    marginBottom: "8px",
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}>
                    {promo.titulo}
                  </h3>

                  {/* Precio */}
                  {(promo.precioOriginal || promo.precioDescuento) && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "16px",
                    }}>
                      {promo.precioOriginal && (
                        <span style={{
                          fontFamily: "var(--font-lato)",
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          textDecoration: "line-through",
                        }}>
                          ${promo.precioOriginal.toLocaleString("es-CL")}
                        </span>
                      )}
                      {promo.precioDescuento && (
                        <span style={{
                          fontFamily: "var(--font-cinzel-decorative)",
                          fontSize: "1.15rem",
                          color: accentColor,
                          fontWeight: 700,
                        }}>
                          ${promo.precioDescuento.toLocaleString("es-CL")}
                        </span>
                      )}
                      {promo.porcentajeDescuento && (
                        <span style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "20px",
                          background: isHH ? "rgba(212,160,23,0.2)" : "rgba(255,100,50,0.15)",
                          color: isHH ? "#d4a017" : "#ff8860",
                          border: isHH ? "1px solid rgba(212,160,23,0.4)" : "1px solid rgba(255,100,50,0.3)",
                        }}>
                          -{promo.porcentajeDescuento}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Días + Horario */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "20px",
                    padding: "10px 14px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "10px",
                  }}>
                    <span style={{ fontSize: "0.85rem" }}>🕐</span>
                    <p style={{
                      fontFamily: "var(--font-lato)",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.4,
                    }}>
                      <span style={{ color: accentColor, fontWeight: 600 }}>{formatDias(promo.diasSemana)}</span>
                      {" · "}
                      {promo.horaInicio} – {promo.horaFin}
                    </p>
                  </div>


                  {/* CTA (styled div, not a button — the whole card is a Link) */}
                  <div
                    style={{
                      width: "100%",
                      background: isHH
                        ? "linear-gradient(135deg, #c8850a, #d4a017)"
                        : "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
                      borderRadius: "16px",
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.78rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#07040f",
                      fontWeight: 700,
                      minHeight: "46px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    Ver promoción
                  </div>
                </div>
              </a>
            );
          })}
        </div>
        )}

        {/* Ver todas */}
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <Link href="/promociones" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.8rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--color-link)",
            textDecoration: "none",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "4px",
            transition: "border-color 0.2s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-color)"; }}
          >
            Ver todas las promociones →
          </Link>
        </div>
      </div>

      <style>{`
        .dc-ps-section { padding: 100px 60px 80px; }
        .dc-ps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 28px;
          max-width: 420px;
          margin: 0 auto;
        }
        .dc-ps-grid:has(:nth-child(2)) { max-width: 860px; }
        .dc-ps-grid:has(:nth-child(3)) { max-width: 100%; }
        .dc-ps-card-inner { padding: 16px 28px 28px; }
        .dc-ps-card:hover { border-color: var(--accent) !important; }
        .dc-ps-card--hh:hover { border-color: #d4a017 !important; }

        @keyframes dc-ps-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes dc-ps-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(212,160,23,0.2); }
          50%       { box-shadow: 0 0 20px rgba(212,160,23,0.45); }
        }

        @media (max-width: 767px) {
          .dc-ps-section   { padding: 72px 20px 48px; }
          .dc-ps-grid      { display: flex !important; flex-direction: row; overflow-x: auto; gap: 16px; padding-bottom: 8px; scrollbar-width: none; }
          .dc-ps-grid::-webkit-scrollbar { display: none; }
          .dc-ps-card      { flex-shrink: 0 !important; width: 300px !important; }
          .dc-ps-card-inner { padding: 20px; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-ps-section { padding: 100px 40px; }
          .dc-ps-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
}

// ─── Birthday Banner ─────────────────────────────────────────────────────────

function BirthdayBanner({ esCumpleHoy }: { esCumpleHoy: boolean }) {
  const { setToastActivo } = useGenie();
  const { user, isAuthenticated } = useAuth();
  const [tieneFecha, setTieneFecha] = useState(false);
  const [cumpleGuardado, setCumpleGuardado] = useState(false);
  const [bannerCerrado, setBannerCerrado] = useState(false);
  const [paso, setPaso] = useState<"banner"|"form"|"contrasena"|"fin">("banner");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try { setTieneFecha(!!localStorage.getItem("deseocomer_user_birthday")); } catch {}
    // Also check from API if user is logged in and localStorage is empty
    if (isAuthenticated && user?.id && !localStorage.getItem("deseocomer_user_birthday")) {
      fetch(`/api/usuarios/${user.id}/cumpleanos-check`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.tieneCumple) {
            setTieneFecha(true);
            if (data.dia && data.mes) {
              localStorage.setItem("deseocomer_user_birthday", JSON.stringify({ dia: data.dia, mes: data.mes, anio: data.anio }));
            }
          }
        })
        .catch(() => {});
    }
    // Check if banner was dismissed
    try {
      if (sessionStorage.getItem("deseocomer_banner_cumple_cerrado_sesion")) { setBannerCerrado(true); }
      const cerradoHasta = localStorage.getItem("deseocomer_banner_cumple_cerrado");
      if (cerradoHasta && Date.now() < Number(cerradoHasta)) { setBannerCerrado(true); }
    } catch {}
    const handler = () => setCumpleGuardado(true);
    window.addEventListener("cumpleanos_guardado", handler);
    return () => window.removeEventListener("cumpleanos_guardado", handler);
  }, []);

  const box: React.CSSProperties = {
    background: esCumpleHoy ? "linear-gradient(135deg, rgba(232,168,76,0.1), rgba(180,30,100,0.1))" : "rgba(180,30,100,0.06)",
    border: esCumpleHoy ? "1px solid rgba(232,168,76,0.3)" : "1px solid rgba(220,50,120,0.2)",
    borderRadius: "16px", padding: "32px", textAlign: "center", marginBottom: "48px",
    animation: "bdFadeIn 0.3s ease",
  };
  const inp: React.CSSProperties = {
    background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)",
    borderRadius: "8px", padding: "10px 12px", color: "var(--text-primary)",
    fontFamily: "var(--font-lato)", fontSize: "1rem", textAlign: "center", outline: "none", boxSizing: "border-box",
  };
  const btnP: React.CSSProperties = {
    background: "var(--accent)", color: "var(--bg-primary)", border: "none",
    borderRadius: "10px", padding: "12px 24px", fontFamily: "var(--font-cinzel)",
    fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase",
    fontWeight: 700, cursor: "pointer",
  };

  const handleCerrarBanner = () => {
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_session") || "{}");
      if (session.loggedIn) {
        localStorage.setItem("deseocomer_banner_cumple_cerrado", String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      } else {
        sessionStorage.setItem("deseocomer_banner_cumple_cerrado_sesion", "true");
      }
    } catch {
      sessionStorage.setItem("deseocomer_banner_cumple_cerrado_sesion", "true");
    }
    setBannerCerrado(true);
  };

  const closeBtn = (
    <button onClick={handleCerrarBanner} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "rgba(240,234,214,0.4)", fontSize: "1rem", cursor: "pointer", padding: "4px", lineHeight: 1, zIndex: 2 }}>✕</button>
  );

  const userName = user?.nombre?.split(" ")[0] ?? "";

  // ── Birthday greeting (it IS their birthday today, ONLY if logged in) ──
  if (esCumpleHoy && isAuthenticated && (tieneFecha || cumpleGuardado)) {
    return (
      <div style={{ ...box, position: "relative" }}>
        {closeBtn}
        <div style={{ position: "relative", overflow: "hidden" }}>
          {["🎊", "✨", "🎉", "🎈", "🎊"].map((e, i) => (
            <span key={i} style={{ position: "absolute", top: "50%", left: `${5 + i * 22}%`, transform: "translateY(-50%)", fontSize: "1.5rem", opacity: 0.25, pointerEvents: "none" }}>{e}</span>
          ))}
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: "2.5rem", margin: "0 0 12px" }}>🎂</p>
            <h3 style={{ fontFamily: "var(--font-cinzel-decorative)", color: "var(--accent)", fontSize: "clamp(1.3rem, 4vw, 1.8rem)", margin: "0 0 8px" }}>
              {userName ? `¡Feliz cumpleaños, ${userName}!` : "¡Feliz cumpleaños!"}
            </h3>
            <p style={{ fontFamily: "var(--font-lato)", color: "var(--color-text, rgba(240,234,214,0.8))", fontSize: "1rem", marginBottom: "20px", lineHeight: 1.6 }}>
              Estos locales tienen ofertas exclusivas para celebrar tu día
            </p>
            <a href="/promociones" style={{ display: "inline-block", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", background: "var(--accent)", color: "var(--bg-primary)", padding: "14px 32px", borderRadius: "10px", textDecoration: "none", fontWeight: 700 }}>
              Ver ofertas de cumpleaños
            </a>
          </div>
        </div>
        <style>{`@keyframes bdFadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
      </div>
    );
  }

  // ── Already has birthday set & not their birthday → hide ──
  if ((isAuthenticated && tieneFecha) || cumpleGuardado) return null;

  // ── User closed it → hide ──
  if (bannerCerrado) return null;

  // ── Logged in without birthday → ask via Genio ──
  if (isAuthenticated && !tieneFecha) return (
    <div style={{ ...box, position: "relative" }}>
      {closeBtn}
      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🎂</div>
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "6px", fontWeight: 700 }}>¿Cuándo es tu cumpleaños?</p>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "16px" }}>Cuéntale al Genio y te avisamos cuando haya ofertas especiales para ti</p>
      <button onClick={() => setToastActivo({ id: "cumpleanos", mensaje: "¿Cuándo es tu cumpleaños? 🎂 Así te aviso cuando los restaurantes tengan ofertas especiales para celebrar", opciones: ["Cuéntale al Genio 🧞", "Después"] })} style={btnP}>
        🧞 Cuéntale al Genio
      </button>
      <style>{`@keyframes bdFadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
    </div>
  );

  // ── Not logged in → don't show birthday banner ──
  if (!isAuthenticated) return null;

  return (
    <div style={{ ...box, position: "relative" }}>
      {paso === "banner" && closeBtn}
      {paso === "banner" && (
        <div>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🎂</div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "6px", fontWeight: 700 }}>¿Cuándo es tu cumpleaños?</p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "16px" }}>Regístrate y te avisamos cuando haya ofertas especiales para celebrar</p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={() => setPaso("form")} style={{ ...btnP, width: "auto", display: "inline-block", padding: "14px 40px" }}>¡Lo quiero!</button>
          </div>
        </div>
      )}

      {paso === "form" && closeBtn}
      {paso === "form" && (
        <div style={{ textAlign: "left", maxWidth: "340px", margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1rem, 3vw, 1.3rem)", color: "var(--color-title)", marginBottom: "8px", textAlign: "center" }}>🎂 Recibe ofertas exclusivas en tu cumpleaños</p>
          {error && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "#ff8080", marginBottom: "10px", textAlign: "center" }}>⚠️ {error}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input style={{ ...inp, textAlign: "left", width: "100%" }} placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
            <input style={{ ...inp, textAlign: "left", width: "100%" }} type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Fecha de cumpleaños</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <input style={{ ...inp, width: "60px" }} placeholder="DD" maxLength={2} value={dia} onChange={e => setDia(e.target.value.replace(/\D/g, ""))} />
                <input style={{ ...inp, width: "60px" }} placeholder="MM" maxLength={2} value={mes} onChange={e => setMes(e.target.value.replace(/\D/g, ""))} />
                <input style={{ ...inp, width: "80px" }} placeholder="AAAA" maxLength={4} value={anio} onChange={e => setAnio(e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
            <button onClick={() => {
              setError("");
              if (!nombre.trim()) return setError("Ingresa tu nombre");
              if (!email.includes("@")) return setError("Email inválido");
              const d = Number(dia), m = Number(mes), a = Number(anio);
              if (d < 1 || d > 31 || m < 1 || m > 12 || a < 1900 || a > 2099) return setError("Fecha inválida");
              try {
                localStorage.setItem("deseocomer_user_birthday", JSON.stringify({ dia: d, mes: m, anio: a, nombre: nombre.trim(), email: email.trim(), guardadoEn: Date.now() }));
                localStorage.setItem("deseocomer_user_temp", JSON.stringify({ nombre: nombre.trim(), email: email.trim() }));
              } catch {}
              setPaso("contrasena");
            }} style={btnP}>Guardar</button>
          </div>
        </div>
      )}

      {paso === "contrasena" && closeBtn}
      {paso === "contrasena" && (
        <div style={{ maxWidth: "340px", margin: "0 auto" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "8px", color: "var(--oasis-bright)" }}>✓</div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "8px", fontWeight: 700 }}>¡Listo! Guardamos tu cumpleaños 🎂</p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.6 }}>Para acceder a otras promociones y concursos en DeseoComer, crea una contraseña:</p>
          {error && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "#ff8080", marginBottom: "10px" }}>⚠️ {error}</p>}
          <input style={{ ...inp, textAlign: "left", width: "100%", marginBottom: "12px" }} type="password" placeholder="Mínimo 8 caracteres" value={contrasena} onChange={e => setContrasena(e.target.value)} />
          <button onClick={() => {
            setError("");
            if (contrasena.length < 8) return setError("Mínimo 8 caracteres");
            try {
              const users = JSON.parse(localStorage.getItem("dc_users") ?? "[]");
              users.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, nombre: nombre.trim(), email: email.trim().toLowerCase(), password: contrasena, type: "user", comuna: "", createdAt: new Date().toISOString() });
              localStorage.setItem("dc_users", JSON.stringify(users));
              localStorage.removeItem("deseocomer_user_temp");
            } catch {}
            setPaso("fin");
          }} style={{ ...btnP, marginBottom: "10px" }}>Crear mi cuenta →</button>
          <button onClick={() => setPaso("fin")} style={{ background: "none", border: "none", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", cursor: "pointer", padding: "8px", width: "100%" }}>Ahora no, ya lo haré después</button>
        </div>
      )}

      {paso === "fin" && (
        <div>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🧞</div>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "var(--accent)", marginBottom: "8px" }}>¡Bienvenido/a a DeseoComer!</p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.6 }}>Ya eres parte de la comunidad. Ahora puedes participar en concursos y ver todas las promociones.</p>
          <button onClick={() => window.location.reload()} style={btnP}>Ver promociones</button>
        </div>
      )}

      <style>{`@keyframes bdFadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
    </div>
  );
}
