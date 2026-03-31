import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CONCURSOS_FINALIZADOS } from "@/lib/mockConcursos";

export default function ComoFuncionaPage() {
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section style={{ padding: "clamp(100px,12vw,140px) clamp(20px,5vw,60px) clamp(40px,6vw,80px)", textAlign: "center", position: "relative", borderBottom: "1px solid rgba(232,168,76,0.08)" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", maxWidth: "620px", margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.65rem,1.5vw,0.8rem)", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--oasis-bright)", marginBottom: "16px" }}>Concursos DeseoComer</p>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(2.2rem,6vw,4rem)", fontWeight: 900, color: "var(--accent)", lineHeight: 1.15, marginBottom: "20px", textShadow: "0 0 60px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
            Gana Comida<br />Gratis 🏆
          </h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(1rem,2vw,1.15rem)", color: "rgba(240,234,214,0.65)", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto 36px" }}>
            Comparte tu link con amigos, sube en el ranking y gana premios reales de los mejores restaurantes de Santiago. Es gratis y tarda 30 segundos.
          </p>
          <Link href="/concursos" style={{ display: "inline-block", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem,1.5vw,0.85rem)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 36px", borderRadius: "30px", textDecoration: "none" }}>
            Ver concursos activos →
          </Link>
        </div>
      </section>

      {/* Body */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(20px,5vw,60px)" }}>

        {/* Cómo funciona */}
        <section style={{ marginBottom: "clamp(48px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>El proceso</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "clamp(32px,5vw,56px)", lineHeight: 1.3 }}>¿Cómo funciona?</h2>

          <div className="cf-pasos">
            {[
              { num: "1", title: "Regístrate gratis", desc: "Crea tu cuenta en 30 segundos. Sin tarjeta de crédito ni letra chica." },
              { num: "2", title: "Elige un concurso", desc: "Hay premios de distintos restaurantes. Únete al que más te guste." },
              { num: "3", title: "Comparte tu link", desc: "Recibes un link único. Compártelo por WhatsApp, Instagram o donde quieras." },
              { num: "4", title: "Sube en el ranking", desc: "Cada amigo que se registra con tu link te da puntos. El que más tenga, gana." },
              { num: "🏆", title: "¡Ganas el premio!", desc: "Te contactamos en 24 horas para coordinar cómo retirar tu premio." },
            ].map((paso, i) => (
              <div key={i} className="cf-paso-item">
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: i === 4 ? "rgba(232,168,76,0.2)" : "rgba(232,168,76,0.08)", border: i === 4 ? "1px solid var(--accent)" : "1px solid rgba(232,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: i === 4 ? "1.2rem" : "1rem", fontWeight: 700, color: "var(--accent)", margin: "0 auto 14px", flexShrink: 0 }}>
                  {paso.num}
                </div>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.85rem,1.5vw,0.95rem)", fontWeight: 700, color: "#f0ead6", marginBottom: "8px", textAlign: "center" }}>{paso.title}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", color: "rgba(240,234,214,0.5)", lineHeight: 1.65, textAlign: "center" }}>{paso.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sistema de puntos */}
        <section style={{ marginBottom: "clamp(48px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>El sistema</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "clamp(28px,4vw,48px)", lineHeight: 1.3 }}>¿Cómo se ganan puntos?</h2>

          <div className="cf-puntos">
            {[
              { icon: "🎉", pts: "+1", color: "#3db89e", label: "Por registrarte en el concurso", highlight: false },
              { icon: "👥", pts: "+2", color: "#e8a84c", label: "Por cada amigo que se registra con tu link", highlight: true },
              { icon: "🤝", pts: "+1", color: "#2a7a6f", label: "Cuando apoyas a otro participante", highlight: false },
            ].map((p, i) => (
              <div key={i} style={{ background: p.highlight ? "rgba(232,168,76,0.07)" : "rgba(255,255,255,0.03)", border: p.highlight ? "1px solid rgba(232,168,76,0.3)" : "0.5px solid rgba(232,168,76,0.1)", borderRadius: "16px", padding: "clamp(16px,3vw,28px) clamp(12px,2vw,20px)", textAlign: "center" }}>
                <div style={{ fontSize: "clamp(1.5rem,3vw,2rem)", marginBottom: "12px" }}>{p.icon}</div>
                <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 900, color: p.color, marginBottom: "10px", lineHeight: 1 }}>{p.pts}</div>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", color: "rgba(240,234,214,0.55)", lineHeight: 1.6 }}>{p.label}</p>
              </div>
            ))}
          </div>

          <div style={{ background: "rgba(61,184,158,0.06)", border: "1px solid rgba(61,184,158,0.15)", borderRadius: "12px", padding: "16px 20px", marginTop: "16px", maxWidth: "600px", margin: "16px auto 0" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", color: "rgba(61,184,158,0.9)", lineHeight: 1.7 }}>
              💡 <strong>Tip:</strong> Los +2 puntos por referido son los que más importan. Quien invita a más personas gana, aunque haya llegado tarde al concurso.
            </p>
          </div>
        </section>

        {/* Premios reales */}
        <section style={{ marginBottom: "clamp(48px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>Premios reales</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "clamp(28px,4vw,48px)", lineHeight: 1.3 }}>Esto es lo que han ganado otros</h2>

          <div className="cf-premios">
            {CONCURSOS_FINALIZADOS.slice(0, 4).map((c, i) => (
              <div key={i} style={{ background: "rgba(232,168,76,0.05)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "16px", overflow: "hidden" }}>
                {c.imagenUrl ? (
                  <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "120px", objectFit: "cover", display: "block", opacity: 0.75 }} />
                ) : (
                  <div style={{ height: "120px", background: "rgba(45,26,8,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>🏆</div>
                )}
                <div style={{ padding: "14px 16px" }}>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#3db89e", marginBottom: "4px" }}>{c.local}</p>
                  <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.88rem", color: "#f5d080", marginBottom: "8px", lineHeight: 1.3 }}>{c.premio}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.35)" }}>
                    <span>Ganó: {c.ganador.nombre}</span>
                    <span>{c.ganador.referidos} refs</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href="/concursos/ganadores" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(232,168,76,0.6)", textDecoration: "none", borderBottom: "1px solid rgba(232,168,76,0.2)", paddingBottom: "3px" }}>
              Ver historial completo de ganadores →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: "clamp(48px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>Preguntas frecuentes</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "clamp(28px,4vw,48px)", lineHeight: 1.3 }}>Lo que todos preguntan</h2>

          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            {[
              { q: "¿Cuánto cuesta participar?", a: "Nada. Los concursos son 100% gratuitos. Los premios los financian los restaurantes como estrategia de marketing." },
              { q: "¿Cómo sé que el concurso es real?", a: "Todos los locales en DeseoComer están verificados. Puedes ver el historial completo de ganadores anteriores con nombre y fecha." },
              { q: "¿Puedo participar en más de un concurso?", a: "Sí, puedes participar en todos los concursos activos al mismo tiempo con la misma cuenta." },
              { q: "¿Qué pasa si gano?", a: "Te contactamos por email dentro de las 24 horas siguientes al cierre del concurso para coordinar cómo retirar tu premio." },
              { q: "¿Los referidos deben ser cuentas nuevas?", a: "Sí, solo cuentan registros nuevos con email verificado. No funciona con cuentas existentes ni cuentas falsas." },
              { q: "¿El premio es canjeable por efectivo?", a: "No. El premio es el producto o servicio indicado en el concurso, no es canjeable por dinero." },
            ].map((faq, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.1)", borderRadius: "12px", padding: "18px 20px", marginBottom: "8px" }}>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", fontWeight: 700, color: "#f5d080", marginBottom: "8px" }}>{faq.q}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", color: "rgba(240,234,214,0.55)", lineHeight: 1.7 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section style={{ background: "linear-gradient(160deg, #1a0e05, #0a0812)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "24px", padding: "clamp(36px,6vw,64px) clamp(24px,5vw,60px)", textAlign: "center" }}>
          <div style={{ fontSize: "clamp(2rem,4vw,3rem)", marginBottom: "16px" }}>🧞</div>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", marginBottom: "14px", lineHeight: 1.3 }}>¿Listo para ganar<br />comida gratis?</h2>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem,1.5vw,1rem)", color: "rgba(240,234,214,0.5)", marginBottom: "28px", lineHeight: 1.7 }}>Hay concursos activos ahora mismo esperándote.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/concursos" style={{ background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem,1.5vw,0.85rem)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 32px", borderRadius: "30px", textDecoration: "none" }}>Ver concursos activos →</Link>
            <Link href="/concursos/ganadores" style={{ background: "transparent", color: "rgba(240,234,214,0.5)", fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem,1.5vw,0.85rem)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 32px", borderRadius: "30px", border: "1px solid rgba(240,234,214,0.15)", textDecoration: "none" }}>Ver ganadores</Link>
          </div>
        </section>
      </div>

      <Footer />

      <style>{`
        .cf-pasos { display: flex; flex-direction: column; gap: 0; max-width: 560px; margin: 0 auto; }
        .cf-paso-item { display: flex; flex-direction: row; align-items: flex-start; gap: 16px; padding: 20px 0; border-bottom: 1px solid rgba(232,168,76,0.06); }
        .cf-paso-item > div:first-child { margin: 0; flex-shrink: 0; }
        .cf-paso-item p { text-align: left !important; }
        .cf-puntos { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(8px, 2vw, 20px); max-width: 680px; margin: 0 auto; }
        .cf-premios { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(10px, 2vw, 20px); }
        @media (min-width: 768px) {
          .cf-pasos { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; max-width: 100%; align-items: start; }
          .cf-paso-item { flex-direction: column; align-items: center; padding: 24px 8px; border-bottom: none; border-right: 1px solid rgba(232,168,76,0.06); gap: 12px; }
          .cf-paso-item:last-child { border-right: none; }
          .cf-paso-item > div:first-child { margin: 0 auto 4px; }
          .cf-paso-item p { text-align: center !important; }
          .cf-premios { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </main>
  );
}
