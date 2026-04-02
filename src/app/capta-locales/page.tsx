"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const PASOS = [
  { titulo: "Entra a un local", texto: "Visita cualquier restaurante, café o local de comida en Santiago que no esté en DeseoComer." },
  { titulo: "Muéstrale DeseoComer", texto: "Enséñale la plataforma desde tu teléfono y muéstrale el QR para que se registre gratis." },
  { titulo: "Gana tu comisión", texto: "Cada local registrado con tu código te suma $10.000. Si publica un concurso, $5.000 más." },
];

const FAQS = [
  { pregunta: "¿Cuándo y cómo me pagan?", respuesta: "Los pagos se realizan quincenalmente via transferencia bancaria. Debes tener RUT chileno y cuenta bancaria para recibir el pago." },
  { pregunta: "¿Cómo saben que el local lo registré yo?", respuesta: "Cada captador tiene un código único. El local lo ingresa al registrarse y queda asociado a tu cuenta automáticamente." },
  { pregunta: "¿Hay un límite de locales que puedo captar?", respuesta: "No hay límite. Cuantos más locales registres, más ganas. Puedes trabajar en cualquier comuna de Santiago." },
  { pregunta: "¿Necesito experiencia en ventas?", respuesta: "No. Solo necesitas ganas de salir a la calle y hablar con dueños de locales. Te damos todo lo que necesitas para empezar." },
];

const sLabel: React.CSSProperties = { fontSize: 9, color: "rgba(240,234,214,0.6)", letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center", marginBottom: 16 };

export default function CaptaLocalesPage() {
  const router = useRouter();
  const [locales, setLocales] = useState(5);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      <div className="cl-wrap" style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 40px" }}>

        {/* ── HERO ──────────────────────────────────────── */}
        <section className="cl-hero" style={{ padding: "48px 0 32px", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "#3db89e", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
            🧞 Programa de captadores · DeseoComer
          </p>
          <h1 className="cl-title" style={{ fontFamily: "var(--font-cinzel)", fontSize: 28, fontWeight: 700, color: "#f5d080", textTransform: "uppercase", lineHeight: 1.2, marginBottom: 12 }}>
            Gana dinero extra visitando restaurantes
          </h1>
          <p className="cl-hero-sub" style={{ fontSize: 15, color: "rgba(240,234,214,0.6)", lineHeight: 1.6, marginBottom: 28 }}>
            Visita locales de comida, muéstrales DeseoComer y gana por cada registro. Sin horarios fijos, sin jefe, a tu ritmo.
          </p>
        </section>

        {/* ── CARDS DE GANANCIAS ────────────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <div className="cl-earnings" style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: 16, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏪</div>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 26, color: "#e8a84c", fontWeight: 700, marginBottom: 4 }}>$10.000</div>
              <div style={{ fontSize: 11, color: "rgba(240,234,214,0.45)", lineHeight: 1.3 }}>Por cada local<br />registrado</div>
            </div>
            <div style={{ flex: 1, background: "rgba(61,184,158,0.06)", border: "1px solid rgba(61,184,158,0.2)", borderRadius: 16, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 26, color: "#3db89e", fontWeight: 700, marginBottom: 4 }}>+$5.000</div>
              <div style={{ fontSize: 11, color: "rgba(240,234,214,0.45)", lineHeight: 1.3 }}>Bonus si publica<br />un concurso</div>
            </div>
            <div className="cl-earnings-total" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: 16, padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(240,234,214,0.35)", marginBottom: 6 }}>Si el local hace todo:</div>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 32, color: "#f5d080", fontWeight: 700, marginBottom: 4 }}>$15.000</div>
              <div style={{ fontSize: 11, color: "rgba(240,234,214,0.4)" }}>Por local</div>
            </div>
          </div>
        </section>

        {/* ── NOTA GRATIS ───────────────────────────────── */}
        <div style={{ background: "rgba(61,184,158,0.06)", border: "1px solid rgba(61,184,158,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>✅</span>
          <p style={{ fontSize: 13, color: "rgba(240,234,214,0.6)", lineHeight: 1.5, margin: 0 }}>
            <strong style={{ color: "#3db89e" }}>Registrar un local es gratis para el dueño.</strong> No tiene que pagar nada, ni ahora ni después. Tu rol es mostrarles la plataforma — el registro toma menos de 5 minutos.
          </p>
        </div>

        {/* ── CALCULADORA ───────────────────────────────── */}
        <section style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 16, padding: 20, marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: "rgba(240,234,214,0.5)", marginBottom: 12, marginTop: 0 }}>¿Cuántos locales puedes visitar al mes?</p>
          <input type="range" min={1} max={30} step={1} value={locales} onChange={e => setLocales(Number(e.target.value))} style={{ width: "100%", marginBottom: 16, accentColor: "#e8a84c" }} />
          <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 20, color: "#e8a84c" }}>
            {locales} locales registrados = ${(locales * 10000).toLocaleString("es-CL")}
          </div>
          <div style={{ fontSize: 14, color: "#3db89e", marginTop: 4 }}>
            Si todos publican concurso = ${(locales * 15000).toLocaleString("es-CL")}
          </div>
        </section>

        {/* ── CÓMO FUNCIONA ─────────────────────────────── */}
        <section style={{ marginBottom: 28 }}>
          <p style={sLabel}>¿Cómo funciona?</p>
          <div className="cl-pasos">
          {PASOS.map((p, i) => (
            <div key={p.titulo} className="cl-paso" style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 14, padding: 14, marginBottom: i < PASOS.length - 1 ? 10 : 0 }}>
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

        {/* ── FAQ ────────────────────────────────────────── */}
        <section style={{ marginBottom: 32 }}>
          <p style={sLabel}>Preguntas frecuentes</p>
          <div className="cl-faq">
          {FAQS.map((f, i) => (
            <div key={f.pregunta} className="cl-faq-item" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: i < FAQS.length - 1 ? 8 : 0, cursor: "pointer" }}>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "#e8a84c", textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {f.pregunta}
                <span style={{ fontSize: 14, color: "rgba(240,234,214,0.3)", marginLeft: 8 }}>{openFaq === i ? "−" : "+"}</span>
              </div>
              {openFaq === i && (
                <p style={{ fontSize: 13, color: "rgba(240,234,214,0.45)", lineHeight: 1.5, margin: "8px 0 0" }}>{f.respuesta}</p>
              )}
            </div>
          ))}
          </div>
        </section>

        {/* ── CTA FINAL ─────────────────────────────────── */}
        <section style={{ textAlign: "center", paddingBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: 20, color: "#f5d080", textTransform: "uppercase", marginBottom: 8, lineHeight: 1.2 }}>
            ¿Te interesa?
          </h2>
          <p style={{ fontSize: 13, color: "rgba(240,234,214,0.4)", marginBottom: 20, lineHeight: 1.5 }}>
            Escríbenos y te contamos todo. El cupo de captadores es limitado.
          </p>
          <button onClick={() => router.push("/contacto?motivo=captador")} style={{ background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, textTransform: "uppercase", padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer" }}>
            Quiero ser captador →
          </button>
        </section>
      </div>

      <Footer />

      <style>{`
        .cl-earnings-total { width: 100%; margin-top: -4px; }
        @media (max-width: 767px) {
          .cl-earnings { flex-wrap: wrap; }
          .cl-earnings-total { flex: 1 1 100% !important; }
        }
        @media (min-width: 1024px) {
          .cl-wrap { max-width: 900px !important; }
          .cl-hero { padding: 80px 0 48px !important; }
          .cl-title { font-size: 40px !important; }
          .cl-hero-sub { font-size: 17px !important; max-width: 600px; margin-left: auto; margin-right: auto; }
          .cl-earnings { gap: 16px; }
          .cl-earnings-total { flex: 1; margin-top: 0; width: auto; }
          .cl-pasos { display: grid !important; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
          .cl-paso { flex-direction: column !important; margin-bottom: 0 !important; }
          .cl-faq { display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px; }
          .cl-faq-item { margin-bottom: 0 !important; }
        }
      `}</style>
    </main>
  );
}
