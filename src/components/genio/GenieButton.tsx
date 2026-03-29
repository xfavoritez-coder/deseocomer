"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGenie } from "@/contexts/GenieContext";
import GeniePanel from "./GeniePanel";
import GenieToast from "./GenieToast";

// ─── Toast triggers ──────────────────────────────────────────────────────────

const TOAST_SHOWN_KEY = "dc_genio_toast_shown";

function getToastShown(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(TOAST_SHOWN_KEY) ?? "{}"); }
  catch { return {}; }
}

function markToastShown(id: string) {
  try {
    const s = getToastShown();
    s[id] = Date.now();
    localStorage.setItem(TOAST_SHOWN_KEY, JSON.stringify(s));
  } catch { /* noop */ }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GenieLampara() {
  const pathname = usePathname();
  const { isOpen, setIsOpen, toastActivo, setToastActivo, isLoggedIn, sessionCount } = useGenie();
  const [rubbing, setRubbing] = useState(false);
  const mountTimeRef = useRef(Date.now());
  const triggerCheckedRef = useRef(false);

  // Don't render on /panel routes
  if (pathname.startsWith("/panel")) return null;

  const handleClick = () => {
    if (toastActivo) {
      // Dismiss toast and open panel
      setToastActivo(null);
    }
    setRubbing(true);
    setTimeout(() => {
      setRubbing(false);
      setIsOpen(!isOpen);
    }, 300);
  };

  // ── Trigger 3: Lunchtime toast ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (triggerCheckedRef.current) return;
    const timer = setTimeout(() => {
      triggerCheckedRef.current = true;
      const h = new Date().getHours();
      if (h >= 12 && h < 14) {
        const elapsed = Date.now() - mountTimeRef.current;
        if (elapsed >= 120_000) { // 2 minutes
          const shown = getToastShown();
          const today = new Date().toISOString().slice(0, 10);
          if (shown["lunch"] !== undefined && new Date(shown["lunch"]).toISOString().slice(0, 10) === today) return;
          markToastShown("lunch");
          setToastActivo({
            id: "lunch",
            mensaje: "¿Buscas dónde almorzar? 🌞",
            opciones: ["Sí, ayúdame", "No, solo explorando"],
          });
        }
      }
    }, 130_000); // Check after ~2 min
    return () => clearTimeout(timer);
  }, [setToastActivo]);

  // ── Trigger 4: Friday/Saturday night ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const day = new Date().getDay(); // 5=Fri, 6=Sat
    const h = new Date().getHours();
    if ((day === 5 || day === 6) && h >= 18) {
      const shown = getToastShown();
      const weekKey = `night_${new Date().toISOString().slice(0, 10).slice(0, 7)}`; // monthly
      if (shown[weekKey]) return;
      const timer = setTimeout(() => {
        markToastShown(weekKey);
        setToastActivo({
          id: "night",
          mensaje: "¿Planes para esta noche? 🌙",
          opciones: ["Buscar restaurante", "Ver promociones", "No gracias"],
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [setToastActivo]);

  // ── Trigger 5: 3rd session without registration ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isLoggedIn || sessionCount < 3) return;
    try {
      if (localStorage.getItem("genio_trigger5_mostrado")) return;
    } catch { return; }
    const timer = setTimeout(() => {
      setToastActivo({
        id: "session3",
        mensaje: "Ya nos conocemos un poco 🧞 Regístrate y recuerdo todo lo que te gusta",
        opciones: ["Registrarme", "Seguir explorando"],
      });
    }, 30000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, sessionCount, setToastActivo]);

  return (
    <>
      {/* Toast */}
      {toastActivo && !isOpen && <GenieToast />}

      {/* Panel */}
      {isOpen && <GeniePanel />}

      {/* Lamp button */}
      <button
        onClick={handleClick}
        aria-label="Abrir El Genio"
        style={{
          position: "fixed",
          bottom: "80px",
          right: "16px",
          zIndex: 950,
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #c4853a, #e8a84c, #f5d080)",
          border: "2px solid rgba(245,208,128,0.6)",
          boxShadow: toastActivo
            ? "0 0 28px rgba(232,168,76,0.6), 0 0 12px rgba(232,168,76,0.3)"
            : "0 0 20px rgba(232,168,76,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.6rem",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          animation: rubbing
            ? "genieRub 0.3s ease"
            : toastActivo
              ? "geniePulseFast 1s ease-in-out infinite"
              : "geniePulse 2s ease-in-out infinite",
        }}
      >
        {isOpen ? "✕" : "🧞"}
      </button>

      <style>{`
        @keyframes geniePulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        @keyframes geniePulseFast {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(232,168,76,0.4); }
          50%      { transform: scale(1.08); box-shadow: 0 0 32px rgba(232,168,76,0.7); }
        }
        @keyframes genieRub {
          0%   { transform: rotate(0deg); }
          25%  { transform: rotate(-10deg); }
          50%  { transform: rotate(10deg); }
          75%  { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        @media (min-width: 768px) {
          button[aria-label="Abrir El Genio"] {
            bottom: 32px !important;
            right: 32px !important;
          }
        }
      `}</style>
    </>
  );
}
