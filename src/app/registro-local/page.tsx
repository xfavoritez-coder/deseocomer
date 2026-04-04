"use client";
import { useState } from "react";
import Link from "next/link";

function generarPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

export default function RegistroLocalPage() {
  const [nombreLocal, setNombreLocal] = useState("");
  const [ciudad, setCiudad] = useState("Santiago");
  const [nombreDueno, setNombreDueno] = useState("");
  const [email, setEmail] = useState("");
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nombreLocal.trim()) return setError("El nombre del local es obligatorio.");
    if (!nombreDueno.trim()) return setError("Tu nombre es obligatorio.");
    if (!email.trim() || !email.includes("@")) return setError("Ingresa un email válido.");
    setLoading(true);
    const password = generarPassword();
    try {
      const res = await fetch("/api/locales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreLocal.trim(),
          nombreDueno: nombreDueno.trim(),
          email: email.trim().toLowerCase(),
          password,
          passwordPlain: password,
          registroRapido: true,
          ciudad: ciudad || "Santiago",
        }),
      });
      const data = await res.json();
      if (!res.ok) { setLoading(false); return setError(data.error || "Error al registrarse"); }
    } catch { setLoading(false); return setError("Error de conexión. Intenta de nuevo."); }
    setLoading(false);
    setRegistroExitoso(true);
  };

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "20px 24px" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textDecoration: "none", marginBottom: "24px", alignSelf: "center", maxWidth: "400px", width: "100%" }}>← Volver al inicio</Link>
      <div style={cardS}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🧞</div>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)", letterSpacing: "0.2em" }}>DeseoComer</p>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.2em", color: "var(--oasis-bright)", textTransform: "uppercase", marginTop: "4px" }}>Para locales y restaurantes</p>
        </div>

        {registroExitoso ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>✨</div>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", marginBottom: "12px" }}>¡Ya estás dentro!</h2>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "8px" }}>
              Hemos registrado <strong style={{ color: "var(--accent)" }}>{nombreLocal}</strong>.
            </p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "rgba(240,234,214,0.45)", lineHeight: 1.7, marginBottom: "24px" }}>
              Te enviamos un correo a <strong style={{ color: "rgba(240,234,214,0.6)" }}>{email}</strong> con tus datos de acceso. Revisa tu bandeja de entrada para entrar al panel.
            </p>
            <div style={{ background: "rgba(61,184,158,0.08)", border: "1px solid rgba(61,184,158,0.2)", borderRadius: "12px", padding: "14px 16px", marginBottom: "24px" }}>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--oasis-bright)", lineHeight: 1.6 }}>💡 Entra al panel para completar tu perfil: agrega logo, portada, horarios y dirección para aparecer en la plataforma.</p>
            </div>
            <Link href="/login-local" style={{ display: "inline-block", width: "100%", padding: "14px", background: "var(--accent)", borderRadius: "12px", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--bg-primary)", fontWeight: 700, textDecoration: "none", textAlign: "center", boxSizing: "border-box" }}>Ir al panel →</Link>
          </div>
        ) : (
        <>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem, 5vw, 1.8rem)", color: "var(--accent)", marginBottom: "8px" }}>Registra tu local</h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.3)", marginBottom: "28px" }}>¿Ya tienes cuenta? <Link href="/login-local" style={{ color: "var(--oasis-bright)", fontWeight: 700, textDecoration: "none" }}>Inicia sesión →</Link></p>

          {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff6b6b" }}>⚠️ {error}</p></div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelS}>Nombre del local</label>
              <input style={inputS} type="text" placeholder="Ej: Pizza Napoli" value={nombreLocal} onChange={e => setNombreLocal(e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <label style={labelS}>Ciudad</label>
              <select style={{ ...inputS, background: "var(--bg-primary)", cursor: "pointer" }} value={ciudad} onChange={e => setCiudad(e.target.value)}>
                {["Santiago","Valparaíso","Viña del Mar","Concepción","Antofagasta","La Serena","Coquimbo","Temuco","Rancagua","Talca","Arica","Iquique","Puerto Montt","Osorno","Valdivia","Chillán","Los Ángeles","Calama","Copiapó","Punta Arenas","Puerto Natales","Curicó","Linares","San Fernando","Ovalle","Quillota","San Antonio","Melipilla"].map(c => <option key={c} value={c} style={{ background: "#0a0812", color: "#f0ead6" }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS}>Tu nombre</label>
              <input style={inputS} type="text" placeholder="Nombre y apellido" value={nombreDueno} onChange={e => setNombreDueno(e.target.value)} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <label style={labelS}>Email de contacto</label>
              <input style={inputS} type="email" placeholder="hola@tulocal.cl" value={email} onChange={e => setEmail(e.target.value)} onFocus={fi} onBlur={fo} />
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.25)", marginTop: "6px" }}>Te enviaremos tus datos de acceso a este correo</p>
            </div>

            <button type="submit" disabled={loading} style={{ ...btnS, opacity: loading ? 0.6 : 1 }}>{loading ? "Registrando..." : "Registrar mi local gratis"}</button>
            <Link href="/solo-locales" style={{ display: "block", textAlign: "center", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", textDecoration: "none", marginTop: "12px" }}>¿Cómo funciona? Conoce más →</Link>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.2)" }}>¿Solo quieres comer?</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
          </div>
          <Link href="/registro" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "transparent", border: "1px solid rgba(232,168,76,0.12)", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)", textDecoration: "none" }}>Crear cuenta de usuario →</Link>
        </>
        )}
      </div>
    </main>
  );
}

const cardS: React.CSSProperties = { width: "100%", maxWidth: "400px", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.15)", borderRadius: "20px", padding: "clamp(28px, 5vw, 40px) clamp(20px, 5vw, 32px)" };
const labelS: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "6px", display: "block" };
const inputS: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
const btnS: React.CSSProperties = { width: "100%", padding: "14px", background: "var(--accent)", border: "none", borderRadius: "12px", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--bg-primary)", fontWeight: 700, cursor: "pointer", marginTop: "8px" };
const fi = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "var(--accent)"; };
const fo = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(232,168,76,0.15)"; };
