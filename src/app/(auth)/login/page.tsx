"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Ingresa tu email.");
    if (!password) return setError("Ingresa tu contraseña.");
    setLoading(true);
    const res = await login(email.trim(), password, remember);
    setLoading(false);
    if (res.success) router.push("/");
    else setError(res.error ?? "Error al iniciar sesión.");
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
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "32px" }}>
          ¿No tienes cuenta? <Link href="/registro" style={{ color: "var(--accent)", textDecoration: "none" }}>Regístrate gratis</Link>
        </p>

        {error && (
          <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff6b6b" }}>⚠️ {error}</p>
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
                {showPw ? "🙈" : "👁"}
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

        <button onClick={() => alert("Escríbenos a hola@deseocomer.com")} style={{ display: "block", width: "100%", textAlign: "center", marginTop: "16px", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      </div>
    </main>
  );
}

const labelS: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "8px", display: "block" };
const inputS: React.CSSProperties = { width: "100%", padding: "14px 16px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box" };
const btnS: React.CSSProperties = { width: "100%", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.1em", padding: "16px", borderRadius: "12px", border: "none", cursor: "pointer" };
