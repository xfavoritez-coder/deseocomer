"use client";
import { useState } from "react";

interface Props {
  userId: string;
  telefonoActual?: string | null;
  onVerificado: () => void;
  onCerrar: () => void;
}

export default function VerificarTelefono({ userId, telefonoActual, onVerificado, onCerrar }: Props) {
  const [paso, setPaso] = useState<"telefono" | "codigo">(telefonoActual ? "codigo" : "telefono");
  const [telefono, setTelefono] = useState(telefonoActual?.replace("+56", "") ?? "");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [telefonoEnviado, setTelefonoEnviado] = useState(telefonoActual ?? "");

  const enviarCodigo = async () => {
    setError("");
    if (telefono.replace(/\s/g, "").length < 8) { setError("Ingresa un número válido"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/verificar-telefono/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, telefono }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al enviar"); setLoading(false); return; }
      setTelefonoEnviado(data.telefono);
      setPaso("codigo");
    } catch { setError("Error de conexión"); }
    setLoading(false);
  };

  const verificarCodigo = async () => {
    setError("");
    if (codigo.length < 4) { setError("Ingresa el código completo"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/verificar-telefono/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, codigo }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al verificar"); setLoading(false); return; }
      onVerificado();
    } catch { setError("Error de conexión"); }
    setLoading(false);
  };

  return (
    <>
      <div onClick={onCerrar} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 499, backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 500, width: "90%", maxWidth: 400, background: "rgba(20,12,35,0.98)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 20, padding: "32px 24px", textAlign: "center", boxShadow: "0 0 60px rgba(0,0,0,0.8)" }}>
        <button onClick={onCerrar} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", color: "rgba(240,234,214,0.3)", fontSize: 20, cursor: "pointer" }}>×</button>

        <p style={{ fontSize: 32, marginBottom: 10 }}>📱</p>
        <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: 16, fontWeight: 700, color: "#f5d080", textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.04em" }}>
          {paso === "telefono" ? "Verifica tu celular" : "Ingresa el código"}
        </h3>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.6)", lineHeight: 1.6, marginBottom: 20 }}>
          {paso === "telefono"
            ? "Para participar necesitamos verificar tu número de teléfono, así el local te podrá contactar y verificamos que eres una persona real."
            : `Enviamos un código de 6 dígitos al ${telefonoEnviado}`}
        </p>

        {paso === "telefono" ? (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span style={{ padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, fontFamily: "var(--font-lato)", fontSize: 15, color: "rgba(240,234,214,0.5)", flexShrink: 0 }}>+56</span>
              <input
                type="tel"
                placeholder="9 1234 5678"
                value={telefono}
                onChange={e => setTelefono(e.target.value.replace(/[^0-9\s]/g, ""))}
                maxLength={12}
                style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, fontFamily: "var(--font-lato)", fontSize: 15, color: "#f0ead6", outline: "none", letterSpacing: "0.5px" }}
                autoFocus
              />
            </div>
            <button onClick={enviarCodigo} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "rgba(232,168,76,0.3)" : "#e8a84c", border: "none", borderRadius: 12, fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, color: "#0a0812", cursor: loading ? "default" : "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {loading ? "Enviando..." : "Enviar código SMS"}
            </button>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(240,234,214,0.4)", marginTop: 14, lineHeight: 1.5 }}>Solo usamos tu número para verificación y entrega de premios. Jamás enviaremos publicidad por SMS.</p>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="000000"
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              maxLength={6}
              style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, fontFamily: "var(--font-lato)", fontSize: 24, color: "#f0ead6", outline: "none", textAlign: "center", letterSpacing: "8px", marginBottom: 16, boxSizing: "border-box" }}
              autoFocus
            />
            <button onClick={verificarCodigo} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "rgba(232,168,76,0.3)" : "#e8a84c", border: "none", borderRadius: 12, fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, color: "#0a0812", cursor: loading ? "default" : "pointer", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              {loading ? "Verificando..." : "Verificar"}
            </button>
            <button onClick={() => { setPaso("telefono"); setCodigo(""); setError(""); }} style={{ background: "none", border: "none", fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.4)", cursor: "pointer", textDecoration: "underline" }}>
              Cambiar número
            </button>
          </>
        )}

        {error && <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "#ff6b6b", marginTop: 12 }}>{error}</p>}
      </div>
    </>
  );
}
