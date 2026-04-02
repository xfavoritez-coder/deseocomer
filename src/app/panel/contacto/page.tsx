"use client";
import { useState } from "react";

const SESSION_KEY = "deseocomer_local_session";
const I: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
const L: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", display: "block" };

const ASUNTOS = ["Consulta general", "Problema con mi cuenta", "Problema con concursos", "Problema con promociones", "Sugerencia", "Otro"];

export default function PanelContacto() {
  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const send = async () => {
    if (!mensaje.trim() || !asunto) return;
    setSending(true);
    setError("");
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "{}");
      const res = await fetch("/api/emails/contacto-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localId: session.id ?? "",
          localNombre: session.nombre ?? "Local",
          email: session.email ?? "",
          asunto,
          mensaje: mensaje.trim(),
        }),
      });
      if (res.ok) {
        setSent(true);
        setAsunto("");
        setMensaje("");
      } else {
        setError("Error al enviar. Intenta de nuevo.");
      }
    } catch {
      setError("Error de conexión.");
    }
    setSending(false);
  };

  if (sent) return (
    <div style={{ maxWidth: "500px", textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✉️</div>
      <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "12px" }}>Mensaje enviado</h2>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "24px" }}>Recibimos tu mensaje. Te responderemos lo antes posible al email de tu local.</p>
      <button onClick={() => setSent(false)} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700, padding: "12px 28px", borderRadius: "12px", border: "none", cursor: "pointer" }}>Enviar otro mensaje</button>
    </div>
  );

  return (
    <div style={{ maxWidth: "500px" }}>
      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", marginBottom: "8px" }}>Contacto</h1>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "28px" }}>¿Tienes alguna duda o problema? Escríbenos y te responderemos lo antes posible.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <label style={L}>Asunto</label>
          <select style={I} value={asunto} onChange={e => setAsunto(e.target.value)}>
            <option value="">Selecciona un asunto...</option>
            {ASUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label style={L}>Mensaje</label>
          <textarea style={{ ...I, resize: "vertical", minHeight: "120px" }} value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Cuéntanos en qué te podemos ayudar..." maxLength={1000} />
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", marginTop: "4px", textAlign: "right" }}>{mensaje.length}/1000</p>
        </div>

        {error && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff6b6b" }}>⚠️ {error}</p>}

        <button onClick={send} disabled={!asunto || !mensaje.trim() || sending} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.88rem", background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700, padding: "14px 28px", borderRadius: "12px", border: "none", cursor: "pointer", opacity: asunto && mensaje.trim() ? 1 : 0.5 }}>
          {sending ? "Enviando..." : "Enviar mensaje"}
        </button>
      </div>
    </div>
  );
}
