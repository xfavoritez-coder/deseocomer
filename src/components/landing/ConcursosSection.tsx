"use client";
import { useState, useEffect } from "react";
import SelloGratis from "@/components/SelloGratis";



interface ConcursoHome { id: string; slug: string; local: string; localLogoUrl: string | null; premio: string; participantes: number; horasRestantes: number; fechaFin: string; imagen: string; imagenUrl: string; topRanking: { nombre: string; referidos: number }[] }
const concursosMock: ConcursoHome[] = [];

export default function ConcursosSection() {
  const [concursos, setConcursos] = useState(concursosMock);
  const [loading, setLoading] = useState(true);
  const [tiempos, setTiempos] = useState<Record<string, {d:number,h:number,m:number,s:number}>>({});

  useEffect(() => {
    fetch("/api/concursos").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
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
          id: c.id, slug: c.slug ?? c.id, local: c.local?.nombre ?? "Local", localLogoUrl: c.local?.logoUrl ?? null, premio: c.premio ?? "",
          participantes: c._count?.participantes ?? 0,
          horasRestantes: Math.max(0, Math.floor((new Date(c.fechaFin).getTime() - ahora) / 3600000)),
          fechaFin: c.fechaFin,
          imagen: "🏆", imagenUrl: c.imagenUrl ?? "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
          topRanking: [],
        })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const calcular = () => {
      const next: Record<string, {d:number,h:number,m:number,s:number}> = {};
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
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem, 2vw, 0.85rem)", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(240,234,214,0.65)", marginBottom: "16px" }}>Concursos</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.8rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "0.02em", color: "#f5d080", textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)", marginBottom: "20px" }}>Gana Comida Gratis</h2>
          <p className="section-description">Comparte tu link con amigos y sube en el ranking. Los mejores ganan premios reales cada semana.</p>
        </div>

        {loading ? (
          <div className="dc-cst-grid">
            {[1, 2, 3].map(i => (
              <div key={i} className="dc-cst-card" style={{ background: "rgba(15,10,28,0.7)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 20, overflow: "hidden", textDecoration: "none", display: "block" }}>
                <div style={{ height: 180, background: "linear-gradient(160deg, rgba(30,15,50,0.5), rgba(45,26,8,0.3))", animation: "dc-cst-pulse 1.5s ease-in-out infinite" }} />
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ height: 16, width: "70%", borderRadius: 4, background: "rgba(232,168,76,0.1)", animation: "dc-cst-pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 12, width: "50%", borderRadius: 4, background: "rgba(232,168,76,0.06)", animation: "dc-cst-pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 40, borderRadius: 8, background: "rgba(232,168,76,0.06)", animation: "dc-cst-pulse 1.5s ease-in-out infinite", marginTop: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : concursos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🏆</p>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.1rem, 3vw, 1.4rem)", color: "var(--color-title)", marginBottom: "10px" }}>Próximamente</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem, 2vw, 1rem)", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: "400px", margin: "0 auto 24px" }}>Estamos preparando concursos increíbles con premios reales. Vuelve pronto para participar.</p>
            <a href="/concursos/como-funciona" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.12em", color: "rgba(240,234,214,0.35)", textDecoration: "none", borderBottom: "1px solid rgba(240,234,214,0.15)", paddingBottom: "2px" }}>¿Cómo funcionan los concursos? →</a>
          </div>
        ) : (
        <div className="dc-cst-grid">
          {concursos.map((c) => {
            const t = tiempos[c.id] ?? { d: 0, h: 0, m: 0, s: 0 };
            const totalSeg = t.d * 86400 + t.h * 3600 + t.m * 60 + t.s;
            const ended = totalSeg <= 0;
            const esUrgente = !ended && c.horasRestantes < 6;
            const urgColor = "#e05555";
            const numColor = esUrgente ? urgColor : "rgba(240,234,214,0.9)";
            const sepColor = esUrgente ? "rgba(224,85,85,0.3)" : "rgba(240,234,214,0.2)";
            const badgeText = ended ? "Finalizado" : esUrgente ? "¡Termina pronto!" : "Activo";
            const badgeDot = ended ? "var(--text-muted)" : esUrgente ? urgColor : "#3db89e";

            return (
              <a key={c.id} href={`/concursos/${c.slug || c.id}`} className="dc-cst-card" style={{
                background: "rgba(20,12,35,0.95)",
                border: `1px solid ${esUrgente ? "rgba(224,85,85,0.4)" : "rgba(232,168,76,0.25)"}`,
                borderRadius: "20px", overflow: "hidden", textDecoration: "none", display: "block", color: "inherit",
                transition: "transform 0.2s, border-color 0.2s",
              }}>
                {/* Image */}
                <div className="dc-cst-img" style={{ position: "relative", overflow: "hidden" }}>
                  <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", top: 0, right: 0, zIndex: 4, lineHeight: 0 }}><SelloGratis size="sm" /></div>
                  {/* Badge */}
                  <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 3, background: "rgba(10,8,18,0.75)", border: `1px solid ${esUrgente ? "rgba(224,85,85,0.5)" : "rgba(232,168,76,0.35)"}`, borderRadius: "20px", padding: "4px 10px 4px 6px", display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: esUrgente ? urgColor : "#e8a84c", animation: `dc-pulse-dot ${esUrgente ? "0.8s" : "1.8s"} ease-in-out infinite` }} />
                    <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", color: esUrgente ? urgColor : "#e8a84c", textTransform: "uppercase" }}>{badgeText}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="dc-cst-content" style={{ padding: "16px 20px 18px" }}>
                  {/* Local */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1.5px solid rgba(232,168,76,0.5)", background: c.localLogoUrl ? "transparent" : "#0a0812", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "14px", fontWeight: 700, color: "#e8a84c", flexShrink: 0, overflow: "hidden" }}>{c.localLogoUrl ? <img src={c.localLogoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : c.local?.[0] ?? "L"}</div>
                    <span style={{ fontFamily: "var(--font-lato)", fontSize: "13px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)" }}>{c.local}</span>
                  </div>
                  {/* Premio */}
                  <p className="dc-cst-premio" style={{ fontFamily: "var(--font-cinzel)", color: "#f5d080", textTransform: "uppercase", marginBottom: "14px", lineHeight: 1.15, fontWeight: 700, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>🏆</span>{c.premio}</p>
                  {/* Descripcion - desktop only */}
                  <p className="dc-cst-desc" style={{ fontFamily: "var(--font-lato)", fontSize: "14px", color: "rgba(240,234,214,0.45)", lineHeight: 1.5, marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>Comparte tu link y gana este premio. Mientras más amigos invites, más chances tienes.</p>

                  {/* Countdown box */}
                  {!ended && (
                    <div style={{ background: "rgba(10,8,18,0.6)", border: `1px solid ${esUrgente ? "rgba(224,85,85,0.3)" : "rgba(232,168,76,0.15)"}`, borderRadius: "12px", padding: "10px 14px", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: esUrgente ? urgColor : "#e8a84c", animation: `dc-pulse-dot ${esUrgente ? "0.8s" : "1.8s"} ease-in-out infinite` }} />
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: esUrgente ? urgColor : "var(--oasis-bright)" }}>Termina en</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                        {[
                          ...(t.d > 0 ? [{ val: t.d, label: "días" }] : []),
                          { val: t.h, label: "hrs" },
                          { val: t.m, label: "min" },
                          { val: t.s, label: "seg" },
                        ].map(({ val, label }, idx, arr) => (
                          <div key={label} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.3rem", fontWeight: 700, lineHeight: 1, color: numColor, minWidth: "32px" }}>{pad(val)}</div>
                              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "2px" }}>{label}</div>
                            </div>
                            {idx < arr.length - 1 && <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: sepColor, marginBottom: "12px" }}>:</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {ended && (
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px", textAlign: "center", marginBottom: "14px" }}>
                      <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>Concurso finalizado</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                      👥 {c.participantes} participante{c.participantes !== 1 ? "s" : ""}
                    </span>
                    {!ended && (
                      <span className="dc-cst-btn" style={{
                        fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700,
                        padding: "7px 16px", borderRadius: "20px",
                        border: `1px solid ${esUrgente ? urgColor : "var(--accent)"}`,
                        color: esUrgente ? urgColor : "var(--accent)",
                        background: "transparent",
                      }}>
                        Participar →
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
        )}

        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <a href="/concursos" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-link)", textDecoration: "none", borderBottom: "1px solid var(--border-color)", paddingBottom: "4px" }}>
            Ver todos los concursos →
          </a>
        </div>
      </div>

      <style>{`
        .dc-cst-section { padding: 100px 60px 80px; }
        .dc-cst-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .dc-cst-card:hover { transform: translateY(-6px); border-color: var(--accent) !important; }
        .dc-cst-img { height: 180px; }
        .dc-cst-premio { font-size: 24px; }
        .dc-cst-desc { display: none !important; }
        .dc-cst-btn { }

        @keyframes dc-pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
        @keyframes dc-cst-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.15; }
        }

        @media (min-width: 640px) {
          .dc-cst-grid { grid-template-columns: repeat(2, 1fr); }
          .dc-cst-premio { font-size: 26px; }
          .dc-cst-desc { display: -webkit-box !important; }
          .dc-cst-btn { background: var(--accent) !important; color: var(--bg-primary) !important; border-color: var(--accent) !important; }
        }
        @media (min-width: 1024px) {
          .dc-cst-grid { grid-template-columns: repeat(3, 1fr); }
          .dc-cst-premio { font-size: 24px; }
        }
        @media (max-width: 767px) {
          .dc-cst-section { padding: 72px 20px 48px; }
          .dc-cst-grid { display: flex !important; flex-direction: row; overflow-x: auto; gap: 16px; padding-bottom: 8px; scrollbar-width: none; }
          .dc-cst-grid::-webkit-scrollbar { display: none; }
          .dc-cst-card { flex-shrink: 0 !important; width: 300px !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-cst-section { padding: 100px 40px; }
        }
      `}</style>
    </section>
  );
}
