"use client";
import { useState } from "react";

const opciones = [
  { imgUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120", label: "Antojo de pizza" },
  { imgUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=120", label: "Algo diferente" },
  { imgUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120", label: "Algo liviano" },
  { imgUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=120", label: "Japonés" },
  { imgUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120", label: "Contundente" },
  { imgUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=120", label: "Café y algo rico" },
];

const respuestasGenio = [
  "✨ El Genio ha hablado... esta noche, Pizza Napoli en Providencia. Pide la Napolitana con albahaca fresca. Hay concurso activo, ¡puedes ganar la cena!",
  "🌟 Por las dunas del destino gastronómico... el Genio te guía a Sushi Oasis. El omakase de hoy tiene ingredientes del Pacífico Sur.",
  "🔮 Las arenas del oasis revelan... El Menú de Don Carlos. El cazuela de vacuno del viernes es legendario.",
];

export default function GenieSection() {
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [cargando,  setCargando]  = useState(false);

  const consultarGenio = (opcion: string) => {
    setSeleccion(opcion);
    setRespuesta(null);
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      setRespuesta(respuestasGenio[Math.floor(Math.random() * respuestasGenio.length)]);
    }, 1800);
  };

  return (
    <section className="dc-genie-section" style={{
      backgroundColor: "var(--bg-primary)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow de fondo */}
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "800px", height: "400px",
        background: "radial-gradient(ellipse, rgba(124,63,168,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>

        <p style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: "0.78rem",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "var(--oasis-bright)",
          marginBottom: "16px",
        }}>
          El Oráculo Gastronómico
        </p>
        <h2 style={{
          fontFamily: "var(--font-cinzel-decorative)",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 800, letterSpacing: "0.02em",
          color: "var(--accent)",
          textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
          marginBottom: "20px",
        }}>
          Consulta al Genio 🧞
        </h2>
        <p className="section-description" style={{ marginBottom: "48px" }}>
          No sabes qué comer. El Genio sí.<br />
          Cuéntale tu antojo y él te revela tu destino gastronómico de hoy.
        </p>

        {/* Lámpara */}
        <div className="dc-genie-lamp" style={{
          marginBottom: "40px",
          filter: cargando
            ? "drop-shadow(0 0 40px var(--accent))"
            : "drop-shadow(0 0 20px color-mix(in srgb, var(--accent) 60%, transparent))",
          animation: cargando ? "none" : "lampFloat 4s ease-in-out infinite",
          display: "inline-block",
        }}>
          🪔
        </div>

        {/* Opciones */}
        {!respuesta && (
          <div className="dc-genie-list">
            {opciones.map(op => (
              <button key={op.label}
                onClick={() => consultarGenio(op.label)}
                disabled={cargando}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "12px 20px",
                  backgroundColor: seleccion === op.label
                    ? "color-mix(in srgb, var(--accent) 20%, transparent)"
                    : "var(--bg-secondary)",
                  border: seleccion === op.label
                    ? "1px solid var(--accent)"
                    : "1px solid var(--border-color)",
                  borderRadius: "16px",
                  cursor: cargando ? "not-allowed" : "pointer",
                  opacity: cargando && seleccion !== op.label ? 0.4 : 1,
                  width: "100%",
                  textAlign: "left",
                  transition: "border-color 0.2s, background-color 0.2s",
                }}>
                <img
                  src={op.imgUrl}
                  alt={op.label}
                  style={{
                    width: "60px", height: "60px", borderRadius: "50%",
                    objectFit: "cover", flexShrink: 0,
                  }}
                />
                <p style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: seleccion === op.label ? "var(--accent)" : "var(--text-primary)",
                  lineHeight: 1.3,
                }}>{op.label}</p>
              </button>
            ))}
          </div>
        )}

        {cargando && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p style={{
              fontFamily: "var(--font-cinzel-decorative)",
              fontSize: "clamp(1rem, 2vw, 1.1rem)",
              color: "var(--accent)",
              animation: "pulse 1s ease-in-out infinite",
            }}>
              El Genio está consultando las arenas del destino...
            </p>
          </div>
        )}

        {respuesta && (
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "20px",
            padding: "32px",
            marginBottom: "32px",
            animation: "fadeUp 0.6s both",
          }}>
            <p style={{
              fontFamily: "var(--font-lato)",
              fontSize: "clamp(1rem, 2vw, 1.1rem)",
              color: "var(--text-primary)",
              lineHeight: 1.8,
              fontStyle: "italic",
            }}>
              {respuesta}
            </p>
          </div>
        )}

        {respuesta && (
          <div className="dc-genie-actions">
            <button
              onClick={() => { setRespuesta(null); setSeleccion(null); }}
              style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.82rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                border: "1px solid var(--border-color)",
                color: "var(--accent)",
                padding: "14px 28px",
                borderRadius: "30px",
                background: "transparent",
                cursor: "pointer",
                minHeight: "52px",
              }}>
              Consultar de nuevo
            </button>
            <a href="/locales" style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.82rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
              color: "var(--bg-primary)",
              padding: "14px 28px",
              borderRadius: "30px",
              textDecoration: "none",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "52px",
            }}>
              Ver el local →
            </a>
          </div>
        )}

        <style>{`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes lampFloat {
            0%, 100% { transform: translateY(0) rotate(-3deg); }
            50%       { transform: translateY(-16px) rotate(3deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50%       { opacity: 1; }
          }

          .dc-genie-section { padding: 64px 60px 32px; }
          .dc-genie-lamp    { font-size: 6rem; }
          .dc-genie-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 40px;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
          }
          .dc-genie-actions {
            display: flex; gap: 16px;
            justify-content: center; flex-wrap: wrap;
          }

          @media (max-width: 767px) {
            .dc-genie-section  { padding: 48px 20px 24px; }
            .dc-genie-lamp     { font-size: 4.5rem !important; margin-bottom: 32px !important; }
            .dc-genie-list     { gap: 10px; }
            .dc-genie-actions  { flex-direction: column; align-items: center; }
            .dc-genie-actions a,
            .dc-genie-actions button { width: 100%; max-width: 320px; justify-content: center; }
          }
          @media (min-width: 768px) and (max-width: 1279px) {
            .dc-genie-section { padding: 100px 40px; }
          }
        `}</style>
      </div>
    </section>
  );
}
