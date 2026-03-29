"use client";
import { useEffect } from "react";
import type { TimeTheme } from "@/hooks/useTimeTheme";

const GREETINGS: Record<string, { title: string; subtitle?: string }> = {
  dia:       { title: "¡Buen día!", subtitle: "¿Qué vas a comer hoy?" },
  noche:     { title: "Buenas noches", subtitle: "La noche es perfecta para descubrir algo nuevo" },
  madrugada: { title: "Buenas madrugadas", subtitle: "Los mejores antojos no tienen hora" },
};

interface Props {
  from: TimeTheme;
  to: TimeTheme;
  onComplete: () => void;
}

// Total: 800ms in + hold + 700ms out = overlay gone at ~3200ms
const TOTAL_MS = 3200;

export default function TimeTransition({ from, to, onComplete }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, TOTAL_MS);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <>
      <style>{`
        @keyframes tt-overlay-in {
          from { opacity: 0; }
          to   { opacity: 0.96; }
        }
        @keyframes tt-overlay-out {
          from { opacity: 0.96; }
          to   { opacity: 0; }
        }
        @keyframes tt-icon-bounce {
          0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
          55%  { transform: scale(1.3) rotate(6deg);  opacity: 1; }
          72%  { transform: scale(0.88) rotate(-3deg); }
          88%  { transform: scale(1.05) rotate(1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes tt-text-in {
          from { opacity: 0; transform: translateY(28px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes tt-glow-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.35; }
          50%       { transform: scale(1.18); opacity: 0.65; }
        }
        @keyframes tt-particle {
          0%   { opacity: 0; transform: translate(0, 0)    scale(0);   }
          15%  { opacity: 1; transform: translate(0, -20px) scale(1);   }
          100% { opacity: 0; transform: translate(var(--px), -140px) scale(0.4); }
        }
        @keyframes tt-ring {
          from { transform: scale(0.4); opacity: 0.6; }
          to   { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Overlay principal */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(ellipse at 50% 45%, ${to.bg} 0%, ${from.bg} 100%)`,
          animation:
            "tt-overlay-in 800ms cubic-bezier(0.4,0,0.2,1) forwards, " +
            "tt-overlay-out 700ms ease 2500ms forwards",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Glow difuso de fondo */}
        <div style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${to.accent}28 0%, transparent 68%)`,
          animation: "tt-glow-pulse 2.2s ease-in-out infinite",
        }} />

        {/* Onda expansiva */}
        <div style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          border: `2px solid ${to.accent}60`,
          animation: "tt-ring 1.4s ease-out 300ms forwards",
        }} />
        <div style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          border: `1px solid ${to.accent}30`,
          animation: "tt-ring 1.8s ease-out 550ms forwards",
        }} />

        {/* Partículas flotantes */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle  = (i / 12) * 360;
          const radius = 80 + (i % 3) * 30;
          const px = Math.round(Math.cos((angle * Math.PI) / 180) * radius);
          const delay = 200 + i * 80;
          const size  = 4 + (i % 3) * 2;
          return (
            <div key={i} style={{
              position: "absolute",
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "50%",
              backgroundColor: to.accent,
              boxShadow: `0 0 ${size * 2}px ${to.accent}`,
              // CSS custom prop for horizontal drift
              ["--px" as string]: `${px}px`,
              animation: `tt-particle ${1.6 + i * 0.1}s ease-out ${delay}ms both`,
              opacity: 0,
            }} />
          );
        })}

        {/* Ícono principal */}
        <div style={{
          fontSize: "120px",
          lineHeight: 1,
          position: "relative",
          zIndex: 1,
          marginBottom: "28px",
          animation: "tt-icon-bounce 950ms cubic-bezier(0.34,1.56,0.64,1) 220ms both",
          filter: `drop-shadow(0 0 50px ${to.accent}dd) drop-shadow(0 0 20px ${to.accent}88)`,
        }}>
          {to.icon}
        </div>

        {/* Saludo principal */}
        <p style={{
          fontFamily: "var(--font-cinzel-decorative)",
          fontSize: "clamp(1.2rem, 4vw, 2.2rem)",
          color: to.text,
          textShadow: `0 0 50px ${to.accent}aa, 0 2px 8px rgba(0,0,0,0.5)`,
          letterSpacing: "0.06em",
          position: "relative",
          zIndex: 1,
          animation: "tt-text-in 600ms ease 620ms both",
          textAlign: "center",
          maxWidth: "600px",
          padding: "0 20px",
          lineHeight: 1.4,
        }}>
          {GREETINGS[to.period]?.title}
        </p>
        {GREETINGS[to.period]?.subtitle && (
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.85rem, 2.5vw, 1.1rem)",
            color: `${to.text}b0`,
            letterSpacing: "0.1em",
            position: "relative",
            zIndex: 1,
            animation: "tt-text-in 600ms ease 820ms both",
            textAlign: "center",
            maxWidth: "600px",
            padding: "0 20px",
            lineHeight: 1.4,
          }}>
            {GREETINGS[to.period].subtitle}
          </p>
        )}
      </div>
    </>
  );
}
