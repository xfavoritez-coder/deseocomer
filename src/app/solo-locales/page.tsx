"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// ─── Animate on scroll ──────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.style.opacity = "1"; el.style.transform = "translateY(0)"; obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} style={{ opacity: 0, transform: "translateY(24px)", transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s` }}>
      {children}
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const BENEFICIOS = [
  { icon: "🏆", titulo: "Concursos que se comparten solos", texto: "Tus clientes invitan amigos para ganar puntos. Tú consigues visibilidad sin pagar publicidad." },
  { icon: "⚡", titulo: "Tus promociones donde la gente las busca", texto: "Happy hours, descuentos y cupones visibles para miles de usuarios que buscan dónde comer hoy." },
  { icon: "🎛️", titulo: "Panel simple, sin complicaciones", texto: "Publica un concurso en 3 pasos. Gestiona todo desde tu celular en minutos." },
];

const PASOS = [
  { n: "①", titulo: "Regístrate gratis", texto: "Solo necesitas email, nombre del local y teléfono. Listo en 2 minutos." },
  { n: "②", titulo: "Publica tu primer concurso", texto: "Elige el premio, la duración y publica. Tus clientes empiezan a participar de inmediato." },
  { n: "③", titulo: "Observa cómo crece tu audiencia", texto: "Cada participante trae amigos. Tu local gana visibilidad real sin invertir en ads." },
];

const TESTIMONIOS = [
  { nombre: "María José R.", local: "Café Bellavista", texto: "Publicamos un concurso el lunes y el miércoles ya teníamos 200 participantes nuevos siguiéndonos." },
  { nombre: "Rodrigo M.", local: "Pizza Napoli", texto: "Nunca pensé que regalar una pizza nos traería tanta gente nueva. Vale mil veces la inversión." },
  { nombre: "Catalina V.", local: "Verde Oasis", texto: "El panel es súper fácil. Lo manejo yo sola sin ayuda." },
];

const COLORS = ["#2a7a6f", "#c4853a", "#7c3fa8"];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SoloLocalesPage() {
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section style={{ padding: "160px 24px 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--accent) 10%, transparent) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", maxWidth: "700px", margin: "0 auto" }}>
          <Reveal>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--oasis-bright)", marginBottom: "20px" }}>
              Para restaurantes y locales
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(2rem, 7vw, 3.5rem)", color: "var(--accent)", textShadow: "0 0 60px color-mix(in srgb, var(--accent) 40%, transparent)", marginBottom: "20px", lineHeight: 1.1 }}>
              Tu local, visto por miles
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(1rem, 2.5vw, 1.15rem)", color: "var(--text-primary)", fontWeight: 400, lineHeight: 1.8, marginBottom: "36px", maxWidth: "560px", margin: "0 auto 36px" }}>
              Publica concursos virales, gestiona tus promociones y llega a clientes que buscan exactamente lo que ofreces.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap", marginBottom: "36px" }}>
              {[
                { icon: "🧞", text: "Gratis durante el lanzamiento" },
                { icon: "📍", text: "Solo en Santiago por ahora" },
              ].map(s => (
                <div key={s.text} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "30px", padding: "10px 20px" }}>
                  <span style={{ fontSize: "1rem" }}>{s.icon}</span>
                  <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.08em", color: "var(--text-primary)" }}>{s.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.4}>
            <Link href="/registro?tipo=local" style={{
              display: "inline-block", fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
              letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700,
              background: "var(--accent)", color: "var(--bg-primary)",
              padding: "18px 48px", borderRadius: "14px", textDecoration: "none",
              boxShadow: "0 4px 24px color-mix(in srgb, var(--accent) 35%, transparent)",
            }}>
              Registrar mi local gratis →
            </Link>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "16px" }}>
              Sin contratos. Sin letra chica. Sin costo.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── BENEFICIOS ───────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.4rem, 4vw, 2.2rem)", color: "var(--accent)", textAlign: "center", marginBottom: "48px" }}>
            ¿Por qué unirte?
          </h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {BENEFICIOS.map((b, i) => (
            <Reveal key={b.titulo} delay={i * 0.1}>
              <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "20px", padding: "32px", height: "100%" }}>
                <div style={{ fontSize: "2.2rem", marginBottom: "16px" }}>{b.icon}</div>
                <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "10px", fontWeight: 700 }}>{b.titulo}</h3>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7 }}>{b.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: "900px", margin: "0 auto" }}>
        <Reveal>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.4rem, 4vw, 2.2rem)", color: "var(--accent)", textAlign: "center", marginBottom: "48px" }}>
            Así de simple
          </h2>
        </Reveal>
        <div className="dc-sl-pasos">
          {PASOS.map((p, i) => (
            <Reveal key={p.titulo} delay={i * 0.15}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
                <div style={{
                  fontFamily: "var(--font-cinzel-decorative)", fontSize: "2.5rem",
                  color: "var(--accent)", marginBottom: "16px", lineHeight: 1,
                  textShadow: "0 0 20px color-mix(in srgb, var(--accent) 40%, transparent)",
                }}>{p.n}</div>
                <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "8px", fontWeight: 700 }}>{p.titulo}</h3>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "240px" }}>{p.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "var(--bg-secondary)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.4rem, 4vw, 2.2rem)", color: "var(--accent)", textAlign: "center", marginBottom: "48px" }}>
              Úsalo como lo usan los mejores locales
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {TESTIMONIOS.map((t, i) => (
              <Reveal key={t.nombre} delay={i * 0.1}>
                <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "28px" }}>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: 1.7, fontStyle: "italic", marginBottom: "20px" }}>
                    "{t.texto}"
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                      background: COLORS[i], display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, color: "#fff",
                    }}>
                      {t.nombre.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600 }}>{t.nombre}</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "var(--text-muted)" }}>{t.local}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section style={{ padding: "100px 24px", textAlign: "center", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 60%)" }} />
        <Reveal>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🧞</div>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.6rem, 5vw, 2.8rem)", color: "var(--accent)", marginBottom: "16px", textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
            ¿Listo para crecer?
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "36px", maxWidth: "420px", margin: "0 auto 36px", lineHeight: 1.7 }}>
            Únete hoy y aparece en DeseoComer esta semana.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <Link href="/registro?tipo=local" style={{
            display: "inline-block", fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
            letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700,
            background: "var(--accent)", color: "var(--bg-primary)",
            padding: "18px 48px", borderRadius: "14px", textDecoration: "none",
            boxShadow: "0 4px 24px color-mix(in srgb, var(--accent) 35%, transparent)",
          }}>
            Comenzar gratis →
          </Link>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "16px" }}>
            Ya son 6 locales en Santiago — sé de los primeros
          </p>
        </Reveal>
      </section>

      <Footer />

      <style>{`
        .dc-sl-pasos {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          position: relative;
        }
        .dc-sl-pasos::before {
          content: "";
          position: absolute;
          top: 20px;
          left: 20%;
          right: 20%;
          height: 1px;
          border-top: 2px dashed rgba(232,168,76,0.25);
          pointer-events: none;
        }
        @media (max-width: 767px) {
          .dc-sl-pasos {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .dc-sl-pasos::before {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}
