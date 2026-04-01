"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGenie } from "@/contexts/GenieContext";
import { useTheme } from "@/contexts/ThemeContext";
import GeniePanel from "./GeniePanel";
import GenieToast from "./GenieToast";

const TOAST_SHOWN_KEY = "dc_genio_toast_shown";
const DISMISSED_KEY = "genio_toasts_dismissed";

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

function isDismissed(id: string): boolean {
  try { return !!JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "{}")[id]; } catch { return false; }
}

export default function GenieLampara() {
  const pathname = usePathname();
  const { isOpen, setIsOpen, toastActivo, setToastActivo, isLoggedIn, sessionCount } = useGenie();
  const { period } = useTheme();
  const [rubbing, setRubbing] = useState(false);
  const [showBalloon, setShowBalloon] = useState(false);
  const [balloonExiting, setBalloonExiting] = useState(false);
  const [esLocal, setEsLocal] = useState(false);
  const mountTimeRef = useRef(Date.now());
  const triggerCheckedRef = useRef(false);

  // Check if local is logged in
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (s?.id && s?.loggedIn) setEsLocal(true);
    } catch {}
  }, []);

  // Determine if should be hidden
  const hidden = pathname.startsWith("/panel") || pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/registro") || pathname.startsWith("/reset-password") || pathname.startsWith("/verificar-email") || pathname.startsWith("/login-local") || esLocal;

  // ── Intro balloon with 3-day reminder ──
  useEffect(() => {
    if (hidden) return;
    try {
      const USADO = "deseocomer_genio_usado";
      const PRESENTADO = "deseocomer_genio_presentado";
      const RECORDATORIO = "deseocomer_genio_ultimo_recordatorio";
      if (localStorage.getItem(USADO)) return;
      const yaPresentado = localStorage.getItem(PRESENTADO);
      if (!yaPresentado) {
        const t = setTimeout(() => {
          setShowBalloon(true);
          localStorage.setItem(PRESENTADO, "true");
          localStorage.setItem(RECORDATORIO, String(Date.now()));
        }, 3000);
        return () => clearTimeout(t);
      }
      const ultimo = localStorage.getItem(RECORDATORIO);
      if (ultimo && (Date.now() - Number(ultimo)) / 86400000 >= 3) {
        const t = setTimeout(() => {
          setShowBalloon(true);
          localStorage.setItem(RECORDATORIO, String(Date.now()));
        }, 3000);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [hidden]);

  // ── Trigger 3: Lunchtime toast ──
  useEffect(() => {
    if (hidden) return;
    if (triggerCheckedRef.current) return;
    const timer = setTimeout(() => {
      triggerCheckedRef.current = true;
      const h = new Date().getHours();
      if (h >= 12 && h < 14) {
        const elapsed = Date.now() - mountTimeRef.current;
        if (elapsed >= 120_000) {
          const shown = getToastShown();
          const today = new Date().toISOString().slice(0, 10);
          if (shown["lunch"] !== undefined && new Date(shown["lunch"]).toISOString().slice(0, 10) === today) return;
          if (isDismissed("lunch")) return;
          markToastShown("lunch");
          setToastActivo({
            id: "lunch",
            mensaje: "¿Buscas dónde almorzar? 🌞",
            opciones: ["Sí, ayúdame", "No, solo explorando"],
          });
        }
      }
    }, 130_000);
    return () => clearTimeout(timer);
  }, [hidden, setToastActivo]);

  // ── Trigger 4: Friday/Saturday night ──
  useEffect(() => {
    if (hidden) return;
    const day = new Date().getDay();
    const h = new Date().getHours();
    if ((day === 5 || day === 6) && h >= 18) {
      const shown = getToastShown();
      const weekKey = `night_${new Date().toISOString().slice(0, 10).slice(0, 7)}`;
      if (shown[weekKey]) return;
      if (isDismissed("night")) return;
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
  }, [hidden, setToastActivo]);

  // ── Trigger 5: 3rd session without registration ──
  useEffect(() => {
    if (hidden) return;
    if (isLoggedIn || sessionCount < 3) return;
    try {
      if (localStorage.getItem("genio_trigger5_mostrado")) return;
    } catch { return; }
    if (isDismissed("session3")) return;
    const timer = setTimeout(() => {
      setToastActivo({
        id: "session3",
        mensaje: "Ya nos conocemos un poco 🧞 Regístrate y recuerdo todo lo que te gusta",
        opciones: ["Registrarme", "Seguir explorando"],
      });
    }, 30000);
    return () => clearTimeout(timer);
  }, [hidden, isLoggedIn, sessionCount, setToastActivo]);

  // ── Birthday special greeting ──
  useEffect(() => {
    if (hidden) return;
    try {
      const birthday = JSON.parse(localStorage.getItem("deseocomer_user_birthday") || "{}");
      if (!birthday?.dia || !birthday?.mes) return;
      const hoy = new Date();
      const esCumple = hoy.getDate() === Number(birthday.dia) && (hoy.getMonth() + 1) === Number(birthday.mes);
      if (!esCumple) return;
      const keyHoy = `genio_cumple_saludo_${hoy.toISOString().slice(0, 10)}`;
      if (localStorage.getItem(keyHoy)) return;
      if (isDismissed("cumple_saludo")) return;
      const timer = setTimeout(() => {
        setToastActivo({
          id: "cumple_saludo",
          mensaje: "🎂 ¡Feliz cumpleaños! Hoy hay ofertas especiales para celebrar tu día 🎉",
          opciones: ["Ver ofertas", "¡Gracias! 🎂"],
        });
        localStorage.setItem(keyHoy, "true");
      }, 2000);
      return () => clearTimeout(timer);
    } catch {}
  }, [hidden, setToastActivo]);

  // Don't render anything if hidden
  if (hidden) return null;

  const handleClick = () => {
    if (showBalloon) setShowBalloon(false);
    try { localStorage.setItem("deseocomer_genio_usado", "true"); } catch {}
    if (toastActivo) setToastActivo(null);
    setRubbing(true);
    setTimeout(() => {
      setRubbing(false);
      setIsOpen(!isOpen);
    }, 300);
  };

  return (
    <>
      {toastActivo && !isOpen && <GenieToast />}
      {isOpen && <GeniePanel />}

      {showBalloon && (() => {
        const gs = {
          dia: { bg: "rgba(10,30,50,0.95)", border: "rgba(232,168,76,0.7)", shadow: "0 4px 30px rgba(0,0,0,0.4), 0 0 20px rgba(232,168,76,0.2)", color: "#f5d080" },
          noche: { bg: "rgba(13,7,3,0.97)", border: "rgba(232,168,76,0.6)", shadow: "0 4px 30px rgba(0,0,0,0.8), 0 0 25px rgba(232,168,76,0.25)", color: "#e8a84c" },
        };
        const s = gs[period as keyof typeof gs] ?? gs.noche;
        return (
          <div style={{
            position: "fixed", bottom: "calc(80px + 56px + 12px)", right: "16px", zIndex: 951,
            background: s.bg, border: `2px solid ${s.border}`,
            boxShadow: s.shadow, backdropFilter: "blur(8px)",
            borderRadius: "12px", padding: "10px 18px", whiteSpace: "nowrap",
            animation: balloonExiting ? "genieBalloonOut 0.3s ease forwards" : "genieBalloonIn 0.4s ease both",
          }}>
            <button onClick={(e) => { e.stopPropagation(); setShowBalloon(false); try { localStorage.setItem("deseocomer_genio_ultimo_recordatorio", String(Date.now())); } catch {} }} style={{ position: "absolute", top: "-8px", right: "-8px", width: "20px", height: "20px", borderRadius: "50%", background: "rgba(232,168,76,0.9)", border: "none", color: "#1a0e05", fontSize: "0.68rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, zIndex: 2 }}>✕</button>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.03em", color: s.color, margin: 0 }}>
              ✨ Pregúntame qué comer
            </p>
            <div style={{ position: "absolute", bottom: "-8px", right: "20px", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `8px solid ${s.border}` }} />
          </div>
        );
      })()}

      <button
        onClick={handleClick}
        aria-label="Abrir El Genio"
        style={{
          position: "fixed", bottom: "80px", right: "16px", zIndex: 950,
          width: "56px", height: "56px", borderRadius: "50%",
          background: "linear-gradient(135deg, #c4853a, #e8a84c, #f5d080)",
          border: "2px solid rgba(245,208,128,0.6)",
          boxShadow: toastActivo ? "0 0 28px rgba(232,168,76,0.6), 0 0 12px rgba(232,168,76,0.3)" : "0 0 20px rgba(232,168,76,0.4)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem", transition: "transform 0.2s ease, box-shadow 0.2s ease",
          animation: rubbing ? "genieRub 0.3s ease" : toastActivo ? "geniePulseFast 1s ease-in-out infinite" : "geniePulse 2s ease-in-out infinite",
        }}
      >
        {isOpen ? "✕" : "🧞"}
      </button>

      <style>{`
        @keyframes geniePulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes geniePulseFast { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(232,168,76,0.4); } 50% { transform: scale(1.08); box-shadow: 0 0 32px rgba(232,168,76,0.7); } }
        @keyframes genieRub { 0% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } 75% { transform: rotate(-5deg); } 100% { transform: rotate(0deg); } }
        @keyframes genieBalloonIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes genieBalloonOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-10px); } }
        @media (min-width: 768px) { button[aria-label="Abrir El Genio"] { bottom: 32px !important; right: 32px !important; } }
      `}</style>
    </>
  );
}
