"use client";
import { useState, useEffect } from "react";
import SelloGratis from "@/components/SelloGratis";

interface ConcursoHome { id: number; slug: string; local: string; premio: string; participantes: number; horasRestantes: number; fechaFin: string; imagen: string; imagenUrl: string; topRanking: { nombre: string; referidos: number }[] }
const concursosMock: ConcursoHome[] = [];

export default function ConcursosSection() {
  const [concursos, setConcursos] = useState(concursosMock);
  const [tiempos, setTiempos] = useState<Record<number, {d:number,h:number,m:number,s:number}>>({});

  // Try fetching from API, fallback to mock
  useEffect(() => {
    fetch("/api/concursos").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // Sort: urgent (<=24h) first, then by participants
        const ahora = Date.now();
        const sorted = [...data].sort((a, b) => {
          const rA = new Date(a.fechaFin).getTime() - ahora;
          const rB = new Date(b.fechaFin).getTime() - ahora;
          const uA = rA <= 86400000, uB = rB <= 86400000;
          if (uA && !uB) return -1; if (!uA && uB) return 1;
          if (uA && uB) return rA - rB;
          return (b._count?.participantes ?? 0) - (a._count?.participantes ?? 0);
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setConcursos(sorted.slice(0, 3).map((c: any) => ({
          id: c.id as number, slug: c.slug ?? c.id, local: c.local?.nombre ?? "Local", premio: c.premio ?? "",
          participantes: c._count?.participantes ?? 0,
          horasRestantes: Math.max(0, Math.floor((new Date(c.fechaFin).getTime() - ahora) / 3600000)),
          fechaFin: c.fechaFin,
          imagen: "🏆", imagenUrl: c.imagenUrl ?? "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
          topRanking: [],
        })));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const calcular = () => {
      const next: Record<number, {d:number,h:number,m:number,s:number}> = {};
      const ahora = Date.now();
      concursos.forEach(c => {
        const restMs = Math.max(0, new Date(c.fechaFin).getTime() - ahora);
        const restSeg = Math.floor(restMs / 1000);
        next[c.id] = {
          d: Math.floor(restSeg / 86400),
          h: Math.floor((restSeg % 86400) / 3600),
          m: Math.floor((restSeg % 3600) / 60),
          s: restSeg % 60,
        };
      });
      setTiempos(next);
    };
    calcular();
    const id = setInterval(calcular, 1000);
    return () => clearInterval(id);
  }, [concursos]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="dc-cst-section" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "rgba(240,234,214,0.65)",
            marginBottom: "16px",
          }}>
            Concursos
          </p>
          <h2 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            fontWeight: 800, letterSpacing: "0.02em",
            color: "#f5d080",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "20px",
          }}>
            Gana Comida Gratis
          </h2>
          <p className="section-description">
            Comparte tu link con amigos y sube en el ranking. Los mejores ganan premios reales cada semana.
          </p>
        </div>

        {concursos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🏆</p>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.1rem, 3vw, 1.4rem)", color: "var(--color-title)", marginBottom: "10px" }}>Próximamente</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem, 2vw, 1rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: "400px", margin: "0 auto 24px" }}>Estamos preparando concursos increíbles con premios reales. Vuelve pronto para participar.</p>
            <a href="/concursos/como-funciona" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.12em", color: "rgba(240,234,214,0.35)", textDecoration: "none", borderBottom: "1px solid rgba(240,234,214,0.15)", paddingBottom: "2px" }}>¿Cómo funcionan los concursos? →</a>
          </div>
        ) : (
        <div className="dc-cst-grid">
          {concursos.map((c) => (
            <a key={c.id}
              href={`/concursos/${c.slug || c.id}`}
              className="dc-cst-card"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "transform 0.2s ease, border-color 0.2s ease",
                textDecoration: "none",
                display: "block",
                color: "inherit",
              }}
            >
              <div style={{ height: "160px", overflow: "hidden", borderRadius: "20px 20px 0 0", flexShrink: 0, pointerEvents: "none", background: "rgba(45,26,8,0.8)", position: "relative" }}>
                <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", top: 0, right: 0, zIndex: 4, pointerEvents: "none", lineHeight: 0 }}><SelloGratis size="sm" /></div>
              </div>
              <div style={{ padding: "24px 24px 0", pointerEvents: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.2em",
                      color: "rgba(240,234,214,0.65)",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}>{c.local}</p>
                    <p style={{
                      fontFamily: "var(--font-cinzel-decorative)",
                      fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                      color: "#f5d080",
                    }}>{c.premio}</p>
                  </div>
                </div>

                {/* Countdown */}
                <div style={{
                  marginBottom: "20px", borderRadius: "14px", overflow: "hidden",
                  border: c.horasRestantes <= 6 ? "1px solid rgba(255,100,60,0.4)" : "1px solid rgba(232,168,76,0.2)",
                  background: c.horasRestantes <= 6 ? "rgba(255,60,30,0.06)" : "rgba(0,0,0,0.2)",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-cinzel)", fontSize: "0.55rem",
                      letterSpacing: "0.2em", textTransform: "uppercase",
                      color: c.horasRestantes <= 6 ? "#ff6b6b" : "var(--oasis-bright)",
                      display: "flex", alignItems: "center", gap: "6px",
                    }}>
                      <span style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: c.horasRestantes <= 6 ? "#ff4444" : "var(--oasis-bright)",
                        display: "inline-block",
                        animation: "dc-cst-pulse 1.5s ease-in-out infinite",
                      }}/>
                      Termina en
                    </span>
                    <span style={{
                      fontFamily: "var(--font-cinzel)", fontSize: "0.55rem",
                      letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase",
                    }}>
                      👥 {c.participantes}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "4px", padding: "12px 16px" }}>
                    {[
                      ...((tiempos[c.id]?.d ?? 0) > 0 ? [{ val: tiempos[c.id]?.d ?? 0, label: "días" }] : []),
                      { val: tiempos[c.id]?.h ?? 0, label: "hrs" },
                      { val: tiempos[c.id]?.m ?? 0, label: "min" },
                      { val: tiempos[c.id]?.s ?? 0, label: "seg" },
                    ].map(({ val, label }, idx, arr) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{
                            fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.6rem", lineHeight: 1,
                            color: c.horasRestantes <= 6 ? "#ff6b6b" : "var(--accent)",
                            textShadow: c.horasRestantes <= 6 ? "0 0 20px rgba(255,80,50,0.5)" : "0 0 20px rgba(232,168,76,0.4)",
                            minWidth: "42px", textAlign: "center",
                            animation: c.horasRestantes <= 2 ? "dc-cst-pulse 1s ease-in-out infinite" : "none",
                          }}>
                            {pad(val)}
                          </div>
                          <div style={{
                            fontFamily: "var(--font-cinzel)", fontSize: "0.45rem",
                            letterSpacing: "0.15em", textTransform: "uppercase",
                            color: "var(--text-muted)", marginTop: "4px",
                          }}>{label}</div>
                        </div>
                        {idx < arr.length - 1 && (
                          <span style={{
                            fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem",
                            color: c.horasRestantes <= 6 ? "#ff6b6b" : "var(--accent)",
                            opacity: 0.6, marginBottom: "16px", alignSelf: "flex-start", paddingTop: "2px",
                          }}>:</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ranking top 3 */}
                <div style={{ marginBottom: "24px" }}>
                  {c.topRanking.map((r, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0",
                      borderBottom: i < 2 ? "1px solid var(--border-color)" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1rem" }}>{["🥇","🥈","🥉"][i]}</span>
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                          {r.nombre}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--oasis-bright)", whiteSpace: "nowrap", paddingLeft: "8px" }}>
                        {r.referidos} amigos
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </a>
          ))}
        </div>
        )}

        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <a href="/concursos" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.8rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--color-link)",
            textDecoration: "none",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "4px",
            transition: "border-color 0.2s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-color)"; }}
          >
            Ver todos los concursos →
          </a>
        </div>
      </div>

      <style>{`
        .dc-cst-section { padding: 100px 60px 80px; }
        .dc-cst-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 28px;
        }
        .dc-cst-card { padding: 0; overflow: visible; }
        .dc-cst-card:hover { transform: translateY(-6px); border-color: var(--accent) !important; }
        @keyframes dc-cst-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 767px) {
          .dc-cst-section { padding: 72px 20px 48px; }
          .dc-cst-grid    { display: flex !important; flex-direction: row; overflow-x: auto; gap: 16px; padding-bottom: 8px; scrollbar-width: none; -ms-overflow-style: none; }
          .dc-cst-grid::-webkit-scrollbar { display: none; }
          .dc-cst-card    { flex-shrink: 0 !important; width: 300px !important; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-cst-section { padding: 100px 40px; }
          .dc-cst-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
}
