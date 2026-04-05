"use client";
import { useState, useEffect, useRef } from "react";
import { useGenie } from "@/contexts/GenieContext";
import { useAuth } from "@/contexts/AuthContext";

export default function GenieToast() {
  const { toastActivo, setToastActivo, addRespuestaGenio, setIsOpen, getRecomendacion, setQuickRec, perfil } = useGenie();
  const { user, isAuthenticated } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DISMISSED_KEY = "genio_toasts_dismissed";

  const isDismissedForever = (id: string): boolean => {
    try { const d = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "{}"); return !!d[id]; } catch { return false; }
  };

  const dismissForever = (id: string) => {
    // Save to localStorage (instant)
    try { const d = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "{}"); d[id] = true; localStorage.setItem(DISMISSED_KEY, JSON.stringify(d)); } catch {}
    // Save to BD if logged in (persistent)
    if (isAuthenticated && user?.id) {
      fetch("/api/genio/toast-dismiss", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: user.id, toastId: id }),
      }).catch(() => {});
    }
    setToastActivo(null);
  };

  // Sync dismissed toasts from BD on login
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    fetch(`/api/genio/toast-dismissed?usuarioId=${user.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(ids => {
        if (!Array.isArray(ids)) return;
        try {
          const d = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "{}");
          let changed = false;
          for (const id of ids) { if (!d[id]) { d[id] = true; changed = true; } }
          if (changed) localStorage.setItem(DISMISSED_KEY, JSON.stringify(d));
        } catch {}
      })
      .catch(() => {});
  }, [isAuthenticated, user?.id]);

  const dismissToast = () => setToastActivo(null);

  const [mostrandoFecha, setMostrandoFecha] = useState(false);
  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");
  const [guardado, setGuardado] = useState(false);

  // ── Mensajes importantes del admin ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mensajeImportante, setMensajeImportante] = useState<any>(null);

  useEffect(() => {
    const uid = user?.id || "";
    fetch(`/api/genio/mensajes${uid ? `?usuarioId=${uid}` : ""}`)
      .then(r => r.ok ? r.json() : [])
      .then(msgs => {
        if (Array.isArray(msgs) && msgs.length > 0) {
          const importante = msgs.find((m: { tipo: string }) => m.tipo === "importante") ?? msgs[0];
          setMensajeImportante(importante);
          // Track view
          if (uid && importante) {
            fetch("/api/genio/mensajes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensajeId: importante.id, usuarioId: uid, accion: "visto" }) }).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Auto-dismiss mensaje importante con duración
  useEffect(() => {
    if (!mensajeImportante || mensajeImportante.fijo || !mensajeImportante.duracion) return;
    const t = setTimeout(() => dismissMensajeImportante(false), mensajeImportante.duracion * 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensajeImportante?.id]);

  const dismissMensajeImportante = (noMostrar = false) => {
    if (mensajeImportante && isAuthenticated && user?.id) {
      fetch("/api/genio/mensajes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensajeId: mensajeImportante.id, usuarioId: user.id, accion: noMostrar ? "no_mostrar" : "dismissed" }) }).catch(() => {});
    }
    setMensajeImportante(null);
  };

  // Reset state when toast changes
  useEffect(() => {
    setMostrandoFecha(false);
    setDia("");
    setMes("");
    setAnio("");
    setGuardado(false);
  }, [toastActivo?.id]);

  // Auto-dismiss after 8 seconds for automatic toasts (only when no important message)
  useEffect(() => {
    if (mensajeImportante) return; // Don't auto-dismiss while important message is showing
    if (!toastActivo || mostrandoFecha || guardado) return;
    const t = setTimeout(() => setToastActivo(null), 8000);
    return () => clearTimeout(t);
  }, [toastActivo?.id, mostrandoFecha, guardado, mensajeImportante]);

  // Skip if user dismissed this toast forever
  useEffect(() => {
    if (toastActivo && isDismissedForever(toastActivo.id)) setToastActivo(null);
  }, [toastActivo?.id]);

  // Auto-close after save confirmation
  useEffect(() => {
    if (!guardado) return;
    const t = setTimeout(() => {
      dismissToast();
      window.dispatchEvent(new Event("cumpleanos_guardado"));
    }, 2500);
    return () => clearTimeout(t);
  }, [guardado, setToastActivo]);

  // ── Render mensaje importante (priority over regular toasts) ──
  if (mensajeImportante) {
    const autoClose = mensajeImportante.duracion && !mensajeImportante.fijo;
    return (
      <>
        <div style={{
          position: "fixed", bottom: "calc(24px + 56px + 12px)", right: "16px", zIndex: 960,
          width: "min(340px, 90vw)",
          background: "rgba(13,7,3,0.98)", border: "1px solid rgba(255,80,80,0.4)", borderRadius: "16px",
          boxShadow: "0 0 40px rgba(255,80,80,0.15), 0 0 20px rgba(0,0,0,0.5)",
          overflow: "hidden", animation: "genieSlideUp 0.3s ease both",
        }}>
          <div style={{ background: "rgba(255,80,80,0.1)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#ff8080", fontWeight: 700 }}>Mensaje importante</span>
            <button onClick={() => dismissMensajeImportante(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "1rem", cursor: "pointer", padding: "2px" }}>✕</button>
          </div>
          <div style={{ padding: "16px" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.85)", lineHeight: 1.6, marginBottom: "12px" }}>{mensajeImportante.contenido}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => dismissMensajeImportante(false)} style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.3)", color: "#e8a84c", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", cursor: "pointer" }}>Entendido</button>
              <button onClick={() => dismissMensajeImportante(true)} style={{ padding: "10px 14px", borderRadius: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,234,214,0.3)", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", cursor: "pointer" }}>No mostrar más</button>
            </div>
          </div>
          {autoClose && <div style={{ height: "2px", background: "rgba(255,80,80,0.3)" }}><div style={{ height: "100%", background: "#ff8080", animation: `shrinkBar ${mensajeImportante.duracion}s linear forwards` }} /></div>}
        </div>
        <style>{`
          @keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }
          @keyframes genieSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </>
    );
  }

  if (!toastActivo) return null;

  const handleOption = (opt: string) => {
    addRespuestaGenio(toastActivo.mensaje, opt);

    // Open Genio panel
    if (opt === "¿Cómo funciona?") {
      try { localStorage.setItem("genio_concursos_ya_sabe", "1"); } catch {}
      dismissToast();
      window.location.href = "/concursos/como-funciona";
      return;
    }
    if (opt === "Ya lo sé") {
      try { localStorage.setItem("genio_concursos_ya_sabe", "1"); } catch {}
      dismissToast();
      return;
    }
    if (opt === "Sí, ayúdame" || opt === "Buscar restaurante") {
      dismissToast();
      setIsOpen(true);
      return;
    }
    if (opt === "Muéstrame") {
      dismissToast();
      const favCat = Object.entries(perfil?.gustos?.categorias ?? {}).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0];
      const rec = getRecomendacion(favCat || undefined);
      if (rec) {
        setQuickRec(rec);
        setIsOpen(true);
      } else {
        setIsOpen(true);
      }
      return;
    }
    // Navigate to specific pages
    if (opt === "Explorar todo") {
      dismissToast();
      window.location.href = "/locales";
      return;
    }
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
    // Persist to DB if logged in
    if (isAuthenticated && user?.id) {
      fetch("/api/usuarios/cumpleanos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId: user.id, dia: d, mes: m, anio: a }),
      }).catch(() => {});
    }
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
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(245,208,128,0.6)" }}>
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
            fontFamily: "var(--font-lato)", fontSize: "0.82rem",
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
              fontFamily: "var(--font-cinzel)", fontSize: "0.82rem",
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
                fontFamily: "var(--font-lato)", fontSize: "0.82rem",
                color: "rgba(245,208,128,0.85)",
              }}>
                {opt}
              </button>
            ))}
          </div>
          <button onClick={() => dismissForever(toastActivo.id)} style={{
            background: "none", border: "1px solid rgba(240,234,214,0.12)", cursor: "pointer",
            fontFamily: "var(--font-lato)", fontSize: "0.78rem",
            color: "rgba(240,234,214,0.4)", marginTop: "12px",
            padding: "6px 14px", display: "block", borderRadius: "16px",
          }}>No mostrar más</button>
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
