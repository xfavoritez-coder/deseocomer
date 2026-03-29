"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
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

type Filter = "todos" | "activos" | "por_terminar" | "finalizados";

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

  // Initialize & tick timers
  const updateTimers = useCallback(() => {
    const next: Record<number, TimeLeft> = {};
    for (const c of CONCURSOS) next[c.id] = getTimeLeft(c.endsAt);
    setTimers(next);
  }, []);

  useEffect(() => {
    setMounted(true);
    updateTimers();
    const id = setInterval(updateTimers, 1000);
    return () => clearInterval(id);
  }, [updateTimers]);

  // Filter logic
  const visibleActivos: Concurso[] = CONCURSOS.filter((c) => {
    const soon = isSoonEnding(c.endsAt);
    if (filter === "activos")      return !soon;
    if (filter === "por_terminar") return soon;
    if (filter === "finalizados")  return false;
    return true; // todos
  });

  const showFinalizados =
    filter === "finalizados" || filter === "todos";

  const filters: { key: Filter; label: string }[] = [
    { key: "todos",        label: "Todos" },
    { key: "activos",      label: "Activos" },
    { key: "por_terminar", label: "Por terminar" },
    { key: "finalizados",  label: "Finalizados" },
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
            DeseoComer · Concursos
          </p>
          <h1 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(2.2rem, 7vw, 4.5rem)",
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

          {/* Stats row */}
          <div className="dc-cp-stats">
            {[
              { val: CONCURSOS.length, label: "concursos activos" },
              { val: CONCURSOS.reduce((s, c) => s + c.participantes, 0).toLocaleString("es-CL"), label: "participantes" },
              { val: CONCURSOS_FINALIZADOS.length, label: "premios entregados" },
            ].map(({ val, label }, i) => (
              <div key={label} className="dc-cp-stat-item">
                {i > 0 && <div className="dc-cp-stat-sep" />}
                <div style={{ textAlign: "center", flex: 1 }}>
                  <p className="dc-cp-stat-val">{val}</p>
                  <p className="dc-cp-stat-label">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <section className="dc-cp-content">
        <div className="dc-cp-filters">
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
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

        {visibleActivos.length === 0 && filter !== "finalizados" && (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</p>
            <p style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.85rem",
              letterSpacing: "0.15em", color: "var(--text-muted)",
            }}>No hay concursos en esta categoría</p>
          </div>
        )}

        {/* ── Finalizados section ───────────────────────────────────── */}
        {showFinalizados && CONCURSOS_FINALIZADOS.length > 0 && (
          <>
            <div style={{
              display: "flex", alignItems: "center", gap: "20px",
              margin: filter === "todos" ? "80px 0 40px" : "20px 0 40px",
            }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
              <p style={{
                fontFamily: "var(--font-cinzel)", fontSize: "0.65rem",
                letterSpacing: "0.35em", textTransform: "uppercase",
                color: "var(--text-muted)", whiteSpace: "nowrap",
              }}>
                Concursos Finalizados
              </p>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }} />
            </div>

            <div className="dc-cp-grid">
              {CONCURSOS_FINALIZADOS.map((c) => (
                <FinalizadoCard key={c.id} concurso={c} />
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: "48px" }}>
              <a
                href="/concursos/ganadores"
                style={{
                  fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
                  letterSpacing: "0.15em", textTransform: "uppercase",
                  color: "var(--accent)", textDecoration: "none",
                  borderBottom: "1px solid var(--border-color)", paddingBottom: "4px",
                }}
              >
                Ver historial completo de ganadores →
              </a>
            </div>
          </>
        )}
      </section>

      <Footer />

      <style>{`
        .dc-cp-hero {
          position: relative; overflow: hidden;
          padding: 140px 60px 80px;
          text-align: center;
        }
        .dc-cp-stats {
          display: flex; justify-content: space-around; align-items: stretch;
          margin-top: 48px;
          padding: 20px 16px;
          background: rgba(0,0,0,0.2);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          max-width: 600px;
          margin-left: auto; margin-right: auto;
        }
        .dc-cp-stat-item {
          display: flex; align-items: center; flex: 1;
        }
        .dc-cp-stat-sep {
          width: 1px; height: 40px;
          background: rgba(255,255,255,0.15);
          flex-shrink: 0;
        }
        .dc-cp-stat-val {
          font-family: var(--font-cinzel-decorative);
          font-size: 2rem !important; font-weight: 700 !important;
          color: var(--sand-gold) !important;
          text-shadow: 0 0 20px color-mix(in srgb, var(--accent) 40%, transparent);
          line-height: 1.2 !important;
        }
        .dc-cp-stat-label {
          font-family: var(--font-cinzel);
          font-size: 0.75rem !important; font-weight: 500 !important;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(255,255,255,0.8) !important;
          margin-top: 4px;
        }
        .dc-cp-filters {
          display: flex; gap: 10px; flex-wrap: nowrap;
          margin-bottom: 44px;
          overflow-x: auto;
          padding-bottom: 8px;
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
          .dc-cp-stats   { padding: 16px 12px; }
          .dc-cp-stat-val { font-size: 1.6rem !important; }
          .dc-cp-content { padding: 0 20px 60px; }
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
  mounted,
  onParticipate,
}: {
  concurso: Concurso;
  timer: TimeLeft | undefined;
  mounted: boolean;
  onParticipate: () => void;
}) {
  const soon = isSoonEnding(c.endsAt);

  return (
    <div
      className="dc-cc-card"
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "20px",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-6px)";
        el.style.borderColor = "var(--accent)";
        el.style.boxShadow = "0 20px 60px color-mix(in srgb, var(--accent) 15%, transparent)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.borderColor = "var(--border-color)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Image */}
      {c.imagenUrl && (
        <div style={{ height: "160px", overflow: "hidden", borderRadius: "20px 20px 0 0", flexShrink: 0, position: "relative", background: "rgba(45,26,8,0.8)" }}>
          <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {/* Badge termina pronto over image */}
          {soon && (
            <div style={{
              position: "absolute", top: "12px", right: "12px",
              background: "linear-gradient(135deg, #ff2244, #ff6644)",
              color: "#fff", fontFamily: "var(--font-cinzel)",
              fontSize: "0.55rem", letterSpacing: "0.15em",
              textTransform: "uppercase", padding: "5px 12px",
              borderRadius: "20px", fontWeight: 700,
              boxShadow: "0 0 16px rgba(255,34,68,0.5)",
              animation: "dc-pulse 1.5s ease-in-out infinite",
            }}>
              ¡Termina pronto!
            </div>
          )}
        </div>
      )}

      {!c.imagenUrl && soon && (
        <div style={{
          position: "absolute", top: "16px", right: "16px",
          background: "linear-gradient(135deg, #ff2244, #ff6644)",
          color: "#fff", fontFamily: "var(--font-cinzel)",
          fontSize: "0.55rem", letterSpacing: "0.15em",
          textTransform: "uppercase", padding: "5px 12px",
          borderRadius: "20px", fontWeight: 700,
          boxShadow: "0 0 16px rgba(255,34,68,0.5)",
          animation: "dc-pulse 1.5s ease-in-out infinite",
        }}>
          ¡Termina pronto!
        </div>
      )}

      <div style={{ padding: "28px 28px 0" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
              letterSpacing: "0.2em", color: "var(--oasis-bright)",
              textTransform: "uppercase", marginBottom: "4px",
            }}>
              {c.local}
            </p>
            <p style={{
              fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
              color: "var(--accent)", lineHeight: 1.3,
            }}>
              {c.premio}
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid var(--border-color)",
          borderRadius: "14px", padding: "16px",
          marginBottom: "20px",
        }}>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.55rem",
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "var(--text-muted)", textAlign: "center", marginBottom: "10px",
          }}>
            Tiempo restante
          </p>
          {mounted && timer ? (
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "flex-end" }}>
              {timer.dias > 0 && (
                <>
                  <TimerUnit value={timer.dias} label="días" urgent={soon} />
                  <span style={{ color: "var(--text-muted)", paddingBottom: "18px", fontSize: "1.2rem" }}>:</span>
                </>
              )}
              <TimerUnit value={timer.horas}    label="horas"    urgent={soon} />
              <span style={{ color: "var(--text-muted)", paddingBottom: "18px", fontSize: "1.2rem" }}>:</span>
              <TimerUnit value={timer.minutos}  label="min"      urgent={soon} />
              <span style={{ color: "var(--text-muted)", paddingBottom: "18px", fontSize: "1.2rem" }}>:</span>
              <TimerUnit value={timer.segundos} label="seg"      urgent={soon} />
            </div>
          ) : (
            <div style={{ height: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: "120px", height: "24px", borderRadius: "6px",
                background: "rgba(255,255,255,0.05)", animation: "dc-shimmer 1.5s ease infinite",
              }} />
            </div>
          )}
        </div>

        {/* Participants */}
        <p style={{
          fontFamily: "var(--font-lato)", fontSize: "0.8rem",
          color: "var(--text-muted)", marginBottom: "20px",
          textAlign: "center",
        }}>
          <span style={{ color: "var(--oasis-bright)", fontWeight: 700 }}>{c.participantes}</span> participantes
        </p>

        {/* Top 3 ranking */}
        <div style={{ marginBottom: "24px" }}>
          {c.ranking.slice(0, 3).map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0",
                borderBottom: i < 2 ? "1px solid var(--border-color)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1rem" }}>{["🥇", "🥈", "🥉"][i]}</span>
                <span style={{
                  fontFamily: "var(--font-lato)", fontSize: "0.88rem",
                  color: "var(--text-primary)",
                }}>
                  {r.nombre}
                </span>
              </div>
              <span style={{
                fontFamily: "var(--font-cinzel)", fontSize: "0.7rem",
                color: "var(--oasis-bright)", whiteSpace: "nowrap", paddingLeft: "8px",
              }}>
                {r.referidos} refs
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 28px 28px" }}>
        <button
          onClick={onParticipate}
          style={{
            width: "100%",
            background: soon
              ? "linear-gradient(135deg, #ff2244, #ff6644)"
              : "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
            border: "none", borderRadius: "16px",
            fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: soon ? "#fff" : "var(--bg-primary)",
            fontWeight: 700, cursor: "pointer", minHeight: "56px", padding: "16px",
            boxShadow: soon
              ? "0 4px 24px rgba(255,34,68,0.35)"
              : "0 4px 24px rgba(42,122,111,0.25)",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
        >
          {soon ? "⚡ Quiero participar ya" : "Quiero participar →"}
        </button>
      </div>

      <style>{`
        .dc-cc-card { cursor: pointer; }
        @keyframes dc-pulse {
          0%, 100% { box-shadow: 0 0 16px rgba(255,34,68,0.5); }
          50%       { box-shadow: 0 0 28px rgba(255,34,68,0.8); }
        }
        @keyframes dc-shimmer {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ─── Timer digit unit ─────────────────────────────────────────────────────────

function TimerUnit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div style={{ textAlign: "center", width: "60px", flexShrink: 0, overflow: "hidden" }}>
      <p style={{
        fontFamily: "var(--font-cinzel-decorative)",
        fontSize: "clamp(1.4rem, 4vw, 2rem)", lineHeight: 1,
        color: urgent ? "#ff4444" : "var(--accent)",
        textShadow: urgent
          ? "0 0 20px rgba(255,68,68,0.6)"
          : "0 0 16px color-mix(in srgb, var(--accent) 50%, transparent)",
      }}>
        {pad2(value)}
      </p>
      <p style={{
        fontFamily: "var(--font-cinzel)", fontSize: "0.6rem",
        letterSpacing: "0.15em", textTransform: "uppercase",
        color: "var(--text-muted)", marginTop: "4px",
      }}>
        {label}
      </p>
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
