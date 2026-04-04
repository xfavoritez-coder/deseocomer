"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SelloGratis from "@/components/SelloGratis";

const sLabel: React.CSSProperties = { fontSize: 9, color: "rgba(240,234,214,0.6)", letterSpacing: "0.16em", textTransform: "uppercase", textAlign: "center", marginBottom: 6 };
const sTitle: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: 20, color: "#f5d080", textTransform: "uppercase", textAlign: "center", marginBottom: 6, lineHeight: 1.2 };
const sSub: React.CSSProperties = { fontSize: 14, color: "rgba(240,234,214,0.45)", textAlign: "center", lineHeight: 1.6, marginBottom: 24 };
const btnPrimary: React.CSSProperties = { background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", padding: "13px 24px", borderRadius: 12, border: "none", cursor: "pointer" };
const btnSecondary: React.CSSProperties = { background: "transparent", border: "1px solid rgba(232,168,76,0.3)", color: "rgba(240,234,214,0.6)", fontFamily: "var(--font-cinzel)", fontSize: 13, textTransform: "uppercase", padding: "13px 24px", borderRadius: 12, cursor: "pointer" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = any;

export default function QueEsDeseoComerPage() {
  const router = useRouter();
  const [concursos, setConcursos] = useState<C[]>([]);

  useEffect(() => {
    fetch("/api/concursos?limit=2").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setConcursos(d.slice(0, 2));
    }).catch(() => {});
  }, []);

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      <div className="qed-wrap" style={{ maxWidth: 600, margin: "0 auto", padding: "0 24px 40px" }}>

        {/* ── HERO ──────────────────────────────────── */}
        <section className="qed-hero" style={{ padding: "56px 0 48px", textAlign: "center", borderBottom: "1px solid rgba(232,168,76,0.08)" }}>
          <p style={{ fontSize: 10, color: "#3db89e", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>
            🧞 La plataforma gastronómica de Chile
          </p>
          <h1 className="qed-hero-title" style={{ fontFamily: "var(--font-cinzel)", fontSize: 32, fontWeight: 700, color: "#f5d080", textTransform: "uppercase", lineHeight: 1.15, letterSpacing: "0.03em", marginBottom: 14 }}>
            ¿Qué es DeseoComer?
          </h1>
          <p className="qed-hero-sub" style={{ fontSize: 16, color: "rgba(240,234,214,0.6)", lineHeight: 1.65, marginBottom: 28 }}>
            La forma más fácil de descubrir dónde comer en Santiago, participar en concursos y ganar comida gratis.
          </p>
          <div className="qed-btns" style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <button style={btnPrimary} onClick={() => router.push("/locales")}>Explorar locales →</button>
            <button style={btnSecondary} onClick={() => router.push("/concursos")}>Ver concursos</button>
          </div>
        </section>

        {/* ── EL GENIO ─────────────────────────────── */}
        <section style={{ padding: "36px 0", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
          <p style={sLabel}>El Genio</p>
          <h2 style={sTitle}>Tu asistente personal para decidir dónde comer</h2>
          <p style={sSub}>El Genio te hace 3 preguntas y en segundos te sugiere el lugar perfecto.</p>

          <div className="qed-centered-content">
            {[
              { titulo: "¿Qué buscas hoy?", texto: "Almuerzo solo, con amigos, cena romántica, antojo rápido o para llevar." },
              { titulo: "¿En qué zona de Santiago?", texto: "Elige tu comuna y el Genio busca en tu zona." },
              { titulo: "¿Qué te provoca hoy?", texto: "Sushi, pizza, vegano, saludable, o déjate sorprender." },
            ].map((p, i) => (
              <div key={p.titulo} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.3)", fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, color: "#e8a84c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "#e8a84c", textTransform: "uppercase", marginBottom: 3 }}>{p.titulo}</div>
                  <p style={{ fontSize: 13, color: "rgba(240,234,214,0.5)", lineHeight: 1.45, margin: 0 }}>{p.texto}</p>
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* ── CONCURSOS ────────────────────────────── */}
        <section style={{ padding: "36px 0", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
          <p style={sLabel}>Concursos</p>
          <h2 style={sTitle}>Gana comida gratis cada semana</h2>
          <p style={sSub}>Los mejores locales de Santiago regalan sus platos. Participa gratis e invita amigos para ganar puntos.</p>

          <div className="qed-centered-content">
            {/* Real concursos */}
            <div className="qed-concursos-grid" style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              {concursos.length > 0 ? concursos.map((c: C) => (
                <Link key={c.id} href={`/concursos/${c.slug || c.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ background: "rgba(15,10,28,0.98)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ height: 140, position: "relative", overflow: "hidden" }}>
                      {c.imagenUrl ? (
                        <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#1a0f2e,#2d1a08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 40, opacity: 0.3 }}>🍱</span>
                        </div>
                      )}
                      <div style={{ position: "absolute", top: 0, right: 0, zIndex: 3, lineHeight: 0 }}><SelloGratis size="sm" /></div>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#f5d080", textTransform: "uppercase", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🏆 {c.premio}</p>
                      <p style={{ fontSize: 11, color: "rgba(240,234,214,0.35)" }}>{c.local?.nombre || "Local"} · {c.local?.comuna || ""}</p>
                    </div>
                  </div>
                </Link>
              )) : (
                /* Fallback placeholders */
                [1, 2].map(n => (
                  <div key={n} style={{ background: "rgba(15,10,28,0.98)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ height: 140, background: "linear-gradient(160deg,#1a0f2e,#2d1a08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 40, opacity: 0.3 }}>🍱</span>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 14, color: "#f5d080", textTransform: "uppercase", marginBottom: 4 }}>🏆 Premio sorpresa</p>
                      <p style={{ fontSize: 11, color: "rgba(240,234,214,0.35)" }}>Próximamente</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Puntos */}
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { pts: "+1", label: "Al registrarte" },
                { pts: "+2", label: "Por referido" },
                { pts: "+1", label: "Al recibir apoyo" },
              ].map(p => (
                <div key={p.label} style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 12, padding: "14px 8px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 22, color: "#e8a84c" }}>{p.pts}</div>
                  <div style={{ fontSize: 10, color: "rgba(240,234,214,0.35)", textTransform: "uppercase", marginTop: 4 }}>{p.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.45)", lineHeight: 1.6, marginTop: 10 }}>Cuando invitas a alguien a un concurso y esa persona también invita a otros, tú sigues sumando +1 punto por cada uno que traigan. Así tu red trabaja para ti en cada concurso.</p>
          </div>
        </section>

        {/* ── PROMOCIONES ──────────────────────────── */}
        <section style={{ padding: "36px 0", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
          <p style={sLabel}>Promociones</p>
          <h2 style={sTitle}>Las mejores ofertas de Santiago en un solo lugar</h2>
          <p style={sSub}>Happy hours, 2x1, descuentos y cupones de los mejores locales. Siempre actualizados.</p>
          <div className="qed-centered-content">
            {[
              { icon: "⚡", titulo: "Happy Hour", desc: "2x1 en rolls de lunes a viernes de 12:00 a 15:00" },
              { icon: "🏷️", titulo: "20% de descuento", desc: "En menú completo todos los miércoles" },
              { icon: "🎁", titulo: "Regalo de cumpleaños", desc: "Postre gratis en tu mes de cumpleaños" },
            ].map((p, i) => (
              <div key={p.titulo} style={{ display: "flex", gap: 12, alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 12, padding: "12px 14px", marginBottom: i < 2 ? 10 : 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(61,184,158,0.1)", border: "1px solid rgba(61,184,158,0.2)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "#3db89e", textTransform: "uppercase", marginBottom: 2 }}>{p.titulo}</div>
                  <div style={{ fontSize: 12, color: "rgba(240,234,214,0.4)", lineHeight: 1.3 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA FINAL ────────────────────────────── */}
        <section style={{ padding: "40px 0", textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: 22, color: "#f5d080", textTransform: "uppercase", marginBottom: 8, lineHeight: 1.2 }}>
            ¿Listo para empezar?
          </h2>
          <p style={{ fontSize: 14, color: "rgba(240,234,214,0.4)", marginBottom: 24, lineHeight: 1.5 }}>
            Únete gratis y empieza a descubrir los mejores locales de Santiago hoy.
          </p>
          <div className="qed-cta-btns" style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            <button style={{ ...btnPrimary, width: "100%", maxWidth: 280 }} onClick={() => router.push("/registro")}>Crear cuenta gratis →</button>
            <button style={{ ...btnSecondary, width: "100%", maxWidth: 280 }} onClick={() => router.push("/locales")}>Explorar sin cuenta</button>
          </div>
        </section>
      </div>

      <Footer />

      <style>{`
        .qed-centered-content { max-width: 600px; margin: 0 auto; }
        @media (min-width: 640px) {
          .qed-concursos-grid { flex-direction: row !important; }
          .qed-concursos-grid > * { flex: 1; min-width: 0; }
        }
        @media (min-width: 1024px) {
          .qed-wrap { max-width: 720px !important; padding: 0 48px 60px !important; }
          .qed-hero { padding: 80px 0 64px !important; }
          .qed-hero-title { font-size: 42px !important; }
          .qed-hero-sub { font-size: 17px !important; max-width: 560px; margin-left: auto; margin-right: auto; }
          .qed-centered-content { max-width: 600px; }
          .qed-btns { flex-direction: row !important; }
          .qed-cta-btns { flex-direction: row !important; justify-content: center; }
        }
      `}</style>
    </main>
  );
}
