"use client";
import { useEffect, useRef, useState } from "react";
import { useTimeTheme, getThemeByPeriod, applyThemeVars, THEMES } from "@/hooks/useTimeTheme";
import type { TimePeriod, TimeTheme } from "@/hooks/useTimeTheme";
import TimeTransition from "@/components/TimeTransition";
import { ThemeContext } from "@/contexts/ThemeContext";

type TransitionState = { from: TimeTheme; to: TimeTheme } | null;

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hookTheme = useTimeTheme();

  const [forcedPeriod, setForcedPeriod] = useState<TimePeriod | null>(null);
  const activeTheme = forcedPeriod ? getThemeByPeriod(forcedPeriod) : hookTheme;

  const [transition, setTransition] = useState<TransitionState>(null);
  const prevPeriodRef = useRef<TimePeriod | null>(null);
  const isMountedRef  = useRef(false);

  const [devVisible, setDevVisible] = useState(false);
  useEffect(() => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      setDevVisible(true);
    }
  }, []);

  // Aplica las variables y detecta cambios de período
  useEffect(() => {
    applyThemeVars(activeTheme);

    if (!isMountedRef.current) {
      isMountedRef.current = true;
      prevPeriodRef.current = activeTheme.period;
      return;
    }

    if (prevPeriodRef.current && prevPeriodRef.current !== activeTheme.period) {
      const from = getThemeByPeriod(prevPeriodRef.current);
      setTransition({ from, to: activeTheme });
    }

    prevPeriodRef.current = activeTheme.period;
  }, [activeTheme]);

  function handleDevSelect(period: TimePeriod) {
    if (period === (forcedPeriod ?? hookTheme.period)) return;
    setForcedPeriod(period);
  }

  return (
    <ThemeContext.Provider value={activeTheme}>
      {children}

      {transition && (
        <TimeTransition
          from={transition.from}
          to={transition.to}
          onComplete={() => setTransition(null)}
        />
      )}

      {devVisible && (
        <DevPanel activePeriod={activeTheme.period} onSelect={handleDevSelect} />
      )}
    </ThemeContext.Provider>
  );
}

// ─── Panel de desarrollo ────────────────────────────────────────────────────

const PERIOD_ORDER: TimePeriod[] = ["madrugada", "manana", "mediodia", "tarde", "noche"];

function DevPanel({
  activePeriod,
  onSelect,
}: {
  activePeriod: TimePeriod;
  onSelect: (p: TimePeriod) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 10000,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "8px",
    }}>
      {open && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          background: "rgba(5,3,8,0.97)",
          border: "1px solid rgba(232,168,76,0.25)",
          borderRadius: "16px",
          padding: "12px",
          backdropFilter: "blur(12px)",
          animation: "devPanelIn 200ms ease both",
        }}>
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(232,168,76,0.5)",
            textAlign: "center",
            marginBottom: "4px",
          }}>
            Simular período
          </p>
          {PERIOD_ORDER.map((period) => {
            const t = THEMES[period];
            const isActive = period === activePeriod;
            return (
              <button
                key={period}
                onClick={() => { onSelect(period); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: isActive ? `1px solid ${t.accent}80` : "1px solid rgba(255,255,255,0.06)",
                  background: isActive ? `${t.accent}18` : "transparent",
                  cursor: isActive ? "default" : "pointer",
                  minWidth: "160px",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
                <span style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isActive ? t.accent : "rgba(255,255,255,0.6)",
                  fontWeight: isActive ? 700 : 400,
                }}>
                  {t.label}
                </span>
                {isActive && (
                  <span style={{
                    marginLeft: "auto",
                    width: "6px", height: "6px",
                    borderRadius: "50%",
                    background: t.accent,
                    boxShadow: `0 0 6px ${t.accent}`,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        title="Panel de desarrollo — simular hora del día"
        style={{
          width: "44px", height: "44px",
          borderRadius: "50%",
          border: "1px solid rgba(232,168,76,0.3)",
          background: "rgba(5,3,8,0.9)",
          color: "rgba(232,168,76,0.7)",
          fontSize: "1.2rem",
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? "✕" : "🕐"}
      </button>

      <style>{`
        @keyframes devPanelIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
