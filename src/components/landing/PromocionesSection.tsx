"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useGenie } from "@/contexts/GenieContext";
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

// Top 3: prioritize active now, then happy_hour, then any
function getTop3(): Promocion[] {
  const noB = PROMOCIONES.filter(p => !p.esCumpleanos);
  const activas   = noB.filter((p) => p.activa && isPromocionActivaAhora(p));
  const happyHour = noB.filter((p) => p.activa && !isPromocionActivaAhora(p) && p.tipo === "happy_hour");
  const resto     = noB.filter((p) => p.activa && !isPromocionActivaAhora(p) && p.tipo !== "happy_hour");
  return [...activas, ...happyHour, ...resto].slice(0, 3);
}

interface TimerState { horas: number; minutos: number; segundos: number }

export default function PromocionesSection() {
  const [mounted, setMounted]   = useState(false);
  const [promos]                = useState<Promocion[]>(getTop3());
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
    updateTimers();
    const id = setInterval(updateTimers, 1000);
    return () => clearInterval(id);
  }, [updateTimers]);

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
        <BirthdayBanner />

        <div className="dc-ps-grid">
          {promos.map((promo) => {
            const isActiva     = mounted ? isPromocionActivaAhora(promo) : false;
            const isUltimas    = mounted ? terminaEnMenos2Horas(promo)   : false;
            const timer        = timers[promo.id];
            const isHH         = promo.tipo === "happy_hour";
            const accentColor  = isHH ? "#d4a017" : "var(--accent)";
            const badge        = isHH
              ? { text: "HAPPY HOUR", bg: "linear-gradient(135deg, #c8850a, #d4a017)" }
              : promo.tipo === "2x1"
              ? { text: "2×1", bg: "linear-gradient(135deg, #2a7a6f, #3db89e)" }
              : promo.porcentajeDescuento
              ? { text: `-${promo.porcentajeDescuento}%`, bg: "linear-gradient(135deg, #b03000, #ff5020)" }
              : promo.tipo === "cupon"
              ? { text: "CUPÓN", bg: "linear-gradient(135deg, #5020a0, #8040d0)" }
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
                      <div style={{
                        position: "absolute", top: "12px", left: "12px", zIndex: 2,
                        background: badge.bg, color: "#fff", fontWeight: 700,
                        fontFamily: "var(--font-cinzel)", fontSize: "0.72rem",
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        padding: "5px 12px", borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                        pointerEvents: "none",
                      }}>
                        {badge.text}
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}>
                    <span style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.52rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "5px 10px",
                      borderRadius: "30px",
                      border: isHH ? "1px solid rgba(212,160,23,0.5)" : "1px solid var(--border-color)",
                      color: accentColor,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      {TIPO_ICONS[promo.tipo]} {TIPO_LABELS[promo.tipo]}
                    </span>
                    {isActiva && (
                      <span style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "0.48rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        padding: "4px 8px",
                        borderRadius: "30px",
                        background: "rgba(61,184,158,0.15)",
                        border: "1px solid rgba(61,184,158,0.4)",
                        color: "var(--oasis-bright)",
                      }}>
                        ● Activa
                      </span>
                    )}
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

                  {/* Timer últimas horas */}
                  {isUltimas && timer && (
                    <div style={{
                      background: "rgba(212,160,23,0.08)",
                      border: "1px solid rgba(212,160,23,0.3)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      marginBottom: "16px",
                      animation: "dc-ps-glow 2s ease-in-out infinite",
                    }}>
                      <p style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "0.55rem",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "#d4a017",
                        fontWeight: 700,
                        marginBottom: "10px",
                      }}>
                        ⚡ ¡Últimas horas!
                      </p>
                      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        {[
                          { val: timer.horas,    lbl: "Hr" },
                          { val: timer.minutos,  lbl: "Min" },
                          { val: timer.segundos, lbl: "Seg" },
                        ].map(({ val, lbl }) => (
                          <div key={lbl} style={{ textAlign: "center" }}>
                            <p style={{
                              fontFamily: "var(--font-cinzel-decorative)",
                              fontSize: "1.5rem",
                              color: "#d4a017",
                              lineHeight: 1,
                              textShadow: "0 0 16px rgba(212,160,23,0.6)",
                            }}>
                              {pad2(val)}
                            </p>
                            <p style={{
                              fontFamily: "var(--font-cinzel)",
                              fontSize: "0.45rem",
                              letterSpacing: "0.2em",
                              textTransform: "uppercase",
                              color: "var(--text-muted)",
                              marginTop: "3px",
                            }}>
                              {lbl}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

function BirthdayBanner() {
  const { setToastActivo } = useGenie();
  const [hasBirthday, setHasBirthday] = useState(false);

  useEffect(() => {
    try { setHasBirthday(!!localStorage.getItem("deseocomer_user_birthday")); } catch {}
  }, []);

  const cumplePromos = PROMOCIONES.filter(p => p.esCumpleanos);

  const triggerCumpleToast = () => {
    setToastActivo({
      id: "cumpleanos",
      mensaje: "¿Cuándo es tu cumpleaños? 🎂 Así te aviso cuando los restaurantes tengan ofertas especiales para celebrar",
      opciones: ["Cuéntale al Genio 🧞", "Después"],
    });
  };

  return (
    <div style={{ marginBottom: "48px" }}>
      <div style={{
        background: hasBirthday ? "rgba(180,30,100,0.08)" : "rgba(180,30,100,0.06)",
        border: `1px solid ${hasBirthday ? "rgba(220,50,120,0.3)" : "rgba(220,50,120,0.2)"}`,
        borderRadius: "16px", padding: "24px", textAlign: "center",
        marginBottom: cumplePromos.length > 0 && hasBirthday ? "20px" : "0",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🎂</div>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "6px", fontWeight: 700 }}>
          {hasBirthday ? "Ofertas para Cumpleañeros" : "¿Es tu cumpleaños pronto?"}
        </p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: hasBirthday ? "0" : "16px" }}>
          {hasBirthday
            ? "Estos locales tienen beneficios especiales para celebrar tu cumpleaños"
            : "Registra tu fecha y te avisamos cuando haya ofertas especiales para celebrar"}
        </p>
        {!hasBirthday && (
          <button onClick={triggerCumpleToast} style={{
            background: "var(--accent)", color: "var(--bg-primary)",
            border: "none", borderRadius: "10px", padding: "10px 24px",
            fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
            letterSpacing: "0.1em", textTransform: "uppercase",
            fontWeight: 700, cursor: "pointer",
          }}>
            Registrar mi cumpleaños
          </button>
        )}
      </div>

      {hasBirthday && cumplePromos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {cumplePromos.map(p => (
            <a key={p.id} href={`/promociones/${p.id}`} style={{
              backgroundColor: "rgba(45,26,8,0.85)", border: "1px solid rgba(220,50,120,0.25)",
              borderRadius: "16px", overflow: "hidden", textDecoration: "none", display: "block",
            }}>
              <div style={{ height: "120px", overflow: "hidden" }}>
                <img src={p.imagenUrl} alt={p.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
              <div style={{ padding: "16px" }}>
                <span style={{
                  fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.12em",
                  background: "rgba(220,50,120,0.15)", color: "#e8a84c",
                  borderRadius: "20px", padding: "3px 10px",
                }}>
                  🎂 CUMPLEAÑOS
                </span>
                <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)", marginTop: "8px", marginBottom: "4px" }}>
                  {p.titulo}
                </p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {p.local} · {p.comuna}
                </p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.5, marginTop: "6px" }}>
                  {p.descripcion}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
