"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import SelloGratis from "@/components/SelloGratis";
import Footer from "@/components/layout/Footer";
import {
  CONCURSOS,
  CONCURSOS_FINALIZADOS,
  getTimeLeft,
  isSoonEnding,
  pad2,
  type Concurso,
  type ConcursoFinalizado,
} from "@/lib/mockConcursos";

// ─── Types ───────────────────────────────────────────────────────────────────

type Filter = "todos" | "activos" | "por_terminar" | "ganadores";

interface TimeLeft {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  ended: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ConcursosPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("todos");
  const [timers, setTimers] = useState<Record<number, TimeLeft>>({});
  const [mounted, setMounted] = useState(false);
  const [bdConcursos, setBdConcursos] = useState<Concurso[]>([]);

  // Fetch real concursos from BD
  useEffect(() => {
    fetch("/api/concursos").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Concurso[] = data.map((c: any) => ({
          id: c.id, slug: c.slug ?? c.id, local: c.local?.nombre ?? "Local", localId: c.local?.id ?? "",
          imagen: "🏆", imagenUrl: c.imagenUrl ?? c.local?.portadaUrl ?? "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
          premio: c.premio ?? "", descripcionPremio: c.descripcion ?? "",
          participantes: c._count?.participantes ?? 0,
          endsAt: new Date(c.fechaFin).getTime(),
          reglas: [], descripcionLocal: "", ranking: [],
        }));
        setBdConcursos(mapped);
      }
    }).catch(() => {});
  }, []);

  // Merge BD concursos with mock
  const allConcursos = bdConcursos.length > 0 ? bdConcursos : CONCURSOS;

  // Initialize & tick timers
  const updateTimers = useCallback(() => {
    const next: Record<number, TimeLeft> = {};
    for (const c of allConcursos) next[c.id] = getTimeLeft(c.endsAt);
    setTimers(next);
  }, [allConcursos.length]);

  useEffect(() => {
    setMounted(true);
    updateTimers();
    const id = setInterval(updateTimers, 1000);
    return () => clearInterval(id);
  }, [updateTimers]);

  // Filter + sort: por terminar primero, luego más participantes
  const visibleActivos: Concurso[] = allConcursos.filter((c) => {
    const soon = isSoonEnding(c.endsAt);
    if (filter === "activos")      return !soon;
    if (filter === "por_terminar") return soon;
    if (filter === "ganadores")    return false;
    return true; // todos
  }).sort((a, b) => {
    const soonA = isSoonEnding(a.endsAt);
    const soonB = isSoonEnding(b.endsAt);
    if (soonA && !soonB) return -1;
    if (!soonA && soonB) return 1;
    if (soonA && soonB) return a.endsAt - b.endsAt; // más urgente primero
    return b.participantes - a.participantes; // más participantes primero
  });

  const filters: { key: Filter; label: string }[] = [
    { key: "todos",        label: "Todos" },
    { key: "activos",      label: "Activos" },
    { key: "por_terminar", label: "Por terminar" },
    { key: "ganadores",    label: "Ganadores 🏆" },
  ];

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── Hero header ──────────────────────────────────────────────── */}
      <section className="dc-cp-hero">
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 65%)",
        }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            letterSpacing: "0.45em", textTransform: "uppercase",
            color: "var(--oasis-bright)", marginBottom: "16px",
          }}>
            Concursos
          </p>
          <h1 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(2.2rem, 7vw, 4.5rem)",
            fontWeight: 800, letterSpacing: "0.02em",
            color: "var(--accent)",
            textShadow: "0 0 60px color-mix(in srgb, var(--accent) 50%, transparent)",
            marginBottom: "20px", lineHeight: 1.1,
          }}>
            Gana Comida Gratis 🎪
          </h1>
          <p style={{
            fontFamily: "var(--font-lato)", fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
            color: "var(--text-primary)", fontWeight: 400,
            maxWidth: "520px", margin: "0 auto", lineHeight: 1.8,
          }}>
            Comparte tu link con amigos, sube en el ranking y gana premios reales
            de los mejores restaurantes de Santiago.
          </p>

          <div style={{ marginTop: "12px" }}>
            <Link href="/concursos/como-funciona" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "rgba(240,234,214,0.35)", textDecoration: "none", borderBottom: "1px solid rgba(240,234,214,0.15)", paddingBottom: "2px" }}>
              ¿No sabes cómo funciona? Aprende aquí →
            </Link>
          </div>

        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <section className="dc-cp-content">
        <div className="dc-cp-filters">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { if (key === "ganadores") { router.push("/concursos/ganadores"); return; } setFilter(key); }}
              className={`dc-cp-filter-btn${filter === key ? " dc-cp-filter-btn--active" : ""}`}
            >
              {label}
              {key === "por_terminar" && (
                <span style={{
                  display: "inline-block", width: "6px", height: "6px",
                  borderRadius: "50%", background: "#ff4444",
                  marginLeft: "7px", verticalAlign: "middle",
                  boxShadow: "0 0 6px #ff4444",
                }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Active/Soon ending grid ───────────────────────────────── */}
        {visibleActivos.length > 0 && (
          <div className="dc-cp-grid">
            {visibleActivos.map((c) => (
              <ConcursoCard
                key={c.id}
                concurso={c}
                timer={timers[c.id]}
                mounted={mounted}
                onParticipate={() => router.push(`/concursos/${c.id}`)}
              />
            ))}
          </div>
        )}

        {visibleActivos.length === 0 && filter !== "ganadores" && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</p>
            <p style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.85rem",
              letterSpacing: "0.15em", color: "var(--text-muted)",
            }}>No hay concursos en esta categoría</p>
          </div>
        )}

      </section>

      <Footer />

      <style>{`
        .dc-cp-hero {
          position: relative; overflow: hidden;
          padding: 140px 60px 80px;
          text-align: center;
        }
        .dc-cp-filters {
          display: flex; gap: 10px; flex-wrap: nowrap;
          justify-content: center;
          margin-bottom: 44px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .dc-cp-filters::-webkit-scrollbar { display: none; }
        .dc-cp-filter-btn {
          font-family: var(--font-cinzel); font-size: clamp(0.75rem, 2vw, 0.85rem);
          letter-spacing: 0.15em; text-transform: uppercase;
          padding: 10px 20px; border-radius: 30px; cursor: pointer;
          border: 1px solid var(--border-color);
          background: transparent; color: var(--text-muted);
          transition: all 0.2s ease; white-space: nowrap;
          display: flex; align-items: center; min-height: 44px;
          flex-shrink: 0;
        }
        .dc-cp-filter-btn:hover {
          border-color: var(--accent); color: var(--accent);
        }
        .dc-cp-filter-btn--active {
          background: color-mix(in srgb, var(--accent) 15%, transparent);
          border-color: var(--accent); color: var(--accent);
        }
        .dc-cp-content {
          padding: 0 60px 60px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .dc-cp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 28px;
        }

        @media (max-width: 767px) {
          .dc-cp-hero    { padding: 100px 20px 60px; }
          .dc-cp-content { padding: 0 20px 60px; }
          .dc-cp-filters { justify-content: flex-start; }
          .dc-cp-grid    { grid-template-columns: 1fr; gap: 16px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-cp-hero    { padding: 120px 40px 70px; }
          .dc-cp-content { padding: 0 40px 60px; }
          .dc-cp-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </main>
  );
}

// ─── Card: active/soon-ending contest ────────────────────────────────────────

function ConcursoCard({
  concurso: c,
  timer,
  mounted: _mounted,
  onParticipate,
}: {
  concurso: Concurso;
  timer: TimeLeft | undefined;
  mounted: boolean;
  onParticipate: () => void;
}) {
  const soon = isSoonEnding(c.endsAt);
  const ended = !!timer?.ended;
  const urgColor = "#e05555";
  const accentColor = soon ? urgColor : "var(--accent)";
  const badgeText = ended ? "Finalizado" : soon ? "¡Termina pronto!" : "Concurso activo";
  const badgeDot = ended ? "var(--text-muted)" : soon ? urgColor : "#3db89e";

  return (
    <div className="dc-cc-card" onClick={onParticipate} style={{
      background: "rgba(20,12,35,0.95)",
      border: `1px solid ${soon ? "rgba(224,85,85,0.4)" : "rgba(232,168,76,0.25)"}`,
      borderRadius: "20px", overflow: "hidden", cursor: "pointer",
      transition: "transform 0.25s, border-color 0.25s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.borderColor = soon ? "rgba(224,85,85,0.4)" : "rgba(232,168,76,0.25)"; }}
    >
      {/* Image */}
      <div className="dc-cc-img" style={{ position: "relative", overflow: "hidden", background: "rgba(45,26,8,0.8)" }}>
        {c.imagenUrl ? (
          <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #2d1a08, #1a0e05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>🏆</div>
        )}
        <div style={{ position: "absolute", top: 0, right: 0, zIndex: 4, lineHeight: 0 }}><SelloGratis size="sm" /></div>
        <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 3, background: "rgba(10,8,18,0.75)", border: `1px solid ${soon ? "rgba(224,85,85,0.5)" : "rgba(232,168,76,0.35)"}`, borderRadius: "20px", padding: "4px 10px 4px 6px", display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: soon ? urgColor : "#e8a84c", animation: `dc-cc-pulse-dot ${soon ? "0.8s" : "1.8s"} ease-in-out infinite` }} />
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.08em", color: soon ? urgColor : "rgba(240,234,214,0.7)", textTransform: "uppercase" }}>{badgeText}</span>
        </div>
      </div>

      {/* Content */}
      <div className="dc-cc-body" style={{ padding: "16px 20px 18px" }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,214,0.45)", marginBottom: "4px" }}>{c.local}</p>
        <p className="dc-cc-premio" style={{ fontFamily: "var(--font-cinzel)", color: "#f5d080", textTransform: "uppercase", marginBottom: "14px", lineHeight: 1.3 }}>{c.premio}</p>
        <p className="dc-cc-desc" style={{ fontFamily: "var(--font-lato)", fontSize: "13px", color: "rgba(240,234,214,0.45)", lineHeight: 1.5, marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>Comparte tu link y gana este premio. Mientras más amigos invites, más chances tienes.</p>

        {/* Countdown */}
        {!ended && timer && (
          <div style={{ background: "rgba(10,8,18,0.6)", border: `1px solid ${soon ? "rgba(224,85,85,0.3)" : "rgba(232,168,76,0.15)"}`, borderRadius: "12px", padding: "10px 14px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: soon ? urgColor : "#e8a84c", animation: `dc-cc-pulse-dot ${soon ? "0.8s" : "1.8s"} ease-in-out infinite` }} />
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.5rem", letterSpacing: "0.15em", textTransform: "uppercase", color: soon ? urgColor : "var(--oasis-bright)" }}>Termina en</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
              {[
                ...(timer.dias > 0 ? [{ val: timer.dias, label: "días" }] : []),
                { val: timer.horas, label: "hrs" },
                { val: timer.minutos, label: "min" },
                { val: timer.segundos, label: "seg" },
              ].map(({ val, label }, idx, arr) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.3rem", fontWeight: 700, lineHeight: 1, color: accentColor, minWidth: "32px" }}>{pad2(val)}</div>
                    <div style={{ fontFamily: "var(--font-cinzel)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "2px" }}>{label}</div>
                  </div>
                  {idx < arr.length - 1 && <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: accentColor, opacity: 0.5, marginBottom: "12px" }}>:</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        {ended && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px", textAlign: "center", marginBottom: "14px" }}>
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>Concurso finalizado</span>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            👥 {c.participantes} participante{c.participantes !== 1 ? "s" : ""}
          </span>
          {!ended && (
            <span className="dc-cc-btn" style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700,
              padding: "7px 16px", borderRadius: "20px",
              border: `1px solid ${soon ? urgColor : "var(--accent)"}`,
              color: soon ? urgColor : "var(--accent)", background: "transparent",
            }}>
              Participar →
            </span>
          )}
        </div>
      </div>

      <style>{`
        .dc-cc-card { cursor: pointer; }
        .dc-cc-img { height: 180px; }
        .dc-cc-premio { font-size: 17px; }
        .dc-cc-desc { display: none !important; }
        @keyframes dc-cc-pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @media (min-width: 768px) {
          .dc-cc-card { display: flex !important; flex-direction: row !important; }
          .dc-cc-img { width: 280px; height: auto !important; min-height: 220px; flex-shrink: 0; }
          .dc-cc-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
          .dc-cc-premio { font-size: 20px; }
          .dc-cc-desc { display: -webkit-box !important; }
          .dc-cc-btn { background: var(--accent) !important; color: var(--bg-primary) !important; border-color: var(--accent) !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Timer digit unit ─────────────────────────────────────────────────────────

function TimerUnit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: "center", padding: "16px 8px" }}>
      <span style={{
        fontFamily: "var(--font-cinzel-decorative)",
        fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: 700,
        lineHeight: 1, display: "block",
        color: urgent ? "#ff4444" : "var(--accent)",
        textShadow: urgent
          ? "0 0 20px rgba(255,68,68,0.6)"
          : "0 0 16px color-mix(in srgb, var(--accent) 50%, transparent)",
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

// ─── Card: finalized contest ──────────────────────────────────────────────────

function FinalizadoCard({ concurso: c }: { concurso: ConcursoFinalizado }) {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "20px", overflow: "hidden",
        opacity: 0.75,
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0.75"; }}
    >
      {c.imagenUrl && (
        <div style={{
          height: "140px", overflow: "hidden",
          background: "rgba(45,26,8,0.8)",
        }}>
          <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}
      <div style={{ padding: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
        {!c.imagenUrl && <span style={{ fontSize: "2.4rem" }}>{c.imagen}</span>}
        <div>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            letterSpacing: "0.2em", color: "var(--text-muted)",
            textTransform: "uppercase", marginBottom: "4px",
          }}>
            {c.local}
          </p>
          <p style={{
            fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            color: "var(--text-primary)",
          }}>
            {c.premio}
          </p>
        </div>
      </div>

      <div style={{
        background: "rgba(0,0,0,0.25)", borderRadius: "12px",
        padding: "16px", marginBottom: "16px",
      }}>
        <p style={{
          fontFamily: "var(--font-cinzel)", fontSize: "0.55rem",
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "var(--text-muted)", marginBottom: "10px",
        }}>
          🏆 Ganador
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "color-mix(in srgb, var(--accent) 20%, var(--bg-primary))",
              border: "1px solid var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-cinzel)", fontSize: "0.7rem",
              fontWeight: 700, color: "var(--accent)",
            }}>
              {c.ganador.nombre.charAt(0)}
            </div>
            <span style={{
              fontFamily: "var(--font-lato)", fontSize: "0.95rem",
              color: "var(--text-primary)", fontWeight: 700,
            }}>
              {c.ganador.nombre}
            </span>
          </div>
          <span style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.7rem",
            color: "var(--oasis-bright)",
          }}>
            {c.ganador.referidos} refs
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: "var(--font-lato)", fontSize: "0.78rem",
          color: "var(--text-muted)",
        }}>
          {c.participantes} participantes
        </span>
        <span style={{
          fontFamily: "var(--font-lato)", fontSize: "0.78rem",
          color: "var(--text-muted)",
        }}>
          {c.fechaFin}
        </span>
      </div>
      </div>{/* close padding wrapper */}
    </div>
  );
}
