"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useGenie } from "@/contexts/GenieContext";
import SubirFoto from "@/components/SubirFoto";
import { getAllRefCounts } from "@/lib/referrals";
import { CONCURSOS, CONCURSOS_FINALIZADOS, getRefCode } from "@/lib/mockConcursos";

// ─── Types & helpers ─────────────────────────────────────────────────────────

const TABS = [
  { key: "favoritos", icon: "💛", label: "Favoritos" },
  { key: "concursos", icon: "🏆", label: "Concursos" },
  { key: "historial", icon: "🕐", label: "Historial" },
  { key: "genio",     icon: "🏮", label: "Mi Genio" },
  { key: "perfil",    icon: "⚙️", label: "Mi Perfil" },
] as const;

type TabKey = typeof TABS[number]["key"];

const PROFILE_KEY = "deseocomer_usuario_perfil";
const FAVS_KEY = "deseocomer_favoritos";

function loadProfile(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveProfile(p: Record<string, unknown>) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("favoritos");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login?next=/perfil");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "160px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>🏮</div>
        </div>
      </main>
    );
  }

  const initials = user.nombre.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const profile = loadProfile();
  const cumple = profile.cumpleanos as { dia?: number; mes?: number } | undefined;
  const isBirthdayMonth = cumple?.mes === new Date().getMonth() + 1;

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />
      <div className="dc-pf-wrap">

        {/* Header */}
        <div className="dc-pf-header">
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: user.fotoUrl ? "transparent" : "linear-gradient(135deg, #c4853a, #e8a84c, #f5d080)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.6rem",
            color: "#1a0e05", flexShrink: 0, fontWeight: 700, overflow: "hidden",
            border: "2px solid rgba(232,168,76,0.3)",
          }}>
            {user.fotoUrl ? <img src={user.fotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: "var(--font-cinzel-decorative)",
              fontSize: "clamp(1.2rem, 4vw, 1.6rem)", color: "var(--accent)",
            }}>
              {user.nombre}
            </h1>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", opacity: 0.7 }}>
              {user.email}
            </p>
            {isBirthdayMonth && (
              <span style={{
                display: "inline-block", marginTop: "6px",
                fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
                letterSpacing: "0.1em", color: "var(--sand-gold, #e8a84c)",
                border: "1px solid var(--sand-gold, #e8a84c)",
                borderRadius: "20px", padding: "3px 10px",
                animation: "bdayPulse 2s ease-in-out infinite",
              }}>
                🎂 ¡Es tu mes!
              </span>
            )}
          </div>
        </div>

        {user && !(user as any).emailVerificado && (
          <div style={{ background: "rgba(255,140,0,0.08)", border: "1px solid rgba(255,140,0,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff8c00", margin: 0, lineHeight: 1.5 }}>
              ⚠️ Tu cuenta no está verificada. Revisa tu email para activarla y poder participar en concursos.
            </p>
            <button onClick={async () => {
              try {
                await fetch("/api/emails/verificacion-reenvio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: user.email }) });
                alert("Email de verificación enviado. Revisa tu bandeja de entrada.");
              } catch {}
            }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "#e8a84c", background: "none", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", marginTop: 8 }}>
              Reenviar email de verificación
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="dc-pf-tabs">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`dc-pf-tab${tab === t.key ? " dc-pf-tab--active" : ""}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "favoritos" && <TabFavoritos />}
        {tab === "concursos" && <TabConcursos userId={user.id} userName={user.nombre} />}
        {tab === "historial" && <TabHistorial />}

        {tab === "genio" && <TabGenio />}
        {tab === "perfil" && <TabPerfil user={user} logout={logout} router={router} />}
      </div>

      <Footer />

      <style>{`
        .dc-pf-wrap { max-width: 860px; margin: 0 auto; padding: 100px 60px 80px; }
        .dc-pf-header {
          display: flex; align-items: center; gap: 20px;
          background: var(--bg-secondary); border: 1px solid var(--border-color);
          border-radius: 20px; padding: 24px 28px; margin-bottom: 24px;
        }
        .dc-pf-tabs {
          display: flex; gap: 4px; margin-bottom: 32px;
          overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none;
          border-bottom: 1px solid var(--border-color); padding-bottom: 0;
        }
        .dc-pf-tabs::-webkit-scrollbar { display: none; }
        .dc-pf-tab {
          font-family: var(--font-cinzel); font-size: 0.7rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--text-muted); opacity: 0.6;
          background: none; border: none; border-bottom: 2px solid transparent;
          padding: 12px 14px; cursor: pointer; white-space: nowrap;
          transition: all 0.2s; display: flex; align-items: center; gap: 6px;
        }
        .dc-pf-tab--active {
          color: var(--accent); opacity: 1;
          border-bottom-color: var(--accent);
        }
        @keyframes bdayPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,168,76,0.3); }
          50% { box-shadow: 0 0 8px 2px rgba(232,168,76,0.5); }
        }
        @media (max-width: 767px) {
          .dc-pf-wrap { padding: 80px 16px 60px; }
          .dc-pf-header { padding: 16px; gap: 14px; }
        }
      `}</style>
    </main>
  );
}

// ─── Tab: Favoritos ──────────────────────────────────────────────────────────

function TabFavoritos() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [locales, setLocales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("deseocomer_session") || "{}");
    if (!session.id) { setLoading(false); return; }
    fetch(`/api/favoritos?usuarioId=${session.id}`)
      .then(r => r.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any[]) => { if (Array.isArray(data)) setLocales(data.map(f => f.local).filter(Boolean)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>{[1,2].map(i => <div key={i} style={{ height: "100px", borderRadius: "12px", background: "rgba(45,26,8,0.85)", animation: "pulse 1.5s ease infinite" }} />)}</div>;

  if (locales.length === 0) return (
    <EmptyState icon="🤍" text="Aún no tienes favoritos. Guarda locales para encontrarlos fácilmente." btnText="Explorar locales" btnHref="/locales" />
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
      {locales.map((l: { id: string; nombre: string; comuna: string; categoria: string }) => (
        <Link key={l.id} href={`/locales/${l.id}`} style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", textDecoration: "none" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, color: "var(--bg-primary)", flexShrink: 0 }}>
            {l.nombre?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "var(--accent)" }}>{l.nombre}</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)" }}>{l.categoria} · {l.comuna}</p>
          </div>
        </Link>
      ))}
      <style>{`@keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }`}</style>
    </div>
  );
}

// ─── Tab: Concursos ──────────────────────────────────────────────────────────

interface ParticipacionAPI {
  concursoId: string | number;
  puntos: number;
  puntosNivel2: number;
  puntosNivel2Pendientes: number;
  puntosMadrugador: number;
  puntosReferidosNuevos: number;
  puntosReferidosExistentes: number;
}

function TabConcursos({ userId, userName }: { userId: string; userName: string }) {
  const [refCounts, setRefCounts] = useState<Array<{ concursoId: string | number; count: number }>>([]);
  const [copied, setCopied] = useState<string | number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ganados, setGanados] = useState<any[]>([]);
  const [ganadosLoading, setGanadosLoading] = useState(true);
  const [participacionesAPI, setParticipacionesAPI] = useState<ParticipacionAPI[]>([]);
  const [expandedConcurso, setExpandedConcurso] = useState<string | null>(null);

  useEffect(() => { setRefCounts(getAllRefCounts(userId)); }, [userId]);

  useEffect(() => {
    fetch(`/api/usuarios/${userId}/concursos-ganados`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setGanados(data); })
      .catch(() => {})
      .finally(() => setGanadosLoading(false));
  }, [userId]);

  useEffect(() => {
    fetch(`/api/usuarios/${userId}/participaciones`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setParticipacionesAPI(data); })
      .catch(() => {});
  }, [userId]);

  const copyLink = async (concursoId: string | number) => {
    const c = CONCURSOS.find(x => x.id === concursoId);
    const slug = c?.slug ?? String(concursoId);
    const nombre = encodeURIComponent(userName.split(" ")[0].toLowerCase());
    const url = `https://deseocomer.com/concursos/${slug}/${nombre}/${getRefCode(userId)}`;
    try { await navigator.clipboard.writeText(url); setCopied(concursoId); setTimeout(() => setCopied(null), 2500); } catch {}
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, { bg: string; border: string; color: string; label: string }> = {
      finalizado: { bg: "rgba(232,168,76,0.1)", border: "rgba(232,168,76,0.3)", color: "#e8a84c", label: "Pendiente de entrega" },
      completado: { bg: "rgba(61,184,158,0.1)", border: "rgba(61,184,158,0.3)", color: "#3db89e", label: "Premio recibido ✓" },
      en_disputa: { bg: "rgba(255,80,80,0.1)", border: "rgba(255,80,80,0.3)", color: "#ff6b6b", label: "Disputa activa" },
      en_revision: { bg: "rgba(232,168,76,0.1)", border: "rgba(232,168,76,0.3)", color: "#e8a84c", label: "En revisión" },
      expirado: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", color: "rgba(240,234,214,0.4)", label: "Expirado" },
    };
    const s = map[estado] ?? map.finalizado;
    return <span style={{ display: "inline-block", background: s.bg, border: `1px solid ${s.border}`, borderRadius: "20px", padding: "2px 10px", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", color: s.color }}>{s.label}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Concursos", value: participacionesAPI.length, icon: "🏆" },
          { label: "Ganados", value: ganados.length, icon: "👑" },
          { label: "Mejor posición", value: (() => { const pts = participacionesAPI.map(p => p.puntos).filter(Boolean); return pts.length > 0 ? Math.max(...pts) + " pts" : "—"; })(), icon: "📊" },
          { label: "Puntos históricos", value: participacionesAPI.reduce((acc, p) => acc + (p.puntos ?? 0), 0), icon: "✨" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 14, padding: 16, textAlign: "center" }}>
            <p style={{ fontSize: "1.2rem", marginBottom: 4 }}>{s.icon}</p>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.4rem", color: "var(--accent)", fontWeight: 700 }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", color: "rgba(240,234,214,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Concursos ganados */}
      {!ganadosLoading && ganados.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px" }}>Mis concursos ganados</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ganados.map((g) => (
              <div key={g.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.4rem" }}>🏆</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/concursos/${g.slug || g.id}`} style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)", textDecoration: "none" }}>{g.premio}</Link>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>{g.local?.nombre}</p>
                  </div>
                  {estadoBadge(g.estado)}
                </div>
                {g.estado === "finalizado" && g.codigoEntrega && (
                  <div style={{ background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", padding: "10px 14px", marginTop: "8px" }}>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>Tu código: <strong style={{ color: "var(--accent)", letterSpacing: "0.05em" }}>{g.codigoEntrega}</strong></p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.35)" }}>Revisa tu email para instrucciones de entrega</p>
                  </div>
                )}
                {g.estado === "completado" && g.premioConfirmadoAt && (
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.35)", marginTop: "4px" }}>Recibido el {new Date(g.premioConfirmadoAt).toLocaleDateString("es-CL")}</p>
                )}
                {g.estado === "en_disputa" && (
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.35)", marginTop: "4px" }}>Nuestro equipo está investigando tu caso</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mis participaciones */}
      {refCounts.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px" }}>Mis participaciones</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {refCounts.map(({ concursoId, count }) => {
              const info = CONCURSOS.find(x => x.id === concursoId) ?? CONCURSOS_FINALIZADOS.find(x => x.id === concursoId);
              const isActive = CONCURSOS.some(c => c.id === concursoId);
              const apiData = participacionesAPI.find(p => String(p.concursoId) === String(concursoId));
              const totalPts = apiData?.puntos ?? count;
              const nivel2 = apiData?.puntosNivel2 ?? 0;
              const nivel2Pend = apiData?.puntosNivel2Pendientes ?? 0;
              const registro = 1;
              const referidosDirectos = Math.max(0, totalPts - registro - nivel2);
              return (
                <div key={concursoId} onClick={() => setExpandedConcurso(prev => prev === String(concursoId) ? null : String(concursoId))} style={{
                  background: "var(--bg-secondary)", border: "1px solid var(--border-color)",
                  borderRadius: "16px", padding: "18px 20px", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ fontSize: "1.6rem" }}>{info?.imagen ?? "🎪"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/concursos/${concursoId}`} style={{
                        fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem",
                        color: "var(--accent)", textDecoration: "none",
                      }}>
                        {info?.premio ?? `Concurso #${concursoId}`}
                      </Link>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        {info?.local} · <span style={{ color: isActive ? "#3db89e" : "var(--text-muted)" }}>
                          {isActive ? "Activo" : "Finalizado"}
                        </span>
                      </p>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.2rem", color: "var(--accent)" }}>{totalPts}</p>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", color: "var(--oasis-bright)", letterSpacing: "0.1em" }}>PTS</p>
                    </div>
                    {isActive && (
                      <button onClick={() => copyLink(concursoId)} style={{
                        background: "none", border: "1px solid var(--border-color)",
                        borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
                        fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", color: "var(--accent)",
                      }}>
                        {copied === concursoId ? "✓" : "📋"}
                      </button>
                    )}
                  </div>
                  {/* Points breakdown */}
                  <div style={{
                    marginTop: "12px", paddingTop: "10px",
                    borderTop: "1px solid var(--border-color)",
                  }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>
                      Tus puntos: {totalPts}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", paddingLeft: "8px" }}>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.55)" }}>
                        Registro: <span style={{ color: "var(--accent)" }}>+1</span>
                      </p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.55)" }}>
                        Referidos directos: <span style={{ color: "var(--accent)" }}>+{referidosDirectos}</span>
                      </p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.55)" }}>
                        Red de referidos: <span style={{ color: "var(--accent)" }}>+{nivel2}</span>
                      </p>
                      {nivel2 > 0 && <p style={{ fontFamily: "var(--font-lato)", fontSize: 10, color: "rgba(240,234,214,0.25)", fontStyle: "italic", marginTop: 2 }}>Puntos ganados porque personas que tú invitaste también invitaron a otros al concurso.</p>}
                      {nivel2Pend > 0 && (
                        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)", fontStyle: "italic" }}>
                          En verificaci&oacute;n: +{nivel2Pend} pts
                        </p>
                      )}
                    </div>
                  </div>
                  {expandedConcurso === String(concursoId) && (
                    <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(232,168,76,0.08)", fontSize: 12, color: "rgba(240,234,214,0.4)", lineHeight: 1.8 }}>
                      <p>• Registro: +1</p>
                      {(apiData?.puntosMadrugador ?? 0) > 0 && <p>• Bonus madrugador: +{apiData!.puntosMadrugador}</p>}
                      {(apiData?.puntosReferidosNuevos ?? 0) > 0 && <p>• Referidos nuevos: +{apiData!.puntosReferidosNuevos}</p>}
                      {(apiData?.puntosReferidosExistentes ?? 0) > 0 && <p>• Referidos existentes: +{apiData!.puntosReferidosExistentes}</p>}
                      {nivel2 > 0 && <p>• Red de referidos: +{nivel2}</p>}
                      <p style={{ color: "var(--accent)", fontWeight: 700, marginTop: 4 }}>Total: +{totalPts} pts</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {refCounts.length === 0 && ganados.length === 0 && !ganadosLoading && (
        <EmptyState icon="🏆" text="No participas en ningún concurso aún" btnText="Ver concursos activos" btnHref="/concursos" />
      )}
    </div>
  );
}

// ─── Tab: Historial ──────────────────────────────────────────────────────────

function TabHistorial() {
  const { perfil } = useGenie();
  const visits = [...perfil.comportamiento.localesVisitados].reverse();

  if (visits.length === 0) return (
    <EmptyState icon="🕐" text="Tu historial de visitas aparecerá aquí" />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {visits.map((v, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "12px 0", borderBottom: "1px solid var(--border-color)",
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "var(--text-primary)" }}>
              {v.nombre}
            </p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {v.categoria} · {v.comuna}
            </p>
          </div>
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", flexShrink: 0 }}>
            {timeAgo(v.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Logros ─────────────────────────────────────────────────────────────

function TabLogros() {
  const { perfil } = useGenie();
  const profile = loadProfile();
  const visits = perfil.comportamiento.localesVisitados;
  const comunasSet = new Set(visits.map(v => v.comuna));

  const badges = [
    { icon: "🏮", name: "Primer Deseo", desc: "Completaste el flujo del Genio", unlocked: perfil.respuestasGenio.length > 0 },
    { icon: "💛", name: "Guardador", desc: "Guardaste tu primer favorito", unlocked: (() => { try { return JSON.parse(localStorage.getItem(FAVS_KEY) ?? "[]").length > 0; } catch { return false; } })() },
    { icon: "🏆", name: "Concursante", desc: "Participaste en tu primer concurso", unlocked: (() => { try { return Object.keys(JSON.parse(localStorage.getItem("dc_refs") ?? "{}")).length > 0; } catch { return false; } })() },
    { icon: "🔥", name: "Explorador", desc: "Visitaste 5 locales distintos", unlocked: new Set(visits.map(v => v.id)).size >= 5 },
    { icon: "🎂", name: "Cumpleañero", desc: "Registraste tu fecha de cumpleaños", unlocked: !!(profile.cumpleanos as Record<string, unknown>)?.mes },
    { icon: "👥", name: "Influencer", desc: "Referiste a 3 amigos en un concurso", unlocked: (() => { try { const s = JSON.parse(localStorage.getItem("dc_refs") ?? "{}"); return Object.values(s).some(v => (v as number) >= 3); } catch { return false; } })() },
    { icon: "🗺���", name: "Viajero", desc: "Visitaste locales en 3 comunas", unlocked: comunasSet.size >= 3 },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
      {badges.map(b => (
        <div key={b.name} style={{
          background: b.unlocked ? "rgba(232,168,76,0.08)" : "rgba(0,0,0,0.2)",
          border: `1px solid ${b.unlocked ? "rgba(232,168,76,0.3)" : "var(--border-color)"}`,
          borderRadius: "14px", padding: "20px 14px", textAlign: "center",
          opacity: b.unlocked ? 1 : 0.5,
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px", filter: b.unlocked ? "none" : "grayscale(1)" }}>
            {b.unlocked ? b.icon : "🔒"}
          </div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: b.unlocked ? "var(--accent)" : "var(--text-muted)", marginBottom: "4px" }}>
            {b.name}
          </p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            {b.unlocked ? b.desc : `Falta: ${b.desc.toLowerCase()}`}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Mi Genio ─────────────────────────────────────���─────────────────────

function TabGenio() {
  const { perfil } = useGenie();
  const g = perfil.gustos;

  const topCats = Object.entries(g.categorias).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topComunas = Object.entries(g.comunas).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topOcasion = Object.entries(g.ocasiones).sort((a, b) => b[1] - a[1])[0];
  const topHorario = Object.entries(g.horario).sort((a, b) => b[1] - a[1])[0];
  const maxCatScore = topCats[0]?.[1] ?? 1;

  const handleReset = () => {
    if (confirm("¿Seguro? El Genio olvidará todo lo que aprendió de ti")) {
      localStorage.removeItem("deseocomer_genio_perfil");
      window.location.reload();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Categorías */}
      <div>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px" }}>
          Tus categorías favoritas
        </p>
        {topCats.length === 0 ? (
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }}>Aún aprendiendo...</p>
        ) : topCats.map(([cat, score]) => (
          <div key={cat} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-primary)", textTransform: "capitalize" }}>{cat}</span>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", color: "var(--oasis-bright)" }}>{score}</span>
            </div>
            <div style={{ height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.3)" }}>
              <div style={{ height: "100%", borderRadius: "3px", background: "var(--oasis-bright)", width: `${(score / maxCatScore) * 100}%`, transition: "width 0.5s" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Comunas */}
      <div>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px" }}>
          Tus zonas habituales
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {topComunas.length === 0
            ? <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }}>Sin datos aún</p>
            : topComunas.map(([c]) => (
              <span key={c} style={{
                fontFamily: "var(--font-lato)", fontSize: "0.82rem",
                background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)",
                borderRadius: "20px", padding: "4px 12px", color: "rgba(245,208,128,0.85)",
                textTransform: "capitalize",
              }}>{c}</span>
            ))}
        </div>
      </div>

      {/* Ocasión y horario */}
      {topOcasion && (
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Tu ocasión más frecuente: <strong style={{ color: "var(--accent)" }}>{topOcasion[0]}</strong>
        </p>
      )}
      {topHorario && (
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Sueles buscar en las <strong style={{ color: "var(--accent)" }}>{topHorario[0] === "manana" ? "mañanas" : topHorario[0] === "mediodia" ? "tardes" : topHorario[0] === "noche" ? "noches" : topHorario[0]}</strong>
        </p>
      )}

      {/* Respuestas */}
      {perfil.respuestasGenio.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px" }}>
            Respuestas que me diste
          </p>
          {perfil.respuestasGenio.slice(-5).reverse().map((r, i) => (
            <p key={i} style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              "{r.respuesta}" <span style={{ opacity: 0.5 }}>— {timeAgo(r.timestamp)}</span>
            </p>
          ))}
        </div>
      )}

      <button onClick={handleReset} style={{
        alignSelf: "flex-start", marginTop: "12px",
        background: "none", border: "1px solid rgba(255,80,80,0.3)",
        borderRadius: "10px", padding: "8px 16px", cursor: "pointer",
        fontFamily: "var(--font-cinzel)", fontSize: "0.78rem",
        color: "#ff8080", letterSpacing: "0.08em",
      }}>
        Resetear mis preferencias
      </button>
    </div>
  );
}

// ─── Tab: Mi Perfil (Editar) ─────────────────────────────────────────────────

function TabPerfil({ user, logout, router }: { user: { nombre: string; email: string; id?: string }; logout: () => void; router: ReturnType<typeof useRouter> }) {
  const [form, setForm] = useState(() => {
    const p = loadProfile();
    const c = p.cumpleanos as { dia?: number; mes?: number; ano?: number } | undefined;
    return {
      nombre: user.nombre,
      email: user.email,
      telefono: (p.telefono as string) ?? "",
      cumpleDia: c?.dia ?? 0,
      cumpleMes: c?.mes ?? 0,
      cumpleAno: c?.ano ?? 0,
      notifConcursos: (p.notifConcursos as boolean) ?? true,
      notifPromos: (p.notifPromos as boolean) ?? true,
      notifCumple: (p.notifCumple as boolean) ?? true,
      notifUrgente: (p.notifUrgente as boolean) ?? true,
    };
  });
  const [saved, setSaved] = useState(false);

  // Food preferences
  const [estiloAlimentario, setEstiloAlimentario] = useState("");
  const [comidasFavoritas, setComidasFavoritas] = useState<string[]>([]);
  const [gustosSaved, setGustosSaved] = useState(false);
  const [gustosLoading, setGustosLoading] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("deseocomer_session") ?? "{}");
      if (s.estiloAlimentario) setEstiloAlimentario(s.estiloAlimentario);
      if (Array.isArray(s.comidasFavoritas) && s.comidasFavoritas.length > 0) setComidasFavoritas(s.comidasFavoritas);
      // If not in localStorage, fetch from DB
      if (s.id && (!s.estiloAlimentario && (!s.comidasFavoritas || s.comidasFavoritas.length === 0))) {
        fetch(`/api/usuarios/${s.id}/perfil`).then(r => r.ok ? r.json() : null).then(data => {
          if (data) {
            if (data.estiloAlimentario) { setEstiloAlimentario(data.estiloAlimentario); s.estiloAlimentario = data.estiloAlimentario; }
            if (Array.isArray(data.comidasFavoritas) && data.comidasFavoritas.length > 0) { setComidasFavoritas(data.comidasFavoritas); s.comidasFavoritas = data.comidasFavoritas; }
            localStorage.setItem("deseocomer_session", JSON.stringify(s));
          }
        }).catch(() => {});
      }
    } catch { /* noop */ }
  }, []);

  const saveGustos = async () => {
    setGustosLoading(true);
    try {
      const s = JSON.parse(localStorage.getItem("deseocomer_session") ?? "{}");
      const res = await fetch("/api/usuarios/preferencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: s.id, estiloAlimentario, comidasFavoritas }),
      });
      if (res.ok) {
        s.estiloAlimentario = estiloAlimentario;
        s.comidasFavoritas = comidasFavoritas;
        localStorage.setItem("deseocomer_session", JSON.stringify(s));
        setGustosSaved(true);
        setTimeout(() => setGustosSaved(false), 2500);
      }
    } catch { /* noop */ }
    setGustosLoading(false);
  };

  const handleSave = () => {
    const p = loadProfile();
    p.telefono = form.telefono;
    p.cumpleanos = form.cumpleDia && form.cumpleMes ? { dia: form.cumpleDia, mes: form.cumpleMes, ano: form.cumpleAno || undefined } : undefined;
    p.notifConcursos = form.notifConcursos;
    p.notifPromos = form.notifPromos;
    p.notifCumple = form.notifCumple;
    p.notifUrgente = form.notifUrgente;
    saveProfile(p);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const edad = form.cumpleMes && form.cumpleDia && form.cumpleAno
    ? Math.floor((Date.now() - new Date(form.cumpleAno, form.cumpleMes - 1, form.cumpleDia).getTime()) / 31557600000)
    : null;

  const S = { fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)", background: "#1a1008", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "10px 14px", width: "100%", boxSizing: "border-box" as const, outline: "none" };

  const [fotoUrl, setFotoUrl] = useState((() => { try { const s = JSON.parse(localStorage.getItem("deseocomer_session") ?? "{}"); return s.fotoUrl || ""; } catch { return ""; } })());

  const handleFotoUpload = async (url: string) => {
    setFotoUrl(url);
    try {
      const s = JSON.parse(localStorage.getItem("deseocomer_session") ?? "{}");
      await fetch("/api/usuarios/foto", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: s.id, fotoUrl: url }) });
      s.fotoUrl = url;
      localStorage.setItem("deseocomer_session", JSON.stringify(s));
    } catch { /* noop */ }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "480px" }}>
      {/* Código de invitación */}
      {user?.id && (
        <div style={{ background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", marginBottom: 8 }}>Tu código de invitación</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.3rem", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.12em", flex: 1 }}>{(user as any).codigoRef || "—"}</span>
            <button onClick={() => { navigator.clipboard.writeText((user as any).codigoRef || ""); }} style={{ padding: "6px 14px", background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: 8, fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--accent)", cursor: "pointer" }}>Copiar</button>
          </div>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.3)", marginTop: 8, lineHeight: 1.5 }}>Comparte este código con amigos para ganar puntos cuando participen en concursos</p>
        </div>
      )}
      <div>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Foto de perfil</span>
        <SubirFoto folder="perfiles" circular preview={fotoUrl || null} label="Subir foto" height="80px" onUpload={handleFotoUpload} />
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Nombre completo</span>
        <input style={S} value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Email</span>
        <input style={{ ...S, opacity: 0.5 }} value={form.email} disabled />
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)" }}>Teléfono (opcional)</span>
        <input style={S} value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+56 9 1234 5678" />
      </label>

      {/* Birthday */}
      <div>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Fecha de nacimiento</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <select style={{ ...S, flex: 1 }} value={form.cumpleDia} onChange={e => setForm(f => ({ ...f, cumpleDia: Number(e.target.value) }))}>
            <option value={0}>Día</option>
            {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
          <select style={{ ...S, flex: 1 }} value={form.cumpleMes} onChange={e => setForm(f => ({ ...f, cumpleMes: Number(e.target.value) }))}>
            <option value={0}>Mes</option>
            {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select style={{ ...S, flex: 1 }} value={form.cumpleAno} onChange={e => setForm(f => ({ ...f, cumpleAno: Number(e.target.value) }))}>
            <option value={0}>Año</option>
            {Array.from({ length: 85 }, (_, i) => { const y = new Date().getFullYear() - i; return <option key={y} value={y}>{y}</option>; })}
          </select>
        </div>
        {edad !== null && edad > 0 && (
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>({edad} años)</p>
        )}
      </div>

      {/* Mis gustos */}
      <div style={{ marginTop: "16px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px" }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", display: "block", marginBottom: "14px" }}>Mis gustos</span>

        <div style={{ marginBottom: "16px" }}>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Estilo alimentario</span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { value: "omnivoro", emoji: "🍽️", label: "Como de todo" },
              { value: "carnivoro", emoji: "🥩", label: "Carnívoro" },
              { value: "vegetariano", emoji: "🌱", label: "Vegetariano" },
              { value: "vegano", emoji: "🌿", label: "Vegano" },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => setEstiloAlimentario(estiloAlimentario === opt.value ? "" : opt.value)} style={{
                padding: "8px 14px", borderRadius: "12px", cursor: "pointer",
                border: estiloAlimentario === opt.value ? "1px solid var(--accent)" : "1px solid var(--border-color)",
                background: estiloAlimentario === opt.value ? "rgba(232,168,76,0.12)" : "transparent",
                color: estiloAlimentario === opt.value ? "var(--accent)" : "var(--text-muted)",
                fontFamily: "var(--font-lato)", fontSize: "0.82rem",
              }}>
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "8px" }}>Comidas favoritas (máx. 3)</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {["Pizza", "Sushi", "Hamburguesa", "Mexicano", "Pastas", "Pollo", "Parrilla", "Mariscos", "Café", "Saludable", "Postres", "Brunch"].map(c => {
              const isSel = comidasFavoritas.includes(c);
              const maxed = comidasFavoritas.length >= 3 && !isSel;
              return (
                <button key={c} type="button" disabled={maxed} onClick={() => {
                  setComidasFavoritas(prev => isSel ? prev.filter(x => x !== c) : [...prev, c]);
                }} style={{
                  padding: "5px 12px", borderRadius: "12px", cursor: maxed ? "default" : "pointer",
                  border: isSel ? "1px solid var(--accent)" : "1px solid var(--border-color)",
                  background: isSel ? "rgba(232,168,76,0.12)" : "transparent",
                  color: isSel ? "var(--accent)" : maxed ? "rgba(240,234,214,0.2)" : "var(--text-muted)",
                  fontFamily: "var(--font-lato)", fontSize: "0.78rem",
                }}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={saveGustos} disabled={gustosLoading} style={{
          background: "var(--accent)", color: "var(--bg-primary)",
          border: "none", borderRadius: "10px", padding: "10px 20px",
          fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
        }}>
          {gustosSaved ? "✓ Guardado" : gustosLoading ? "..." : "Guardar gustos"}
        </button>
      </div>

      {/* Notifications */}
      <div style={{ marginTop: "8px" }}>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "10px" }}>Notificaciones</span>
        {[
          { key: "notifConcursos" as const, label: "Notificarme concursos nuevos" },
          { key: "notifPromos" as const, label: "Alertas de promociones en mi zona" },
          { key: "notifCumple" as const, label: "Recordatorio de cumpleaños con ofertas" },
          { key: "notifUrgente" as const, label: "Concursos por terminar (menos de 24h)" },
        ].map(n => (
          <label key={n.key} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={form[n.key]} onChange={e => setForm(f => ({ ...f, [n.key]: e.target.checked }))}
              style={{ accentColor: "var(--accent)", width: "18px", height: "18px" }} />
            <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)" }}>{n.label}</span>
          </label>
        ))}
      </div>

      <button onClick={handleSave} style={{
        background: "var(--accent)", color: "var(--bg-primary)",
        border: "none", borderRadius: "12px", padding: "12px 24px",
        fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
        alignSelf: "flex-start",
      }}>
        {saved ? "✓ Guardado" : "Guardar cambios"}
      </button>

      {/* Danger zone */}
      <div style={{ marginTop: "32px", paddingTop: "20px", borderTop: "1px solid rgba(255,80,80,0.2)" }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#ff8080", marginBottom: "12px" }}>Zona de peligro</p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => { logout(); router.push("/"); }} style={{
            background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "10px",
            padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-cinzel)",
            fontSize: "0.78rem", color: "#ff8080",
          }}>Cerrar sesión</button>
          <button onClick={() => alert("Esta función estará disponible pronto")} style={{
            background: "none", border: "1px solid rgba(255,80,80,0.15)", borderRadius: "10px",
            padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-cinzel)",
            fontSize: "0.78rem", color: "rgba(255,80,80,0.5)",
          }}>Eliminar mi cuenta</button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state helper ──────────────────────────────────────────────────────

function EmptyState({ icon, text, btnText, btnHref }: { icon: string; text: string; btnText?: string; btnHref?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{icon}</div>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: btnText ? "20px" : "0", maxWidth: "360px", margin: "0 auto" }}>
        {text}
      </p>
      {btnText && btnHref && (
        <Link href={btnHref} style={{
          display: "inline-block", marginTop: "20px",
          fontFamily: "var(--font-cinzel)", fontSize: "0.8rem",
          letterSpacing: "0.1em", textTransform: "uppercase",
          background: "var(--accent)", color: "var(--bg-primary)",
          fontWeight: 700, padding: "10px 24px", borderRadius: "20px", textDecoration: "none",
        }}>{btnText}</Link>
      )}
    </div>
  );
}
