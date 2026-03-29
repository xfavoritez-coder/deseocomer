"use client";
import { useState, useEffect } from "react";
import {
  THEMES,
  applyThemeVars,
  getThemeByPeriod,
  type TimePeriod,
} from "@/hooks/useTimeTheme";

const PERIODS: TimePeriod[] = ["madrugada", "manana", "mediodia", "tarde", "noche"];

interface OverlayState {
  active: boolean;
  icon: string;
  label: string;
}

export default function DevPeriodSwitcher() {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [open, setOpen] = useState(false);
  const [overlay, setOverlay] = useState<OverlayState>({ active: false, icon: "", label: "" });

  useEffect(() => {
    setIsLocalhost(window.location.hostname === "localhost");
  }, []);

  if (!isLocalhost) return null;

  const switchPeriod = (period: TimePeriod) => {
    const theme = getThemeByPeriod(period);
    const { icon, label } = THEMES[period];

    setOpen(false);
    setOverlay({ active: true, icon, label });

    // Apply theme vars after overlay fades in (~600ms)
    setTimeout(() => {
      applyThemeVars(theme);
    }, 500);

    // Fade out overlay after 2s total
    setTimeout(() => {
      setOverlay({ active: false, icon, label });
    }, 2200);
  };

  return (
    <>
      {/* Overlay */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: "20px",
        pointerEvents: overlay.active ? "all" : "none",
        opacity: overlay.active ? 1 : 0,
        transition: "opacity 600ms ease",
      }}>
        <span style={{
          fontSize: "80px", lineHeight: 1,
          transform: overlay.active ? "scale(1)" : "scale(0)",
          transition: "transform 500ms cubic-bezier(0.34,1.56,0.64,1)",
          transitionDelay: "100ms",
          display: "block",
        }}>
          {overlay.icon}
        </span>
        <p style={{
          fontFamily: "var(--font-cinzel)", fontSize: "1rem",
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.9)",
          opacity: overlay.active ? 1 : 0,
          transition: "opacity 400ms ease",
          transitionDelay: "300ms",
        }}>
          {overlay.label}
        </p>
      </div>

      {/* Period panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: "72px", left: "16px", zIndex: 9000,
          background: "rgba(10,8,20,0.97)",
          border: "1px solid rgba(232,168,76,0.3)",
          borderRadius: "16px", padding: "12px",
          display: "flex", flexDirection: "column", gap: "4px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          minWidth: "160px",
        }}>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.55rem",
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "rgba(232,168,76,0.6)", padding: "4px 8px 8px",
            borderBottom: "1px solid rgba(232,168,76,0.15)", marginBottom: "4px",
          }}>
            Período del día
          </p>
          {PERIODS.map((period) => {
            const { icon, label } = THEMES[period];
            return (
              <button
                key={period}
                onClick={() => switchPeriod(period)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  background: "none", border: "none", cursor: "pointer",
                  padding: "10px 12px", borderRadius: "10px",
                  fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.85)",
                  transition: "background 0.15s",
                  width: "100%", textAlign: "left",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,168,76,0.12)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
              >
                <span style={{ fontSize: "1.2rem" }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Simulador de período"
        style={{
          position: "fixed", bottom: "16px", left: "16px", zIndex: 9000,
          width: "44px", height: "44px", borderRadius: "50%",
          background: "rgba(10,8,20,0.92)",
          border: "1px solid rgba(232,168,76,0.4)",
          cursor: "pointer", fontSize: "1.2rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          transition: "border-color 0.2s, transform 0.2s",
          color: "rgba(232,168,76,0.8)",
        }}
        onMouseEnter={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = "rgba(232,168,76,0.9)";
          b.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          const b = e.currentTarget as HTMLButtonElement;
          b.style.borderColor = "rgba(232,168,76,0.4)";
          b.style.transform = "scale(1)";
        }}
      >
        🕐
      </button>
    </>
  );
}
