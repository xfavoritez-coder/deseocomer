"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
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

export default function ConcursoDetalleWrapper() {
  return <Suspense><ConcursoDetallePage /></Suspense>;
}

function ConcursoDetallePage() {
  const rawParams = useParams<{ params: string[] }>();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const segments = rawParams.params ?? [];
  const slug = segments[0] ?? "";

  let refUserId: string | null = null;
  let refNameFromUrl: string | null = null;
  if (segments.length >= 3) {
    refNameFromUrl = decodeURIComponent(segments[1] ?? "");
    const resolvedUser = findUserByRefCode((segments[2] ?? "").toUpperCase());
    refUserId = resolvedUser?.id ?? null;
  } else {
    refUserId = searchParams.get("ref");
    refNameFromUrl = searchParams.get("refName");
  }

  const found = findConcurso(slug);
  const concursoId = found.concurso?.id ?? found.finalizado?.id ?? 0;
  const concursoMock = CONCURSOS.find((c) => c.id === concursoId) ?? null;
  const finalizadoMock = CONCURSOS_FINALIZADOS.find((c) => c.id === concursoId) ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbConcurso, setDbConcurso] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [timer, setTimer] = useState<ReturnType<typeof getTimeLeft> | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [concursoData, setConcursoData] = useState<any>(null);
  const finalizado = finalizadoMock;

  useEffect(() => {
    if (concursoMock || finalizadoMock) {
      if (concursoMock) { setConcursoData(concursoMock); setTimer(getTimeLeft(concursoMock.endsAt)); setRanking(concursoMock.ranking); }
      if (finalizadoMock) setRanking(finalizadoMock.ranking);
      setDbLoading(false);
      return;
    }
    if (!slug) { setDbLoading(false); return; }
    fetch(`/api/concursos/${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const built = {
            id: data.id ?? 0, slug: data.slug ?? "", local: data.local?.nombre ?? "Local",
            localId: data.local?.id ?? "", localSlug: data.local?.slug ?? "",
            localLogoUrl: data.local?.logoUrl ?? null,
            imagen: "🏆", imagenUrl: data.imagenUrl ?? data.local?.portadaUrl ?? "",
            premio: data.premio ?? "", descripcionPremio: data.descripcion ?? "",
            condiciones: data.condiciones ?? "", participantes: data._count?.participantes ?? 0,
            endsAt: new Date(data.fechaFin).getTime(),
            ranking: (data.participantes ?? []).map((p: { usuario?: { nombre?: string }; puntos?: number }) => ({ nombre: p.usuario?.nombre ?? "Participante", referidos: p.puntos ?? 0 })),
            reglas: ["Debes estar registrado en DeseoComer para participar.", "Cada persona que se registre usando tu link cuenta como 1 referido.", "El ganador es quien más puntos tenga al cierre del concurso."],
            descripcionLocal: "",
          };
          setConcursoData(built); setTimer(getTimeLeft(built.endsAt)); setRanking(built.ranking);
        }
        setDbLoading(false);
      })
      .catch(() => { setDbLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const concurso = concursoData;
  const [copied, setCopied] = useState(false);
  const [refToast, setRefToast] = useState(false);
  const [newRefToast, setNewRefToast] = useState(false);
  const [newRefCount, setNewRefCount] = useState(0);
  const [myRefs, setMyRefs] = useState(0);
  const [refBannerName, setRefBannerName] = useState<string | null | undefined>(undefined);
  const [refBannerDismissed, setRefBannerDismissed] = useState(false);
  const [tooltipActivo, setTooltipActivo] = useState<string | null>(null);
  const [supportedMap, setSupportedMap] = useState<Record<string, boolean>>({});
  const refProcessed = useRef(false);

  const handleDismissRefBanner = () => { setRefBannerDismissed(true); if (refUserId) savePendingRef(refUserId, concursoId); };

  useEffect(() => {
    if (!concursoData) return;
    const tick = () => setTimer(getTimeLeft(concursoData.endsAt));
    const iid = setInterval(tick, 1000);
    return () => clearInterval(iid);
  }, [concursoData?.endsAt]);

  useEffect(() => {
    if (!refUserId || refProcessed.current) return;
    if (authLoading) return;
    if (!isAuthenticated || !user) { savePendingRef(refUserId, concursoId); setRefBannerName(refNameFromUrl || getRefUserName(refUserId)); return; }
    if (user.id === refUserId) return;
    if (hasVisited(concursoId, refUserId)) return;
    refProcessed.current = true;
    incrementRef(concursoId, refUserId); markVisited(concursoId, refUserId);
    setRefToast(true); setTimeout(() => setRefToast(false), 4000);
  }, [authLoading, isAuthenticated, user, concursoId, refUserId]);

  const refreshRanking = useCallback(() => {
    if (!concurso || !user) return;
    const myCount = getRefCount(concursoId, user.id); setMyRefs(myCount);
    if (myCount === 0) { setRanking(concurso!.ranking); return; }
    const firstName = user!.nombre.split(" ")[0];
    const lastInit = user!.nombre.split(" ")[1]?.[0] ?? "";
    const myEntry: RankingEntry = { nombre: `${firstName} ${lastInit}.`, referidos: myCount };
    const base = concurso!.ranking.filter((r: RankingEntry) => r.nombre !== myEntry.nombre);
    setRanking([...base, myEntry].sort((a, b) => b.referidos - a.referidos));
  }, [concurso, concursoId, user]);

  useEffect(() => { refreshRanking(); const iid = setInterval(refreshRanking, 30_000); return () => clearInterval(iid); }, [refreshRanking]);
  useEffect(() => { if (user) setMyRefs(getRefCount(concursoId, user.id)); }, [user, concursoId]);

  useEffect(() => {
    if (!user) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== REFS_KEY || !e.newValue) return;
      try {
        const newStore = JSON.parse(e.newValue) as Record<string, number>;
        const oldStore = e.oldValue ? (JSON.parse(e.oldValue) as Record<string, number>) : {};
        const myKey = `${concursoId}_${user.id}`;
        if ((newStore[myKey] ?? 0) > (oldStore[myKey] ?? 0)) {
          setNewRefCount(newStore[myKey] ?? 0); setNewRefToast(true);
          setTimeout(() => setNewRefToast(false), 5000); refreshRanking();
        }
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [user, concursoId, refreshRanking]);

  useEffect(() => {
    if (!user) return;
    const map: Record<string, boolean> = {};
    for (const r of ranking) { const key = `mock_${r.nombre}`; map[key] = hasSupportedToday(concursoId, user.id, key); }
    setSupportedMap(map);
  }, [user, concursoId, ranking]);

  // ── Loading ──
  if (dbLoading) return (<main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}><Navbar /><div style={{ padding: "160px 40px", textAlign: "center" }}><p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)" }}>🧞 Cargando concurso...</p></div><Footer /></main>);

  // ── 404 ──
  if (!concurso && !finalizado) return (<main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}><Navbar /><div style={{ padding: "160px 40px", textAlign: "center" }}><p style={{ fontSize: "4rem", marginBottom: "20px" }}>🏆</p><h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", color: "var(--accent)", marginBottom: "24px" }}>Concurso no encontrado</h2><Link href="/concursos" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--oasis-bright)", textDecoration: "none" }}>← Volver a concursos</Link></div><Footer /></main>);

  const c = concurso ?? finalizado!;
  const isEnded = !!finalizado || !!timer?.ended;
  const soon = concurso ? isSoonEnding(concurso.endsAt) : false;
  const urgColor = "#e05555";
  const refLink = isAuthenticated && user && c
    ? `https://deseocomer.com/concursos/${c.slug ?? concursoId}/${encodeURIComponent(user.nombre.split(" ")[0].toLowerCase())}/${getRefCode(user.id)}`
    : null;
  const copyLink = async () => { if (!refLink) return; try { await navigator.clipboard.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {} };
  const handleSupport = (targetName: string, targetId: string) => { if (!user) return; const ok = supportUser(concursoId, user.id, targetId); if (ok) { setSupportedMap(m => ({ ...m, [targetId]: true })); setTooltipActivo(targetId); setTimeout(() => setTooltipActivo(null), 2000); refreshRanking(); } };
  const localInitials = c.local?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "L";
  const userInitials = user?.nombre?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "?";

  // Ranking block (shared between mobile + desktop sidebar)
  const rankingBlock = (
    <div style={{ background: "rgba(13,27,62,0.85)", border: "1px solid rgba(61,100,210,0.25)", borderRadius: 12, overflow: "hidden" }}>
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 9, color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center", padding: "14px 14px 0" }}>🏆 tabla de posiciones</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 14px 10px" }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, color: "#f5d080" }}>Ranking en tiempo real</span>
        <span style={{ fontFamily: "var(--font-lato)", fontSize: 9, color: "rgba(240,234,214,0.3)" }}>↻ cada 30 seg</span>
      </div>
      {ranking.length === 0 ? (
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.35)", fontStyle: "italic", textAlign: "center", padding: 20 }}>Sé el primero en participar</p>
      ) : ranking.map((r, i) => {
        const isMe = isAuthenticated && user && r.nombre.startsWith(user.nombre.split(" ")[0]);
        const posColors = [
          { bg: "rgba(232,168,76,0.2)", color: "#e8a84c", border: "rgba(232,168,76,0.4)" },
          { bg: "rgba(180,180,180,0.08)", color: "rgba(220,220,220,0.6)", border: "rgba(180,180,180,0.15)" },
          { bg: "rgba(180,100,50,0.12)", color: "rgba(200,140,80,0.7)", border: "rgba(180,100,50,0.2)" },
        ][i] ?? { bg: "rgba(255,255,255,0.03)", color: "rgba(240,234,214,0.3)", border: "rgba(255,255,255,0.06)" };
        const supportKey = `mock_${r.nombre}`;
        const alreadySupported = supportedMap[supportKey];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(61,100,210,0.1)", background: isMe ? "rgba(61,184,158,0.04)" : "transparent", position: "relative" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: posColors.bg, border: `1px solid ${posColors.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: posColors.color, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ flex: 1, fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.7)" }}>{r.nombre}</span>
            {isMe && <span style={{ background: "rgba(61,184,158,0.15)", color: "#3db89e", border: "1px solid rgba(61,184,158,0.3)", borderRadius: 4, padding: "1px 6px", fontFamily: "var(--font-cinzel)", fontSize: 9, fontWeight: 700 }}>tú</span>}
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "#e8a84c", whiteSpace: "nowrap" }}>{r.referidos} <span style={{ fontSize: 9, color: "rgba(240,234,214,0.35)" }}>pts</span></span>
            {isAuthenticated && !isMe && (
              <button onClick={() => handleSupport(r.nombre, supportKey)} disabled={!!alreadySupported} style={{ background: "none", border: "none", cursor: alreadySupported ? "default" : "pointer", opacity: alreadySupported ? 0.3 : 1, padding: 0, lineHeight: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={alreadySupported ? "rgba(232,168,76,0.3)" : "#e8a84c"}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              </button>
            )}
            {tooltipActivo === supportKey && <div style={{ position: "absolute", bottom: "calc(100% + 4px)", right: 14, background: "rgba(13,7,3,0.96)", border: "1px solid rgba(61,184,158,0.4)", borderRadius: 8, padding: "5px 10px", fontFamily: "var(--font-lato)", fontSize: 11, color: "#3db89e", whiteSpace: "nowrap", zIndex: 10 }}>¡+1 punto a {r.nombre}!</div>}
          </div>
        );
      })}
    </div>
  );

  // Condiciones unificadas
  const condicionesSistema = [
    "Se requiere cuenta verificada en DeseoComer para participar. Los puntos de referidos solo se acreditan una vez que el referido verifica su correo.",
    "Queda estrictamente prohibido el uso de correos temporales, cuentas falsas o cualquier método fraudulento para acumular puntos.",
    "El local organizador y DeseoComer se reservan el derecho de descalificar a cualquier participante que presente patrones sospechosos de fraude, sin necesidad de justificación previa.",
    "DeseoComer actúa como plataforma intermediaria. La entrega del premio es responsabilidad exclusiva del local organizador.",
    "La participación en este concurso implica la aceptación total de estos términos y los Términos y Condiciones de DeseoComer.",
  ];
  const allRules: string[] = [];
  if (c.condiciones) allRules.push(c.condiciones);
  allRules.push("Debes estar registrado en DeseoComer para participar.", "Cada persona que se registre con tu link cuenta como 1 referido.", "El ganador es quien más puntos tenga al cierre del concurso.");
  allRules.push(...condicionesSistema);

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Toasts */}
      {refToast && <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", padding: "14px 28px", borderRadius: 30, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "dc-slideUp 0.3s ease", whiteSpace: "nowrap" }}>✓ ¡Referido contabilizado!</div>}
      {newRefToast && <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "linear-gradient(135deg, #e8a84c, #f5c97a)", color: "#1a1008", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", padding: "14px 28px", borderRadius: 30, boxShadow: "0 8px 32px rgba(232,168,76,0.45)", animation: "dc-slideUp 0.3s ease", whiteSpace: "nowrap" }}>🎉 ¡Nuevo referido! Ya tienes {newRefCount}.</div>}

      {/* Referral modal */}
      {refUserId && refBannerName !== undefined && !isAuthenticated && !refBannerDismissed && (() => {
        const dn = refBannerName ?? "tu amigo";
        return (<>
          <div onClick={handleDismissRefBanner} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "90%", maxWidth: 480, zIndex: 1000, background: "rgba(13,7,3,0.98)", border: "1px solid rgba(232,168,76,0.5)", borderRadius: 20, boxShadow: "0 0 60px rgba(0,0,0,0.8)", padding: "36px 28px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.15rem", fontWeight: 800, color: "#f5d080", marginBottom: 16, lineHeight: 1.4 }}>🏮 ¡{dn} te invitó a ganar!</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.7, marginBottom: 24 }}><strong style={{ color: "var(--accent)" }}>{dn}</strong> participa en <strong style={{ color: "var(--accent)" }}>{c.premio}</strong>. Regístrate gratis y ambos pueden ganar.</p>
            <Link href={`/registro?ref=${refUserId}&concurso=${concursoId}`} style={{ display: "block", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, padding: "14px 28px", borderRadius: 14, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.08em" }}>🎉 Registrarme y sumarle un punto</Link>
            <button onClick={handleDismissRefBanner} style={{ marginTop: 12, background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", padding: "8px 16px" }}>Cerrar</button>
          </div>
        </>);
      })()}

      {/* 1. HERO */}
      <section className="dc-cd-hero" style={{ position: "relative", height: "280px", overflow: "hidden" }}>
        {c.imagenUrl ? <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #2d1a08, #1a0e05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>🏆</div>}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,8,18,0.05) 0%, rgba(10,8,18,0.94) 100%)" }} />
        {/* Back */}
        <Link href="/concursos" style={{ position: "absolute", top: "clamp(72px,10vw,88px)", left: 14, zIndex: 3, background: "rgba(10,8,18,0.75)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 6, padding: "5px 10px", fontFamily: "var(--font-cinzel)", fontSize: "11px", color: "rgba(240,234,214,0.55)", textDecoration: "none" }}>← Concursos</Link>
        {/* Bottom content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: "0 clamp(14px,4vw,32px) clamp(14px,3vw,20px)", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            {c.localLogoUrl ? <img src={c.localLogoUrl} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(232,168,76,0.45)" }} />
              : <div style={{ width: 24, height: 24, borderRadius: "50%", border: "1.5px solid rgba(232,168,76,0.45)", background: "#0a0812", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700, color: "#e8a84c" }}>{localInitials[0]}</div>}
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(240,234,214,0.45)" }}>{c.local}</span>
          </div>
          <h1 className="dc-cd-title" style={{ fontFamily: "var(--font-cinzel)", fontSize: 28, fontWeight: 700, color: "#f5d080", lineHeight: 1.15, margin: 0, textTransform: "uppercase", letterSpacing: "0.03em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ fontSize: 20 }}>🏆</span>{c.premio}</h1>
          {c.descripcionPremio && <>
            <div style={{ width: '40px', height: '1px', background: 'rgba(232,168,76,0.4)', margin: '10px auto' }} />
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.45)", fontStyle: "italic", marginTop: 0, lineHeight: 1.4 }}>{c.descripcionPremio}</p>
          </>}
        </div>
      </section>

      {/* Body */}
      <div className="dc-cd-body">
        <div className="dc-cd-main" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 3. Countdown */}
          {!isEnded && timer && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 9, color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 8 }}>⏳ termina en</p>
              <div style={{ background: "rgba(10,8,18,0.7)", border: `1px solid ${soon ? "rgba(224,85,85,0.3)" : "rgba(232,168,76,0.18)"}`, borderRadius: 12, padding: 14, display: "flex", justifyContent: "center", gap: 6 }}>
                {[
                  ...(timer.dias > 0 ? [{ v: timer.dias, l: "días" }] : []),
                  { v: timer.horas, l: "hrs" }, { v: timer.minutos, l: "min" }, { v: timer.segundos, l: "seg" },
                ].map(({ v, l }, i, arr) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div className="dc-cd-timer-unit" style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 30, fontWeight: 700, color: soon ? urgColor : "rgba(240,234,214,0.9)", lineHeight: 1, minWidth: 40 }}>{pad2(v)}</div>
                      <div className="dc-cd-timer-label" style={{ fontFamily: "var(--font-cinzel)", fontSize: 9, color: "rgba(240,234,214,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>{l}</div>
                    </div>
                    {i < arr.length - 1 && <span className="dc-cd-timer-sep" style={{ fontFamily: "var(--font-cinzel)", fontSize: 22, color: soon ? "rgba(224,85,85,0.3)" : "rgba(240,234,214,0.2)", marginBottom: 14 }}>:</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Link de participación */}
          <div style={{ background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.22)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: 20 }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#e8a84c", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8a84c" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Link de participación</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.45)", textAlign: "center", marginTop: 6 }}>Participa gratis, suma puntos y gana</p>

              {isAuthenticated && refLink ? (
                <div style={{ marginTop: 14 }}>
                  {/* Link field */}
                  <div style={{ background: "rgba(10,8,18,0.6)", border: "1px solid rgba(232,168,76,0.18)", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(232,168,76,0.4)" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    <span style={{ flex: 1, fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(240,234,214,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{refLink}</span>
                    <button onClick={copyLink} style={{ background: "rgba(232,168,76,0.18)", border: "1px solid rgba(232,168,76,0.35)", borderRadius: 6, padding: "4px 10px", fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700, color: "#e8a84c", cursor: "pointer", whiteSpace: "nowrap" }}>{copied ? "✓ Copiado" : "Copiar"}</button>
                  </div>
                  {/* WhatsApp */}
                  <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Participa en este concurso y gana: ${refLink}`)}`, "_blank")} style={{ width: "100%", marginTop: 8, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 10, padding: 13, fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", fontWeight: 700, color: "#25d366", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.63-1.476A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.15 0-4.136-.683-5.762-1.843l-.413-.265-2.748.877.87-2.686-.287-.438A9.71 9.71 0 0 1 2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" /></svg>
                    Compartir por WhatsApp
                  </button>
                </div>
              ) : !isEnded ? (
                <div style={{ marginTop: 16 }}>
                  <Link className="dc-cd-cta-btn" href={`/login?next=/concursos/${c.slug || slug}`} style={{ display: "block", width: "100%", background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", padding: 14, borderRadius: 10, textDecoration: "none", textAlign: "center", letterSpacing: "0.06em" }}>Iniciar sesión para participar</Link>
                </div>
              ) : null}
            </div>
            <div style={{ borderTop: "1px solid rgba(232,168,76,0.1)", padding: "10px 20px", textAlign: "center" }}>
              <Link href="/concursos/como-funciona" style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(240,234,214,0.3)", textDecoration: "none" }}>¿Cómo funcionan los concursos? →</Link>
            </div>
          </div>

          {/* 5. Ranking (mobile) — hidden on desktop where sidebar shows */}
          <div className="dc-cd-ranking-mobile">
            {rankingBlock}
          </div>

          {/* 6. Cómo se gana */}
          {!isEnded && (
            <div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 9, color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 12 }}>Cómo se gana</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[{ n: "PASO 1", pts: "+1", label: "Al unirte" }, { n: "PASO 2", pts: "+2", label: "Por referido" }, { n: "PASO 3", pts: "+1", label: "Al apoyar" }].map(s => (
                  <div key={s.n} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-lato)", fontSize: 9, color: "rgba(240,234,214,0.28)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{s.n}</div>
                    <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 28, color: "#e8a84c", fontWeight: 700, lineHeight: 1 }}>{s.pts}</div>
                    <div style={{ fontFamily: "var(--font-lato)", fontSize: 10, color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Reglas y condiciones */}
          <div>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 9, color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 10 }}>Reglas del concurso</p>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 10, padding: "12px 14px" }}>
              {allRules.map((rule, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: i < allRules.length - 1 ? "1px solid rgba(232,168,76,0.05)" : "none" }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(232,168,76,0.35)", marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(240,234,214,0.45)", lineHeight: 1.45 }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Ficha del local */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
            {c.localLogoUrl ? <img src={c.localLogoUrl} alt={c.local} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(232,168,76,0.3)", flexShrink: 0 }} />
              : <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(232,168,76,0.15)", border: "2px solid rgba(232,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, color: "#e8a84c", flexShrink: 0 }}>{localInitials}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "#e8a84c", textTransform: "uppercase", fontWeight: 700 }}>{c.local}</p>
              <Link href={`/locales/${c.localSlug || c.localId}`} style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: "#3db89e", textDecoration: "none" }}>Ver perfil completo →</Link>
            </div>
          </div>
        </div>

        {/* Sidebar: Ranking (desktop only) */}
        <div className="dc-cd-sidebar">
          {rankingBlock}
        </div>
      </div>

      <Footer />

      <style>{`
        .dc-cd-body { display: block; padding: 20px 14px; }
        .dc-cd-main, .dc-cd-sidebar { width: 100%; }
        .dc-cd-sidebar { display: none; }
        .dc-cd-ranking-mobile { display: block; }
        @media (min-width: 1024px) {
          .dc-cd-hero { height: 340px !important; }
          .dc-cd-title { font-size: 36px !important; }
          .dc-cd-body { display: grid; grid-template-columns: 58% 42%; gap: 28px; max-width: 1100px; margin: 0 auto; padding: 32px 32px; align-items: start; }
          .dc-cd-main { margin-top: 0; }
          .dc-cd-sidebar { display: block; position: sticky; top: 88px; align-self: start; margin-top: 0; }
          .dc-cd-ranking-mobile { display: none; }
          .dc-cd-timer-unit { background: rgba(10,8,18,0.5); border: 1px solid rgba(232,168,76,0.12); border-radius: 10px; padding: 10px 14px; min-width: 64px; }
          .dc-cd-timer-label { font-size: 10px !important; color: rgba(240,234,214,0.28) !important; letter-spacing: 0.1em !important; margin-top: 6px !important; }
          .dc-cd-timer-sep { font-size: 24px !important; color: rgba(240,234,214,0.2) !important; align-self: center; padding-bottom: 12px; margin-bottom: 0 !important; }
          .dc-cd-cta-btn { max-width: 320px !important; margin-left: auto !important; margin-right: auto !important; }
        }
        @keyframes dc-pd { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes dc-slideUp { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes dc-tooltipUp { from{opacity:0;transform:translateX(-50%) translateY(4px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
    </main>
  );
}
