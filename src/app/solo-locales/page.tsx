"use client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const BENEFICIOS = [
  { icon: "🏆", titulo: "Concursos que se comparten solos", texto: "Tus clientes invitan amigos para ganar puntos. Tú consigues nuevos clientes ", highlight: "sin pagar un peso en publicidad." },
  { icon: "⚡", titulo: "Aumenta tus ventas con promociones", texto: "Publica happy hours, descuentos y cupones. ", highlight: "Miles de personas los ven", after: " cuando deciden dónde comer hoy." },
  { icon: "📱", titulo: "Panel simple desde tu celular", texto: "Publica un concurso en 3 pasos. ", highlight: "Sin conocimientos técnicos", after: ", sin complicaciones." },
  { icon: "📍", titulo: "Tu local en el mapa de Santiago", texto: "Aparece cuando alguien busca comida en tu comuna. ", highlight: "Visibilidad real", after: " donde están tus clientes." },
];

const PASOS = [
  { titulo: "Regístrate gratis", texto: "Solo nombre del local, tu nombre y correo. Listo en menos de 3 minutos." },
  { titulo: "Publica tu primer concurso o promoción", texto: "Elige el premio o el descuento, configura y publica. Tus clientes lo ven de inmediato." },
  { titulo: "Mira cómo crece tu audiencia", texto: "Cada participante trae amigos. Tu local gana visibilidad y ventas reales." },
];

const TESTIMONIOS = [
  { iniciales: "MJ", nombre: "María José R.", local: "Café Bellavista", texto: "Publicamos un concurso el lunes y el miércoles ya teníamos 200 personas nuevas. Nunca había llegado a tanta gente tan rápido." },
  { iniciales: "RM", nombre: "Rodrigo M.", local: "Pizza Napoli", texto: "Regalar una pizza nos trajo clientes que nunca nos habrían conocido. Vale mil veces la inversión." },
  { iniciales: "CV", nombre: "Catalina V.", local: "Verde Oasis", texto: "El panel es súper fácil. Lo manejo yo sola sin ayuda y publico mis promociones en minutos." },
];

const FAQS = [
  { icon: "💰", pregunta: "¿Cuánto cuesta?", respuesta: "Registrar tu local es completamente gratis. Publica concursos y promociones sin costo." },
  { icon: "🤔", pregunta: "¿Necesito saber de tecnología?", respuesta: "Para nada. Si sabes usar WhatsApp, sabes usar DeseoComer. El panel está diseñado para manejarlo desde el celular." },
  { icon: "🍕", pregunta: "¿Funciona para mi tipo de local?", respuesta: "Sí. Restaurantes, cafeterías, locales de comida rápida, delivery, food trucks — cualquier negocio de comida en Santiago." },
  { icon: "⏱️", pregunta: "¿Cuánto toma publicar un concurso?", respuesta: "Menos de 3 minutos. Eliges el premio, subes una foto y defines la duración. Listo." },
];

const sectionLabel: React.CSSProperties = {
  fontSize: 9, color: "rgba(240,234,214,0.6)", letterSpacing: "0.14em",
  textTransform: "uppercase", textAlign: "center", marginBottom: 20,
};

const btnStyle: React.CSSProperties = {
  background: "var(--accent)", color: "var(--bg-primary)",
  fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700,
  padding: "14px 28px", borderRadius: 12, border: "none",
  letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer",
};

const hl: React.CSSProperties = { color: "rgba(240,234,214,0.9)", fontWeight: 600 };

export default function SoloLocalesPage() {
  const router = useRouter();

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="sl-hero" style={{ padding: "48px 24px 40px", textAlign: "center", borderBottom: "1px solid rgba(232,168,76,0.08)" }}>
        <p style={{ fontSize: 10, color: "#3db89e", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
          🧞 Para restaurantes y locales
        </p>
        <h1 className="sl-hero-title" style={{ fontFamily: "var(--font-cinzel)", fontSize: 24, fontWeight: 700, color: "#f5d080", textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em", marginBottom: 12 }}>
          Más clientes, más ventas
        </h1>
        <p className="sl-hero-sub" style={{ fontSize: 15, color: "rgba(240,234,214,0.6)", lineHeight: 1.6, marginBottom: 24 }}>
          Llega a miles de personas en Santiago que buscan dónde comer hoy. Publica concursos, promociones y haz crecer tu local gratis.
        </p>
        <button style={btnStyle} onClick={() => router.push("/registro-local")}>
          Registrar mi local gratis →
        </button>
        <p style={{ fontSize: 11, color: "rgba(240,234,214,0.22)", marginTop: 10 }}>Listo en 3 minutos</p>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section style={{ padding: 24, borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
        <div className="sl-stats" style={{ display: "flex", gap: 10 }}>
          {[
            { num: "+500", label: "Personas buscan dónde comer cada semana" },
            { num: "3 min", label: "Para publicar tu primer concurso" },
            { num: "100%", label: "Gratis para registrar tu local" },
          ].map((s) => (
            <div key={s.num} style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 14, padding: "16px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 20, color: "#e8a84c" }}>{s.num}</div>
              <div style={{ fontSize: 10, color: "rgba(240,234,214,0.32)", lineHeight: 1.3, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFICIOS ────────────────────────────────────── */}
      <section style={{ padding: "28px 24px", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
        <p style={sectionLabel}>¿Por qué unirte?</p>
        <div className="sl-beneficios">
          {BENEFICIOS.map((b, i) => (
            <div key={b.titulo} className="sl-beneficio" style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: i < BENEFICIOS.length - 1 ? 18 : 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.2)", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {b.icon}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, color: "#e8a84c", textTransform: "uppercase", marginBottom: 4 }}>{b.titulo}</div>
                <p style={{ fontSize: 13, color: "rgba(240,234,214,0.5)", lineHeight: 1.5, margin: 0 }}>
                  {b.texto}<span style={hl}>{b.highlight}</span>{b.after ?? ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PASOS ─────────────────────────────────────────── */}
      <section style={{ padding: "28px 24px", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
        <p style={sectionLabel}>Así de simple</p>
        <div className="sl-pasos">
          {PASOS.map((p, i) => (
            <div key={p.titulo} className="sl-paso" style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 14, padding: 14, marginBottom: i < PASOS.length - 1 ? 10 : 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, color: "#e8a84c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "#f5d080", textTransform: "uppercase", marginBottom: 3 }}>{p.titulo}</div>
                <p style={{ fontSize: 12, color: "rgba(240,234,214,0.45)", lineHeight: 1.4, margin: 0 }}>{p.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIOS ───────────────────────────────────── */}
      <section style={{ padding: "28px 24px", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
        <p style={sectionLabel}>Lo que dicen los locales</p>
        <div className="sl-testimonios">
          {TESTIMONIOS.map((t, i) => (
            <div key={t.nombre} className="sl-testimonio" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 14, padding: 16, marginBottom: i < TESTIMONIOS.length - 1 ? 12 : 0 }}>
              <p style={{ fontSize: 13, color: "rgba(240,234,214,0.65)", lineHeight: 1.55, fontStyle: "italic", marginBottom: 12, marginTop: 0 }}>
                &ldquo;{t.texto}&rdquo;
              </p>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700, color: "#e8a84c", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {t.iniciales}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,234,214,0.6)" }}>{t.nombre}</div>
                  <div style={{ fontSize: 11, color: "rgba(240,234,214,0.3)" }}>{t.local}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section style={{ padding: "28px 24px", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
        <p style={sectionLabel}>Preguntas frecuentes</p>
        <div className="sl-faq">
          {FAQS.map((f, i) => (
            <div key={f.pregunta} className="sl-faq-item" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: i < FAQS.length - 1 ? 10 : 0 }}>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "#e8a84c", textTransform: "uppercase", marginBottom: 6 }}>{f.icon} {f.pregunta}</div>
              <p style={{ fontSize: 13, color: "rgba(240,234,214,0.45)", lineHeight: 1.5, margin: 0 }}>{f.respuesta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────── */}
      <section style={{ padding: "32px 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: 20, color: "#f5d080", textTransform: "uppercase", marginBottom: 8, lineHeight: 1.2 }}>
          ¿Listo para vender más?
        </h2>
        <p style={{ fontSize: 13, color: "rgba(240,234,214,0.4)", marginBottom: 20, lineHeight: 1.5 }}>
          Únete hoy y tu local aparece en DeseoComer esta misma semana. Sin tarjeta de crédito, sin compromisos.
        </p>
        <button style={btnStyle} onClick={() => router.push("/registro-local")}>
          Comenzar gratis →
        </button>
      </section>

      <Footer />

      <style>{`
        @media (min-width: 1024px) {
          .sl-hero { padding: 80px 48px 64px !important; }
          .sl-hero-title { font-size: 40px !important; }
          .sl-hero-sub { font-size: 17px !important; max-width: 560px; margin-left: auto; margin-right: auto; }
          .sl-stats { max-width: 700px; margin: 0 auto; }
          .sl-beneficios { display: grid !important; grid-template-columns: 1fr 1fr; gap: 20px; }
          .sl-beneficio { margin-bottom: 0 !important; }
          .sl-pasos { display: grid !important; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
          .sl-paso { flex-direction: column !important; margin-bottom: 0 !important; }
          .sl-testimonios { display: grid !important; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
          .sl-testimonio { margin-bottom: 0 !important; }
          .sl-faq { display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px; }
          .sl-faq-item { margin-bottom: 0 !important; }
          main > section { max-width: 900px; margin-left: auto; margin-right: auto; }
        }
      `}</style>
    </main>
  );
}
