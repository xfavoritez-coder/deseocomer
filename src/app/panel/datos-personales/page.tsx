"use client";
import { useState, useEffect } from "react";

const LS: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "6px", display: "block" };
const IS: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };

type PassMode = "normal" | "enviando" | "codigo" | "nuevo";

export default function DatosPersonalesPage() {
  const [nombreDueno, setNombreDueno] = useState("");
  const [celularDueno, setCelularDueno] = useState("");
  const [emailDueno, setEmailDueno] = useState("");
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "error" } | null>(null);

  // Password states
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passConfirm, setPassConfirm] = useState("");

  // Recovery flow
  const [passMode, setPassMode] = useState<PassMode>("normal");
  const [codigo, setCodigo] = useState("");
  const [emailMasked, setEmailMasked] = useState("");
  const [recPassNueva, setRecPassNueva] = useState("");
  const [recPassConfirm, setRecPassConfirm] = useState("");

  const showToast = (msg: string, tipo: "ok" | "error" = "ok") => { setToast({ msg, tipo }); setTimeout(() => setToast(null), 4000); };

  const getSession = () => {
    try { return JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}"); } catch { return {}; }
  };

  useEffect(() => {
    const session = getSession();
    if (session.id) {
      fetch(`/api/locales/${session.id}`).then(r => r.ok ? r.json() : null).then(data => {
        if (data) {
          setNombreDueno(data.nombreDueno ?? "");
          setCelularDueno(data.celularDueno ?? "");
          setEmailDueno(data.email ?? "");
        }
      }).catch(() => {});
    }
  }, []);

  const handleSavePersonal = async () => {
    const session = getSession();
    if (!session.id) { showToast("No hay sesión activa", "error"); return; }
    try {
      const res = await fetch(`/api/locales/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreDueno, celularDueno }),
      });
      if (res.ok) showToast("✓ Datos personales guardados");
      else { const err = await res.json().catch(() => ({})); showToast(err.error ?? "Error al guardar", "error"); }
    } catch { showToast("Error de conexión", "error"); }
  };

  const handleCambiarPass = async () => {
    if (passNueva !== passConfirm || passNueva.length < 8) return;
    const session = getSession();
    try {
      const res = await fetch("/api/auth/cambiar-password-local", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ localId: session.id, passActual, passNueva }) });
      if (res.ok) { showToast("✓ Contraseña actualizada"); setPassActual(""); setPassNueva(""); setPassConfirm(""); }
      else { const err = await res.json(); showToast(err.error ?? "Error", "error"); }
    } catch { showToast("Error de conexión", "error"); }
  };

  // Recovery: send code
  const handleEnviarCodigo = async () => {
    setPassMode("enviando");
    const session = getSession();
    try {
      const res = await fetch("/api/auth/recuperar-password-local", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ localId: session.id, action: "enviar" }) });
      const data = await res.json();
      if (res.ok) { setEmailMasked(data.emailMasked ?? ""); setPassMode("codigo"); showToast("✓ Código enviado a tu email"); }
      else { showToast(data.error ?? "Error al enviar código", "error"); setPassMode("normal"); }
    } catch { showToast("Error de conexión", "error"); setPassMode("normal"); }
  };

  // Recovery: verify code and change
  const handleVerificarCodigo = async () => {
    if (recPassNueva !== recPassConfirm || recPassNueva.length < 8) return;
    const session = getSession();
    try {
      const res = await fetch("/api/auth/recuperar-password-local", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ localId: session.id, action: "verificar", codigo, passNueva: recPassNueva }) });
      if (res.ok) { showToast("✓ Contraseña actualizada"); setPassMode("normal"); setCodigo(""); setRecPassNueva(""); setRecPassConfirm(""); }
      else { const err = await res.json(); showToast(err.error ?? "Error", "error"); }
    } catch { showToast("Error de conexión", "error"); }
  };

  const cancelRecovery = () => { setPassMode("normal"); setCodigo(""); setRecPassNueva(""); setRecPassConfirm(""); };

  return (
    <div style={{ maxWidth: "680px" }}>
      {toast && (
        <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.tipo === "ok" ? "rgba(13,40,35,0.98)" : "rgba(40,10,10,0.98)", border: `1px solid ${toast.tipo === "ok" ? "rgba(61,184,158,0.5)" : "rgba(255,80,80,0.4)"}`, borderRadius: "30px", padding: "14px 28px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", whiteSpace: "nowrap", animation: "dc-slideUp 0.3s ease" }}>
          <span style={{ fontSize: "1.1rem" }}>{toast.tipo === "ok" ? "✓" : "⚠️"}</span>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.05em", color: toast.tipo === "ok" ? "#3db89e" : "#ff6b6b" }}>{toast.msg}</span>
        </div>
      )}

      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", marginBottom: "28px" }}>Datos Personales</h1>

      <SectionTitle>Información del dueño o encargado</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
        <Field label="Nombre del dueño o encargado" value={nombreDueno} onChange={setNombreDueno} placeholder="Tu nombre completo" />
        <Field label="Celular del dueño" value={celularDueno} onChange={setCelularDueno} placeholder="+56 9 1234 5678" autoComplete="tel" />
        <div>
          <label style={LS}>Email de acceso</label>
          <input type="text" style={{ ...IS, opacity: 0.6, cursor: "not-allowed" }} value={emailDueno} readOnly />
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", marginTop: "4px" }}>El email no se puede cambiar desde aquí</p>
        </div>
      </div>
      <button onClick={handleSavePersonal} style={{ padding: "12px 28px", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, border: "none", borderRadius: "10px", cursor: "pointer", marginBottom: "40px", transition: "opacity 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}>Guardar datos</button>

      <SectionTitle>Cambiar contraseña</SectionTitle>

      {passMode === "normal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
          <Field label="Contraseña actual" value={passActual} onChange={setPassActual} placeholder="Tu contraseña actual" type="password" />
          <Field label="Nueva contraseña" value={passNueva} onChange={setPassNueva} placeholder="Mínimo 8 caracteres" type="password" />
          <Field label="Confirmar nueva contraseña" value={passConfirm} onChange={setPassConfirm} placeholder="Repite la nueva contraseña" type="password" />
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <button onClick={handleCambiarPass} disabled={!passActual || !passNueva || passNueva !== passConfirm || passNueva.length < 8} style={{ padding: "10px 24px", background: passActual && passNueva && passNueva === passConfirm && passNueva.length >= 8 ? "rgba(61,184,158,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.1em", color: "#3db89e", cursor: "pointer" }}>Cambiar contraseña</button>
            <button onClick={handleEnviarCodigo} type="button" style={{ background: "none", border: "none", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--accent)", cursor: "pointer", textDecoration: "underline", padding: 0 }}>¿Olvidaste tu contraseña?</button>
          </div>
          {passNueva && passConfirm && passNueva !== passConfirm && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "#ff6b6b" }}>Las contraseñas no coinciden</p>}
        </div>
      )}

      {passMode === "enviando" && (
        <div style={{ marginBottom: "32px", padding: "24px", background: "rgba(232,168,76,0.06)", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)" }}>Enviando código a tu email...</p>
        </div>
      )}

      {(passMode === "codigo" || passMode === "nuevo") && (
        <div style={{ marginBottom: "32px", padding: "24px", background: "rgba(232,168,76,0.06)", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
            Enviamos un código de 6 dígitos a <strong style={{ color: "var(--accent)" }}>{emailMasked}</strong>
          </p>
          <Field label="Código de verificación" value={codigo} onChange={setCodigo} placeholder="123456" />
          <Field label="Nueva contraseña" value={recPassNueva} onChange={setRecPassNueva} placeholder="Mínimo 8 caracteres" type="password" />
          <Field label="Confirmar nueva contraseña" value={recPassConfirm} onChange={setRecPassConfirm} placeholder="Repite la nueva contraseña" type="password" />
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={handleVerificarCodigo} disabled={!codigo || codigo.length !== 6 || !recPassNueva || recPassNueva.length < 8 || recPassNueva !== recPassConfirm} style={{ padding: "10px 24px", background: codigo.length === 6 && recPassNueva.length >= 8 && recPassNueva === recPassConfirm ? "rgba(61,184,158,0.15)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.1em", color: "#3db89e", cursor: "pointer" }}>Cambiar contraseña</button>
            <button onClick={cancelRecovery} type="button" style={{ background: "none", border: "none", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "#ff8080", cursor: "pointer" }}>Cancelar</button>
          </div>
          {recPassNueva && recPassConfirm && recPassNueva !== recPassConfirm && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "#ff6b6b" }}>Las contraseñas no coinciden</p>}
        </div>
      )}

      <style>{`
        @keyframes dc-slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>{children}</h3>;
}

function Field({ label, value, onChange, placeholder, type = "text", autoComplete }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; autoComplete?: string }) {
  return <div><label style={LS}>{label}</label><input type={type} autoComplete={autoComplete} style={IS} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>;
}
