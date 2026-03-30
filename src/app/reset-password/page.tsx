"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  return <Suspense><ResetContent /></Suspense>;
}

function ResetContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) return (
    <main style={mainS}>
      <div style={cardS}>
        <p style={{ fontSize: "2rem", textAlign: "center", marginBottom: "12px" }}>😕</p>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", textAlign: "center" }}>Link inválido</p>
        <Link href="/login" style={{ display: "block", textAlign: "center", marginTop: "16px", color: "var(--oasis-bright)", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", textDecoration: "none" }}>← Ir a iniciar sesión</Link>
      </div>
    </main>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Mínimo 8 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setLoading(true);
    const res = await fetch("/api/reset-password/confirmar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error || "Error");
    setDone(true);
  };

  if (done) return (
    <main style={mainS}>
      <div style={cardS}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "2rem", marginBottom: "12px" }}>✅</p>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "8px" }}>¡Contraseña actualizada!</p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "24px" }}>Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Link href="/login" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "var(--bg-primary)", background: "var(--accent)", padding: "12px 32px", borderRadius: "10px", textDecoration: "none", fontWeight: 700 }}>Iniciar sesión</Link>
        </div>
      </div>
    </main>
  );

  return (
    <main style={mainS}>
      <div style={cardS}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <p style={{ fontSize: "2rem", marginBottom: "8px" }}>🧞</p>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "var(--accent)" }}>DeseoComer</p>
        </div>
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", color: "var(--accent)", marginBottom: "24px" }}>Nueva contraseña</h1>
        {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff6b6b" }}>⚠️ {error}</p></div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelS}>Nueva contraseña</label>
            <input style={inputS} type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div>
            <label style={labelS}>Confirmar contraseña</label>
            <input style={inputS} type="password" placeholder="Repite la contraseña" value={confirm} onChange={e => setConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} style={btnS}>{loading ? "Guardando..." : "Guardar nueva contraseña"}</button>
        </form>
      </div>
    </main>
  );
}

const mainS: React.CSSProperties = { backgroundColor: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" };
const cardS: React.CSSProperties = { width: "100%", maxWidth: "420px", background: "rgba(45,26,8,0.9)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" };
const labelS: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px", display: "block" };
const inputS: React.CSSProperties = { width: "100%", padding: "14px 16px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box" };
const btnS: React.CSSProperties = { width: "100%", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: "1rem", padding: "16px", borderRadius: "12px", border: "none", cursor: "pointer" };
