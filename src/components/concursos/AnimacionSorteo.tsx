"use client";
import { useState, useEffect } from "react";

interface AnimacionSorteoProps {
  ganadorNombre: string;
  totalBoletos: number;
  onClose: () => void;
}

export default function AnimacionSorteo({ ganadorNombre, totalBoletos, onClose }: AnimacionSorteoProps) {
  const [fase, setFase] = useState<"mezclando" | "ganador">("mezclando");
  const [progreso, setProgreso] = useState(0);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; delay: number; dur: number }[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setFase("ganador"), 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgreso(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + 3;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (fase === "ganador") {
      const colors = ["#ec4899", "#f472b6", "#e8a84c", "#f5d080", "#3db89e"];
      setConfetti(Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 1.5,
        dur: 2 + Math.random() * 2,
      })));
    }
  }, [fase]);

  const textoProgreso = progreso < 50 ? "Mezclando boletos..." : progreso < 80 ? "Casi listo..." : "¡Encontrando al ganador!";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,8,18,0.98)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>

      {fase === "mezclando" && (
        <>
          <div style={{ fontSize: 56, marginBottom: 12, animation: "dc-sorteo-float 2s ease-in-out infinite", filter: "drop-shadow(0 0 20px rgba(236,72,153,0.3))" }}>🧞</div>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: 18, color: "#f5d080", textTransform: "uppercase", textAlign: "center", marginBottom: 4 }}>Realizando el sorteo</h2>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.4)", textAlign: "center", marginBottom: 28 }}>Seleccionando al ganador entre todos los boletos...</p>

          {/* Urna */}
          <div style={{ width: 160, height: 160, borderRadius: "50%", border: "2px solid rgba(236,72,153,0.35)", background: "rgba(236,72,153,0.04)", boxShadow: "0 0 50px rgba(236,72,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 48, animation: "dc-sorteo-spin 1.5s linear infinite" }}>🎲</div>
          </div>

          {/* Barra de progreso */}
          <div style={{ width: 180, marginBottom: 8 }}>
            <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(progreso, 100)}%`, height: "100%", background: "linear-gradient(to right, #ec4899, #f472b6)", borderRadius: 20, transition: "width 0.1s" }} />
            </div>
          </div>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(236,72,153,0.5)", textAlign: "center" }}>{textoProgreso}</p>
        </>
      )}

      {fase === "ganador" && (
        <div style={{ textAlign: "center", animation: "dc-sorteo-reveal 0.6s ease" }}>
          {/* Confetti */}
          {confetti.map(c => (
            <div key={c.id} style={{
              position: "fixed", top: -10, left: `${c.x}%`, width: 8, height: 8, borderRadius: 2,
              background: c.color, zIndex: 1001,
              animation: `dc-sorteo-fall ${c.dur}s linear ${c.delay}s forwards`,
              opacity: 0,
            }} />
          ))}

          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 10, color: "#ec4899", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>🎲 Ganador del sorteo</p>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
          <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: 30, color: "#f5d080", fontWeight: 700, marginBottom: 16, textTransform: "capitalize" }}>{ganadorNombre}</h1>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.35)", borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
            <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "#ec4899" }}>🎟️ Seleccionado entre {totalBoletos} boletos</span>
          </div>
          <br />
          <button onClick={onClose} style={{ marginTop: 8, background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 20, padding: "10px 24px", fontFamily: "var(--font-cinzel)", fontSize: 13, color: "#ec4899", cursor: "pointer", animation: "dc-sorteo-fadein 0.5s ease 1.5s both" }}>Ver el concurso →</button>
        </div>
      )}

      <style>{`
        @keyframes dc-sorteo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes dc-sorteo-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes dc-sorteo-reveal {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes dc-sorteo-fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
        @keyframes dc-sorteo-fadein {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
