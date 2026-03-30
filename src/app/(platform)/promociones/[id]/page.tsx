"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  PROMOCIONES,
  TIPO_LABELS,
  DIAS_SHORT,
  pad2,
  isPromocionActivaAhora,
  terminaEnMenos2Horas,
  getTimerHastaFin,
  type Promocion,
} from "@/lib/mockPromociones";

function getSello(promo: Promocion): { text: string; color: string } | null {
  if (promo.tipo === "happy_hour") return { text: "HAPPY HOUR", color: "#d4a017" };
  if (promo.tipo === "2x1") return { text: "2\u00d71", color: "#3db89e" };
  if (promo.porcentajeDescuento) return { text: `-${promo.porcentajeDescuento}%`, color: "#ff6644" };
  if (promo.tipo === "cupon") return { text: "CUP\u00d3N", color: "#8040d0" };
  return { text: "REGALO", color: "#e8a84c" };
}

export default function PromocionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const promo = PROMOCIONES.find((p) => p.id === id);
  const relacionadas = PROMOCIONES.filter(
    (p) => p.id !== id && p.activa && !p.esCumpleanos && (p.localId === promo?.localId || p.categoria === promo?.categoria)
  ).slice(0, 6);

  const [mounted, setMounted] = useState(false);
  const [isActiva, setIsActiva] = useState(false);
  const [isUltimas, setIsUltimas] = useState(false);
  const [timer, setTimer] = useState({ horas: 0, minutos: 0, segundos: 0 });
  const [copiado, setCopiado] = useState(false);

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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "20px", padding: "120px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "4rem" }}>🔍</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", color: "var(--accent)" }}>Promoción no encontrada</h2>
          <p style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>Esta promoción no existe o ya no está disponible.</p>
          <Link href="/promociones" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))", color: "var(--bg-primary)", padding: "12px 28px", borderRadius: "30px", textDecoration: "none", fontWeight: 700 }}>
            Ver todas las promociones
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const sello = getSello(promo);

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── Hero: full-width image header ── */}
      <section className="dc-pd-hero">
        {promo.imagenUrl ? (
          <>
            <img src={promo.imagenUrl} alt={promo.titulo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,13,24,0.3) 0%, rgba(8,13,24,0.85) 70%, var(--bg-primary) 100%)" }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(232,168,76,0.12) 0%, transparent 70%)" }} />
        )}

        {/* Sello pill */}
        {sello && (
          <div style={{ position: "absolute", top: "100px", right: "clamp(20px, 5vw, 60px)", zIndex: 3, pointerEvents: "none", background: "rgba(13,7,3,0.88)", border: `1px solid ${sello.color}`, borderRadius: "20px", padding: "6px 16px" }}>
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, color: sello.color, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{sello.text}</span>
          </div>
        )}

        {/* Back button */}
        <button onClick={() => router.push("/promociones")} className="dc-pd-back">
          {"\u2190"} Promociones
        </button>

        {/* Hero content overlay */}
        <div style={{ position: "relative", zIndex: 2 }}>
          {/* Tipo badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", padding: "5px 14px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.3)", color: "rgba(240,234,214,0.8)", marginBottom: "16px", backdropFilter: "blur(4px)" }}>
            {TIPO_LABELS[promo.tipo]}
          </div>

          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem, 4vw, 2.8rem)", color: "#f5d080", textShadow: "0 2px 20px rgba(0,0,0,0.6)", marginBottom: "12px", lineHeight: 1.25, maxWidth: "700px", margin: "0 auto 12px" }}>
            {promo.titulo}
          </h1>

          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", letterSpacing: "0.08em", color: "rgba(240,234,214,0.7)" }}>
            {promo.local} · {promo.comuna}
          </p>

          {/* Active badge */}
          {mounted && isActiva && (
            <div style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "20px", background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.4)", backdropFilter: "blur(4px)" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--oasis-bright)", display: "inline-block", animation: "dc-pd-blink 1.5s infinite" }} />
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.15em", color: "var(--oasis-bright)", textTransform: "uppercase" }}>Activa ahora</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Two-column content ── */}
      <section className="dc-pd-content">
        <div className="dc-pd-layout">

          {/* ── Left: info ── */}
          <div className="dc-pd-main">

            {/* Descripción */}
            <div className="dc-pd-card">
              <h2 className="dc-pd-card-title">Sobre esta promoción</h2>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.75 }}>
                {promo.descripcion}
              </p>

              {/* Precios */}
              {(promo.precioOriginal || promo.precioDescuento) && (
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "24px", padding: "20px", background: "rgba(0,0,0,0.25)", borderRadius: "14px", border: "1px solid rgba(232,168,76,0.12)", flexWrap: "wrap" }}>
                  {promo.precioOriginal && (
                    <div>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Normal</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "1.2rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                        ${promo.precioOriginal.toLocaleString("es-CL")}
                      </p>
                    </div>
                  )}
                  {promo.precioDescuento && (
                    <>
                      <span style={{ color: "rgba(232,168,76,0.3)", fontSize: "1.5rem" }}>{"\u2192"}</span>
                      <div>
                        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "4px" }}>Ahora</p>
                        <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.8rem", color: "#f5d080", fontWeight: 700 }}>
                          ${promo.precioDescuento.toLocaleString("es-CL")}
                        </p>
                      </div>
                    </>
                  )}
                  {promo.porcentajeDescuento && (
                    <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", fontWeight: 700, padding: "8px 16px", borderRadius: "30px", background: "rgba(255,80,32,0.12)", color: "#ff5020", border: "1px solid rgba(255,80,32,0.25)" }}>
                      -{promo.porcentajeDescuento}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Código de cupón */}
            {promo.codigoCupon && (
              <div className="dc-pd-card" style={{ border: "1px solid rgba(95,240,208,0.25)", background: "rgba(61,184,158,0.04)" }}>
                <h2 className="dc-pd-card-title" style={{ color: "var(--oasis-bright)" }}>Código de cupón</h2>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Presenta este código al momento de pagar:
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", letterSpacing: "0.15em", color: "var(--oasis-bright)", padding: "14px 24px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "2px dashed rgba(95,240,208,0.35)", textShadow: "0 0 20px rgba(95,240,208,0.3)", flex: 1, textAlign: "center", minWidth: "180px" }}>
                    {promo.codigoCupon}
                  </div>
                  <button onClick={copiarCodigo} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 24px", borderRadius: "12px", border: "none", background: copiado ? "linear-gradient(135deg, #2a7a6f, #3db89e)" : "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))", color: "var(--bg-primary)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                    {copiado ? "\u2713 Copiado" : "Copiar"}
                  </button>
                </div>
                {promo.limiteUsos && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      <span>{promo.usosActuales ?? 0} usados</span>
                      <span>{promo.limiteUsos} máximo</span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, ((promo.usosActuales ?? 0) / promo.limiteUsos) * 100)}%`, background: "linear-gradient(90deg, var(--oasis-teal), var(--oasis-bright))", borderRadius: "4px" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timer countdown */}
            {mounted && isUltimas && (
              <div className="dc-pd-card" style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.3)", animation: "dc-pd-glow 2s ease-in-out infinite" }}>
                <h2 className="dc-pd-card-title" style={{ color: "#d4a017" }}>{"\u26a1"} Termina en:</h2>
                <div style={{ display: "flex", gap: "16px", justifyContent: "center", paddingTop: "4px" }}>
                  {[
                    { val: timer.horas, lbl: "hrs" },
                    { val: timer.minutos, lbl: "min" },
                    { val: timer.segundos, lbl: "seg" },
                  ].map(({ val, lbl }, idx) => (
                    <div key={lbl} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "2.4rem", lineHeight: 1, color: "#d4a017", textShadow: "0 0 24px rgba(212,160,23,0.5)", minWidth: "56px", padding: "12px 16px", background: "rgba(0,0,0,0.3)", borderRadius: "10px", border: "1px solid rgba(212,160,23,0.2)" }}>
                          {pad2(val)}
                        </div>
                        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.45rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "6px" }}>{lbl}</p>
                      </div>
                      {idx < 2 && <span style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.8rem", color: "#d4a017", opacity: 0.5, marginBottom: "18px" }}>:</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sobre el local */}
            {promo.descripcionLocal && (
              <div className="dc-pd-card">
                <h2 className="dc-pd-card-title">Sobre {promo.local}</h2>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.75, marginBottom: "20px" }}>
                  {promo.descripcionLocal}
                </p>
                <Link href={`/locales/${promo.localId}`} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px", borderRadius: "30px", border: "1px solid rgba(232,168,76,0.2)", color: "var(--accent)", textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLAnchorElement).style.background = "rgba(232,168,76,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(232,168,76,0.2)"; (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                >
                  Ver perfil del local {"\u2192"}
                </Link>
              </div>
            )}
          </div>

          {/* ── Right: action card sidebar ── */}
          <div className="dc-pd-sidebar">

            {/* Horario card */}
            <div className="dc-pd-card">
              <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "16px" }}>
                Horario de la promoción
              </h3>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.6rem", color: "#f5d080" }}>
                  {promo.horaInicio} – {promo.horaFin}
                </p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Hasta {promo.fechaVencimiento}
                </p>
              </div>

              {/* Day circles */}
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
                Días válidos
              </p>
              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                {DIAS_SHORT.map((dia, idx) => {
                  const active = promo.diasSemana.includes(idx);
                  return (
                    <div key={idx} style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: active ? "1.5px solid var(--accent)" : "1px solid rgba(232,168,76,0.15)", background: active ? "rgba(232,168,76,0.12)" : "transparent", color: active ? "#f5d080" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", fontWeight: active ? 700 : 400, letterSpacing: "0.05em", transition: "all 0.2s" }}>
                      {dia}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ubicación */}
            {promo.direccion && (
              <div className="dc-pd-card">
                <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "14px" }}>
                  Ubicación
                </h3>
                <div style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: "12px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.02) 19px, rgba(255,255,255,0.02) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(255,255,255,0.02) 19px, rgba(255,255,255,0.02) 20px)" }} />
                  <div style={{ position: "relative", textAlign: "center" }}>
                    <span style={{ fontSize: "2rem", display: "block" }}>{"\ud83d\udccd"}</span>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "6px" }}>{promo.comuna}</p>
                  </div>
                </div>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.5, marginBottom: "6px" }}>
                  {promo.direccion}
                </p>
                {promo.telefono && (
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {"\ud83d\udcde"} {promo.telefono}
                  </p>
                )}
              </div>
            )}

            {/* Horario del local */}
            {promo.horarioLocal && (
              <div className="dc-pd-card">
                <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
                  Horarios del local
                </h3>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.7 }}>
                  {promo.horarioLocal}
                </p>
              </div>
            )}

            {/* CTA */}
            <Link href={`/locales/${promo.localId}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))", color: "#07040f", padding: "16px 24px", borderRadius: "12px", textDecoration: "none", fontWeight: 700, transition: "opacity 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            >
              Ir al local {"\u2192"}
            </Link>
          </div>
        </div>

        {/* ── Related promotions horizontal scroll ── */}
        {relacionadas.length > 0 && (
          <div style={{ marginTop: "60px", maxWidth: "1000px", margin: "60px auto 0" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", marginBottom: "8px" }}>
              También te puede interesar
            </p>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "#f5d080", marginBottom: "24px" }}>
              Promociones Relacionadas
            </h2>
            <div className="dc-pd-related-scroll">
              {relacionadas.map((rel) => {
                const relSello = getSello(rel);
                const relActiva = isPromocionActivaAhora(rel);
                return (
                  <Link key={rel.id} href={`/promociones/${rel.id}`} className="dc-pd-related-card" style={{ textDecoration: "none", display: "block" }}>
                    {rel.imagenUrl && (
                      <div style={{ position: "relative", height: "120px", overflow: "hidden", borderRadius: "14px 14px 0 0" }}>
                        <img src={rel.imagenUrl} alt={rel.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        {relSello && (
                          <div style={{ position: "absolute", top: "8px", right: "8px", pointerEvents: "none", background: "rgba(13,7,3,0.88)", border: `1px solid ${relSello.color}`, borderRadius: "16px", padding: "3px 10px" }}>
                            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", fontWeight: 700, color: relSello.color, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{relSello.text}</span>
                          </div>
                        )}
                        {relActiva && (
                          <div style={{ position: "absolute", bottom: "8px", left: "8px", display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "12px", background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.35)", backdropFilter: "blur(4px)" }}>
                            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--oasis-bright)", display: "inline-block" }} />
                            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.45rem", letterSpacing: "0.1em", color: "var(--oasis-bright)", textTransform: "uppercase" }}>Activa</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ padding: "14px" }}>
                      <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.82rem", color: "#f5d080", marginBottom: "4px", lineHeight: 1.3 }}>{rel.titulo}</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.55)" }}>{rel.local} · {rel.comuna}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <Footer />

      <style>{`
        .dc-pd-hero {
          position: relative;
          padding: 160px 24px 60px;
          text-align: center;
          overflow: hidden;
          min-height: 340px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .dc-pd-back {
          position: absolute;
          top: 100px;
          left: clamp(20px, 5vw, 60px);
          font-family: var(--font-cinzel);
          font-size: 0.6rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(240,234,214,0.75);
          padding: 8px 18px;
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 3;
        }
        .dc-pd-back:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .dc-pd-content {
          padding: 40px clamp(20px, 5vw, 60px) 100px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .dc-pd-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 28px;
          align-items: start;
        }
        .dc-pd-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .dc-pd-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 100px;
        }
        .dc-pd-card {
          background: rgba(8,13,24,0.85);
          border: 1px solid rgba(232,168,76,0.12);
          border-radius: 16px;
          padding: 24px;
        }
        .dc-pd-card-title {
          font-family: var(--font-cinzel-decorative);
          font-size: 1rem;
          color: #f5d080;
          margin-bottom: 14px;
        }
        .dc-pd-related-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .dc-pd-related-scroll::-webkit-scrollbar { display: none; }
        .dc-pd-related-card {
          flex-shrink: 0;
          width: 260px;
          background: rgba(8,13,24,0.85);
          border: 1px solid rgba(232,168,76,0.12);
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.2s, border-color 0.2s;
          color: inherit;
        }
        .dc-pd-related-card:hover {
          transform: translateY(-4px);
          border-color: rgba(232,168,76,0.35);
        }

        @keyframes dc-pd-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes dc-pd-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(212,160,23,0.15); }
          50% { box-shadow: 0 0 24px rgba(212,160,23,0.35); }
        }

        @media (max-width: 767px) {
          .dc-pd-hero { padding: 120px 20px 40px; min-height: 280px; }
          .dc-pd-back { top: 80px; left: 16px; }
          .dc-pd-content { padding: 24px 16px 80px; }
          .dc-pd-layout { grid-template-columns: 1fr; }
          .dc-pd-sidebar { position: static; }
          .dc-pd-related-card { width: 240px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-pd-hero { padding: 140px 24px 50px; }
          .dc-pd-layout { grid-template-columns: 1fr 280px; }
        }
      `}</style>
    </main>
  );
}
