"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useGenie } from "@/contexts/GenieContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  PROMOCIONES,
  TIPO_ICONS,
  TIPO_LABELS,
  DIAS_SHORT,
  pad2,
  isPromocionActivaAhora,
  terminaEnMenos2Horas,
  getTimerHastaFin,
  type Promocion,
} from "@/lib/mockPromociones";

// Top 3: if birthday, show birthday promos first; then active, happy_hour, rest
function getTop3(esCumple: boolean): Promocion[] {
  const cumple = esCumple ? PROMOCIONES.filter(p => p.esCumpleanos && p.activa) : [];
  const noB = PROMOCIONES.filter(p => !p.esCumpleanos && p.activa);
  const activas   = noB.filter(p => isPromocionActivaAhora(p));
  const happyHour = noB.filter(p => !isPromocionActivaAhora(p) && p.tipo === "happy_hour");
  const resto     = noB.filter(p => !isPromocionActivaAhora(p) && p.tipo !== "happy_hour");
  return [...cumple, ...activas, ...happyHour, ...resto].slice(0, 3);
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

export default function PromocionesSection() {
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted]   = useState(false);
  const [esCumple, setEsCumple] = useState(false);
  const [promos, setPromos]     = useState<Promocion[]>(getTop3(false));

  // Try fetching from API (supplement mock data)
  useEffect(() => {
    fetch("/api/promociones").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // BD promos found — for now just log, full integration later
        console.log("[Promos] BD tiene", data.length, "promociones");
      }
    }).catch(() => {});
  }, []);
  const [timers, setTimers]     = useState<Record<number, TimerState>>({});
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
    const cumple = isAuthenticated && checkBirthday();
    setEsCumple(cumple);
    if (cumple) setPromos(getTop3(true));
    updateTimers();
    const id = setInterval(updateTimers, 1000);
    return () => clearInterval(id);
  }, [updateTimers, isAuthenticated]);

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
            color: "var(--color-title)",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "20px",
          }}>
            Promociones Activas
          </h2>
          <p className="section-description" style={{ marginBottom: "24px" }}>
            Descuentos, happy hours y cupones exclusivos en los mejores locales de Santiago. Algunos terminan hoy.
          </p>

          {mounted && activasAhora > 0 && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.65rem",
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

        <div className="dc-ps-grid">
          {promos.map((promo) => {
            const isActiva     = mounted ? isPromocionActivaAhora(promo) : false;
            const isUltimas    = mounted ? terminaEnMenos2Horas(promo)   : false;
            const timer        = timers[promo.id];
            const isHH         = promo.tipo === "happy_hour";
            const accentColor  = isHH ? "#d4a017" : "var(--accent)";
            const badge        = isHH
              ? { text: "HOUR", color: "#d4a017" }
              : promo.tipo === "2x1"
              ? { text: "2×1", color: "#3db89e" }
              : promo.porcentajeDescuento
              ? { text: `-${promo.porcentajeDescuento}%`, color: "#ff5020" }
              : promo.tipo === "cupon"
              ? { text: "OFF", color: "#8040d0" }
              : promo.tipo === "precio_especial"
              ? { text: "FREE", color: "#e8a84c" }
              : null;

            return (
              <a
                key={promo.id}
                href={`/promociones/${promo.id}`}
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
                      <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 3, pointerEvents: "none" }}>
                        <svg width="58" height="58" viewBox="0 0 58 58">
                          <circle cx="29" cy="29" r="26" fill="none" stroke={badge.color} strokeWidth="2.5" opacity="0.9" />
                          <circle cx="29" cy="29" r="22" fill="none" stroke={badge.color} strokeWidth="1" opacity="0.6" strokeDasharray="2 2" />
                          <text x="29" y="32" textAnchor="middle" fontFamily="serif" fontSize={badge.text.length > 4 ? "9" : "12"} fontWeight="900" fill={badge.color} opacity="0.95">{badge.text}</text>
                          <text x="12" y="42" fontSize="6" fill={badge.color} opacity="0.7">★</text>
                          <text x="42" y="42" fontSize="6" fill={badge.color} opacity="0.7">★</text>
                        </svg>
                      </div>
                    )}
                  </div>
                )}

                {/* Local info below image */}
                <div style={{
                  padding: "16px 24px 0",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  pointerEvents: "none",
                }}>
                  <div>
                    <p style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: "3px",
                    }}>
                      {promo.comuna}
                    </p>
                    <p style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.85rem",
                      color: isHH ? "#d4a017" : "var(--color-link)",
                      fontWeight: 600,
                    }}>
                      {promo.local}
                    </p>
                  </div>
                  <div />
                </div>

                <div className="dc-ps-card-inner" style={{ pointerEvents: "none" }}>
                  {/* Título */}
                  <h3 style={{
                    fontFamily: "var(--font-cinzel-decorative)",
                    fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                    color: "var(--color-title)",
                    marginBottom: "8px",
                    lineHeight: 1.3,
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
                          fontSize: "0.6rem",
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

                  {/* Horario stats */}
                  <div style={{
                    display: "flex",
                    gap: "16px",
                    marginBottom: "16px",
                    padding: "12px 16px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "10px",
                  }}>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <p style={{
                        fontFamily: "var(--font-cinzel-decorative)",
                        fontSize: "1rem",
                        color: accentColor,
                      }}>
                        {promo.horaInicio}
                      </p>
                      <p style={{
                        fontFamily: "var(--font-lato)",
                        fontSize: "0.6rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}>
                        Inicio
                      </p>
                    </div>
                    <div style={{ width: "1px", background: "var(--border-color)" }} />
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <p style={{
                        fontFamily: "var(--font-cinzel-decorative)",
                        fontSize: "1rem",
                        color: accentColor,
                      }}>
                        {promo.horaFin}
                      </p>
                      <p style={{
                        fontFamily: "var(--font-lato)",
                        fontSize: "0.6rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}>
                        Fin
                      </p>
                    </div>
                  </div>

                  {/* Días */}
                  <div style={{ display: "flex", gap: "5px", marginBottom: "20px" }}>
                    {DIAS_SHORT.map((dia, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.5rem",
                          width: "22px", height: "22px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          border: promo.diasSemana.includes(idx)
                            ? isHH ? "1px solid rgba(212,160,23,0.6)" : "1px solid var(--accent)"
                            : "1px solid var(--border-color)",
                          background: promo.diasSemana.includes(idx)
                            ? isHH ? "rgba(212,160,23,0.15)" : "color-mix(in srgb, var(--accent) 15%, transparent)"
                            : "transparent",
                          color: promo.diasSemana.includes(idx)
                            ? isHH ? "#d4a017" : "var(--accent)"
                            : "var(--text-muted)",
                        }}
                      >
                        {dia}
                      </span>
                    ))}
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
                      fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#07040f",
                      fontWeight: 700,
                      minHeight: "52px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    Ver promoción →
                  </div>
                </div>
              </a>
            );
          })}
        </div>

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
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 28px;
        }
        .dc-ps-card-inner { padding: 16px 28px 28px; }
        .dc-ps-card:hover { transform: translateY(-6px); border-color: var(--accent) !important; }
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
          .dc-ps-grid      { grid-template-columns: 1fr; gap: 16px; }
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
  const [cerrado, setCerrado] = useState(false);
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
    fontWeight: 700, cursor: "pointer", width: "100%",
  };

  const closeBtn = (
    <button onClick={() => setCerrado(true)} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "1rem", cursor: "pointer", opacity: 0.6, zIndex: 2 }}>✕</button>
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
  if (cerrado) return null;

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

  // ── Not logged in → multi-step flow ──
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

      {paso === "form" && (
        <div style={{ textAlign: "left", maxWidth: "340px", margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1rem, 3vw, 1.3rem)", color: "var(--color-title)", marginBottom: "8px", textAlign: "center" }}>🎂 Recibe ofertas exclusivas en tu cumpleaños</p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px", textAlign: "center" }}>Solo tarda 30 segundos</p>
          {error && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "#ff8080", marginBottom: "10px", textAlign: "center" }}>⚠️ {error}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input style={{ ...inp, textAlign: "left", width: "100%" }} placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
            <input style={{ ...inp, textAlign: "left", width: "100%" }} type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Fecha de cumpleaños</p>
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
            }} style={btnP}>Guardar 🎂</button>
          </div>
        </div>
      )}

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
