"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,208,128,0.45)" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,208,128,0.45)" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>);
}

export default function LoginLocalPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!email.trim()) return setError("Ingresa tu email.");
    if (!password) return setError("Ingresa tu contraseña.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), password, tipo: "local" }) });
      const data = await res.json();
      if (!res.ok) { setLoading(false); return setError(data.error || "Email o contraseña incorrectos"); }
      const sessionObj = { id: data.data.id, nombre: data.data.nombre, email: data.data.email, tipo: "local", loggedIn: true };
      localStorage.setItem("deseocomer_local_session", JSON.stringify(sessionObj));
      sessionStorage.setItem("deseocomer_local_session", JSON.stringify(sessionObj));
    } catch { setLoading(false); return setError("Error de conexión."); }
    setLoading(false);
    window.location.href = "/panel";
  };

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textDecoration: "none", marginBottom: "24px", alignSelf: "center", maxWidth: "400px", width: "100%" }}>← Volver al inicio</Link>
      <div style={cardS}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🧞</div>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)", letterSpacing: "0.2em" }}>DeseoComer</p>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.2em", color: "var(--oasis-bright)", textTransform: "uppercase", marginTop: "4px" }}>Para locales y restaurantes</p>
        </div>

        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem, 5vw, 1.8rem)", color: "var(--accent)", marginBottom: "8px" }}>Accede a tu panel</h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "28px" }}>Gestiona tu local en DeseoComer</p>

        {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff6b6b" }}>⚠️ {error}</p></div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div><label style={labelS}>Email</label><input style={inputS} type="email" placeholder="hola@tulocal.cl" value={email} onChange={e => setEmail(e.target.value)} onFocus={fi} onBlur={fo} /></div>
          <div><label style={labelS}>Contraseña</label><div style={{ position: "relative" }}><input style={{ ...inputS, paddingRight: "48px" }} type={showPw ? "text" : "password"} placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} onFocus={fi} onBlur={fo} /><button type="button" onClick={() => setShowPw(s => !s)} style={eyeS}><EyeIcon open={showPw} /></button></div></div>
          <button type="submit" disabled={loading} style={btnS}>{loading ? "Entrando..." : "Entrar al panel →"}</button>
        </form>

        <button onClick={() => alert("Contáctanos a hola@deseocomer.com para recuperar tu contraseña.")} style={{ display: "block", width: "100%", textAlign: "center", marginTop: "14px", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>¿Olvidaste tu contraseña?</button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}><div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} /><span style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.2)" }}>¿Aún no tienes cuenta?</span><div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} /></div>
        <Link href="/registro-local" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "transparent", border: "1px solid rgba(232,168,76,0.12)", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)", textDecoration: "none" }}>Registra tu local gratis →</Link>
      </div>

      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.3)", marginTop: "16px", textAlign: "center" }}>¿Eres usuario? <Link href="/login" style={{ color: "rgba(240,234,214,0.5)", textDecoration: "none", marginLeft: "4px" }}>Inicia sesión aquí</Link></p>
    </main>
  );
}

const cardS: React.CSSProperties = { width: "100%", maxWidth: "400px", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.15)", borderRadius: "20px", padding: "clamp(28px, 5vw, 40px) clamp(20px, 5vw, 32px)" };
const labelS: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "6px", display: "block" };
const inputS: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
const btnS: React.CSSProperties = { width: "100%", padding: "14px", background: "var(--accent)", border: "none", borderRadius: "12px", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--bg-primary)", fontWeight: 700, cursor: "pointer", marginTop: "8px" };
const eyeS: React.CSSProperties = { position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" };
const fi = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "var(--accent)"; };
const fo = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(232,168,76,0.15)"; };
