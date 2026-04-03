"use client";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

type Ganador = {
  id: string;
  slug: string | null;
  premio: string;
  imagenUrl: string | null;
  local: string;
  categoria: string | null;
  ganador: string;
  fechaFin: string;
  participantes: number;
};

const emojiPorCategoria = (nombre: string) => {
  const n = nombre.toLowerCase();
  if (n.includes("pizza")) return "🍕";
  if (n.includes("sushi")) return "🍣";
  if (n.includes("burger") || n.includes("hambur")) return "🍔";
  if (n.includes("taco") || n.includes("mexican")) return "🌮";
  if (n.includes("café") || n.includes("cafe")) return "☕";
  if (n.includes("vegano") || n.includes("ensalad")) return "🥗";
  if (n.includes("ramen") || n.includes("pasta")) return "🍜";
  if (n.includes("asado") || n.includes("bbq")) return "🥩";
  if (n.includes("helado") || n.includes("postre")) return "🍦";
  return "🍽️";
};

export default function GanadoresPage() {
  const [ganadores, setGanadores] = useState<Ganador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/concursos/ganadores")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGanadores(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const locales = new Set(ganadores.map(c => c.local)).size;
  const top3 = ganadores.slice(0, 3);

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section className="dc-gan-hero">
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <Link href="/concursos" style={{ display: "block", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", textDecoration: "none", marginBottom: "24px" }}>
            ← Todos los concursos
          </Link>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "#3db89e", marginBottom: "14px" }}>Historial de premios</p>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.8rem, 6vw, 3.5rem)", fontWeight: 900, color: "#e8a84c", marginBottom: "14px", lineHeight: 1.15 }}>🏆 Ganadores</h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.85rem, 2vw, 1.05rem)", color: "rgba(240,234,214,0.55)", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto 32px" }}>
            Estas personas ganaron comida gratis compartiendo DeseoComer con sus amigos
          </p>

          {/* Stats */}
          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", maxWidth: "320px", margin: "0 auto", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: "16px", overflow: "hidden" }}>
              {[
                { val: ganadores.length, label: "Premios" },
                { val: locales, label: "Locales" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "16px 8px", textAlign: "center", borderRight: i < 1 ? "1px solid rgba(232,168,76,0.1)" : "none" }}>
                  <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.2rem, 4vw, 2rem)", fontWeight: 700, color: "#e8a84c", lineHeight: 1.1, marginBottom: "4px" }}>{s.val}</div>
                  <div style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.5rem, 1.5vw, 0.6rem)", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="dc-gan-body">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>Cargando ganadores...</p>
          </div>
        ) : ganadores.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🏆</div>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "8px" }}>Aún no hay ganadores</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "24px" }}>Participa en un concurso y sé el primero</p>
            <Link href="/concursos" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#e8a84c", textDecoration: "none", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", padding: "12px 28px" }}>Ver concursos activos →</Link>
          </div>
        ) : (
          <>
            {/* Podio top 3 */}
            {top3.length > 0 && (
              <div style={{ marginBottom: "40px" }}>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "20px", textAlign: "center" }}>Últimos ganadores</p>
                <div className="dc-gan-podio">
                  {[top3[1], top3[0], top3[2]].map((c, i) => {
                    if (!c) return null;
                    const isCentral = i === 1;
                    const medals = ["🥈", "🥇", "🥉"];
                    const borders = ["rgba(192,192,192,0.3)", "rgba(255,215,0,0.4)", "rgba(205,127,50,0.3)"];
                    const bgs = ["rgba(192,192,192,0.04)", "rgba(255,215,0,0.06)", "rgba(205,127,50,0.04)"];
                    return (
                      <div key={c.id} style={{ background: bgs[i], border: `1px solid ${borders[i]}`, borderRadius: "14px", padding: isCentral ? "24px 8px 14px" : "14px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: "clamp(1.1rem, 3vw, 1.6rem)", marginBottom: "8px" }}>{medals[i]}</div>
                        <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.7rem, 2vw, 0.85rem)", fontWeight: 700, color: "#f0ead6", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.ganador}</p>
                        <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.55rem, 1.5vw, 0.68rem)", color: "rgba(240,234,214,0.4)", lineHeight: 1.3, marginBottom: "6px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{c.premio}</p>
                        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.5rem, 1.3vw, 0.6rem)", color: "#3db89e", letterSpacing: "0.05em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.local}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Separador */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(232,168,76,0.1)" }} />
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", whiteSpace: "nowrap" }}>Historial completo</p>
              <div style={{ flex: 1, height: "1px", background: "rgba(232,168,76,0.1)" }} />
            </div>

            {/* Lista historial */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {ganadores.map((c) => (
                <Link key={c.id} href={`/concursos/${c.slug || c.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: "14px", overflow: "hidden", display: "flex", transition: "border-color 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,168,76,0.3)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,168,76,0.1)"; }}>
                    <div style={{ width: "70px", flexShrink: 0, background: "rgba(45,26,8,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", position: "relative", overflow: "hidden" }}>
                      {c.imagenUrl ? <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} /> : emojiPorCategoria(c.premio + " " + c.local)}
                    </div>
                    <div style={{ padding: "10px 12px", flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#3db89e", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.local}</p>
                      <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.78rem", color: "#f5d080", marginBottom: "6px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{c.premio}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", fontWeight: 700, color: "#1a0e05", flexShrink: 0 }}>{c.ganador.charAt(0)}</div>
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.8)", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.ganador}</span>
                        {c.fechaFin && <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.3)", flexShrink: 0 }}>{c.fechaFin}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <Footer />

      <style>{`
        .dc-gan-hero {
          background: linear-gradient(160deg, #1a0e05, #0a0812);
          border-bottom: 1px solid rgba(232,168,76,0.1);
          padding: 120px 24px 48px;
          text-align: center;
        }
        .dc-gan-body {
          max-width: 700px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }
        .dc-gan-podio {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          align-items: end;
          max-width: 500px;
          margin: 0 auto;
        }
        @media (max-width: 767px) {
          .dc-gan-hero { padding: 96px 16px 36px; }
          .dc-gan-body { padding: 28px 16px 60px; }
          .dc-gan-podio { gap: 6px; max-width: 100%; }
        }
      `}</style>
    </main>
  );
}
