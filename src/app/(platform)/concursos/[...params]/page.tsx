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

  const [refUserId, setRefUserId] = useState<string | null>(null);
  const [refNameFromUrl, setRefNameFromUrl] = useState<string | null>(null);
  const refCodeRaw = segments.length >= 3 ? segments[2] : searchParams.get("ref");
  const refNameRaw = segments.length >= 3 ? decodeURIComponent(segments[1] ?? "") : searchParams.get("refName");
  const hasRefLink = !!refCodeRaw;

  // Resolve refCode to userId via API
  useEffect(() => {
    if (!refCodeRaw) return;
    setRefNameFromUrl(refNameRaw);
    // Try localStorage first (fast)
    const local = findUserByRefCode(refCodeRaw.toUpperCase());
    if (local) { setRefUserId(local.id); return; }
    // Fallback: resolve via API
    fetch(`/api/usuarios/by-refcode?code=${encodeURIComponent(refCodeRaw)}`).then(r => r.ok ? r.json() : null).then(data => {
      if (data?.id) { setRefUserId(data.id); if (data.nombre) setRefNameFromUrl(data.nombre); }
    }).catch(() => {});
  }, [refCodeRaw]);

  const found = findConcurso(slug);
  const mockId = found.concurso?.id ?? found.finalizado?.id ?? 0;
  const concursoMock = CONCURSOS.find((c) => c.id === mockId) ?? null;
  const finalizadoMock = CONCURSOS_FINALIZADOS.find((c) => c.id === mockId) ?? null;

  const [concursoId, setConcursoId] = useState<string | number>(mockId || slug);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbConcurso, setDbConcurso] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [timer, setTimer] = useState<ReturnType<typeof getTimeLeft> | null>(null);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [concursoData, setConcursoData] = useState<any>(null);
  const [supportError, setSupportError] = useState("");
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
          setConcursoData(built); setTimer(getTimeLeft(built.endsAt)); setRanking(built.ranking); setConcursoId(data.id);
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
  const [isParticipating, setIsParticipating] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const refProcessed = useRef(false);

  const handleDismissRefBanner = () => { setRefBannerDismissed(true); if (refUserId || refCodeRaw) savePendingRef(refUserId || refCodeRaw!, concursoId); };

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
    markVisited(concursoId, refUserId);
    // Call API to create participation and credit referral points in DB
    fetch(`/api/concursos/${slug}/participar`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: user.id, referidoPor: refUserId }),
    }).then(() => {
      // Reload ranking from DB
      fetch(`/api/concursos/${encodeURIComponent(slug)}`).then(r => r.ok ? r.json() : null).then(data => {
        if (data) {
          const newRanking = (data.participantes ?? []).map((p: { id?: string; usuarioId?: string; usuario?: { nombre?: string }; puntos?: number }) => ({ nombre: p.usuario?.nombre ?? "Participante", referidos: p.puntos ?? 0, usuarioId: p.usuarioId ?? "", participanteId: p.id ?? "" }));
          setRanking(newRanking);
        }
      }).catch(() => {});
    }).catch(() => {});
    setRefToast(true); setTimeout(() => setRefToast(false), 4000);
  }, [authLoading, isAuthenticated, user, concursoId, refUserId]);

  const refreshRanking = useCallback(() => {
    if (!slug) return;
    fetch(`/api/concursos/${encodeURIComponent(slug)}`).then(r => r.ok ? r.json() : null).then(data => {
      if (data) {
        const newRanking = (data.participantes ?? []).map((p: { id?: string; usuarioId?: string; usuario?: { nombre?: string }; puntos?: number }) => ({ nombre: p.usuario?.nombre ?? "Participante", referidos: p.puntos ?? 0, usuarioId: p.usuarioId ?? "", participanteId: p.id ?? "" }));
        setRanking(newRanking);
        if (user) {
          const me = (data.participantes ?? []).find((p: { usuarioId?: string }) => p.usuarioId === user.id);
          setMyRefs(me?.puntos ?? 0);
          setIsParticipating(!!me);
        }
      }
    }).catch(() => {});
  }, [slug, user]);

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
    for (const r of ranking) { const key = (r as {usuarioId?: string}).usuarioId || `mock_${r.nombre}`; map[key] = hasSupportedToday(concursoId, user.id, key); }
    setSupportedMap(map);
  }, [user, concursoId, ranking]);

  // ── Loading skeleton ──
  if (dbLoading) return (<main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}><Navbar />
    <div className="dc-skeleton-wrap">
      <div className="dc-sk dc-sk-hero" />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="dc-sk" style={{ height: 14, width: "40%", margin: "0 auto" }} />
        <div className="dc-sk" style={{ height: 24, width: "70%", margin: "0 auto" }} />
        <div className="dc-sk" style={{ height: 80, borderRadius: 12 }} />
        <div className="dc-sk" style={{ height: 120, borderRadius: 12 }} />
        <div className="dc-sk" style={{ height: 160, borderRadius: 12 }} />
      </div>
    </div>
    <style>{`
      .dc-sk { background: linear-gradient(90deg, rgba(232,168,76,0.06) 25%, rgba(232,168,76,0.12) 50%, rgba(232,168,76,0.06) 75%); background-size: 200% 100%; animation: dcShimmer 1.5s ease-in-out infinite; border-radius: 8px; }
      .dc-sk-hero { height: 280px; border-radius: 0; }
      @keyframes dcShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    `}</style>
  <Footer /></main>);

  // ── 404 ──
  if (!concurso && !finalizado) return (<main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}><Navbar /><div style={{ padding: "80px 40px", textAlign: "center" }}><p style={{ fontSize: "4rem", marginBottom: "20px" }}>🏆</p><h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", color: "var(--accent)", marginBottom: "24px" }}>Concurso no encontrado</h2><Link href="/concursos" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--oasis-bright)", textDecoration: "none" }}>← Volver a concursos</Link></div><Footer /></main>);

  const c = concurso ?? finalizado!;
  const isEnded = !!finalizado || !!timer?.ended;
  const soon = concurso ? isSoonEnding(concurso.endsAt) : false;
  const urgColor = "#e05555";
  const refLink = isAuthenticated && user && c
    ? `https://deseocomer.com/concursos/${c.slug ?? concursoId}/${encodeURIComponent(user.nombre.split(" ")[0].toLowerCase())}/${getRefCode(user.id)}`
    : null;
  const copyLink = async () => { if (!refLink) return; try { await navigator.clipboard.writeText(refLink); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {} };
  const handleSupport = async (targetName: string, targetId: string, targetUsuarioId: string) => {
    if (!user) return;
    const ok = supportUser(concursoId, user.id, targetId);
    if (!ok) return;
    setSupportedMap(m => ({ ...m, [targetId]: true })); setTooltipActivo(targetId); setTimeout(() => setTooltipActivo(null), 2000);
    // Call API to persist the +1 in DB
    if (targetUsuarioId) {
      try {
        const res = await fetch(`/api/concursos/${slug}/apoyar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supporterId: user.id, targetUsuarioId }) });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 403) { setSupportError(data.error ?? "Debes verificar tu correo para apoyar."); setTimeout(() => setSupportError(""), 5000); setSupportedMap(m => { const n = { ...m }; delete n[targetId]; return n; }); }
        }
      } catch {}
    }
    refreshRanking();
  };
  const handleJoin = async () => {
    if (!user || joinLoading) return;
    setJoinLoading(true);
    try {
      await fetch(`/api/concursos/${slug}/participar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: user.id }),
      });
      setIsParticipating(true);
      refreshRanking();
    } catch {} finally { setJoinLoading(false); }
  };
  const localInitials = c.local?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "L";
  const userInitials = user?.nombre?.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase() ?? "?";

  // Ranking block (shared between mobile + desktop sidebar)
  const rankingBlock = (
    <div style={{ background: "rgba(13,27,62,0.85)", border: "1px solid rgba(61,100,210,0.25)", borderRadius: 12, overflow: "hidden" }}>
      {supportError && <div style={{ padding: "10px 14px", background: "rgba(255,80,80,0.1)", borderBottom: "1px solid rgba(255,80,80,0.2)", fontFamily: "var(--font-lato)", fontSize: 12, color: "#ff8080", textAlign: "center" }}>{supportError} <a href="/verificar-email" style={{ color: "#e8a84c", fontWeight: 700 }}>Reenviar verificación →</a></div>}
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 11, color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", textAlign: "center", padding: "14px 14px 0" }}>🏆 tabla de posiciones</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 14px 10px" }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "rgba(120,140,220,0.8)" }}>Ranking en tiempo real</span>
        <span style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: "rgba(240,234,214,0.3)" }}>↻ cada 30 seg</span>
      </div>
      {ranking.length === 0 ? (
        <div style={{ padding: "20px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>🏆</span>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#f5d080", fontWeight: 700, margin: 0 }}>¡El primer lugar te espera!</p>
          </div>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.4)", lineHeight: 1.4, textAlign: "center", marginBottom: isAuthenticated && !isParticipating && !isEnded ? 12 : 0 }}>Nadie se ha unido aún. Únete ahora y empieza con ventaja.</p>
          {isAuthenticated && !isParticipating && !isEnded && (
            <button onClick={handleJoin} disabled={joinLoading} style={{ display: "block", width: "100%", background: "rgba(61,100,210,0.2)", border: "1px solid rgba(61,100,210,0.4)", borderRadius: 8, padding: "10px 16px", fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, color: "#7b9aff", cursor: joinLoading ? "wait" : "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>{joinLoading ? "Uniéndote..." : "Unirse al concurso →"}</button>
          )}
          {!isAuthenticated && !isEnded && (
            <a href={`/login?next=/concursos/${c.slug || slug}`} style={{ display: "block", textAlign: "center", fontFamily: "var(--font-cinzel)", fontSize: 12, color: "rgba(120,140,220,0.7)", textDecoration: "none", marginTop: 8, letterSpacing: "0.06em" }}>Inicia sesión para participar →</a>
          )}
        </div>
      ) : ranking.map((r, i) => {
        const isMe = isAuthenticated && user && r.nombre.startsWith(user.nombre.split(" ")[0]);
        const posColors = [
          { bg: "rgba(232,168,76,0.2)", color: "#e8a84c", border: "rgba(232,168,76,0.4)" },
          { bg: "rgba(180,180,180,0.08)", color: "rgba(220,220,220,0.6)", border: "rgba(180,180,180,0.15)" },
          { bg: "rgba(180,100,50,0.12)", color: "rgba(200,140,80,0.7)", border: "rgba(180,100,50,0.2)" },
        ][i] ?? { bg: "rgba(255,255,255,0.03)", color: "rgba(240,234,214,0.3)", border: "rgba(255,255,255,0.06)" };
        const rAny = r as { usuarioId?: string };
        const supportKey = rAny.usuarioId || `mock_${r.nombre}`;
        const alreadySupported = supportedMap[supportKey];
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(61,100,210,0.1)", background: isMe ? "rgba(61,184,158,0.04)" : "transparent", position: "relative" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: posColors.bg, border: `1px solid ${posColors.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700, color: posColors.color, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ flex: 1, fontFamily: "var(--font-lato)", fontSize: 14, color: "rgba(240,234,214,0.7)", textTransform: "capitalize" }}>{(() => { const parts = r.nombre.trim().split(/\s+/); return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]; })()}</span>
            {isMe && <span style={{ background: "rgba(61,184,158,0.15)", color: "#3db89e", border: "1px solid rgba(61,184,158,0.3)", borderRadius: 4, padding: "1px 6px", fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700 }}>tú</span>}
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#e8a84c", whiteSpace: "nowrap" }}>{r.referidos} <span style={{ fontSize: 11, color: "rgba(240,234,214,0.35)" }}>pts</span></span>
            {isAuthenticated && !isMe && (
              <button onClick={() => handleSupport(r.nombre, supportKey, rAny.usuarioId || "")} disabled={!!alreadySupported} style={{ background: "none", border: "none", cursor: alreadySupported ? "default" : "pointer", opacity: alreadySupported ? 0.3 : 1, padding: 0, lineHeight: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={alreadySupported ? "rgba(232,168,76,0.3)" : "#e8a84c"}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              </button>
            )}
            {tooltipActivo === supportKey && <div style={{ position: "absolute", bottom: "calc(100% + 6px)", right: 14, background: "rgba(30,20,5,0.96)", border: "1px solid rgba(232,168,76,0.5)", borderRadius: 10, padding: "8px 14px", fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#e8a84c", whiteSpace: "nowrap", zIndex: 10, fontWeight: 700 }}>❤️ ¡+1 punto a {r.nombre.split(/\s+/)[0]}!</div>}
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
      {refToast && <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", padding: "14px 28px", borderRadius: 30, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "dc-slideUp 0.3s ease", whiteSpace: "nowrap" }}>🎉 ¡Ya estás participando! Le diste 2 puntos a {refNameFromUrl || "tu amigo"} y ganaste 1.</div>}
      {newRefToast && <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "linear-gradient(135deg, #e8a84c, #f5c97a)", color: "#1a1008", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", padding: "14px 28px", borderRadius: 30, boxShadow: "0 8px 32px rgba(232,168,76,0.45)", animation: "dc-slideUp 0.3s ease", whiteSpace: "nowrap" }}>🎉 ¡Nuevo referido! Ya tienes {newRefCount}.</div>}

      {/* Referral modal */}
      {hasRefLink && !isAuthenticated && !refBannerDismissed && !authLoading && (() => {
        const raw = refNameFromUrl || refBannerName || refNameRaw || "Tu amigo";
        const dn = raw.charAt(0).toUpperCase() + raw.slice(1);
        return (<>
          <div onClick={handleDismissRefBanner} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "90%", maxWidth: 480, zIndex: 1000, background: "rgba(13,7,3,0.98)", border: "1px solid rgba(232,168,76,0.5)", borderRadius: 20, boxShadow: "0 0 60px rgba(0,0,0,0.8)", padding: "36px 28px", textAlign: "center" }}>
            <button onClick={handleDismissRefBanner} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", cursor: "pointer" }}>✕</button>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.15rem", fontWeight: 800, color: "#f5d080", marginBottom: 16, lineHeight: 1.4 }}>🏮 ¡{dn} te invitó a ganar!</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.7, marginBottom: 24 }}><strong style={{ color: "var(--accent)" }}>{dn}</strong> participa en <strong style={{ color: "var(--accent)" }}>{c.premio}</strong> y necesita tu ayuda para sumar puntos. Regístrate gratis, súmale 2 puntos y tú también entras a ganar.</p>
            <Link href={`/registro?ref=${refUserId || refCodeRaw}&concurso=${concursoId}`} style={{ display: "block", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, padding: "14px 28px", borderRadius: 14, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>🎉 Registrarme y sumarle 2 puntos</Link>
            <Link href={`/login?next=/concursos/${c.slug || slug}/${encodeURIComponent(dn)}/${refCodeRaw}`} style={{ display: "block", background: "transparent", border: "1px solid rgba(232,168,76,0.3)", color: "var(--accent)", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", padding: "12px 28px", borderRadius: 14, textDecoration: "none", textAlign: "center", letterSpacing: "0.08em" }}>Ya tengo cuenta · Iniciar sesión</Link>
            <button onClick={handleDismissRefBanner} style={{ marginTop: 12, background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", padding: "8px 16px" }}>Cerrar y ver el concurso</button>
          </div>
        </>);
      })()}

      {/* 1. HERO */}
      <section className="dc-cd-hero" style={{ position: "relative", height: "280px", overflow: "hidden" }}>
        {c.imagenUrl ? <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #2d1a08, #1a0e05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem" }}>🏆</div>}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,8,18,0.05) 0%, rgba(10,8,18,0.94) 100%)" }} />
        {/* Back */}
        <Link href="/concursos" style={{ position: "absolute", top: "20px", left: 14, zIndex: 3, background: "rgba(10,8,18,0.75)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 6, padding: "5px 10px", fontFamily: "var(--font-cinzel)", fontSize: "11px", color: "rgba(240,234,214,0.55)", textDecoration: "none" }}>← Concursos</Link>
        {/* Bottom content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, padding: "0 clamp(14px,4vw,32px) clamp(14px,3vw,20px)", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10, background: "rgba(10,8,18,0.6)", backdropFilter: "blur(6px)", borderRadius: 24, padding: "6px 14px 6px 6px", border: "1px solid rgba(232,168,76,0.2)" }}>
            {c.localLogoUrl ? <img src={c.localLogoUrl} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(232,168,76,0.4)" }} />
              : <div style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid rgba(232,168,76,0.4)", background: "rgba(232,168,76,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700, color: "#e8a84c" }}>{localInitials[0]}</div>}
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#f0ead6" }}>{c.local}</span>
          </div>
          <h1 className="dc-cd-title" style={{ fontFamily: "var(--font-cinzel)", fontSize: 28, fontWeight: 700, color: "#f5d080", lineHeight: 1.15, margin: 0, textTransform: "uppercase", letterSpacing: "0.03em", textAlign: "center" }}>🏆 {c.premio}</h1>
          {c.descripcionPremio && <>
            <div style={{ width: '40px', height: '1px', background: 'rgba(232,168,76,0.4)', margin: '10px auto' }} />
            <p className="dc-cd-hero-desc" style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "rgba(240,234,214,0.55)", fontStyle: "italic", marginTop: 0, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{c.descripcionPremio}</p>
          </>}
        </div>
      </section>

      {/* Body */}
      <div className="dc-cd-body">
        <div className="dc-cd-main" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 3. Countdown */}
          {!isEnded && timer && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 11, color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 8 }}>⏳ termina en</p>
              <div style={{ background: "rgba(10,8,18,0.7)", border: `1px solid ${soon ? "rgba(224,85,85,0.3)" : "rgba(232,168,76,0.18)"}`, borderRadius: 12, padding: 14, display: "flex", justifyContent: "center", gap: 6 }}>
                {[
                  ...(timer.dias > 0 ? [{ v: timer.dias, l: "días" }] : []),
                  { v: timer.horas, l: "hrs" }, { v: timer.minutos, l: "min" }, { v: timer.segundos, l: "seg" },
                ].map(({ v, l }, i, arr) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div className="dc-cd-timer-unit" style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 30, fontWeight: 700, color: soon ? urgColor : "rgba(240,234,214,0.9)", lineHeight: 1, minWidth: 40 }}>{pad2(v)}</div>
                      <div className="dc-cd-timer-label" style={{ fontFamily: "var(--font-cinzel)", fontSize: 11, color: "rgba(240,234,214,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>{l}</div>
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
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#e8a84c", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>{isAuthenticated && isParticipating ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e8a84c" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Tu link de participación</> : "🏆 Participa en este concurso"}</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "rgba(240,234,214,0.45)", textAlign: "center", marginTop: 6 }}>{isAuthenticated && isParticipating ? "Comparte este link y suma puntos para ganar" : "Únete gratis y compite por el premio"}</p>

              {isAuthenticated && isParticipating && refLink ? (
                <div style={{ marginTop: 14 }}>
                  {/* Link field */}
                  <div style={{ background: "rgba(10,8,18,0.6)", border: "1px solid rgba(232,168,76,0.18)", borderRadius: 8, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(232,168,76,0.4)" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    <span style={{ flex: 1, fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.45)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{refLink}</span>
                    <button onClick={copyLink} style={{ background: "rgba(232,168,76,0.18)", border: "1px solid rgba(232,168,76,0.35)", borderRadius: 6, padding: "4px 10px", fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, color: "#e8a84c", cursor: "pointer", whiteSpace: "nowrap" }}>{copied ? "✓ Copiado" : "Copiar"}</button>
                  </div>
                  {/* WhatsApp */}
                  <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Holaa, me ayudas? estoy en un concurso de comida, si te registras con mi link me ayudas a ganar 2 puntos y tú ganas 1 ${refLink}`)}`, "_blank")} style={{ width: "100%", marginTop: 8, background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 10, padding: 13, fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, color: "#25d366", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.63-1.476A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.15 0-4.136-.683-5.762-1.843l-.413-.265-2.748.877.87-2.686-.287-.438A9.71 9.71 0 0 1 2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" /></svg>
                    Compartir por WhatsApp
                  </button>
                </div>
              ) : isAuthenticated && !isParticipating && !isEnded ? (
                <div style={{ marginTop: 16 }}>
                  <button onClick={handleJoin} disabled={joinLoading} style={{ display: "block", width: "100%", background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", padding: 14, borderRadius: 10, border: "none", cursor: joinLoading ? "wait" : "pointer", textAlign: "center", letterSpacing: "0.06em" }}>{joinLoading ? "Uniéndote..." : "🎉 Entrar a concurso"}</button>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.35)", textAlign: "center", marginTop: 8 }}>Únete gratis y comienza a sumar puntos para ganar</p>
                </div>
              ) : !isAuthenticated && !isEnded ? (
                <div style={{ marginTop: 16 }}>
                  <Link className="dc-cd-cta-btn" href={`/login?next=/concursos/${c.slug || slug}`} style={{ display: "block", width: "100%", background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", padding: 14, borderRadius: 10, textDecoration: "none", textAlign: "center", letterSpacing: "0.06em" }}>Iniciar sesión para participar</Link>
                </div>
              ) : null}
            </div>
            <div style={{ borderTop: "1px solid rgba(232,168,76,0.1)", padding: "10px 20px", textAlign: "center" }}>
              <Link href="/concursos/como-funciona" style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.3)", textDecoration: "none" }}>¿Cómo funcionan los concursos? →</Link>
            </div>
          </div>

          {/* 5. Ranking (mobile) — hidden on desktop where sidebar shows */}
          <div className="dc-cd-ranking-mobile">
            {rankingBlock}
          </div>

          {/* 6. Cómo se gana */}
          {!isEnded && (
            <div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 11, color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 12 }}>Cómo se gana</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {[{ icon: "🎟️", pts: "+1", label: "Al unirte" }, { icon: "🔗", pts: "+2", label: "Por referido" }, { icon: "❤️", pts: "+1", label: "Al recibir apoyo" }, { icon: "👤", pts: "+1", label: "Registro directo" }].map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 24, color: "#e8a84c", fontWeight: 700, lineHeight: 1 }}>{s.pts}</div>
                    <div style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 6 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6.5 Descripción completa del premio (si fue truncada en hero) */}
          {c.descripcionPremio && c.descripcionPremio.length > 120 && (
            <div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "rgba(240,234,214,0.5)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 12 }}>Descripción del premio</p>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 10, padding: "14px 16px" }}>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: "rgba(240,234,214,0.6)", lineHeight: 1.55, margin: 0 }}>{c.descripcionPremio}</p>
              </div>
            </div>
          )}

          {/* 7. Reglas y condiciones */}
          <div>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "rgba(240,234,214,0.5)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center", marginBottom: 12 }}>Reglas del concurso</p>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 10, padding: "14px 16px" }}>
              {allRules.map((rule, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", borderBottom: i < allRules.length - 1 ? "1px solid rgba(232,168,76,0.05)" : "none" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(232,168,76,0.4)", marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: 15, color: "rgba(240,234,214,0.6)", lineHeight: 1.55 }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 8. Ficha del local */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center" }}>
            {c.localLogoUrl ? <img src={c.localLogoUrl} alt={c.local} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(232,168,76,0.3)", flexShrink: 0 }} />
              : <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(232,168,76,0.15)", border: "2px solid rgba(232,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, color: "#e8a84c", flexShrink: 0 }}>{localInitials}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 15, color: "#e8a84c", textTransform: "uppercase", fontWeight: 700 }}>{c.local}</p>
              <Link href={`/locales/${c.localSlug || c.localId}`} style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "#3db89e", textDecoration: "none" }}>Ver perfil completo →</Link>
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
          .dc-cd-hero-desc { max-width: 500px; margin-left: auto; margin-right: auto; }
        }
        @keyframes dc-pd { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes dc-slideUp { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes dc-tooltipUp { from{opacity:0;transform:translateX(-50%) translateY(4px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>
    </main>
  );
}
