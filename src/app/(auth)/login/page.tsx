"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

function OjoIcon({ visible }: { visible: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,208,128,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {visible ? (<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>)}
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [emailNoVerificado, setEmailNoVerificado] = useState(false);
  const [reenvioSent, setReenvioSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Ingresa tu email.");
    if (!password) return setError("Ingresa tu contraseña.");
    setLoading(true);
    const res = await login(email.trim(), password, remember);
    setLoading(false);
    if (res.success) router.push("/");
    else {
      setError(res.error ?? "Error al iniciar sesión.");
      if (res.codigo === "EMAIL_NO_VERIFICADO") setEmailNoVerificado(true);
    }
  };

  return (
    <main style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "420px" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.1em", color: "var(--text-muted)", textDecoration: "none", marginBottom: "20px", opacity: 0.7, alignSelf: "flex-start" }}>← Volver al inicio</a>
      <div style={{ width: "100%", background: "rgba(45,26,8,0.9)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🧞</div>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "var(--accent)" }}>DeseoComer</p>
        </div>

        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.6rem, 5vw, 2rem)", color: "var(--color-title, var(--accent))", marginBottom: "8px" }}>Entrar</h1>
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 6px" }}>¿No tienes cuenta?</p>
          <Link href="/registro" style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Regístrate gratis →</Link>
        </div>

        {error && (
          <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff6b6b", marginBottom: emailNoVerificado ? "10px" : 0 }}>⚠️ {error}</p>
            {emailNoVerificado && !reenvioSent && (
              <button onClick={async () => { await fetch("/api/emails/verificacion-reenvio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase() }) }).catch(() => {}); setReenvioSent(true); }} style={{ background: "none", border: "1px solid rgba(61,184,158,0.4)", borderRadius: "8px", padding: "8px 14px", color: "#3db89e", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", cursor: "pointer", width: "100%" }}>
                Reenviar email de verificación
              </button>
            )}
            {reenvioSent && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "#3db89e", marginTop: "6px" }}>✓ Email reenviado. Revisa tu bandeja.</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelS}>Email</label>
            <input style={inputS} type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={labelS}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inputS, paddingRight: "48px" }} type={showPw ? "text" : "password"} placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>
                <OjoIcon visible={showPw} />
              </button>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: "var(--accent)", width: "18px", height: "18px" }} />
            <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }}>Recordarme</span>
          </label>

          <button type="submit" disabled={loading} style={btnS}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <button onClick={() => setShowReset(true)} style={{ display: "block", width: "100%", textAlign: "center", marginTop: "16px", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
          ¿Olvidaste tu contraseña?
        </button>

        {showReset && (
          <div style={{ marginTop: "20px", padding: "20px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "1px solid rgba(232,168,76,0.15)" }}>
            {resetSent ? (
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--oasis-bright)", textAlign: "center" }}>✓ Si tu email está registrado, recibirás un link en minutos.</p>
            ) : (
              <>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", color: "var(--accent)", marginBottom: "10px", letterSpacing: "0.1em" }}>Recuperar contraseña</p>
                <input style={inputS} type="email" placeholder="tu@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  <button onClick={async () => {
                    if (!resetEmail.includes("@")) return;
                    setResetLoading(true);
                    await fetch("/api/emails/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }) }).catch(() => {});
                    setResetLoading(false);
                    setResetSent(true);
                  }} disabled={resetLoading} style={{ ...btnS, flex: 1, fontSize: "0.8rem", padding: "10px" }}>{resetLoading ? "Enviando..." : "Enviar link"}</button>
                  <button onClick={() => { setShowReset(false); setResetSent(false); }} style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "10px 14px", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem" }}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        )}
        {/* Separador */}
        <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />

        {/* Link para locales */}
        <Link href="/login-local" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", textDecoration: "none" }}>
          🏪 ¿Eres un local asociado? Entra aquí →
        </Link>
      </div>
      </div>
    </main>
  );
}

const labelS: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "8px", display: "block" };
const inputS: React.CSSProperties = { width: "100%", padding: "14px 16px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box" };
const btnS: React.CSSProperties = { width: "100%", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.1em", padding: "16px", borderRadius: "12px", border: "none", cursor: "pointer" };
