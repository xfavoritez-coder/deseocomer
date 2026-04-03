"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function BannerVerificacion() {
  const { user, isAuthenticated } = useAuth();
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

  if (!isAuthenticated || !user || user.emailVerificado) return null;

  // Also check localStorage in case session was updated after verification
  try {
    const session = JSON.parse(localStorage.getItem("deseocomer_session") ?? "{}");
    if (session.emailVerificado === true) return null;
  } catch {}

  const reenviar = async () => {
    if (enviando || enviado) return;
    setEnviando(true);
    setError(false);
    try {
      const res = await fetch("/api/emails/verificacion-reenvio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (!res.ok) throw new Error();
      setEnviado(true);
      setTimeout(() => setEnviado(false), 5000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{
      background: "rgba(224,85,85,0.1)",
      border: "1px solid rgba(224,85,85,0.35)",
      margin: "8px 16px",
      borderRadius: 12,
      padding: "10px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      flexWrap: "wrap",
      position: "relative",
      zIndex: 1,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700, color: "#e05555", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>Verifica tu cuenta</span>
      <span style={{ color: "rgba(224,85,85,0.4)", fontSize: 12 }}>—</span>
      <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(240,234,214,0.6)" }}>Necesitas verificar tu email para participar en concursos y sumar puntos.</span>
      <button
        onClick={reenviar}
        disabled={enviando || enviado}
        style={{
          background: enviado ? "transparent" : error ? "#888" : "#e05555",
          color: enviado ? "rgba(240,234,214,0.6)" : "#fff",
          fontFamily: "var(--font-cinzel)", fontSize: 10,
          fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", border: "none",
          borderRadius: 20, padding: "6px 14px",
          cursor: enviando ? "wait" : enviado ? "default" : "pointer",
          whiteSpace: "nowrap", flexShrink: 0,
          transition: "all 0.2s",
        }}
      >
        {enviando ? "Enviando..." : enviado ? "✓ Enviado" : error ? "Error, reintentar" : "Reenviar →"}
      </button>
    </div>
  );
}
