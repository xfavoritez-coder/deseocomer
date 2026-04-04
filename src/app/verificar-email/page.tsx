"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerificarEmailPage() {
  return <Suspense><VerificarContent /></Suspense>;
}

function VerificarContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [nombre, setNombre] = useState("");
  const [referidorNombre, setReferidorNombre] = useState<string | null>(null);
  const [concursoSlug, setConcursoSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    fetch(`/api/verificar-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setStatus("ok");
          setNombre(data.nombre ?? "");
          setReferidorNombre(data.referidorNombre ?? null);
          setConcursoSlug(data.concursoSlug ?? null);
          // Auto-login: save session with emailVerificado
          try {
            const existingSession = JSON.parse(localStorage.getItem("deseocomer_session") ?? "{}");
            localStorage.setItem("deseocomer_session", JSON.stringify({
              ...existingSession,
              id: data.id, nombre: data.nombre, email: data.email,
              tipo: "usuario", loggedIn: true,
              emailVerificado: true,
            }));
          } catch {}
        } else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <main style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 24px" }}>
      <div style={{ maxWidth: "420px", width: "100%", background: "rgba(45,26,8,0.9)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", textAlign: "center" }}>
        {status === "loading" && (
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)" }}>Verificando tu email... 🧞</p>
        )}
        {status === "ok" && (
          <>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✨</div>
            <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", color: "var(--accent)", marginBottom: "12px" }}>¡Cuenta activada!</h1>
            {referidorNombre ? (
              <>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "8px" }}>
                  {nombre ? `Hola ${nombre}, tu` : "Tu"} cuenta está activa.
                </p>
                <div style={{ background: "rgba(61,184,158,0.1)", border: "1px solid rgba(61,184,158,0.25)", borderRadius: 12, padding: "14px 18px", marginBottom: "20px" }}>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "#3db89e", lineHeight: 1.6, margin: 0 }}>
                    🎉 ¡Le sumaste <strong>3 puntos</strong> a <strong>{referidorNombre}</strong>!
                  </p>
                </div>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "20px" }}>
                  Tú también puedes participar y ganar comida gratis. Comparte tu link e invita amigos para sumar puntos.
                </p>
                <a href={concursoSlug ? `/concursos/${concursoSlug}` : "/concursos"} style={{ display: "inline-block", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, padding: "14px 32px", borderRadius: "12px", textDecoration: "none", marginBottom: "10px" }}>
                  Ver concursos →
                </a>
                <a href="/" style={{ display: "block", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(240,234,214,0.4)", textDecoration: "none", marginTop: "8px" }}>
                  Ir al inicio
                </a>
              </>
            ) : (
              <>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "24px" }}>
                  {nombre ? `Hola ${nombre}, tu` : "Tu"} cuenta está activa. Ya puedes participar en concursos y guardar favoritos.
                </p>
                <a href="/concursos" style={{ display: "inline-block", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, padding: "14px 32px", borderRadius: "12px", textDecoration: "none" }}>
                  Ver concursos →
                </a>
                <a href="/" style={{ display: "block", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(240,234,214,0.4)", textDecoration: "none", marginTop: "12px" }}>
                  Ir al inicio
                </a>
              </>
            )}
          </>
        )}
        {status === "error" && <ErrorVerificacion />}
      </div>
    </main>
  );
}

function ErrorVerificacion() {
  const [emailInput, setEmailInput] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [showInput, setShowInput] = useState(false);

  // Try to get email from session
  const sessionEmail = typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("deseocomer_session") ?? "{}").email ?? ""; } catch { return ""; } })() : "";

  const enviar = async (email: string) => {
    if (!email.includes("@")) return;
    setEnviando(true);
    try {
      await fetch("/api/emails/verificacion-reenvio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setEnviado(true);
    } catch {}
    setEnviando(false);
  };

  if (enviado) return (
    <>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "#3db89e", lineHeight: 1.6 }}>Te enviamos un nuevo link a <strong>{emailInput || sessionEmail}</strong>. Revisa tu bandeja de entrada y también la carpeta de spam.</p>
      <Link href="/" style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.4)", textDecoration: "none", display: "block", marginTop: 16 }}>← Volver al inicio</Link>
    </>
  );

  return (
    <>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
      <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: 20, color: "#f5d080", textTransform: "uppercase", marginBottom: 10 }}>No pudimos verificar tu cuenta</h1>
      <div style={{ textAlign: "left", maxWidth: 320, margin: "0 auto 20px" }}>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.5)", lineHeight: 1.7 }}>Esto puede pasar porque:</p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.5)", lineHeight: 1.7, margin: "4px 0" }}>• El link ya fue usado anteriormente</p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.5)", lineHeight: 1.7, margin: "4px 0" }}>• El link expiró (tiene validez de 48 horas)</p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.5)", lineHeight: 1.7, margin: "4px 0" }}>• Hubo un problema técnico al enviar</p>
      </div>
      <div style={{ height: 1, background: "rgba(232,168,76,0.1)", marginBottom: 20 }} />
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, color: "#e8a84c", textTransform: "uppercase", marginBottom: 14 }}>¿Qué puedo hacer?</p>
      {sessionEmail && !showInput ? (
        <button onClick={() => enviar(sessionEmail)} disabled={enviando} style={{ background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", padding: "13px 24px", borderRadius: 12, border: "none", cursor: "pointer", width: "100%", maxWidth: 320 }}>{enviando ? "Enviando..." : "Enviar nuevo link de verificación →"}</button>
      ) : (
        <div style={{ maxWidth: 320, width: "100%", margin: "0 auto" }}>
          <input type="email" placeholder="Ingresa tu email" value={emailInput} onChange={e => setEmailInput(e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "rgba(240,234,214,0.8)", width: "100%", maxWidth: 320, marginBottom: 10, boxSizing: "border-box", outline: "none", fontFamily: "var(--font-lato)" }} />
          <button onClick={() => enviar(emailInput)} disabled={enviando || !emailInput.includes("@")} style={{ background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, textTransform: "uppercase", padding: "13px 24px", borderRadius: 12, border: "none", cursor: "pointer", width: "100%", maxWidth: 320, opacity: emailInput.includes("@") ? 1 : 0.5 }}>{enviando ? "Enviando..." : "Enviar nuevo link de verificación →"}</button>
        </div>
      )}
      <Link href="/" style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.4)", textDecoration: "none", display: "block", marginTop: 12 }}>← Volver al inicio</Link>
    </>
  );
}
