"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  CONCURSOS,
  CONCURSOS_FINALIZADOS,
  getTimeLeft,
  isSoonEnding,
  pad2,
  type RankingEntry,
} from "@/lib/mockConcursos";
import {
  REFS_KEY,
  savePendingRef,
  getRefCount,
  incrementRef,
  hasVisited,
  markVisited,
  getRefUserName,
} from "@/lib/referrals";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConcursoDetallePage() {
  const { id }         = useParams<{ id: string }>();
  const searchParams   = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const concursoId = Number(id);
  const refUserId  = searchParams.get("ref");
  const refNameFromUrl = searchParams.get("refName");

  const concurso   = CONCURSOS.find((c) => c.id === concursoId);
  const finalizado = CONCURSOS_FINALIZADOS.find((c) => c.id === concursoId);

  const [timer, setTimer] = useState(() =>
    concurso ? getTimeLeft(concurso.endsAt) : null
  );
  const [ranking, setRanking] = useState<RankingEntry[]>(() =>
    concurso ? concurso.ranking : (finalizado?.ranking ?? [])
  );
  const [copied,       setCopied]       = useState(false);
  const [refToast,     setRefToast]     = useState(false);
  const [newRefToast,  setNewRefToast]  = useState(false);
  const [newRefCount,  setNewRefCount]  = useState(0);
  const [myRefs,       setMyRefs]       = useState(0);
  const [refBannerName, setRefBannerName] = useState<string | null | undefined>(undefined);
  const [refBannerDismissed, setRefBannerDismissed] = useState(false);
  const refProcessed = useRef(false);

  const handleDismissRefBanner = () => {
    setRefBannerDismissed(true);
    // Keep the ref in localStorage so registration can still process it
    if (refUserId) savePendingRef(refUserId, concursoId);
  };

  // Tick countdown every second
  useEffect(() => {
    if (!concurso) return;
    const tick = () => setTimer(getTimeLeft(concurso.endsAt));
    tick();
    const iid = setInterval(tick, 1000);
    return () => clearInterval(iid);
  }, [concurso]);

  // Process incoming referral param
  useEffect(() => {
    if (!refUserId || refProcessed.current) return;
    if (authLoading) return; // Wait for session to resolve

    if (!isAuthenticated || !user) {
      // Unauthenticated: save pending ref so registration can process it
      savePendingRef(refUserId, concursoId);
      // Priority: URL param > localStorage > null (fallback to "tu amigo")
      const name = refNameFromUrl || getRefUserName(refUserId);
      setRefBannerName(name);
      return;
    }

    if (user.id === refUserId) return; // No self-referral
    if (hasVisited(concursoId, refUserId)) return;
    refProcessed.current = true;
    incrementRef(concursoId, refUserId);
    markVisited(concursoId, refUserId);
    setRefToast(true);
    setTimeout(() => setRefToast(false), 4000);
  }, [authLoading, isAuthenticated, user, concursoId, refUserId]);

  // Refresh ranking every 30s, merging localStorage referrals
  const refreshRanking = useCallback(() => {
    if (!concurso || !user) return;
    const myCount = getRefCount(concursoId, user.id);
    setMyRefs(myCount);
    if (myCount === 0) { setRanking(concurso.ranking); return; }
    const firstName = user.nombre.split(" ")[0];
    const lastInit  = user.nombre.split(" ")[1]?.[0] ?? "";
    const myEntry: RankingEntry = { nombre: `${firstName} ${lastInit}.`, referidos: myCount };
    const base   = concurso.ranking.filter((r) => r.nombre !== myEntry.nombre);
    const merged = [...base, myEntry].sort((a, b) => b.referidos - a.referidos);
    setRanking(merged);
  }, [concurso, concursoId, user]);

  useEffect(() => {
    refreshRanking();
    const iid = setInterval(refreshRanking, 30_000);
    return () => clearInterval(iid);
  }, [refreshRanking]);

  useEffect(() => {
    if (user) setMyRefs(getRefCount(concursoId, user.id));
  }, [user, concursoId]);

  // Cross-tab: notify referrer when someone registers via their link
  useEffect(() => {
    if (!user) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== REFS_KEY || !e.newValue) return;
      try {
        const newStore = JSON.parse(e.newValue) as Record<string, number>;
        const oldStore = e.oldValue ? (JSON.parse(e.oldValue) as Record<string, number>) : {};
        const myKey    = `${concursoId}_${user.id}`;
        const oldCount = oldStore[myKey] ?? 0;
        const newCount = newStore[myKey] ?? 0;
        if (newCount > oldCount) {
          setNewRefCount(newCount);
          setNewRefToast(true);
          setTimeout(() => setNewRefToast(false), 5000);
          refreshRanking();
        }
      } catch { /* noop */ }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [user, concursoId, refreshRanking]);

  // 404
  if (!concurso && !finalizado) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "160px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "4rem", marginBottom: "20px" }}>🔍</p>
          <h2 style={{
            fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem",
            color: "var(--accent)", marginBottom: "24px",
          }}>
            Concurso no encontrado
          </h2>
          <Link href="/concursos" style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
            letterSpacing: "0.15em", textTransform: "uppercase",
            color: "var(--oasis-bright)", textDecoration: "none",
          }}>
            ← Volver a concursos
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const c       = concurso ?? finalizado!;
  const isEnded = !!finalizado || !!timer?.ended;
  const soon    = concurso ? isSoonEnding(concurso.endsAt) : false;
  const refLink = isAuthenticated && user
    ? `https://deseocomer.com/concursos/${concursoId}?ref=${user.id}&refName=${encodeURIComponent(user.nombre.split(" ")[0])}`
    : null;

  const copyLink = async () => {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* noop */ }
  };

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Ref credited toast (shown to the visitor who registered via a link) */}
      {refToast && (
        <div style={{
          position: "fixed", bottom: "32px", left: "50%",
          transform: "translateX(-50%)", zIndex: 200,
          background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
          color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)",
          fontSize: "0.75rem", letterSpacing: "0.1em",
          padding: "14px 28px", borderRadius: "30px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "dc-slideUp 0.3s ease",
          whiteSpace: "nowrap",
        }}>
          ✓ ¡Referido contabilizado! Alguien llegó por tu link.
        </div>
      )}

      {/* New ref cross-tab toast (shown to the referrer in another tab) */}
      {newRefToast && (
        <div style={{
          position: "fixed", bottom: "32px", left: "50%",
          transform: "translateX(-50%)", zIndex: 200,
          background: "linear-gradient(135deg, #e8a84c, #f5c97a)",
          color: "#1a1008", fontFamily: "var(--font-cinzel)",
          fontSize: "0.75rem", letterSpacing: "0.1em",
          padding: "14px 28px", borderRadius: "30px",
          boxShadow: "0 8px 32px rgba(232,168,76,0.45)",
          animation: "dc-slideUp 0.3s ease",
          whiteSpace: "nowrap",
        }}>
          🎉 ¡Nuevo referido! Ya tienes {newRefCount} referido{newRefCount !== 1 ? "s" : ""} en este concurso.
        </div>
      )}

      {/* Referral modal — centered shadow box for unauthenticated visitors via ref link */}
      {refUserId && refBannerName !== undefined && !isAuthenticated && !refBannerDismissed && (() => {
        const displayName = refBannerName ?? "tu amigo";
        return (
          <>
            {/* Overlay oscuro */}
            <div
              onClick={handleDismissRefBanner}
              style={{
                position: "fixed", inset: 0, zIndex: 999,
                background: "rgba(0,0,0,0.7)",
              }}
            />
            {/* Modal centrado */}
            <div style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%", maxWidth: "480px", zIndex: 1000,
              background: "rgba(13,7,3,0.98)",
              border: "1px solid rgba(232,168,76,0.5)",
              borderRadius: "20px",
              boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 30px rgba(232,168,76,0.15)",
              padding: "36px 28px",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: "var(--font-cinzel-decorative)",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "var(--sand-gold)",
                marginBottom: "16px",
                lineHeight: 1.4,
              }}>
                🏮 ¡{displayName} te invitó a ganar comida gratis!
              </p>
              <p style={{
                fontFamily: "var(--font-lato)", fontSize: "1rem",
                color: "var(--text-primary)", lineHeight: 1.7,
                marginBottom: "24px", fontWeight: 400,
              }}>
                <strong style={{ color: "var(--accent)" }}>{displayName}</strong> está participando en el concurso{" "}
                <strong style={{ color: "var(--accent)" }}>{c.premio}</strong> y necesita tu ayuda para sumar puntos.
                Regístrate gratis, súmale 1 punto y tú también entras a ganar.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                <Link href={`/registro?ref=${refUserId}&concurso=${concursoId}`} style={{
                  fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.78rem, 2.5vw, 0.88rem)",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  background: "var(--accent)", color: "var(--bg-primary)",
                  fontWeight: 700, padding: "14px 28px", borderRadius: "14px",
                  textDecoration: "none", display: "inline-flex", alignItems: "center",
                  justifyContent: "center", minHeight: "48px", width: "100%", maxWidth: "380px",
                }}>
                  🎉 Registrarme y sumarle un punto a {displayName}
                </Link>
                <button onClick={handleDismissRefBanner} style={{
                  fontFamily: "var(--font-cinzel)", fontSize: "0.85rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  background: "none", border: "none", color: "rgba(255,255,255,0.6)",
                  cursor: "pointer", padding: "8px 16px", fontWeight: 400,
                }}>
                  Cerrar
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {/* Banner */}
      <section className="dc-cd-banner">
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 60%)",
        }} />
        <Link href="/concursos" style={{
          position: "relative", display: "inline-flex", alignItems: "center", gap: "6px",
          fontFamily: "var(--font-cinzel)", fontSize: "0.65rem",
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "var(--text-muted)", textDecoration: "none", marginBottom: "36px",
        }}>
          ← Todos los concursos
        </Link>

        <div style={{
          position: "relative", display: "flex",
          alignItems: "center", gap: "28px", flexWrap: "wrap",
        }}>
          {c.imagenUrl ? (
            <div style={{
              width: "clamp(80px, 15vw, 120px)", height: "clamp(80px, 15vw, 120px)",
              borderRadius: "16px", overflow: "hidden", flexShrink: 0,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              border: "1px solid var(--border-color)",
            }}>
              <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <span style={{
              fontSize: "clamp(3.5rem, 10vw, 6rem)",
              filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))",
            }}>
              {c.imagen}
            </span>
          )}
          <div>
            <p style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.65rem",
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: "var(--oasis-bright)", marginBottom: "10px",
            }}>
              {c.local}
            </p>
            <h1 style={{
              fontFamily: "var(--font-cinzel-decorative)",
              fontSize: "clamp(1.4rem, 4.5vw, 2.8rem)",
              color: "var(--accent)",
              textShadow: "0 0 40px color-mix(in srgb, var(--accent) 50%, transparent)",
              marginBottom: "12px", lineHeight: 1.2,
            }}>
              {c.premio}
            </h1>
            {"descripcionPremio" in c && (
              <p style={{
                fontFamily: "var(--font-lato)", fontSize: "0.95rem",
                color: "var(--text-primary)", fontWeight: 400,
                maxWidth: "520px", lineHeight: 1.7,
              }}>
                {(c as typeof c & { descripcionPremio: string }).descripcionPremio}
              </p>
            )}
            {isEnded && "fechaFin" in c && (
              <div style={{
                display: "inline-block", marginTop: "12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border-color)",
                borderRadius: "20px", padding: "6px 16px",
                fontFamily: "var(--font-cinzel)", fontSize: "0.58rem",
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "var(--text-muted)",
              }}>
                Concurso finalizado · {(c as typeof c & { fechaFin: string }).fechaFin}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="dc-cd-body">
        {/* Main column */}
        <div className="dc-cd-main">

          {/* Big countdown */}
          {!isEnded && timer && (
            <div className="dc-cd-block">
              <SectionTitle>⏱ Cuenta regresiva</SectionTitle>
              <BigTimer timer={timer} soon={soon} />
            </div>
          )}

          {/* Steps */}
          <div className="dc-cd-block">
            <SectionTitle>Cómo participar</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {[
                { n: "1", icon: "👤", title: "Regístrate", desc: "Crea tu cuenta gratis en DeseoComer. Solo toma un minuto y es completamente gratuito." },
                { n: "2", icon: "🔗", title: "Comparte tu link", desc: "Copia tu link único y compártelo con amigos por WhatsApp, Instagram o donde quieras." },
                { n: "3", icon: "🏆", title: "Gana", desc: "Quien más referidos válidos tenga al cierre del concurso se lleva el premio del local." },
              ].map(({ n, icon, title, desc }) => (
                <div key={n} style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "42px", height: "42px", flexShrink: 0, borderRadius: "50%",
                    background: "color-mix(in srgb, var(--accent) 12%, var(--bg-primary))",
                    border: "1px solid var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem",
                    color: "var(--accent)",
                  }}>
                    {n}
                  </div>
                  <div>
                    <p style={{
                      fontFamily: "var(--font-cinzel)", fontSize: "0.82rem",
                      letterSpacing: "0.08em", color: "var(--text-primary)",
                      fontWeight: 600, marginBottom: "6px",
                    }}>
                      {icon} {title}
                    </p>
                    <p style={{
                      fontFamily: "var(--font-lato)", fontSize: "0.88rem",
                      color: "var(--text-muted)", lineHeight: 1.65,
                    }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral link */}
          {!isEnded && (
            <div className="dc-cd-block">
              <SectionTitle>Tu link de participación</SectionTitle>
              {isAuthenticated && refLink ? (
                <div>
                  {myRefs > 0 && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      marginBottom: "20px",
                      background: "color-mix(in srgb, var(--oasis-teal) 10%, transparent)",
                      border: "1px solid rgba(42,122,111,0.4)",
                      borderRadius: "12px", padding: "14px 18px",
                    }}>
                      <span style={{ fontSize: "1.4rem" }}>🎉</span>
                      <p style={{
                        fontFamily: "var(--font-lato)", fontSize: "0.9rem",
                        color: "var(--text-primary)",
                      }}>
                        Ya tienes{" "}
                        <strong style={{ color: "var(--oasis-bright)" }}>
                          {myRefs} referido{myRefs !== 1 ? "s" : ""}
                        </strong>{" "}
                        en este concurso. ¡Sigue compartiendo!
                      </p>
                    </div>
                  )}
                  <div style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "14px", padding: "18px 20px",
                    display: "flex", gap: "12px", alignItems: "center",
                    flexWrap: "wrap",
                  }}>
                    <p style={{
                      fontFamily: "var(--font-lato)", fontSize: "0.8rem",
                      color: "var(--text-muted)", flex: 1,
                      wordBreak: "break-all", minWidth: "180px",
                    }}>
                      {refLink}
                    </p>
                    <button
                      onClick={copyLink}
                      style={{
                        flexShrink: 0,
                        background: copied
                          ? "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))"
                          : "transparent",
                        border: "1px solid var(--accent)",
                        borderRadius: "10px",
                        fontFamily: "var(--font-cinzel)", fontSize: "0.65rem",
                        letterSpacing: "0.12em", textTransform: "uppercase",
                        color: copied ? "var(--bg-primary)" : "var(--accent)",
                        padding: "10px 20px", cursor: "pointer",
                        fontWeight: 700, transition: "all 0.2s",
                        minHeight: "44px",
                      }}
                    >
                      {copied ? "✓ Copiado" : "Copiar link"}
                    </button>
                  </div>
                  <p style={{
                    fontFamily: "var(--font-lato)", fontSize: "0.76rem",
                    color: "var(--text-muted)", marginTop: "12px", lineHeight: 1.6,
                  }}>
                    Comparte por WhatsApp, Instagram o donde quieras. Cada nueva cuenta registrada suma 1 punto.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "14px", padding: "40px",
                  textAlign: "center",
                }}>
                  <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔐</p>
                  <p style={{
                    fontFamily: "var(--font-lato)", fontSize: "0.95rem",
                    color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.7,
                  }}>
                    Inicia sesión para obtener tu link personal único y empezar a sumar referidos.
                  </p>
                  <Link
                    href={`/login?next=/concursos/${concursoId}`}
                    style={{
                      display: "inline-block",
                      background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
                      fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      color: "var(--bg-primary)", fontWeight: 700,
                      padding: "14px 32px", borderRadius: "30px",
                      textDecoration: "none",
                    }}
                  >
                    Inicia sesión para participar
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Rules */}
          {"reglas" in c && (
            <div className="dc-cd-block">
              <SectionTitle>📋 Reglas del concurso</SectionTitle>
              <div style={{
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--border-color)",
                borderRadius: "14px", padding: "24px 28px",
              }}>
                <ol style={{ margin: 0, paddingLeft: "20px" }}>
                  {(c as typeof c & { reglas: string[] }).reglas.map((r, i, arr) => (
                    <li key={i} style={{
                      fontFamily: "var(--font-lato)", fontSize: "0.88rem",
                      color: "var(--text-muted)", lineHeight: 1.7,
                      marginBottom: i < arr.length - 1 ? "10px" : 0,
                    }}>
                      {r}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* Local info */}
          {"descripcionLocal" in c && (
            <div className="dc-cd-block">
              <SectionTitle>🏪 Sobre {c.local}</SectionTitle>
              <div style={{
                display: "flex", gap: "20px", alignItems: "flex-start",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid var(--border-color)",
                borderRadius: "14px", padding: "24px",
              }}>
                <span style={{ fontSize: "2.5rem", flexShrink: 0 }}>{c.imagen}</span>
                <div>
                  <p style={{
                    fontFamily: "var(--font-lato)", fontSize: "0.9rem",
                    color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "16px",
                  }}>
                    {(c as typeof c & { descripcionLocal: string }).descripcionLocal}
                  </p>
                  <Link href={`/locales/${c.localId}`} style={{
                    fontFamily: "var(--font-cinzel)", fontSize: "0.65rem",
                    letterSpacing: "0.15em", textTransform: "uppercase",
                    color: "var(--oasis-bright)", textDecoration: "none",
                    borderBottom: "1px solid rgba(61,184,158,0.3)", paddingBottom: "2px",
                  }}>
                    Ver perfil del local →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: ranking */}
        <div className="dc-cd-sidebar">
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "20px", padding: "28px",
            position: "sticky", top: "100px",
          }}>
            <p style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.58rem",
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: "var(--oasis-bright)", marginBottom: "6px",
            }}>
              Ranking en tiempo real
            </p>
            <h2 style={{
              fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.05rem",
              color: "var(--accent)", marginBottom: "28px",
            }}>
              🏆 Tabla de posiciones
            </h2>

            {/* Podium */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px", marginBottom: "20px",
            }}>
              {ranking.slice(0, 3).map((r, i) => {
                const podiumColors = [
                  { bg: "linear-gradient(135deg,#ffd700,#ffb300)", glow: "rgba(255,215,0,0.45)", border: "rgba(255,215,0,0.4)" },
                  { bg: "linear-gradient(135deg,#c0c0c0,#9e9e9e)", glow: "rgba(192,192,192,0.2)", border: "rgba(192,192,192,0.25)" },
                  { bg: "linear-gradient(135deg,#cd7f32,#a0522d)", glow: "rgba(205,127,50,0.2)", border: "rgba(205,127,50,0.25)" },
                ][i];
                return (
                  <div key={i} style={{
                    padding: "14px 6px", borderRadius: "12px",
                    background: "rgba(0,0,0,0.2)",
                    border: `1px solid ${podiumColors.border}`,
                    textAlign: "center",
                  }}>
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "50%",
                      background: podiumColors.bg, margin: "0 auto 8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.1rem",
                      boxShadow: `0 0 16px ${podiumColors.glow}`,
                    }}>
                      {["🥇", "🥈", "🥉"][i]}
                    </div>
                    <p style={{
                      fontFamily: "var(--font-lato)", fontSize: "0.75rem",
                      color: "var(--text-primary)", fontWeight: 600, marginBottom: "2px",
                    }}>
                      {r.nombre.split(" ")[0]}
                    </p>
                    <p style={{
                      fontFamily: "var(--font-cinzel)", fontSize: "0.6rem",
                      letterSpacing: "0.08em", color: "var(--oasis-bright)",
                    }}>
                      {r.referidos} refs
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Rest of ranking */}
            {ranking.slice(3).map((r, i) => {
              const pos  = i + 4;
              const isMe = isAuthenticated && user &&
                r.nombre.startsWith(user.nombre.split(" ")[0]);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: isMe ? "9px 8px" : "9px 0",
                  borderTop: "1px solid var(--border-color)",
                  borderRadius: isMe ? "8px" : 0,
                  background: isMe
                    ? "color-mix(in srgb, var(--accent) 6%, transparent)"
                    : "transparent",
                }}>
                  <span style={{
                    fontFamily: "var(--font-cinzel)", fontSize: "0.62rem",
                    color: "var(--text-muted)", width: "18px",
                    textAlign: "center", flexShrink: 0,
                  }}>
                    {pos}
                  </span>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                    background: isMe
                      ? "color-mix(in srgb, var(--accent) 20%, var(--bg-primary))"
                      : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isMe ? "var(--accent)" : "var(--border-color)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-cinzel)", fontSize: "0.58rem",
                    color: isMe ? "var(--accent)" : "var(--text-muted)",
                  }}>
                    {r.nombre.charAt(0)}
                  </div>
                  <span style={{
                    fontFamily: "var(--font-lato)", fontSize: "0.82rem",
                    color: isMe ? "var(--accent)" : "var(--text-primary)",
                    flex: 1, fontWeight: isMe ? 700 : 400,
                  }}>
                    {r.nombre}{isMe ? " (tú)" : ""}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-cinzel)", fontSize: "0.62rem",
                    color: "var(--oasis-bright)", flexShrink: 0,
                  }}>
                    {r.referidos}
                  </span>
                </div>
              );
            })}

            <p style={{
              fontFamily: "var(--font-lato)", fontSize: "0.68rem",
              color: "var(--text-muted)", textAlign: "center",
              marginTop: "20px", paddingTop: "16px",
              borderTop: "1px solid var(--border-color)",
            }}>
              Actualizado cada 30 segundos
            </p>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        .dc-cd-banner {
          position: relative; overflow: hidden;
          padding: 120px 60px 60px;
          border-bottom: 1px solid var(--border-color);
        }
        .dc-cd-body {
          max-width: 1200px; margin: 0 auto;
          padding: 60px 60px 80px;
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 48px; align-items: start;
        }
        .dc-cd-main { min-width: 0; }
        .dc-cd-sidebar { min-width: 0; }
        .dc-cd-block { margin-bottom: 48px; }

        @keyframes dc-slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @media (max-width: 1023px) {
          .dc-cd-body { grid-template-columns: 1fr; padding: 40px 40px 60px; }
          .dc-cd-sidebar { order: -1; }
          .dc-cd-sidebar > div { position: static !important; }
        }
        @media (max-width: 767px) {
          .dc-cd-banner { padding: 96px 20px 40px; }
          .dc-cd-body { padding: 28px 20px 60px; }
        }
      `}</style>
    </main>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: "var(--font-cinzel)", fontSize: "0.72rem",
      letterSpacing: "0.25em", textTransform: "uppercase",
      color: "var(--accent)", marginBottom: "22px",
      paddingBottom: "12px", borderBottom: "1px solid var(--border-color)",
    }}>
      {children}
    </h2>
  );
}

function BigTimer({
  timer,
  soon,
}: {
  timer: { dias: number; horas: number; minutos: number; segundos: number; ended: boolean };
  soon: boolean;
}) {
  const col  = soon ? "#ff4444" : "var(--accent)";
  const glow = soon
    ? "rgba(255,68,68,0.55)"
    : "color-mix(in srgb, var(--accent) 55%, transparent)";

  return (
    <div style={{
      background: "rgba(0,0,0,0.28)",
      border: `1px solid ${soon ? "rgba(255,68,68,0.4)" : "var(--border-color)"}`,
      borderRadius: "20px", padding: "40px 24px",
      textAlign: "center",
      boxShadow: soon ? "0 0 40px rgba(255,68,68,0.08)" : "none",
    }}>
      {soon && (
        <p style={{
          fontFamily: "var(--font-cinzel)", fontSize: "0.6rem",
          letterSpacing: "0.35em", textTransform: "uppercase",
          color: "#ff5555", marginBottom: "20px",
          animation: "dc-blink 1s ease-in-out infinite",
        }}>
          ⚡ ¡Últimas horas! No pierdas tu oportunidad
        </p>
      )}
      <div style={{
        display: "flex", justifyContent: "center",
        alignItems: "flex-start", gap: "6px", flexWrap: "wrap",
      }}>
        {timer.dias > 0 && (
          <>
            <BigUnit value={timer.dias}    label="días"    col={col} glow={glow} />
            <Colon />
          </>
        )}
        <BigUnit value={timer.horas}    label="horas"    col={col} glow={glow} />
        <Colon />
        <BigUnit value={timer.minutos}  label="minutos"  col={col} glow={glow} />
        <Colon />
        <BigUnit value={timer.segundos} label="segundos" col={col} glow={glow} />
      </div>
      <style>{`
        @keyframes dc-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

function Colon() {
  return (
    <span style={{
      color: "var(--text-muted)", fontSize: "2.5rem",
      marginTop: "10px", lineHeight: 1,
    }}>
      :
    </span>
  );
}

function BigUnit({ value, label, col, glow }: {
  value: number; label: string; col: string; glow: string;
}) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.3)",
      border: "1px solid var(--border-color)",
      borderRadius: "14px", padding: "16px 18px",
      minWidth: "72px",
    }}>
      <p style={{
        fontFamily: "var(--font-cinzel-decorative)",
        fontSize: "clamp(1.8rem, 5vw, 3.2rem)",
        lineHeight: 1, color: col,
        textShadow: `0 0 30px ${glow}`,
      }}>
        {pad2(value)}
      </p>
      <p style={{
        fontFamily: "var(--font-cinzel)", fontSize: "0.52rem",
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: "var(--text-muted)", marginTop: "8px",
      }}>
        {label}
      </p>
    </div>
  );
}
