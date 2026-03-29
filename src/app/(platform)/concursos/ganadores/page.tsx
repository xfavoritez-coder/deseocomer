"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CONCURSOS_FINALIZADOS } from "@/lib/mockConcursos";

export default function GanadoresPage() {
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section className="dc-gw-hero">
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 60%)",
        }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.62rem",
            letterSpacing: "0.45em", textTransform: "uppercase",
            color: "var(--oasis-bright)", marginBottom: "16px",
          }}>
            DeseoComer · Concursos
          </p>
          <h1 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(2rem, 7vw, 4rem)",
            color: "var(--accent)",
            textShadow: "0 0 60px color-mix(in srgb, var(--accent) 50%, transparent)",
            marginBottom: "20px", lineHeight: 1.15,
          }}>
            🏆 Historial de Ganadores
          </h1>
          <p style={{
            fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
            color: "var(--text-primary)", fontWeight: 300,
            maxWidth: "480px", margin: "0 auto", lineHeight: 1.8,
          }}>
            Todos los premios que ya encontraron a su dueño. ¿Serás el próximo en esta lista?
          </p>

          {/* Stats */}
          <div className="dc-gw-stats">
            {[
              { val: CONCURSOS_FINALIZADOS.length, label: "concursos finalizados" },
              {
                val: CONCURSOS_FINALIZADOS.reduce((s, c) => s + c.participantes, 0).toLocaleString("es-CL"),
                label: "participantes totales",
              },
              {
                val: Math.max(...CONCURSOS_FINALIZADOS.map((c) => c.ganador.referidos)),
                label: "récord de referidos",
              },
            ].map(({ val, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{
                  fontFamily: "var(--font-cinzel-decorative)",
                  fontSize: "clamp(1.4rem, 4vw, 2rem)",
                  color: "var(--accent)",
                  textShadow: "0 0 20px color-mix(in srgb, var(--accent) 40%, transparent)",
                }}>
                  {val}
                </p>
                <p style={{
                  fontFamily: "var(--font-cinzel)", fontSize: "0.58rem",
                  letterSpacing: "0.2em", textTransform: "uppercase",
                  color: "var(--text-muted)", marginTop: "4px",
                }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Back link */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 60px" }}>
        <Link href="/concursos" style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          fontFamily: "var(--font-cinzel)", fontSize: "0.65rem",
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "var(--text-muted)", textDecoration: "none",
          marginBottom: "40px",
        }}>
          ← Concursos activos
        </Link>
      </div>

      {/* Grid */}
      <section className="dc-gw-section">
        <div className="dc-gw-grid">
          {CONCURSOS_FINALIZADOS.map((c, idx) => (
            <WinnerCard key={c.id} concurso={c} index={idx} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: "80px 60px",
        textAlign: "center",
        borderTop: "1px solid var(--border-color)",
      }}>
        <p style={{ fontSize: "3rem", marginBottom: "16px" }}>🎯</p>
        <h2 style={{
          fontFamily: "var(--font-cinzel-decorative)",
          fontSize: "clamp(1.3rem, 4vw, 2rem)",
          color: "var(--accent)",
          textShadow: "0 0 30px color-mix(in srgb, var(--accent) 40%, transparent)",
          marginBottom: "16px",
        }}>
          ¡Tú podrías ser el próximo!
        </h2>
        <p style={{
          fontFamily: "var(--font-lato)", fontSize: "1rem",
          color: "var(--text-muted)", marginBottom: "36px",
          maxWidth: "400px", margin: "0 auto 36px", lineHeight: 1.7,
        }}>
          Hay concursos activos ahora mismo. Comparte tu link y entra en la historia.
        </p>
        <Link href="/concursos" style={{
          display: "inline-block",
          background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
          fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "var(--bg-primary)", fontWeight: 700,
          padding: "16px 40px", borderRadius: "30px",
          textDecoration: "none",
          boxShadow: "0 4px 24px rgba(42,122,111,0.3)",
        }}>
          Ver concursos activos →
        </Link>
      </section>

      <Footer />

      <style>{`
        .dc-gw-hero {
          position: relative; overflow: hidden;
          padding: 140px 60px 80px;
          text-align: center;
        }
        .dc-gw-stats {
          display: flex; justify-content: center; gap: 56px;
          margin-top: 48px; flex-wrap: wrap;
        }
        .dc-gw-section {
          max-width: 1200px; margin: 0 auto;
          padding: 0 60px 80px;
        }
        .dc-gw-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 28px;
        }

        @media (max-width: 767px) {
          .dc-gw-hero    { padding: 100px 20px 60px; }
          .dc-gw-stats   { gap: 28px; }
          .dc-gw-section { padding: 0 20px 60px; }
          .dc-gw-grid    { grid-template-columns: 1fr; gap: 16px; }
          section[style*="padding: 80px 60px"] { padding: 60px 20px !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-gw-hero    { padding: 120px 40px 70px; }
          .dc-gw-section { padding: 0 40px 70px; }
          .dc-gw-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </main>
  );
}

// ─── Winner Card ──────────────────────────────────────────────────────────────

function WinnerCard({
  concurso: c,
  index,
}: {
  concurso: typeof CONCURSOS_FINALIZADOS[number];
  index: number;
}) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div
      className="dc-gw-card"
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "20px", overflow: "hidden",
        transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-5px)";
        el.style.borderColor = "var(--accent)";
        el.style.boxShadow = "0 16px 48px color-mix(in srgb, var(--accent) 12%, transparent)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.borderColor = "var(--border-color)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Card image */}
      {c.imagenUrl && (
        <div style={{
          height: "160px", overflow: "hidden",
          background: "rgba(45,26,8,0.8)",
        }}>
          <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      )}

      {/* Card header */}
      <div style={{
        background: "rgba(0,0,0,0.3)",
        padding: "24px 24px 20px",
        display: "flex", alignItems: "center", gap: "16px",
        borderBottom: "1px solid var(--border-color)",
      }}>
        {!c.imagenUrl && (
          <span style={{
            fontSize: "2.8rem",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
          }}>
            {c.imagen}
          </span>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.58rem",
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--oasis-bright)", marginBottom: "4px",
          }}>
            {c.local}
          </p>
          <p style={{
            fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem",
            color: "var(--accent)", lineHeight: 1.3,
          }}>
            {c.premio}
          </p>
        </div>
      </div>

      <div style={{ padding: "20px 24px 24px" }}>
        {/* Winner highlight */}
        <div style={{
          background: "color-mix(in srgb, var(--accent) 8%, rgba(0,0,0,0.2))",
          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          borderRadius: "14px", padding: "16px 20px",
          marginBottom: "20px",
          display: "flex", alignItems: "center", gap: "14px",
        }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 40%, transparent), color-mix(in srgb, var(--accent) 15%, transparent))",
            border: "2px solid var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.2rem",
            color: "var(--accent)",
            boxShadow: "0 0 16px color-mix(in srgb, var(--accent) 30%, transparent)",
          }}>
            {c.ganador.nombre.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.58rem",
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--text-muted)", marginBottom: "4px",
            }}>
              🏆 Ganador
            </p>
            <p style={{
              fontFamily: "var(--font-lato)", fontSize: "1rem",
              color: "var(--text-primary)", fontWeight: 700,
            }}>
              {c.ganador.nombre}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{
              fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem",
              color: "var(--oasis-bright)",
              textShadow: "0 0 12px rgba(61,184,158,0.4)",
            }}>
              {c.ganador.referidos}
            </p>
            <p style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.52rem",
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: "var(--text-muted)",
            }}>
              referidos
            </p>
          </div>
        </div>

        {/* Podium top 3 */}
        <div style={{ marginBottom: "20px" }}>
          {c.ranking.map((r, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0",
              borderBottom: i < c.ranking.length - 1 ? "1px solid var(--border-color)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1rem" }}>{medals[i] ?? `${i + 1}`}</span>
                <span style={{
                  fontFamily: "var(--font-lato)", fontSize: "0.88rem",
                  color: i === 0 ? "var(--text-primary)" : "var(--text-muted)",
                  fontWeight: i === 0 ? 700 : 400,
                }}>
                  {r.nombre}
                </span>
              </div>
              <span style={{
                fontFamily: "var(--font-cinzel)", fontSize: "0.68rem",
                color: "var(--oasis-bright)",
              }}>
                {r.referidos} refs
              </span>
            </div>
          ))}
        </div>

        {/* Footer meta */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          paddingTop: "16px", borderTop: "1px solid var(--border-color)",
        }}>
          <span style={{
            fontFamily: "var(--font-lato)", fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}>
            {c.participantes.toLocaleString("es-CL")} participantes
          </span>
          <span style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.6rem",
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--text-muted)",
          }}>
            {c.fechaFin}
          </span>
        </div>
      </div>
    </div>
  );
}
