"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import SelloGratis from "@/components/SelloGratis";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import {
  CONCURSOS,
  CONCURSOS_FINALIZADOS,
  LOCAL_IMAGES,
  findConcurso,
  getRefCode,
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
  findUserByRefCode,
  hasSupportedToday,
  supportUser,
} from "@/lib/referrals";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConcursoDetallePage() {
  const rawParams    = useParams<{ params: string[] }>();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const segments = rawParams.params ?? [];

  // Parse URL: /concursos/[slug-or-id] OR /concursos/[slug]/[nombre]/[codigo]
  let concursoId: number;
  let refUserId: string | null = null;
  let refNameFromUrl: string | null = null;

  if (segments.length >= 3) {
    // Pretty URL: /concursos/pizza-napoli/jaime/ABC123
    const [slugOrId, refName, refCode] = segments;
    const found = findConcurso(slugOrId);
    concursoId = found.concurso?.id ?? found.finalizado?.id ?? 0;
    refNameFromUrl = decodeURIComponent(refName);
    // Resolve userId from refCode via localStorage
    const resolvedUser = findUserByRefCode(refCode.toUpperCase());
    refUserId = resolvedUser?.id ?? null;
  } else {
    // Classic URL: /concursos/1?ref=xxx or /concursos/pizza-napoli
    const param = segments[0] ?? "";
    const found = findConcurso(param);
    concursoId = found.concurso?.id ?? found.finalizado?.id ?? 0;
    refUserId = searchParams.get("ref");
    refNameFromUrl = searchParams.get("refName");
  }

  const concursoMock = CONCURSOS.find((c) => c.id === concursoId);
  const finalizadoMock = CONCURSOS_FINALIZADOS.find((c) => c.id === concursoId);
  const [dbConcurso, setDbConcurso] = useState<Record<string, unknown> | null>(null);
  const [dbLoading, setDbLoading] = useState(!concursoMock && !finalizadoMock);

  // If not found in mocks, try fetching from DB
  useEffect(() => {
    if (concursoMock || finalizadoMock) { setDbLoading(false); return; }
    const param = segments[0] ?? "";
    if (!param) { setDbLoading(false); return; }
    setDbLoading(true);
    fetch(`/api/concursos/${param}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDbConcurso(data); setDbLoading(false); })
      .catch(() => setDbLoading(false));
  }, [segments[0]]);

  // Build concurso/finalizado from DB data if needed
  const concurso = concursoMock ?? (dbConcurso ? {
    ...CONCURSOS[0], // Use first mock as template for structure
    id: 0,
    slug: dbConcurso.slug as string ?? "",
    local: (dbConcurso.local as Record<string, string>)?.nombre ?? "Local",
    localId: (dbConcurso.local as Record<string, string>)?.id ?? "",
    imagen: "🏆",
    imagenUrl: (dbConcurso.imagenUrl as string) ?? (dbConcurso.local as Record<string, string>)?.portadaUrl ?? "",
    premio: dbConcurso.premio as string ?? "",
    descripcionPremio: dbConcurso.descripcion as string ?? "",
    participantes: (dbConcurso._count as Record<string, number>)?.participantes ?? 0,
    endsAt: new Date(dbConcurso.fechaFin as string).getTime(),
    ranking: ((dbConcurso.participantes as Array<{usuario: {nombre: string}; puntos: number}>) ?? []).map(p => ({ nombre: p.usuario?.nombre ?? "Participante", referidos: p.puntos ?? 0 })),
    reglas: ["Debes estar registrado en DeseoComer para participar.", "Cada persona que se registre usando tu link cuenta como 1 referido.", "El ganador es quien más puntos tenga al cierre del concurso."],
    descripcionLocal: "",
  } : null);
  const finalizado = finalizadoMock;

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
  const [tooltipActivo, setTooltipActivo] = useState<string | null>(null);
  const [supportedMap, setSupportedMap] = useState<Record<string, boolean>>({});
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
  if (dbLoading) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "160px 40px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)" }}>🧞 Cargando concurso...</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (!concurso && !finalizado) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "160px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "4rem", marginBottom: "20px" }}>🏆</p>
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
  const refLink = isAuthenticated && user && c
    ? `https://deseocomer.com/concursos/${c.slug ?? concursoId}/${encodeURIComponent(user.nombre.split(" ")[0].toLowerCase())}/${getRefCode(user.id)}`
    : null;

  const copyLink = async () => {
    if (!refLink) return;
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* noop */ }
  };

  const handleSupport = (targetName: string, targetId: string) => {
    if (!user) return;
    const ok = supportUser(concursoId, user.id, targetId);
    if (ok) {
      setSupportedMap(m => ({ ...m, [targetId]: true }));
      setTooltipActivo(targetId);
      setTimeout(() => setTooltipActivo(null), 2000);
      refreshRanking();
    }
  };

  // Check which users were already supported today
  useEffect(() => {
    if (!user) return;
    const map: Record<string, boolean> = {};
    for (const r of ranking) {
      // Use nombre as a proxy key since we don't have real user IDs in mock ranking
      const key = `mock_${r.nombre}`;
      map[key] = hasSupportedToday(concursoId, user.id, key);
    }
    setSupportedMap(map);
  }, [user, concursoId, ranking]);

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
                fontSize: "1.15rem",
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
                  background: "none", border: "none", color: "rgba(255,255,255,0.5)",
                  cursor: "pointer", padding: "8px 16px", fontWeight: 300,
                }}>
                  Cerrar
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Banner: 2-col on desktop ── */}
      <section className="dc-cd-banner">
        <div className="dc-cd-banner-inner">
          {/* Left: photo */}
          <div className="dc-cd-banner-photo">
            {c.imagenUrl ? (
              <div style={{ position: "relative", height: "100%", minHeight: "280px", overflow: "hidden", borderRadius: "20px", background: "rgba(45,26,8,0.8)" }}>
                <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", top: 0, right: 0, zIndex: 4, pointerEvents: "none", lineHeight: 0 }}><SelloGratis size="lg" /></div>
              </div>
            ) : (
              <div style={{ height: "280px", borderRadius: "20px", background: "linear-gradient(160deg, #2d1a08, #1a0e05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>🏆</div>
            )}
          </div>

          {/* Right: info */}
          <div className="dc-cd-banner-info">
            <Link href="/concursos" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", textDecoration: "none", marginBottom: "24px" }}>
              ← Todos los concursos
            </Link>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#3db89e", marginBottom: "12px" }}>{c.local}</p>
            <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 900, color: "#e8a84c", lineHeight: 1.3, marginBottom: "16px" }}>{c.premio}</h1>
            <div style={{ width: "60px", height: "1px", marginBottom: "16px", background: "linear-gradient(90deg, #e8a84c, transparent)" }} />
            {"descripcionPremio" in c && (
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "rgba(253,240,200,0.75)", fontWeight: 400, lineHeight: 1.65 }}>
                {(c as typeof c & { descripcionPremio: string }).descripcionPremio}
              </p>
            )}
            {isEnded && "fechaFin" in c && (
              <div style={{ display: "inline-block", marginTop: "16px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "6px 16px", fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Concurso finalizado · {(c as typeof c & { fechaFin: string }).fechaFin}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Body: 2-col grid (main + ranking sidebar) ── */}
      <div className="dc-cd-body">
        <div className="dc-cd-main">

          {/* 1. Link de participación */}
          {!isEnded && (
            <div style={{ background: "linear-gradient(135deg, rgba(45,26,8,0.8), rgba(13,7,3,0.9))", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 0 40px rgba(232,168,76,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "1.1rem" }}>🔗</span>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8a84c", fontWeight: 700, margin: 0 }}>Tu link de participación</p>
              </div>
              {isAuthenticated && refLink ? (
                <div>
                  {myRefs > 0 && (
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--oasis-bright)", marginBottom: "12px" }}>
                      🎉 Ya tienes <strong>{myRefs} referido{myRefs !== 1 ? "s" : ""}</strong>. ¡Sigue compartiendo!
                    </p>
                  )}
                  <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", padding: "10px 16px", marginBottom: "12px", wordBreak: "break-all" }}>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "#e8a84c", margin: 0 }}>{refLink}</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <button onClick={copyLink} style={{ background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))", border: "none", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: copied ? "#fff" : "var(--bg-primary)", padding: "10px 20px", cursor: "pointer", fontWeight: 700, opacity: copied ? 0.8 : 1 }}>
                      {copied ? "✓ Copiado" : "📋 Copiar link"}
                    </button>
                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Hola! Ayúdame a ganar en el concurso ${c.premio} de ${c.local} en DeseoComer 🙏 Regístrate con mi link y ambos podemos ganar: ${refLink}`)}`} target="_blank" rel="noopener noreferrer" style={{ background: "#25D366", border: "none", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff", padding: "10px 20px", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                      WhatsApp
                    </a>
                  </div>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(253,240,200,0.5)", margin: 0 }}>Comparte por WhatsApp, Instagram o donde quieras</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(253,240,200,0.6)", marginBottom: "16px", lineHeight: 1.6 }}>Inicia sesión para obtener tu link único y empezar a sumar referidos</p>
                  <Link href={`/login?next=/concursos/${concursoId}`} style={{ display: "inline-block", background: "linear-gradient(135deg, #f5d080, #e8a84c)", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#1a0e05", fontWeight: 700, padding: "12px 24px", borderRadius: "10px", textDecoration: "none" }}>
                    Inicia sesión para participar
                  </Link>
                  <div style={{ marginTop: "10px" }}>
                    <Link href="/concursos/como-funciona" style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.3)", textDecoration: "none", borderBottom: "1px solid rgba(240,234,214,0.12)", paddingBottom: "1px" }}>
                      ¿Primera vez? Así funcionan los concursos →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Cuenta regresiva */}
          {!isEnded && timer && (
            <div>
              <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "22px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)", textAlign: "center" }}>
                ⏱ Cuenta regresiva
              </h2>
              <BigTimer timer={timer} soon={soon} />
            </div>
          )}

          {/* 3. Así se gana */}
          {!isEnded && (
            <div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#e8a84c", textAlign: "center", marginBottom: "20px" }}>⚡ Así se gana</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }} className="dc-asi-grid">
                {[
                  { icon: "🎉", action: "Te registras por invitación", points: "+1 punto de bienvenida", color: "#3db89e" },
                  { icon: "👥", action: "Un amigo se registra con tu link", points: "+2 puntos para ti", color: "#e8a84c" },
                  { icon: "🤝", action: "Apoyas a un participante", points: "+1 punto para él", color: "#2a7a6f" },
                ].map((item, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "16px", padding: "24px 20px", textAlign: "center" }}>
                    <span style={{ fontSize: "2rem", display: "block", marginBottom: "12px" }}>{item.icon}</span>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.75)", margin: "0 0 12px", lineHeight: 1.5 }}>{item.action}</p>
                    <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", fontWeight: 900, color: item.color, margin: 0 }}>{item.points}</p>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "16px" }}>
                <Link href="/concursos/como-funciona" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "rgba(240,234,214,0.3)", textDecoration: "none", borderBottom: "1px solid rgba(240,234,214,0.12)", paddingBottom: "2px" }}>
                  ¿Tienes dudas? Ver guía completa →
                </Link>
              </div>
            </div>
          )}

          {/* 4. Reglas */}
          {"reglas" in c && (
            <div>
              <div style={{ width: "60px", height: "1px", margin: "0 auto 24px", background: "linear-gradient(90deg, transparent, rgba(232,168,76,0.4), transparent)" }} />
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(232,168,76,0.6)", marginBottom: "20px", textAlign: "center" }}>Reglas del concurso</p>
              <ol style={{ margin: 0, paddingLeft: "20px" }}>
                {(c as typeof c & { reglas: string[] }).reglas.map((r, i, arr) => (
                  <li key={i} style={{ fontFamily: "var(--font-lato)", fontSize: "0.875rem", color: "rgba(253,240,200,0.5)", lineHeight: 1.7, marginBottom: i < arr.length - 1 ? "10px" : 0 }}>{r}</li>
                ))}
              </ol>
            </div>
          )}

          {/* 5. Sobre el local */}
          {"descripcionLocal" in c && (() => {
            const localColors = ["#2a7a6f", "#7c3fa8", "#c4853a", "#2d6a8f", "#8f2d5a", "#4a7a2a"];
            const localColor = localColors[c.local.charCodeAt(0) % localColors.length];
            const localInitials = c.local.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
            return (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "16px", padding: "24px", display: "flex", gap: "20px", alignItems: "center" }}>
                {LOCAL_IMAGES[c.localId] ? (
                  <img src={LOCAL_IMAGES[c.localId]} alt={c.local} style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: "72px", height: "72px", borderRadius: "50%", flexShrink: 0, background: localColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>{localInitials}</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "#e8a84c", fontWeight: 700, marginBottom: "4px" }}>{c.local}</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(253,240,200,0.7)", lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden", marginBottom: "8px" }}>
                    {(c as typeof c & { descripcionLocal: string }).descripcionLocal}
                  </p>
                  <Link href={`/locales/${c.localId}`} style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--oasis-bright)", textDecoration: "none" }}>Ver perfil completo →</Link>
                </div>
              </div>
            );
          })()}
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
              fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase",
              color: "var(--oasis-bright)", marginBottom: "6px", textAlign: "center",
            }}>
              Ranking en tiempo real
            </p>
            <h2 style={{
              fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.05rem",
              fontWeight: 800, color: "var(--accent)", marginBottom: "28px", textAlign: "center",
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
                  {isAuthenticated && !isMe && !isEnded && (() => {
                    const targetKey = `mock_${r.nombre}`;
                    const already = supportedMap[targetKey];
                    return (
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {tooltipActivo === targetKey && (
                          <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: "rgba(13,7,3,0.96)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "20px", padding: "7px 14px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", zIndex: 10, animation: "dc-tooltipUp 0.25s ease both", pointerEvents: "none" }}>
                            <span style={{ fontSize: "0.85rem" }}>🤝</span>
                            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", fontWeight: 700, color: "#e8a84c", letterSpacing: "0.05em" }}>+1 a {r.nombre.split(" ")[0]}</span>
                            <div style={{ position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid rgba(232,168,76,0.4)" }} />
                          </div>
                        )}
                        <button onClick={() => handleSupport(r.nombre, targetKey)} disabled={!!already} style={{ border: already ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(61,184,158,0.4)", color: already ? "var(--text-muted)" : "var(--oasis-bright)", fontSize: "0.65rem", padding: "3px 8px", borderRadius: "20px", background: "transparent", cursor: already ? "default" : "pointer", fontFamily: "var(--font-cinzel)", whiteSpace: "nowrap" }}>
                          {already ? "✓" : "+1"}
                        </button>
                      </div>
                    );
                  })()}
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
          padding: 100px 60px 40px;
        }
        .dc-cd-banner-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .dc-cd-banner-photo { margin-bottom: 24px; }
        .dc-cd-banner-info {}

        .dc-cd-body {
          max-width: 1200px; margin: 0 auto;
          padding: 40px 60px 80px;
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 40px; align-items: start;
        }
        .dc-cd-main {
          display: flex; flex-direction: column;
          gap: 32px; min-width: 0;
        }
        .dc-cd-sidebar { min-width: 0; }

        @keyframes dc-slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes dc-tooltipUp {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @media (min-width: 1024px) {
          .dc-cd-banner-inner {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            align-items: center;
          }
          .dc-cd-banner-photo { margin-bottom: 0; }
          .dc-cd-banner-photo > div { height: 420px !important; min-height: 420px !important; }
        }

        @media (max-width: 1023px) {
          .dc-cd-body { grid-template-columns: 1fr; padding: 32px 40px 60px; gap: 24px; }
          .dc-cd-sidebar { order: -1; }
          .dc-cd-sidebar > div { position: static !important; }
        }
        @media (max-width: 767px) {
          .dc-cd-banner { padding: 80px 20px 24px; }
          .dc-cd-body { padding: 24px 20px 48px; }
          .dc-asi-grid { grid-template-columns: 1fr !important; }
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
      fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
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
        display: "flex", flexDirection: "row", justifyContent: "center",
        alignItems: "center", gap: "8px", flexWrap: "nowrap", width: "100%",
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
      color: "var(--text-muted)", fontSize: "1.5rem",
      flexShrink: 0, alignSelf: "center", marginBottom: "16px",
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
      borderRadius: "14px", padding: "16px 8px",
      flex: 1, minWidth: 0, textAlign: "center",
    }}>
      <span style={{
        fontFamily: "var(--font-cinzel-decorative)",
        fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: 700,
        lineHeight: 1, display: "block", color: col,
        textShadow: `0 0 30px ${glow}`,
      }}>
        {pad2(value)}
      </span>
      <span style={{
        fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.55rem, 1.5vw, 0.7rem)",
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: "var(--text-muted)", marginTop: "4px", display: "block",
      }}>
        {label}
      </span>
    </div>
  );
}
