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

  const isDay  = period === "dia";
  const hasSky = period === "madrugada" || period === "noche";

  const btnBg    = "var(--accent)";
  const btnColor = "var(--bg-primary)";

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
      marginBottom: "0",
    }}>

      {/* ── Estrellas ── */}
      <div
        ref={starsRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
      />

      {/* ── Glow atmosférico (solo noche/madrugada) ── */}
      {!isDay && (
        <div style={{
          position: "absolute", inset: 0,
          background: heroAtmosphere,
          pointerEvents: "none", zIndex: 2,
          transition: "background 2s ease",
        }} />
      )}

      {/* ── Objetos del cielo ── */}
      {period === "dia" && (
        <div className="dc-sky dc-sky--sun" style={{
          position: "absolute", top: "7%", left: "50%",
          transform: "translateX(-50%)",
          fontSize: "88px",
          filter: "drop-shadow(0 0 60px rgba(255,230,80,1))",
          animation: "skyFloat 5s ease-in-out infinite",
          pointerEvents: "none", zIndex: 4,
        }}>☀️</div>
      )}
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
          {period === "madrugada" ? "✨" : "🌙"}
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
        maxWidth: "1000px",
        boxSizing: "border-box" as const,
        width: "100%",
      }}>
        <h1 className="dc-hero-h1" style={{
          fontFamily: "var(--font-cinzel-decorative)",
          fontSize: "clamp(1.6rem, 6vw, 4.5rem)",
          lineHeight: 1.05,
          fontWeight: 800,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          color: "var(--sand-gold)",
          textShadow: TEXT_SHADOW,
          animation: "fadeUp 0.8s 0.4s both",
          margin: "0 auto 0",
          maxWidth: "800px",
        }}>
          Comida gratis{" "}<span className="dc-hero-gratis">y promociones</span>
        </h1>

        <p className="dc-hero-city" style={{
          fontFamily: "var(--font-cinzel)",
          fontWeight: 400,
          color: "var(--color-hero-subtitle, rgba(61,184,158,0.9))",
          fontSize: "clamp(1rem, 2.5vw, 2rem)",
          lineHeight: 1.5,
          letterSpacing: "0.05em",
          animation: "fadeUp 0.8s 0.55s both",
          margin: "16px auto 40px",
        }}>
          El genio que cumple tu deseo de comer&nbsp;🧞
        </p>

        <div className="dc-hero-cta" style={{
          display: "flex", flexDirection: "column", gap: "16px",
          alignItems: "center",
          animation: "fadeUp 0.8s 0.7s both",
        }}>
          <Link href="/concursos" className="dc-hero-btn dc-hero-btn--primary" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.85rem, 2vw, 1.1rem)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: btnBg,
            color: btnColor,
            padding: "18px 56px",
            borderRadius: "12px",
            textDecoration: "none",
            fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            transition: "background 2s ease, color 2s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
            minHeight: "56px",
            textAlign: "center",
          }}>
            Ver Concursos
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

        .dc-hero-gratis { white-space: nowrap; }

        @media (max-width: 767px) {
          .dc-hero-h1 {
            font-size: clamp(1.6rem, 8vw, 2.2rem) !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .dc-hero-gratis   { display: inline !important; white-space: normal !important; }
          .dc-hero-city     { font-size: 1.1rem !important; line-height: 1.6 !important; }
          .dc-hero-content  { margin-top: -16px !important; padding: 0 20px !important; }
          .dc-sky--sun      { font-size: 56px !important; }
          /* sunrise/sunset icons removed */
          .dc-sky--moon     { font-size: 34px !important; right: 6% !important; top: 5% !important; }
          .dc-hero-btn      { padding: 16px 28px !important; font-size: 0.85rem !important; min-height: 56px; width: 100%; max-width: 340px; justify-content: center; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-hero-content { margin-top: -56px !important; }
        }
      `}</style>
    </section>
  );
}
