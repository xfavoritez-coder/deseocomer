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
      {period === "manana" && (
        <div className="dc-sky dc-sky--sunrise" style={{
          position: "absolute", bottom: "22%", left: "50%",
          transform: "translateX(-50%)",
          fontSize: "72px",
          filter: "drop-shadow(0 0 50px rgba(255,160,40,0.9))",
          animation: "skyFloat 6s ease-in-out infinite",
          pointerEvents: "none", zIndex: 4,
        }}>🌅</div>
      )}
      {period === "tarde" && (
        <div className="dc-sky dc-sky--sunset" style={{
          position: "absolute", bottom: "18%", right: "12%",
          fontSize: "60px",
          filter: "drop-shadow(0 0 40px rgba(255,80,20,0.8))",
          animation: "skyFloat 7s ease-in-out infinite",
          pointerEvents: "none", zIndex: 4,
        }}>🌇</div>
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

      {/* ── Lámpara flotante ── */}
      <div className="dc-lamp" style={{
        position: "absolute", bottom: "16%", left: "50%",
        transform: "translateX(-50%)",
        animation: "lampFloat 4s ease-in-out infinite",
        filter: `drop-shadow(0 0 35px ${accent})`,
        zIndex: 6,
      }}>🏮</div>

      {/* ── Humo ── */}
      <div style={{
        position: "absolute", bottom: "30%", left: "50%",
        transform: "translateX(-50%)",
        width: "4px", height: "80px",
        background: "linear-gradient(to top, rgba(95,240,208,0.4), transparent)",
        borderRadius: "4px",
        animation: "smokeRise 2s ease-out infinite",
        zIndex: 6,
      }} />

      {/* ── Contenido ── */}
      <div className="dc-hero-content" style={{
        position: "relative", zIndex: 10,
        textAlign: "center",
        padding: "0 24px",
        maxWidth: "820px",
      }}>
        <h1 className="dc-hero-h1" style={{
          fontFamily: "var(--font-cinzel-decorative)",
          fontSize: "clamp(2.5rem, 4.5vw, 4rem)",
          lineHeight: 1.1,
          marginBottom: "24px",
          animation: "fadeUp 0.8s 0.4s both",
          textShadow: TEXT_SHADOW,
          transition: "color 2s ease",
          textTransform: "uppercase",
          maxWidth: "800px",
          margin: "0 auto 24px",
        }}>
          <span style={{
            display: "block",
            color: isDay ? "#ffe898" : "var(--accent)",
          }}>
            Gana comida gratis.
          </span>
          <span style={{
            display: "block",
            color: isDay ? "#80f0e0" : "var(--oasis-bright)",
          }}>
            Descubre los mejores locales.
          </span>
        </h1>

        <p className="dc-hero-subtitle hero-subtitle" style={{
          fontFamily: "var(--font-lato)",
          fontWeight: 300,
          color: "rgba(255,255,255,0.88)",
          animation: "fadeUp 0.8s 0.65s both",
          maxWidth: "560px",
          margin: "0 auto 40px",
        }}>
          El genio que cumple tu deseo de comer. Participa en concursos, accede a promociones,
          {" "}y descubre qué comer hoy.
        </p>

        <div className="dc-hero-cta" style={{
          display: "flex", flexDirection: "column", gap: "16px",
          alignItems: "center",
          animation: "fadeUp 0.8s 0.9s both",
        }}>
          <Link href="/concursos" className="dc-hero-btn dc-hero-btn--primary" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            background: "var(--accent)",
            color: "var(--bg-primary)",
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
            🎪 Ver Concursos
          </Link>
          <Link href="/promociones" className="dc-hero-link" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-link)",
            textDecoration: "none",
            opacity: 0.9,
          }}>
            Ver promociones →
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes lampFloat {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-3deg); }
          50%       { transform: translateX(-50%) translateY(-16px) rotate(3deg); }
        }
        @keyframes smokeRise {
          0%   { opacity: 0; transform: translateX(-50%) scaleX(1); }
          50%  { opacity: 0.6; }
          100% { opacity: 0; transform: translateX(-50%) scaleX(3) translateY(-40px); }
        }
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
        .dc-lamp { font-size: 80px; }

        .dc-hero-link:hover { text-decoration: underline; opacity: 1; }

        @media (max-width: 767px) {
          .dc-hero-h1       { font-size: clamp(1.8rem, 6vw, 2.4rem) !important; }
          .dc-hero-subtitle { font-size: clamp(1rem, 4vw, 1.1rem) !important; line-height: 1.8 !important; }
          .dc-hero-content  { margin-top: -16px !important; padding: 0 20px !important; }
          .dc-lamp          { font-size: 52px !important; bottom: 13% !important; }
          .dc-sky--sun      { font-size: 56px !important; }
          .dc-sky--sunrise  { font-size: 50px !important; bottom: 25% !important; }
          .dc-sky--sunset   { font-size: 42px !important; right: 5% !important; bottom: 20% !important; }
          .dc-sky--moon     { font-size: 34px !important; right: 6% !important; top: 5% !important; }
          .dc-hero-btn      { padding: 16px 28px !important; font-size: 0.9rem !important; min-height: 56px; width: 100%; max-width: 320px; justify-content: center; }
          .dc-hero-subtitle br { display: none; }
        }

        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-hero-content { margin-top: -56px !important; }
          .dc-lamp         { font-size: 64px !important; }
        }
      `}</style>
    </section>
  );
}
