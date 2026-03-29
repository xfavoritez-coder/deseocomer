"use client";
import { useEffect, useRef, useState } from "react";
import { useTimeTheme, getThemeByPeriod, applyThemeVars, THEMES } from "@/hooks/useTimeTheme";
import type { TimePeriod } from "@/hooks/useTimeTheme";
import { ThemeContext } from "@/contexts/ThemeContext";

const PERIOD_ORDER: TimePeriod[] = ["madrugada", "manana", "mediodia", "tarde", "noche"];

const DEV_LABELS: Record<TimePeriod, string> = {
  madrugada: "Madrugada",
  manana:    "Amanecer",
  mediodia:  "Mediodía",
  tarde:     "Tarde",
  noche:     "Noche",
};

const OVERLAY_BG: Record<TimePeriod, string> = {
  madrugada: "rgba(7,4,15,0.95)",
  manana:    "rgba(28,12,0,0.95)",
  mediodia:  "rgba(30,20,0,0.95)",
  tarde:     "rgba(20,6,8,0.95)",
  noche:     "rgba(6,4,16,0.95)",
};

const GREETING_DATA: Record<TimePeriod, { icon: string; title: string; subtitle?: string }> = {
  madrugada: { icon: "✨", title: "Los mejores antojos no tienen hora" },
  manana:    { icon: "🌅", title: "Buenos días", subtitle: "¿Qué vas a desayunar hoy?" },
  mediodia:  { icon: "🌞", title: "Buenas tardes", subtitle: "¿Ya pensaste dónde almorzar?" },
  tarde:     { icon: "🌇", title: "Buenas tardes", subtitle: "La hora perfecta para una promoción" },
  noche:     { icon: "🌙", title: "Buenas noches", subtitle: "La noche es perfecta para descubrir algo nuevo" },
};

const LS_KEY = "periodo_actual";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hookTheme    = useTimeTheme();
  const [forcedPeriod, setForcedPeriod] = useState<TimePeriod | null>(null);
  const activeTheme  = forcedPeriod ? getThemeByPeriod(forcedPeriod) : hookTheme;

  const [devVisible, setDevVisible] = useState(false);
  useEffect(() => {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      setDevVisible(true);
    }
  }, []);

  // ── Overlay ──────────────────────────────────────────────────────────────
  const overlayVersionRef = useRef(0);
  const [overlayActive,  setOverlayActive]  = useState(false);
  const [overlayKey,     setOverlayKey]     = useState(0);
  const [overlayContent, setOverlayContent] = useState({ icon: "", title: "", subtitle: "", bg: "rgba(0,0,0,0.95)" });

  // Track whether this is a dev-panel forced change (always animate)
  const devForcedRef = useRef(false);

  // On mount, seed localStorage with current period so first load never animates
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const stored = localStorage.getItem(LS_KEY);
      if (!stored) {
        // First ever visit — store period silently
        localStorage.setItem(LS_KEY, activeTheme.period);
      }
    }
  }, [activeTheme.period]);

  // Detect period change → apply CSS vars + trigger overlay only on REAL change
  const prevPeriodRef = useRef<TimePeriod | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY) as TimePeriod | null;
    const isDevForced = devForcedRef.current;
    devForcedRef.current = false; // reset flag

    // Determine if we should show the overlay:
    // - Dev panel forced change → always animate
    // - Real period change detected by setInterval → animate only if stored !== current
    // - Page load / refresh → stored === current, so NO animation
    const needsOverlay = isDevForced || (stored !== null && stored !== activeTheme.period && prevPeriodRef.current !== null);

    if (needsOverlay) {
      const greeting = GREETING_DATA[activeTheme.period];
      const bg  = OVERLAY_BG[activeTheme.period];
      const ver = ++overlayVersionRef.current;
      setOverlayContent({ icon: greeting.icon, title: greeting.title, subtitle: greeting.subtitle ?? "", bg });
      setOverlayKey(ver);
      setOverlayActive(true);
      // Update localStorage
      localStorage.setItem(LS_KEY, activeTheme.period);
      // Apply CSS vars after overlay has faded in (~500ms)
      setTimeout(() => applyThemeVars(activeTheme), 500);
      // Remove overlay after 3s animation
      setTimeout(() => {
        if (overlayVersionRef.current === ver) setOverlayActive(false);
      }, 3100);
    } else {
      // Silently apply theme — no animation
      applyThemeVars(activeTheme);
      localStorage.setItem(LS_KEY, activeTheme.period);
    }
    prevPeriodRef.current = activeTheme.period;
  }, [activeTheme]);

  function handleDevSelect(period: TimePeriod) {
    if (period === (forcedPeriod ?? hookTheme.period)) return;
    devForcedRef.current = true; // mark as dev-forced so overlay always plays
    setForcedPeriod(period);
  }

  return (
    <ThemeContext.Provider value={activeTheme}>
      {children}

      {/* Period transition overlay */}
      {overlayActive && (
        <div
          key={overlayKey}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "16px",
            background: overlayContent.bg,
            pointerEvents: "all",
            animation: "tpOverlayShow 3s ease forwards",
          }}
        >
          <span style={{
            fontSize: "80px", lineHeight: 1, display: "block",
            animation: "tpIconBounce 600ms cubic-bezier(0.34,1.56,0.64,1) 100ms both",
          }}>
            {overlayContent.icon}
          </span>
          <p style={{
            fontFamily: "var(--font-cinzel-decorative, serif)", fontSize: "clamp(1.2rem, 4vw, 2rem)",
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.95)", margin: 0,
            animation: "tpLabelFade 400ms ease 300ms both",
            textAlign: "center", padding: "0 20px",
          }}>
            {overlayContent.title}
          </p>
          {overlayContent.subtitle && (
            <p style={{
              fontFamily: "var(--font-cinzel, serif)", fontSize: "clamp(0.85rem, 2.5vw, 1.1rem)",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.7)", margin: 0,
              animation: "tpLabelFade 400ms ease 500ms both",
              textAlign: "center", padding: "0 20px",
            }}>
              {overlayContent.subtitle}
            </p>
          )}
        </div>
      )}

      {devVisible && (
        <DevPanel activePeriod={activeTheme.period} onSelect={handleDevSelect} />
      )}

      <style>{`
        @keyframes tpOverlayShow {
          0%   { opacity: 0; }
          16%  { opacity: 1; }
          83%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes tpIconBounce {
          0%   { transform: scale(0); }
          55%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes tpLabelFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </ThemeContext.Provider>
  );
}

// ─── Dev Panel ───────────────────────────────────────────────────────────────

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
      position: "fixed", bottom: "24px", right: "24px", zIndex: 10000,
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px",
    }}>
      {open && (
        <div style={{
          display: "flex", flexDirection: "column", gap: "4px",
          background: "rgba(5,3,8,0.97)",
          border: "1px solid rgba(232,168,76,0.25)",
          borderRadius: "16px", padding: "12px",
          backdropFilter: "blur(12px)",
          animation: "devPanelIn 200ms ease both",
          minWidth: "168px",
        }}>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.55rem",
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "rgba(232,168,76,0.5)", textAlign: "center",
            padding: "0 4px 8px",
            borderBottom: "1px solid rgba(232,168,76,0.12)",
            marginBottom: "4px",
          }}>
            Simular período
          </p>
          {PERIOD_ORDER.map((period) => {
            const t        = THEMES[period];
            const isActive = period === activePeriod;
            return (
              <button
                key={period}
                onClick={() => { onSelect(period); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", borderRadius: "10px",
                  border: isActive ? `1px solid ${t.accent}80` : "1px solid rgba(255,255,255,0.06)",
                  background: isActive ? `${t.accent}18` : "transparent",
                  cursor: isActive ? "default" : "pointer",
                  width: "100%",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{t.icon}</span>
                <span style={{
                  fontFamily: "var(--font-cinzel)", fontSize: "0.7rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: isActive ? t.accent : "rgba(255,255,255,0.6)",
                  fontWeight: isActive ? 700 : 400,
                }}>
                  {DEV_LABELS[period]}
                </span>
                {isActive && (
                  <span style={{
                    marginLeft: "auto", width: "6px", height: "6px", flexShrink: 0,
                    borderRadius: "50%", background: t.accent,
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
          width: "44px", height: "44px", borderRadius: "50%",
          border: "1px solid rgba(232,168,76,0.3)",
          background: "rgba(5,3,8,0.9)",
          color: "rgba(232,168,76,0.7)",
          fontSize: "1.2rem", cursor: "pointer",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {open ? "✕" : "🕐"}
      </button>

      <style>{`
        @keyframes devPanelIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
