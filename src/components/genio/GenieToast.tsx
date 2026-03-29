"use client";
import { useEffect, useRef } from "react";
import { useGenie } from "@/contexts/GenieContext";

export default function GenieToast() {
  const { toastActivo, setToastActivo, addRespuestaGenio, setIsOpen } = useGenie();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!toastActivo) return;
    timerRef.current = setTimeout(() => setToastActivo(null), 8000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toastActivo, setToastActivo]);

  if (!toastActivo) return null;

  const handleOption = (opt: string) => {
    addRespuestaGenio(toastActivo.mensaje, opt);
    // If user wants help, open the panel
    if (opt === "Sí, ayúdame" || opt === "Buscar restaurante") {
      setToastActivo(null);
      setIsOpen(true);
    } else {
      setToastActivo(null);
    }
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "calc(80px + 56px + 12px)",
      right: "16px",
      width: "min(280px, 85vw)",
      background: "rgba(13,7,3,0.98)",
      border: "1px solid rgba(232,168,76,0.35)",
      borderRadius: "16px",
      boxShadow: "0 0 30px rgba(0,0,0,0.6), 0 0 15px rgba(232,168,76,0.08)",
      zIndex: 949,
      padding: "16px",
      animation: "genieToastIn 0.3s ease both",
    }}>
      {/* Close */}
      <button onClick={() => setToastActivo(null)} style={{
        position: "absolute", top: "8px", right: "10px",
        background: "none", border: "none", color: "rgba(245,208,128,0.4)",
        fontSize: "0.9rem", cursor: "pointer",
      }}>✕</button>

      <p style={{
        fontFamily: "var(--font-lato)", fontSize: "0.85rem",
        color: "rgba(245,208,128,0.9)", lineHeight: 1.5,
        marginBottom: "12px", paddingRight: "20px",
      }}>
        {toastActivo.mensaje}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {toastActivo.opciones.map(opt => (
          <button key={opt} onClick={() => handleOption(opt)} style={{
            background: "rgba(232,168,76,0.12)",
            border: "1px solid rgba(232,168,76,0.25)",
            borderRadius: "16px", padding: "6px 12px", cursor: "pointer",
            fontFamily: "var(--font-lato)", fontSize: "0.75rem",
            color: "rgba(245,208,128,0.85)",
          }}>
            {opt}
          </button>
        ))}
      </div>

      {/* Lamp indicator */}
      <div style={{
        position: "absolute", bottom: "-6px", right: "28px",
        fontSize: "0.7rem",
      }}>🪔</div>

      <style>{`
        @keyframes genieToastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
