"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", background: "#1a1008",
  border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px",
  color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem",
  outline: "none", boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.2em",
  textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "8px", display: "block",
};

export default function LoginLocalPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Ingresa tu email.");
    if (!password) return setError("Ingresa tu contraseña.");

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, tipo: "local" }),
      });
      const data = await res.json();

      if (!res.ok) { setLoading(false); return setError(data.error || "Email o contraseña incorrectos"); }

      localStorage.setItem("deseocomer_local_session", JSON.stringify({ id: data.data.id, nombre: data.data.nombre, email: data.data.email, tipo: "local", loggedIn: true }));
      sessionStorage.setItem("deseocomer_local_session", JSON.stringify({ loggedIn: true, email: data.data.email }));
    } catch {
      setLoading(false);
      return setError("Error de conexión.");
    }

    setLoading(false);
    router.push("/panel");
  };

  const handleForgot = () => {
    alert("Contáctanos a hola@deseocomer.com para recuperar tu contraseña.");
  };

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 20px" }}>
      <Link href="/" style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.2rem", color: "var(--accent)", textDecoration: "none", marginBottom: "4px" }}>
        🏮 DeseoComer
      </Link>
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--oasis-bright)", marginBottom: "32px" }}>
        Para locales y restaurantes
      </p>

      <div style={{ width: "100%", maxWidth: "480px", background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "20px", padding: "40px" }}>
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", color: "var(--accent)", marginBottom: "8px" }}>Accede a tu panel</h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "28px" }}>Gestiona tu local en DeseoComer</p>

        {error && (
          <div style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "10px", padding: "10px 14px", marginBottom: "16px" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff8080" }}>⚠️ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" placeholder="hola@tulocal.cl" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...inputStyle, paddingRight: "48px" }} type={showPw ? "text" : "password"} placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px", display: "flex" }}>
                <EyeIcon open={showPw} />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "16px", background: "var(--accent)", color: "var(--bg-primary)",
            fontFamily: "var(--font-cinzel)", fontSize: "1rem", fontWeight: 700,
            border: "none", borderRadius: "12px", cursor: loading ? "wait" : "pointer",
            opacity: loading ? 0.7 : 1, marginTop: "4px",
          }}>
            {loading ? "Entrando..." : "Entrar al panel →"}
          </button>
        </form>

        <button onClick={handleForgot} style={{
          display: "block", width: "100%", textAlign: "center", marginTop: "12px",
          fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)",
          background: "none", border: "none", cursor: "pointer", padding: "8px",
        }}>
          ¿Olvidaste tu contraseña?
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0 16px" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(232,168,76,0.15)" }} />
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)" }}>¿Aún no tienes cuenta?</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(232,168,76,0.15)" }} />
        </div>

        <Link href="/registro-local" style={{ display: "block", textAlign: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "var(--oasis-bright)", textDecoration: "none" }}>
          Registra tu local gratis →
        </Link>
      </div>

      <Link href="/login" style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none", marginTop: "24px" }}>
        ¿Eres usuario? Inicia sesión aquí
      </Link>
    </main>
  );
}
