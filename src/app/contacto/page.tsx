"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ContactoPage() {
  return <Suspense><ContactoInner /></Suspense>;
}

function ContactoInner() {
  const searchParams = useSearchParams();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [motivo, setMotivo] = useState("Consulta general");

  useEffect(() => {
    const m = searchParams.get("motivo");
    if (m) setMotivo(m);
  }, [searchParams]);
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async () => {
    if (!nombre || !email || !mensaje) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/emails/contacto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre, email, motivo, mensaje }) });
      if (res.ok) setEnviado(true);
      else setEnviando(false);
    } catch { setEnviando(false); }
    setEnviando(false);
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" };
  const labelStyle: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "6px", display: "block" };
  const canSend = nombre && email && mensaje && !enviando;

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section style={{ padding: "120px clamp(20px,5vw,80px) 48px", textAlign: "center", borderBottom: "1px solid rgba(232,168,76,0.08)" }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--oasis-bright)", marginBottom: "14px" }}>Estamos aquí</p>
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.8rem, 5vw, 3rem)", fontWeight: 900, color: "var(--accent)", marginBottom: "16px", lineHeight: 1.2 }}>¿En qué podemos<br />ayudarte? 🧞</h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.95rem, 2vw, 1.05rem)", color: "rgba(240,234,214,0.5)", lineHeight: 1.7, maxWidth: "400px", margin: "0 auto" }}>Respondemos todos los mensajes dentro de las 24 horas hábiles siguientes.</p>
      </section>

      {/* Body */}
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px clamp(20px,5vw,60px) 80px" }}>
        {enviado ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✨</div>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", marginBottom: "12px" }}>¡Mensaje enviado!</h2>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "rgba(240,234,214,0.5)", lineHeight: 1.7, marginBottom: "28px" }}>Te responderemos a <strong style={{ color: "var(--accent)" }}>{email}</strong> dentro de las próximas 24 horas hábiles.</p>
            <Link href="/" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--oasis-bright)", textDecoration: "none", borderBottom: "1px solid rgba(61,184,158,0.3)", paddingBottom: "2px" }}>Volver al inicio →</Link>
          </div>
        ) : (
          <>
            {/* Quick options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "36px" }}>
              {[
                { icon: "🏪", color: "rgba(232,168,76,0.1)", title: "Quiero registrar mi local", desc: "Conecta con personas que buscan dónde comer", href: "/registro-local" },
                { icon: "🏆", color: "rgba(61,184,158,0.1)", title: "Tengo dudas sobre un concurso", desc: "Premios, reglas o cómo participar", href: "/concursos/como-funciona" },
              ].map((op, i) => (
                <Link key={i} href={op.href} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.12)", borderRadius: "14px", textDecoration: "none", transition: "border-color 0.2s" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: op.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>{op.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#f0ead6", marginBottom: "2px" }}>{op.title}</p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)" }}>{op.desc}</p>
                  </div>
                  <span style={{ color: "rgba(240,234,214,0.25)", fontSize: "1rem" }}>→</span>
                </Link>
              ))}
            </div>

            {/* Separator */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(232,168,76,0.08)" }} />
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,214,0.25)", whiteSpace: "nowrap" }}>O escríbenos directamente</p>
              <div style={{ flex: 1, height: "1px", background: "rgba(232,168,76,0.08)" }} />
            </div>

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Tu nombre</label>
                <input type="text" placeholder="María González" value={nombre} onChange={e => setNombre(e.target.value)} style={inputStyle} onFocus={e => { e.target.style.borderColor = "var(--accent)"; }} onBlur={e => { e.target.style.borderColor = "rgba(232,168,76,0.15)"; }} />
              </div>
              <div>
                <label style={labelStyle}>Tu email</label>
                <input type="email" placeholder="maria@email.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} onFocus={e => { e.target.style.borderColor = "var(--accent)"; }} onBlur={e => { e.target.style.borderColor = "rgba(232,168,76,0.15)"; }} />
              </div>
              <div>
                <label style={labelStyle}>Motivo</label>
                <select value={motivo} onChange={e => setMotivo(e.target.value)} style={{ ...inputStyle, background: "#0a0812", cursor: "pointer" }}>
                  <option value="Consulta general">Consulta general</option>
                  <option value="Registrar mi local">Quiero registrar mi local</option>
                  <option value="captador">Quiero ser captador de locales</option>
                  <option value="Problema técnico">Problema técnico</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Mensaje</label>
                <textarea placeholder="Cuéntanos en qué podemos ayudarte..." value={mensaje} onChange={e => setMensaje(e.target.value)} rows={4} style={{ ...inputStyle, resize: "vertical", minHeight: "110px" }} onFocus={e => { e.target.style.borderColor = "var(--accent)"; }} onBlur={e => { e.target.style.borderColor = "rgba(232,168,76,0.15)"; }} />
              </div>
              <button onClick={handleSubmit} disabled={!canSend} style={{ padding: "14px", background: canSend ? "var(--accent)" : "rgba(232,168,76,0.2)", border: "none", borderRadius: "12px", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: canSend ? "var(--bg-primary)" : "rgba(240,234,214,0.3)", fontWeight: 700, cursor: canSend ? "pointer" : "default", transition: "all 0.2s", marginTop: "4px" }}>
                {enviando ? "Enviando..." : "Enviar mensaje →"}
              </button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
