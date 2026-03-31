"use client";
import { useState, useEffect, useRef } from "react";
import { useGenie } from "@/contexts/GenieContext";

export default function GenieToast() {
  const { toastActivo, setToastActivo, addRespuestaGenio, setIsOpen } = useGenie();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = () => setToastActivo(null);

  const [mostrandoFecha, setMostrandoFecha] = useState(false);
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const [guardado, setGuardado] = useState(false);

  // Reset state when toast changes
  useEffect(() => {
    setMostrandoFecha(false);
    setDia("");
    setMes("");
    setAnio("");
    setGuardado(false);
  }, [toastActivo?.id]);

  // No auto-dismiss — toast stays until user closes it

  // Auto-close after save confirmation
  useEffect(() => {
    if (!guardado) return;
    const t = setTimeout(() => {
      dismissToast();
      window.dispatchEvent(new Event("cumpleanos_guardado"));
    }, 2500);
    return () => clearTimeout(t);
  }, [guardado, setToastActivo]);

  if (!toastActivo) return null;

  const handleOption = (opt: string) => {
    addRespuestaGenio(toastActivo.mensaje, opt);

    // Open Genio panel
    if (opt === "¿Cómo funciona?") {
      dismissToast();
      window.location.href = "/concursos/como-funciona";
      return;
    }
    if (opt === "Sí, ayúdame" || opt === "Buscar restaurante" || opt === "Muéstrame") {
      dismissToast();
      setIsOpen(true);
      return;
    }
    // Navigate to specific pages
    if (opt === "Ver promociones" || opt === "Ver ahora" || opt === "Ver mis ofertas" || opt === "Ver todas") {
      dismissToast();
      window.location.href = "/promociones";
      return;
    }
    if (opt === "Ver ofertas" || opt === "Ver ofertas de cumpleaños") {
      dismissToast();
      window.location.href = "/promociones";
      return;
    }
    // Registration
    if (opt === "Registrarme") {
      dismissToast();
      try { localStorage.setItem("genio_trigger5_mostrado", "true"); } catch {}
      window.location.href = "/registro";
      return;
    }
    if (opt === "Seguir explorando") {
      try { localStorage.setItem("genio_trigger5_mostrado", "true"); } catch {}
      dismissToast();
      return;
    }
    // Birthday form
    if (opt === "Cuéntale al Genio 🧞") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setMostrandoFecha(true);
      return;
    }
    if (opt === "Después" && toastActivo.id === "cumpleanos") {
      try {
        const count = Number(localStorage.getItem("genio_cumple_postponed_count") ?? "0") + 1;
        localStorage.setItem("genio_cumple_postponed_count", String(count));
        if (count >= 2) localStorage.setItem("genio_cumple_solicitado", "true");
      } catch {}
      dismissToast();
      return;
    }
    // Default: just close
    dismissToast();
  };

  const handleGuardarCumple = () => {
    const d = Number(dia), m = Number(mes), a = Number(anio);
    if (d < 1 || d > 31 || m < 1 || m > 12 || a < 1900 || a > 2099) return;
    try {
      localStorage.setItem("deseocomer_user_birthday", JSON.stringify({ dia: d, mes: m, anio: a, guardadoEn: Date.now() }));
      // Also save in profile
      const profile = JSON.parse(localStorage.getItem("deseocomer_usuario_perfil") ?? "{}");
      profile.cumpleanos = { dia: d, mes: m, ano: a };
      localStorage.setItem("deseocomer_usuario_perfil", JSON.stringify(profile));
      localStorage.setItem("genio_cumple_solicitado", "true");
    } catch {}
    addRespuestaGenio("cumpleaños", `${d}/${m}/${a}`);
    setGuardado(true);
  };

  const isValidDate = (() => {
    const d = Number(dia), m = Number(mes), a = Number(anio);
    return d >= 1 && d <= 31 && m >= 1 && m <= 12 && a >= 1900 && a <= 2099;
  })();

  const inputStyle = {
    background: "rgba(232,168,76,0.08)",
    border: "1px solid rgba(232,168,76,0.25)",
    borderRadius: "8px",
    color: "var(--accent, #e8a84c)",
    fontFamily: "var(--font-cinzel)",
    fontSize: "0.9rem",
    textAlign: "center" as const,
    padding: "8px",
    outline: "none",
    boxSizing: "border-box" as const,
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
      <button onClick={dismissToast} style={{
        position: "absolute", top: "8px", right: "10px",
        background: "none", border: "none", color: "rgba(245,208,128,0.4)",
        fontSize: "0.9rem", cursor: "pointer",
      }}>✕</button>

      {/* Birthday saved confirmation */}
      {guardado ? (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>🎂</div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent, #e8a84c)", marginBottom: "4px" }}>
            ¡Guardado!
          </p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(245,208,128,0.6)" }}>
            Te avisaré cuando haya ofertas de cumpleaños
          </p>
        </div>
      ) : mostrandoFecha ? (
        /* Inline birthday form */
        <div>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.85rem",
            color: "rgba(245,208,128,0.9)", marginBottom: "6px",
          }}>
            ¿Cuándo es tu cumpleaños?
          </p>
          <p style={{
            fontFamily: "var(--font-lato)", fontSize: "0.75rem",
            color: "rgba(245,208,128,0.5)", marginBottom: "14px", lineHeight: 1.4,
          }}>
            Así te aviso cuando hay ofertas especiales para celebrar 🎂
          </p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input
              type="text" inputMode="numeric" placeholder="DD" maxLength={2}
              value={dia} onChange={e => setDia(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, width: "52px" }}
            />
            <input
              type="text" inputMode="numeric" placeholder="MM" maxLength={2}
              value={mes} onChange={e => setMes(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, width: "52px" }}
            />
            <input
              type="text" inputMode="numeric" placeholder="AAAA" maxLength={4}
              value={anio} onChange={e => setAnio(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, width: "72px" }}
            />
          </div>
          <button
            onClick={handleGuardarCumple}
            disabled={!isValidDate}
            style={{
              width: "100%", padding: "10px",
              background: isValidDate ? "var(--accent, #e8a84c)" : "rgba(232,168,76,0.2)",
              border: "none", borderRadius: "10px",
              fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: isValidDate ? "#1a0e05" : "rgba(245,208,128,0.4)",
              fontWeight: 700, cursor: isValidDate ? "pointer" : "default",
            }}
          >
            Guardar 🧞
          </button>
        </div>
      ) : (
        /* Normal toast content */
        <>
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
        </>
      )}

      <style>{`
        @keyframes genieToastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
