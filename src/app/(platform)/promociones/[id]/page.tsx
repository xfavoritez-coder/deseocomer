"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  PROMOCIONES,
  TIPO_ICONS,
  TIPO_LABELS,
  CATEGORIA_LABELS,
  DIAS_SHORT,
  DIAS_FULL,
  pad2,
  isPromocionActivaAhora,
  terminaEnMenos2Horas,
  getTimerHastaFin,
  type Promocion,
} from "@/lib/mockPromociones";

export default function PromocionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const promo = PROMOCIONES.find((p) => p.id === id);
  const relacionadas = PROMOCIONES.filter(
    (p) => p.id !== id && (p.localId === promo?.localId || p.categoria === promo?.categoria)
  ).slice(0, 3);

  const [mounted, setMounted]   = useState(false);
  const [isActiva, setIsActiva] = useState(false);
  const [isUltimas, setIsUltimas] = useState(false);
  const [timer, setTimer]       = useState({ horas: 0, minutos: 0, segundos: 0 });
  const [copiado, setCopiado]   = useState(false);

  const updateTimer = useCallback(() => {
    if (!promo) return;
    setIsActiva(isPromocionActivaAhora(promo));
    setIsUltimas(terminaEnMenos2Horas(promo));
    setTimer(getTimerHastaFin(promo));
  }, [promo]);

  useEffect(() => {
    setMounted(true);
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [updateTimer]);

  const copiarCodigo = () => {
    if (!promo?.codigoCupon) return;
    navigator.clipboard.writeText(promo.codigoCupon).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  if (!promo) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          gap: "20px",
          padding: "120px 40px",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "4rem" }}>🔍</p>
          <h2 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "1.5rem",
            color: "var(--accent)",
          }}>Promoción no encontrada</h2>
          <p style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>
            Esta promoción no existe o ya no está disponible.
          </p>
          <Link href="/promociones" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.75rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
            color: "var(--bg-primary)",
            padding: "12px 28px",
            borderRadius: "30px",
            textDecoration: "none",
            fontWeight: 700,
          }}>
            Ver todas las promociones
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const isHappyHour = promo.tipo === "happy_hour";
  const accentColor = isHappyHour ? "#d4a017" : "var(--accent)";

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── Hero imagen / emoji grande ──────────────────────────────── */}
      <section className="dc-pd-hero">
        {isHappyHour && (
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% 50%, rgba(212,160,23,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
        )}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 65%)",
        }} />

        {/* Back button */}
        <button
          onClick={() => router.push("/promociones")}
          style={{
            position: "absolute", top: "100px", left: "60px",
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            background: "transparent",
            border: "1px solid var(--border-color)",
            color: "var(--text-muted)",
            padding: "8px 16px",
            borderRadius: "30px",
            cursor: "pointer",
            transition: "all 0.2s",
            zIndex: 2,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-color)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
        >
          ← Volver
        </button>

        <div style={{ position: "relative", textAlign: "center", paddingTop: "60px" }}>
          <span style={{ fontSize: "5rem", display: "block", marginBottom: "20px" }}>
            {promo.imagen}
          </span>

          {/* Tipo badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.65rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "6px 16px",
            borderRadius: "30px",
            border: isHappyHour ? "1px solid rgba(212,160,23,0.5)" : "1px solid var(--border-color)",
            color: accentColor,
            background: isHappyHour ? "rgba(212,160,23,0.1)" : "rgba(255,255,255,0.04)",
            marginBottom: "20px",
          }}>
            {TIPO_ICONS[promo.tipo]} {TIPO_LABELS[promo.tipo]} — {CATEGORIA_LABELS[promo.categoria]}
          </div>

          <h1 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.6rem, 4vw, 3rem)",
            color: accentColor,
            textShadow: isHappyHour
              ? "0 0 60px rgba(212,160,23,0.5)"
              : "0 0 60px color-mix(in srgb, var(--accent) 50%, transparent)",
            marginBottom: "12px",
            lineHeight: 1.2,
            maxWidth: "700px",
            margin: "0 auto 12px",
          }}>
            {promo.titulo}
          </h1>

          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.85rem",
            letterSpacing: "0.1em",
            color: "var(--oasis-bright)",
            marginTop: "12px",
          }}>
            {promo.local} · {promo.comuna}
          </p>

          {/* Estado ahora */}
          {mounted && (
            <div style={{ marginTop: "20px" }}>
              {isActiva ? (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "8px 20px",
                  borderRadius: "30px",
                  background: "rgba(61,184,158,0.15)",
                  border: "1px solid rgba(61,184,158,0.4)",
                  color: "var(--oasis-bright)",
                }}>
                  <span style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: "var(--oasis-bright)",
                    animation: "dc-promo-blink 1.5s ease-in-out infinite",
                  }} />
                  Activa ahora mismo
                </span>
              ) : (
                <span style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "8px 20px",
                  borderRadius: "30px",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-muted)",
                  display: "inline-block",
                }}>
                  Disponible {promo.horaInicio} – {promo.horaFin}
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Content ────────────────────────────────────────────────── */}
      <section className="dc-pd-content">
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="dc-pd-layout">

            {/* ── Left column (main info) ── */}
            <div className="dc-pd-main">

              {/* Descripción */}
              <div className="dc-pd-card">
                <h2 className="dc-pd-card-title" style={{ color: accentColor }}>
                  Sobre esta promoción
                </h2>
                <p style={{
                  fontFamily: "var(--font-lato)",
                  fontSize: "1rem",
                  color: "var(--text-primary)",
                  lineHeight: 1.75,
                }}>
                  {promo.descripcion}
                </p>

                {/* Precio */}
                {(promo.precioOriginal || promo.precioDescuento) && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginTop: "24px",
                    padding: "20px",
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "12px",
                    flexWrap: "wrap",
                  }}>
                    <div>
                      <p style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "0.55rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        marginBottom: "4px",
                      }}>
                        Precio normal
                      </p>
                      {promo.precioOriginal && (
                        <p style={{
                          fontFamily: "var(--font-lato)",
                          fontSize: "1.2rem",
                          color: "var(--text-muted)",
                          textDecoration: "line-through",
                        }}>
                          ${promo.precioOriginal.toLocaleString("es-CL")}
                        </p>
                      )}
                    </div>
                    {promo.precioDescuento && (
                      <>
                        <span style={{ color: "var(--border-color)", fontSize: "1.5rem" }}>→</span>
                        <div>
                          <p style={{
                            fontFamily: "var(--font-cinzel)",
                            fontSize: "0.55rem",
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: accentColor,
                            marginBottom: "4px",
                          }}>
                            Precio con descuento
                          </p>
                          <p style={{
                            fontFamily: "var(--font-cinzel-decorative)",
                            fontSize: "1.8rem",
                            color: accentColor,
                            fontWeight: 700,
                            textShadow: isHappyHour
                              ? "0 0 20px rgba(212,160,23,0.4)"
                              : "none",
                          }}>
                            ${promo.precioDescuento.toLocaleString("es-CL")}
                          </p>
                        </div>
                        {promo.porcentajeDescuento && (
                          <span style={{
                            fontFamily: "var(--font-cinzel)",
                            fontSize: "1rem",
                            fontWeight: 700,
                            padding: "8px 16px",
                            borderRadius: "30px",
                            background: isHappyHour ? "rgba(212,160,23,0.2)" : "rgba(255,100,50,0.15)",
                            color: isHappyHour ? "#d4a017" : "#ff8860",
                            border: isHappyHour ? "1px solid rgba(212,160,23,0.4)" : "1px solid rgba(255,100,50,0.3)",
                          }}>
                            -{promo.porcentajeDescuento}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Código de cupón */}
              {promo.codigoCupon && (
                <div className="dc-pd-card" style={{
                  border: "1px solid rgba(95,240,208,0.3)",
                  background: "color-mix(in srgb, var(--bg-secondary) 90%, var(--oasis-teal))",
                }}>
                  <h2 className="dc-pd-card-title" style={{ color: "var(--oasis-bright)" }}>
                    🎟️ Código de cupón
                  </h2>
                  <p style={{
                    fontFamily: "var(--font-lato)",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    marginBottom: "16px",
                  }}>
                    Presenta este código al momento de pagar para obtener tu descuento:
                  </p>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-cinzel-decorative)",
                      fontSize: "1.6rem",
                      letterSpacing: "0.15em",
                      color: "var(--oasis-bright)",
                      padding: "16px 28px",
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: "12px",
                      border: "2px dashed rgba(95,240,208,0.4)",
                      textShadow: "0 0 20px rgba(95,240,208,0.4)",
                      flex: 1,
                      textAlign: "center",
                      minWidth: "200px",
                    }}>
                      {promo.codigoCupon}
                    </div>
                    <button
                      onClick={copiarCodigo}
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "0.65rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        padding: "14px 24px",
                        borderRadius: "12px",
                        border: "none",
                        background: copiado
                          ? "linear-gradient(135deg, #2a7a6f, #3db89e)"
                          : "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
                        color: "var(--bg-primary)",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        minHeight: "52px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {copiado ? "✓ ¡Copiado!" : "Copiar código"}
                    </button>
                  </div>
                  {promo.limiteUsos && (
                    <div style={{ marginTop: "16px" }}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "var(--font-lato)",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                      }}>
                        <span>{promo.usosActuales ?? 0} usos realizados</span>
                        <span>{promo.limiteUsos} usos máximos</span>
                      </div>
                      <div style={{
                        height: "4px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: "4px",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.min(100, ((promo.usosActuales ?? 0) / promo.limiteUsos) * 100)}%`,
                          background: "linear-gradient(90deg, var(--oasis-teal), var(--oasis-bright))",
                          borderRadius: "4px",
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timer countdown — últimas horas */}
              {mounted && isUltimas && (
                <div className="dc-pd-card" style={{
                  background: "rgba(212,160,23,0.08)",
                  border: "1px solid rgba(212,160,23,0.35)",
                  animation: "dc-pd-glow 2s ease-in-out infinite",
                }}>
                  <h2 className="dc-pd-card-title" style={{ color: "#d4a017" }}>
                    ⚡ ¡Últimas horas! La promoción termina en:
                  </h2>
                  <div style={{
                    display: "flex",
                    gap: "24px",
                    justifyContent: "center",
                    paddingTop: "8px",
                  }}>
                    {[
                      { val: timer.horas,    lbl: "Horas" },
                      { val: timer.minutos,  lbl: "Minutos" },
                      { val: timer.segundos, lbl: "Segundos" },
                    ].map(({ val, lbl }) => (
                      <div key={lbl} style={{ textAlign: "center" }}>
                        <div style={{
                          fontFamily: "var(--font-cinzel-decorative)",
                          fontSize: "3.5rem",
                          color: "#d4a017",
                          lineHeight: 1,
                          textShadow: "0 0 30px rgba(212,160,23,0.7)",
                          padding: "16px 20px",
                          background: "rgba(0,0,0,0.3)",
                          borderRadius: "12px",
                          border: "1px solid rgba(212,160,23,0.25)",
                          minWidth: "80px",
                        }}>
                          {pad2(val)}
                        </div>
                        <p style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.5rem",
                          letterSpacing: "0.25em",
                          textTransform: "uppercase",
                          color: "var(--text-muted)",
                          marginTop: "8px",
                        }}>
                          {lbl}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Descripción del local */}
              {promo.descripcionLocal && (
                <div className="dc-pd-card">
                  <h2 className="dc-pd-card-title" style={{ color: accentColor }}>
                    Sobre {promo.local}
                  </h2>
                  <p style={{
                    fontFamily: "var(--font-lato)",
                    fontSize: "0.95rem",
                    color: "var(--text-primary)",
                    lineHeight: 1.75,
                    marginBottom: "20px",
                  }}>
                    {promo.descripcionLocal}
                  </p>
                  <Link
                    href={`/locales/${promo.localId}`}
                    style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.7rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 20px",
                      borderRadius: "30px",
                      border: "1px solid var(--border-color)",
                      color: "var(--accent)",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "var(--accent)";
                      el.style.background = "color-mix(in srgb, var(--accent) 10%, transparent)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "var(--border-color)";
                      el.style.background = "transparent";
                    }}
                  >
                    Ver perfil del local →
                  </Link>
                </div>
              )}
            </div>

            {/* ── Right column (sidebar) ── */}
            <div className="dc-pd-sidebar">

              {/* Horario de validez */}
              <div className="dc-pd-card">
                <h3 style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "16px",
                }}>
                  Horario de la promoción
                </h3>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "16px",
                }}>
                  <span style={{ fontSize: "1.5rem" }}>🕐</span>
                  <div>
                    <p style={{
                      fontFamily: "var(--font-cinzel-decorative)",
                      fontSize: "1.4rem",
                      color: accentColor,
                    }}>
                      {promo.horaInicio} – {promo.horaFin}
                    </p>
                    <p style={{
                      fontFamily: "var(--font-lato)",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}>
                      Válido hasta el {promo.fechaVencimiento}
                    </p>
                  </div>
                </div>

                {/* Días */}
                <p style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.55rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "10px",
                }}>
                  Días que aplica
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {DIAS_FULL.map((dia, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.05em",
                        padding: "6px 10px",
                        borderRadius: "20px",
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
              </div>

              {/* Ubicación del local */}
              {promo.direccion && (
                <div className="dc-pd-card">
                  <h3 style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "16px",
                  }}>
                    Ubicación
                  </h3>

                  {/* Mapa placeholder */}
                  <div style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "12px",
                    height: "140px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.03) 19px, rgba(255,255,255,0.03) 20px)",
                    }} />
                    <div style={{ position: "relative", textAlign: "center" }}>
                      <span style={{ fontSize: "2.5rem", display: "block" }}>📍</span>
                      <p style={{
                        fontFamily: "var(--font-cinzel)",
                        fontSize: "0.55rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        marginTop: "8px",
                      }}>
                        {promo.comuna}
                      </p>
                    </div>
                  </div>

                  <p style={{
                    fontFamily: "var(--font-lato)",
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                    lineHeight: 1.6,
                    marginBottom: "8px",
                  }}>
                    {promo.direccion}
                  </p>
                  {promo.telefono && (
                    <p style={{
                      fontFamily: "var(--font-lato)",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                    }}>
                      📞 {promo.telefono}
                    </p>
                  )}
                </div>
              )}

              {/* Horarios del local */}
              {promo.horarioLocal && (
                <div className="dc-pd-card">
                  <h3 style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "12px",
                  }}>
                    Horarios del local
                  </h3>
                  <p style={{
                    fontFamily: "var(--font-lato)",
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                    lineHeight: 1.7,
                  }}>
                    {promo.horarioLocal}
                  </p>
                </div>
              )}

              {/* CTA ir al local */}
              <Link
                href={`/locales/${promo.localId}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  background: isHappyHour
                    ? "linear-gradient(135deg, #c8850a, #d4a017)"
                    : "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
                  color: "#07040f",
                  padding: "16px 24px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontWeight: 700,
                  minHeight: "56px",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
              >
                Ir al local →
              </Link>
            </div>
          </div>

          {/* ── Promociones relacionadas ─────────────────────────────── */}
          {relacionadas.length > 0 && (
            <div style={{ marginTop: "60px" }}>
              <div style={{ marginBottom: "32px" }}>
                <p style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "var(--oasis-bright)",
                  marginBottom: "8px",
                }}>
                  También te puede interesar
                </p>
                <h2 style={{
                  fontFamily: "var(--font-cinzel-decorative)",
                  fontSize: "1.6rem",
                  color: "var(--accent)",
                }}>
                  Promociones Relacionadas
                </h2>
              </div>
              <div className="dc-pd-related-grid">
                {relacionadas.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => router.push(`/promociones/${rel.id}`)}
                    style={{
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "16px",
                      padding: "20px",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = "translateY(-4px)";
                      el.style.borderColor = rel.tipo === "happy_hour" ? "#d4a017" : "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.transform = "translateY(0)";
                      el.style.borderColor = "var(--border-color)";
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontSize: "2rem" }}>{rel.imagen}</span>
                      <div>
                        <p style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.6rem",
                          letterSpacing: "0.15em",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}>
                          {rel.local}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.75rem",
                          color: rel.tipo === "happy_hour" ? "#d4a017" : "var(--accent)",
                          marginTop: "2px",
                        }}>
                          {TIPO_ICONS[rel.tipo]} {TIPO_LABELS[rel.tipo]}
                        </p>
                      </div>
                    </div>
                    <p style={{
                      fontFamily: "var(--font-lato)",
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                      lineHeight: 1.5,
                    }}>
                      {rel.titulo}
                    </p>
                    <p style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginTop: "10px",
                    }}>
                      {rel.horaInicio} – {rel.horaFin} · {rel.comuna}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />

      <style>{`
        .dc-pd-hero {
          position: relative;
          padding: 120px 60px 60px;
          text-align: center;
          overflow: hidden;
        }
        .dc-pd-content {
          padding: 0 60px 120px;
        }
        .dc-pd-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: start;
        }
        .dc-pd-main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .dc-pd-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .dc-pd-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 28px;
        }
        .dc-pd-card-title {
          font-family: var(--font-cinzel-decorative);
          font-size: 1.1rem;
          margin-bottom: 16px;
        }
        .dc-pd-related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @keyframes dc-promo-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes dc-pd-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(212,160,23,0.2); }
          50%       { box-shadow: 0 0 28px rgba(212,160,23,0.45); }
        }

        @media (max-width: 767px) {
          .dc-pd-hero    { padding: 100px 20px 40px; }
          .dc-pd-content { padding: 0 20px 80px; }
          .dc-pd-layout  { grid-template-columns: 1fr; }
          .dc-pd-related-grid { grid-template-columns: 1fr; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-pd-hero    { padding: 110px 40px 50px; }
          .dc-pd-content { padding: 0 40px 100px; }
          .dc-pd-layout  { grid-template-columns: 1fr 300px; }
          .dc-pd-related-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </main>
  );
}
