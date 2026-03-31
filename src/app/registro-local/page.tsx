"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,208,128,0.45)" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
  ) : (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,208,128,0.45)" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>);
}

const CIUDADES: Record<string, string> = { santiago: "Santiago", valparaiso: "Valparaíso", concepcion: "Concepción", antofagasta: "Antofagasta", la_serena: "La Serena", temuco: "Temuco", rancagua: "Rancagua", talca: "Talca", iquique: "Iquique", puerto_montt: "Puerto Montt", otra: "Otra ciudad" };

export default function RegistroLocalPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombreLocal: "", nombreDueno: "", email: "", password: "", celular: "", ciudad: "santiago" });
  const [otraCiudad, setOtraCiudad] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [waitlistSaved, setWaitlistSaved] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const ciudadLabel = form.ciudad === "otra" ? (otraCiudad || "tu ciudad") : (CIUDADES[form.ciudad] ?? form.ciudad);
  const noEsSantiago = form.ciudad !== "santiago";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!form.nombreLocal.trim()) return setError("Nombre del local obligatorio.");
    if (!form.nombreDueno.trim()) return setError("Nombre del dueño obligatorio.");
    if (!form.email.trim() || !form.email.includes("@")) return setError("Email inválido.");
    if (form.password.length < 8) return setError("Mínimo 8 caracteres.");
    if (!form.celular.trim()) return setError("Celular obligatorio.");
    setLoading(true);
    try {
      const res = await fetch("/api/locales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: form.nombreLocal.trim(), nombreDueno: form.nombreDueno.trim(), email: form.email.trim().toLowerCase(), password: form.password, telefono: form.celular.trim(), ciudad: form.ciudad }) });
      const data = await res.json();
      if (!res.ok) { setLoading(false); return setError(data.error || "Error al registrarse"); }
    } catch { setLoading(false); return setError("Error de conexión"); }
    setLoading(false);
    setRegistroExitoso(true);
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

        {registroExitoso ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>✨</div>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", marginBottom: "12px" }}>¡Registro recibido!</h2>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "8px" }}>
              Hemos recibido los datos de <strong style={{ color: "var(--accent)" }}>{form.nombreLocal}</strong>.
            </p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "rgba(240,234,214,0.45)", lineHeight: 1.7, marginBottom: "24px" }}>
              Nuestro equipo revisará tu solicitud y te contactaremos a <strong style={{ color: "rgba(240,234,214,0.6)" }}>{form.email}</strong> dentro de las próximas 24 horas para activar tu cuenta.
            </p>
            <div style={{ background: "rgba(61,184,158,0.08)", border: "1px solid rgba(61,184,158,0.2)", borderRadius: "12px", padding: "14px 16px", marginBottom: "24px" }}>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--oasis-bright)", lineHeight: 1.6 }}>💡 Mientras tanto, puedes explorar la plataforma como usuario para conocer cómo se ven los concursos y promociones.</p>
            </div>
            <Link href="/" style={{ display: "inline-block", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--oasis-bright)", textDecoration: "none", borderBottom: "1px solid rgba(61,184,158,0.3)", paddingBottom: "2px" }}>Explorar DeseoComer →</Link>
          </div>
        ) : (
        <>
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem, 5vw, 1.8rem)", color: "var(--accent)", marginBottom: "8px" }}>Registra tu local</h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "28px" }}>¿Ya tienes cuenta? <Link href="/login-local" style={{ color: "var(--oasis-bright)", fontWeight: 700, textDecoration: "none" }}>Inicia sesión →</Link></p>

        {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff6b6b" }}>⚠️ {error}</p></div>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div><label style={labelS}>Nombre del local</label><input style={inputS} type="text" placeholder="Ej: Pizza Napoli" value={form.nombreLocal} onChange={e => set("nombreLocal", e.target.value)} onFocus={fi} onBlur={fo} /></div>
          <div><label style={labelS}>Nombre del dueño</label><input style={inputS} type="text" placeholder="Tu nombre completo" value={form.nombreDueno} onChange={e => set("nombreDueno", e.target.value)} onFocus={fi} onBlur={fo} /></div>
          <div><label style={labelS}>Email de contacto</label><input style={inputS} type="email" placeholder="hola@tulocal.cl" value={form.email} onChange={e => set("email", e.target.value)} onFocus={fi} onBlur={fo} /></div>
          <div><label style={labelS}>Contraseña</label><div style={{ position: "relative" }}><input style={{ ...inputS, paddingRight: "48px" }} type={showPw ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => set("password", e.target.value)} onFocus={fi} onBlur={fo} /><button type="button" onClick={() => setShowPw(s => !s)} style={eyeS}><EyeIcon open={showPw} /></button></div></div>
          <div><label style={labelS}>Teléfono</label><input style={inputS} type="tel" placeholder="+56 9 1234 5678" value={form.celular} onChange={e => set("celular", e.target.value)} onFocus={fi} onBlur={fo} /></div>
          <div><label style={labelS}>Ciudad</label><select style={{ ...inputS, background: "var(--bg-primary)", cursor: "pointer" }} value={form.ciudad} onChange={e => { set("ciudad", e.target.value); setWaitlistSaved(false); }}>
            {Object.entries(CIUDADES).map(([k, v]) => <option key={k} value={k} style={{ background: "#0a0812", color: "#f0ead6" }}>{v}</option>)}
          </select></div>
          {form.ciudad === "otra" && <div><label style={labelS}>¿Cuál ciudad?</label><input style={inputS} value={otraCiudad} onChange={e => setOtraCiudad(e.target.value)} placeholder="Tu ciudad..." onFocus={fi} onBlur={fo} /></div>}

          {noEsSantiago ? (
            <div style={{ background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "12px", padding: "18px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.88rem", color: "var(--accent)", marginBottom: "8px" }}>Aún no estamos en {ciudadLabel}</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "12px" }}>Déjanos tu email y te avisamos cuando lleguemos.</p>
              {waitlistSaved ? (
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "var(--oasis-bright)" }}>✓ ¡Te avisaremos!</p>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input style={{ ...inputS, flex: 1 }} type="email" placeholder="tu@email.com" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} onFocus={fi} onBlur={fo} />
                  <button type="button" onClick={async () => { if (!waitlistEmail.includes("@")) return; try { await fetch("/api/lista-espera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: waitlistEmail.trim(), ciudad: ciudadLabel }) }); } catch {} setWaitlistSaved(true); }} style={{ ...btnS, width: "auto", padding: "10px 16px", fontSize: "0.72rem", marginTop: 0 }}>Avisarme →</button>
                </div>
              )}
            </div>
          ) : (
            <button type="submit" disabled={loading} style={btnS}>{loading ? "Creando..." : "Registrar mi local →"}</button>
          )}
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}><div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} /><span style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.2)" }}>¿Solo quieres comer?</span><div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} /></div>
        <Link href="/registro" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "transparent", border: "1px solid rgba(232,168,76,0.12)", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)", textDecoration: "none" }}>Crear cuenta de usuario →</Link>
        </>
        )}
      </div>
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
