"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const allConcursos = [...bdConcursos, ...CONCURSOS];

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
    if (filter === "finalizados")  return false;
    return true; // todos
  }).sort((a, b) => {
    const soonA = isSoonEnding(a.endsAt);
    const soonB = isSoonEnding(b.endsAt);
    if (soonA && !soonB) return -1;
    if (!soonA && soonB) return 1;
    if (soonA && soonB) return a.endsAt - b.endsAt; // más urgente primero
    return b.participantes - a.participantes; // más participantes primero
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
        .dc-cp-filters {
          display: flex; gap: 10px; flex-wrap: nowrap;
          justify-content: center;
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
      onClick={onParticipate}
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
          {/* Sello GRATIS */}
          <div style={{ position: "absolute", top: 0, right: 0, zIndex: 4, pointerEvents: "none", lineHeight: 0 }}><SelloGratis size="sm" /></div>
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
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: "8px", flexWrap: "nowrap", width: "100%" }}>
              {timer.dias > 0 && (
                <>
                  <TimerUnit value={timer.dias} label="días" urgent={soon} />
                  <span style={{ color: "var(--text-muted)", fontSize: "1.5rem", flexShrink: 0, alignSelf: "center", marginBottom: "16px" }}>:</span>
                </>
              )}
              <TimerUnit value={timer.horas}    label="horas"    urgent={soon} />
              <span style={{ color: "var(--text-muted)", fontSize: "1.5rem", flexShrink: 0, alignSelf: "center", marginBottom: "16px" }}>:</span>
              <TimerUnit value={timer.minutos}  label="min"      urgent={soon} />
              <span style={{ color: "var(--text-muted)", fontSize: "1.5rem", flexShrink: 0, alignSelf: "center", marginBottom: "16px" }}>:</span>
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
