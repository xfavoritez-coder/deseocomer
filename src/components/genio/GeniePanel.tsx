"use client";
import { useState } from "react";
import { useGenie, type LocalRecomendado } from "@/contexts/GenieContext";

// ─── Data ────────────────────────────────────────────────────────────────────

const OCASIONES = ["Almuerzo solo", "Con amigos", "Cena romántica", "Antojo rápido", "Para llevar"];
const COMUNAS = ["Providencia", "Santiago Centro", "Ñuñoa", "Las Condes", "Vitacura", "San Miguel", "Maipú", "Otra"];
const CATEGORIAS = [
  { emoji: "🍕", label: "Pizza" },
  { emoji: "🍣", label: "Sushi" },
  { emoji: "🍔", label: "Hamburguesa" },
  { emoji: "🌮", label: "Mexicano" },
  { emoji: "🥗", label: "Saludable" },
  { emoji: "🍝", label: "Pastas" },
  { emoji: "🐔", label: "Pollo" },
  { emoji: "🎲", label: "Sorpréndeme" },
];

function getSaludo(): string {
  const h = new Date().getHours();
  if (h >= 7 && h < 12) return "Buenos días ✨ ¿Para qué ocasión busco?";
  if (h >= 12 && h < 16) return "Hora de almorzar 🌞 ¿Qué buscas?";
  if (h >= 16 && h < 20) return "Buenas tardes 🌅 ¿Qué se te antoja?";
  if (h >= 20) return "Buenas noches 🌙 ¿Para qué ocasión?";
  return "Trasnochado/a 🌟 ¿Qué necesitas?";
}

function getRazon(local: LocalRecomendado, categoria?: string, comuna?: string): string {
  if (local.descuento > 0) return `tiene ${local.descuento}% de descuento hoy`;
  if (categoria && local.categoria === categoria.toLowerCase()) return "es justo lo que buscas";
  if (comuna && local.comuna.toLowerCase() === comuna.toLowerCase()) return "está en tu zona";
  return "es uno de los más valorados en Santiago";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GeniePanel() {
  const { setIsOpen, addInteraccion, getRecomendacion } = useGenie();

  const [step, setStep] = useState(1);
  const [ocasion, setOcasion] = useState("");
  const [comuna, setComuna] = useState("");
  const [categoria, setCategoria] = useState("");
  const [resultado, setResultado] = useState<LocalRecomendado | null>(null);

  const handleOcasion = (o: string) => {
    setOcasion(o);
    addInteraccion("ocasion_seleccionada", { ocasion: o });
    setStep(2);
  };

  const handleComuna = (c: string) => {
    setComuna(c);
    addInteraccion("comuna_seleccionada", { comuna: c });
    setStep(3);
  };

  const handleCategoria = (c: string) => {
    setCategoria(c);
    addInteraccion("categoria_seleccionada", { categoria: c });
    const rec = getRecomendacion(c === "Sorpréndeme" ? undefined : c, comuna || undefined);
    setResultado(rec);
    setStep(4);
  };

  const handleOtra = () => {
    const rec = getRecomendacion(categoria === "Sorpréndeme" ? undefined : categoria, comuna || undefined);
    setResultado(rec);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "calc(80px + 56px + 12px)",
      right: "16px",
      width: "min(320px, 90vw)",
      maxHeight: "70vh",
      overflowY: "auto",
      background: "rgba(13,7,3,0.98)",
      border: "1px solid rgba(232,168,76,0.35)",
      borderRadius: "20px",
      boxShadow: "0 0 40px rgba(0,0,0,0.7), 0 0 20px rgba(232,168,76,0.1)",
      zIndex: 950,
      animation: "genieSlideUp 0.3s ease both",
      padding: "20px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{
          fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem",
          color: "var(--sand-gold, #e8a84c)",
        }}>
          🪔 El Genio
        </p>
        <button onClick={() => setIsOpen(false)} style={{
          background: "none", border: "none", color: "rgba(245,208,128,0.5)",
          fontSize: "1.2rem", cursor: "pointer", padding: "4px",
        }}>✕</button>
      </div>

      {/* Step 1: Ocasión */}
      {step === 1 && (
        <div>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.85rem",
            color: "rgba(245,208,128,0.9)", marginBottom: "14px", lineHeight: 1.5,
          }}>
            {getSaludo()}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {OCASIONES.map(o => (
              <button key={o} onClick={() => handleOcasion(o)} style={{
                background: "rgba(232,168,76,0.12)",
                border: "1px solid rgba(232,168,76,0.25)",
                borderRadius: "20px", padding: "8px 14px", cursor: "pointer",
                fontFamily: "var(--font-lato)", fontSize: "0.8rem",
                color: "rgba(245,208,128,0.85)", transition: "all 0.15s",
              }}>
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Comuna */}
      {step === 2 && (
        <div>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.85rem",
            color: "rgba(245,208,128,0.9)", marginBottom: "14px", lineHeight: 1.5,
          }}>
            ¿En qué zona de Santiago?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {COMUNAS.map(c => (
              <button key={c} onClick={() => handleComuna(c)} style={{
                background: "rgba(232,168,76,0.12)",
                border: "1px solid rgba(232,168,76,0.25)",
                borderRadius: "20px", padding: "8px 14px", cursor: "pointer",
                fontFamily: "var(--font-lato)", fontSize: "0.8rem",
                color: "rgba(245,208,128,0.85)",
              }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Categoría */}
      {step === 3 && (
        <div>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.85rem",
            color: "rgba(245,208,128,0.9)", marginBottom: "14px", lineHeight: 1.5,
          }}>
            ¿Qué te provoca hoy?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CATEGORIAS.map(c => (
              <button key={c.label} onClick={() => handleCategoria(c.label)} style={{
                background: "rgba(232,168,76,0.12)",
                border: "1px solid rgba(232,168,76,0.25)",
                borderRadius: "20px", padding: "8px 14px", cursor: "pointer",
                fontFamily: "var(--font-lato)", fontSize: "0.8rem",
                color: "rgba(245,208,128,0.85)",
              }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Resultado */}
      {step === 4 && resultado && (
        <div>
          <div style={{
            background: "rgba(232,168,76,0.08)",
            border: "1px solid rgba(232,168,76,0.2)",
            borderRadius: "14px", padding: "16px", marginBottom: "12px",
          }}>
            {/* Local photo placeholder */}
            <div style={{
              width: "100%", height: "100px", borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(45,26,8,0.8), rgba(13,7,3,0.6))",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.5rem", marginBottom: "12px",
            }}>
              {resultado.categoria === "sushi" ? "🍣" :
               resultado.categoria === "pizza" ? "🍕" :
               resultado.categoria === "hamburguesa" ? "🍔" :
               resultado.categoria === "mexicano" ? "🌮" :
               resultado.categoria === "saludable" ? "🥗" :
               resultado.categoria === "pastas" ? "🍝" :
               resultado.categoria === "pollo" ? "🐔" : "🍽️"}
            </div>

            <p style={{
              fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem",
              color: "var(--sand-gold, #e8a84c)", marginBottom: "4px",
            }}>
              {resultado.nombre}
            </p>
            <p style={{
              fontFamily: "var(--font-lato)", fontSize: "0.75rem",
              color: "rgba(245,208,128,0.5)", marginBottom: "8px",
            }}>
              {resultado.categoria} · {resultado.comuna} · ⭐ {resultado.rating}
              {resultado.descuento > 0 && ` · ${resultado.descuento}% OFF`}
            </p>
            <p style={{
              fontFamily: "var(--font-lato)", fontSize: "0.85rem",
              color: "rgba(245,208,128,0.8)", lineHeight: 1.6,
            }}>
              Te recomiendo <strong style={{ color: "var(--sand-gold, #e8a84c)" }}>{resultado.nombre}</strong> porque {getRazon(resultado, categoria, comuna)}.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <a href={`/locales/${resultado.id}`} style={{
              flex: 1, textAlign: "center", padding: "10px",
              background: "var(--oasis-teal, #2a7a6f)", borderRadius: "10px",
              fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#fff", textDecoration: "none", fontWeight: 700,
            }}>
              Ver local
            </a>
            <button onClick={handleOtra} style={{
              flex: 1, padding: "10px",
              background: "transparent", border: "1px solid rgba(232,168,76,0.3)",
              borderRadius: "10px", cursor: "pointer",
              fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "rgba(245,208,128,0.7)",
            }}>
              Otra opción
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes genieSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
