"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

const TEXT_SHADOW = "0 2px 12px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.6)";

export default function HeroSection() {
  const theme     = useTheme();
  const { period, heroGradient, heroAtmosphere, starCount, accent } = theme;

  const starsRef    = useRef<HTMLDivElement>(null);
  const prevPeriod  = useRef<string>("");

  useEffect(() => {
    if (!starsRef.current) return;
    if (prevPeriod.current === period) return;
    prevPeriod.current = period;

    const container = starsRef.current;
    container.innerHTML = "";

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      const size  = Math.random() * 2.5 + 0.5;
      const glow  = size > 1.8 ? `0 0 ${size * 3}px rgba(255,255,255,0.9)` : "none";
      star.style.cssText = `
        position:absolute;
        width:${size}px; height:${size}px;
        background:white; border-radius:50%;
        left:${Math.random() * 100}%; top:${Math.random() * 72}%;
        box-shadow:${glow};
        animation:twinkle ${(Math.random() * 3 + 2).toFixed(1)}s ease-in-out infinite;
        animation-delay:${(Math.random() * 4).toFixed(1)}s;
      `;
      container.appendChild(star);
    }
  });

  const isDay  = period === "manana" || period === "mediodia";
  const hasSky = period === "madrugada" || period === "noche";

  // Botón "Ver Concursos" — dorado intenso en tarde para contraste
  const btnBg    = period === "tarde" ? "#e8a84c" : "var(--accent)";
  const btnColor = period === "tarde" ? "#1a0e05" : "var(--bg-primary)";

  return (
    <section style={{
      minHeight: "100vh",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: heroGradient,
      transition: "background 2s ease",
    }}>

      {/* ── Estrellas ── */}
      <div
        ref={starsRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
      />

      {/* ── Glow atmosférico ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: heroAtmosphere,
        pointerEvents: "none", zIndex: 2,
        transition: "background 2s ease",
      }} />

      {/* ── Vignette diurna ── */}
      {isDay && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 58%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 40%, transparent 72%)",
          pointerEvents: "none", zIndex: 3,
        }} />
      )}

      {/* ── Oscurecimiento superior para legibilidad en tarde ── */}
      {period === "tarde" && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, transparent 65%)",
          pointerEvents: "none", zIndex: 3,
        }} />
      )}

      {/* ── Objetos del cielo ── */}
      {period === "mediodia" && (
        <div className="dc-sky dc-sky--sun" style={{
          position: "absolute", top: "7%", left: "50%",
          transform: "translateX(-50%)",
          fontSize: "88px",
          filter: "drop-shadow(0 0 60px rgba(255,230,80,1))",
          animation: "skyFloat 5s ease-in-out infinite",
          pointerEvents: "none", zIndex: 4,
        }}>☀️</div>
      )}
      {/* Sunrise and sunset icons removed for cleaner hero */}
      {hasSky && (
        <div className="dc-sky dc-sky--moon" style={{
          position: "absolute", top: "8%", right: "14%",
          fontSize: period === "madrugada" ? "50px" : "58px",
          filter: period === "madrugada"
            ? "drop-shadow(0 0 18px rgba(200,180,255,0.8))"
            : "drop-shadow(0 0 24px rgba(220,220,180,0.7))",
          animation: "skyFloat 9s ease-in-out infinite",
          pointerEvents: "none", zIndex: 4,
        }}>
          {period === "madrugada" ? "🌙" : "🌕"}
        </div>
      )}

      {/* ── Dunas SVG ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, pointerEvents: "none", zIndex: 5 }}>
        <svg viewBox="0 0 1440 200" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
          <path d="M0,160 C200,80 400,200 720,120 C1040,40 1280,160 1440,100 L1440,200 L0,200 Z"
            fill="var(--bg-secondary)" opacity="0.95" />
          <path d="M0,180 C300,120 500,200 800,150 C1100,100 1300,180 1440,140 L1440,200 L0,200 Z"
            fill="var(--bg-primary)" />
        </svg>
      </div>

      {/* ── Contenido ── */}
      <div className="dc-hero-content" style={{
        position: "relative", zIndex: 10,
        textAlign: "center",
        padding: "0 24px",
        maxWidth: "820px",
      }}>
        <h1 className="dc-hero-h1" style={{
          fontFamily: "var(--font-cinzel-decorative)",
          fontSize: "clamp(2rem, 4.5vw, 3.8rem)",
          lineHeight: 1.05,
          fontWeight: 700,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          color: "var(--sand-gold)",
          textShadow: TEXT_SHADOW,
          animation: "fadeUp 0.8s 0.4s both",
          margin: "0 auto 0",
          maxWidth: "800px",
        }}>
          Gana comida{" "}<span className="dc-hero-gratis">gratis</span>
        </h1>

        <p className="dc-hero-city" style={{
          fontFamily: "var(--font-cinzel)",
          fontWeight: 400,
          color: "var(--color-hero-subtitle, rgba(61,184,158,0.9))",
          fontSize: "clamp(1rem, 2.5vw, 1.6rem)",
          lineHeight: 1.5,
          letterSpacing: "0.05em",
          animation: "fadeUp 0.8s 0.55s both",
          margin: "16px auto 40px",
        }}>
          El genio que cumple tu deseo de comer 🧞
        </p>

        <div className="dc-hero-cta" style={{
          display: "flex", flexDirection: "column", gap: "16px",
          alignItems: "center",
          animation: "fadeUp 0.8s 0.7s both",
        }}>
          <Link href="/concursos" className="dc-hero-btn dc-hero-btn--primary" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: btnBg,
            color: btnColor,
            padding: "16px 40px",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            transition: "background 2s ease, color 2s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
            whiteSpace: "nowrap",
            minHeight: "56px",
          }}>
            Ver Concursos
          </Link>
          <Link href="/promociones" className="dc-hero-ghost" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.85rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.9)",
            textDecoration: "none",
            padding: "12px 28px",
            borderRadius: "10px",
            border: "1.5px solid rgba(255,255,255,0.6)",
            background: "transparent",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "border-color 0.2s, background 0.2s",
            whiteSpace: "nowrap",
          }}>
            Ver promociones →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; }
          50%       { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes skyFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-14px); }
        }

        /* ── Responsive base ── */
        .dc-hero-content { margin-top: -80px; }

        .dc-hero-ghost:hover { border-color: rgba(255,255,255,1) !important; background: rgba(255,255,255,0.08) !important; }

        .dc-hero-gratis { white-space: nowrap; }

        @media (max-width: 767px) {
          .dc-hero-h1       { font-size: clamp(1.8rem, 6vw, 2.4rem) !important; }
          .dc-hero-gratis   { display: block; }
          .dc-hero-subtitle { font-size: clamp(1rem, 4vw, 1.1rem) !important; line-height: 1.8 !important; }
          .dc-hero-content  { margin-top: -16px !important; padding: 0 20px !important; }
          .dc-sky--sun      { font-size: 56px !important; }
          /* sunrise/sunset icons removed */
          .dc-sky--moon     { font-size: 34px !important; right: 6% !important; top: 5% !important; }
          .dc-hero-btn      { padding: 16px 28px !important; font-size: 0.9rem !important; min-height: 56px; width: 100%; max-width: 320px; justify-content: center; }
          .dc-hero-ghost    { width: 100%; max-width: 320px; justify-content: center; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-hero-content { margin-top: -56px !important; }
        }
      `}</style>
    </section>
  );
}
