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
  const [telVerificado, setTelVerificado] = useState(false);

  const refParam = params.get("ref");
  const concursoParam = params.get("concurso");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    const apiUrl = `/api/verificar-email?token=${token}${refParam ? `&ref=${encodeURIComponent(refParam)}` : ""}${concursoParam ? `&concurso=${encodeURIComponent(concursoParam)}` : ""}`;
    fetch(apiUrl)
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setStatus("ok");
          setNombre(data.nombre ?? "");
          setReferidorNombre(data.referidorNombre ?? null);
          setConcursoSlug(data.concursoSlug ?? null);
          setTelVerificado(!!data.telefonoVerificado);
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
  }, [token, refParam, concursoParam]);

  return (
    <main style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 24px" }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>

        {status === "loading" && (
          <div style={{ background: "rgba(45,26,8,0.9)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: 24, padding: 40, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize: 40, marginBottom: 12, animation: "dcPulse 1.5s ease-in-out infinite" }}>🧞</div>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)" }}>Activando tu cuenta...</p>
          </div>
        )}

        {status === "ok" && (
          <div style={{ background: "rgba(45,26,8,0.9)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: 24, padding: "40px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            {/* Success icon */}
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(61,184,158,0.12)", border: "2px solid rgba(61,184,158,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <span style={{ fontSize: 36 }}>✓</span>
            </div>

            <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "#3db89e", marginBottom: 8 }}>Cuenta activada</h1>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 24 }}>
              {nombre ? `${nombre}, tu` : "Tu"} cuenta en DeseoComer está activa.
            </p>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(232,168,76,0.1)", margin: "0 -8px 24px" }} />

            {referidorNombre ? (
              <>
                {/* Referral flow — needs phone verification for points */}
                {!telVerificado ? (
                  <>
                    <div style={{ background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 14, padding: "20px 18px", marginBottom: 20, textAlign: "left" }}>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8a84c", marginBottom: 12, textAlign: "center" }}>Siguiente paso</p>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, color: "#3db89e", fontWeight: 700 }}>✓</span>
                        </div>
                        <div>
                          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", margin: "0 0 2px", textDecoration: "line-through" }}>Activar cuenta</p>
                          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.25)", margin: 0 }}>Email confirmado</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, color: "#e8a84c", fontWeight: 700 }}>2</span>
                        </div>
                        <div>
                          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "#f5d080", margin: "0 0 2px" }}>Verificar celular</p>
                          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.45)", margin: 0, lineHeight: 1.5 }}>
                            Verifica tu celular en el concurso para activar tus <strong style={{ color: "#3db89e" }}>+3 puntos</strong> y sumarle <strong style={{ color: "#3db89e" }}>+3 puntos</strong> a {referidorNombre}.
                          </p>
                        </div>
                      </div>
                    </div>

                    <a href={concursoSlug ? `/concursos/${concursoSlug}` : "/concursos"} style={{ display: "block", background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, padding: "15px 32px", borderRadius: 12, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                      Ir al concurso y verificar celular →
                    </a>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.3)", lineHeight: 1.5 }}>
                      Solo toma 30 segundos. Necesitas hacerlo una sola vez.
                    </p>
                  </>
                ) : (
                  <>
                    {/* Phone already verified — points credited */}
                    <div style={{ background: "rgba(61,184,158,0.08)", border: "1px solid rgba(61,184,158,0.25)", borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.92rem", color: "#3db89e", lineHeight: 1.6, margin: 0 }}>
                        Le sumaste <strong>+3 puntos</strong> a <strong>{referidorNombre}</strong> y tus <strong>+3 puntos</strong> ya están activos.
                      </p>
                    </div>
                    <a href={concursoSlug ? `/concursos/${concursoSlug}` : "/concursos"} style={{ display: "block", background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, padding: "15px 32px", borderRadius: 12, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                      {concursoSlug ? "Ver mi concurso →" : "Ver concursos →"}
                    </a>
                  </>
                )}
              </>
            ) : (
              <>
                {/* No referral — standard activation */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(232,168,76,0.04)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 12 }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>🏆</span>
                    <div>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "#f5d080", margin: "0 0 2px", fontWeight: 700 }}>Concursos</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.45)", margin: 0, lineHeight: 1.4 }}>Participa gratis y gana comida. Invita amigos y ambos ganan puntos.</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(232,168,76,0.04)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 12 }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>🍽️</span>
                    <div>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "#f5d080", margin: "0 0 2px", fontWeight: 700 }}>Locales</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.45)", margin: 0, lineHeight: 1.4 }}>Descubre los mejores restaurantes cerca de ti.</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(232,168,76,0.04)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 12 }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>⚡</span>
                    <div>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "#f5d080", margin: "0 0 2px", fontWeight: 700 }}>Promociones</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.45)", margin: 0, lineHeight: 1.4 }}>Ofertas exclusivas de los locales que te gustan.</p>
                    </div>
                  </div>
                </div>
                <a href="/" style={{ display: "block", background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, padding: "15px 32px", borderRadius: 12, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Explorar DeseoComer →
                </a>
              </>
            )}

            <a href="/" style={{ display: "block", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(240,234,214,0.3)", textDecoration: "none", marginTop: 8 }}>
              Ir al inicio
            </a>
          </div>
        )}

        {status === "error" && (
          <div style={{ background: "rgba(45,26,8,0.9)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: 24, padding: "40px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <ErrorVerificacion />
          </div>
        )}
      </div>

      <style>{`
        @keyframes dcPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </main>
  );
}

function ErrorVerificacion() {
  const [emailInput, setEmailInput] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [showInput, setShowInput] = useState(false);

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
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(61,184,158,0.12)", border: "2px solid rgba(61,184,158,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <span style={{ fontSize: 28 }}>✓</span>
      </div>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#3db89e", lineHeight: 1.6 }}>Te enviamos un nuevo link a <strong>{emailInput || sessionEmail}</strong>. Revisa tu bandeja de entrada y la carpeta de spam.</p>
      <Link href="/" style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", textDecoration: "none", display: "block", marginTop: 16 }}>← Volver al inicio</Link>
    </>
  );

  return (
    <>
      <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
      <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.15rem", color: "#f5d080", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>No pudimos verificar tu cuenta</h1>

      <div style={{ textAlign: "left", margin: "0 auto 20px", maxWidth: 320 }}>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)", lineHeight: 1.7, marginBottom: 8 }}>Esto puede pasar porque:</p>
        {["El link ya fue usado", "El link expiró (48 horas de validez)", "Hubo un problema técnico"].map(r => (
          <p key={r} style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.45)", lineHeight: 1.7, margin: "4px 0", paddingLeft: 12 }}>• {r}</p>
        ))}
      </div>

      <div style={{ height: 1, background: "rgba(232,168,76,0.1)", marginBottom: 20 }} />

      {sessionEmail && !showInput ? (
        <button onClick={() => enviar(sessionEmail)} disabled={enviando} style={{ background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "14px 24px", borderRadius: 12, border: "none", cursor: "pointer", width: "100%", maxWidth: 320 }}>
          {enviando ? "Enviando..." : "Enviar nuevo link →"}
        </button>
      ) : (
        <div style={{ maxWidth: 320, width: "100%", margin: "0 auto" }}>
          <input type="email" placeholder="Ingresa tu email" value={emailInput} onChange={e => setEmailInput(e.target.value)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: "0.88rem", color: "rgba(240,234,214,0.8)", width: "100%", marginBottom: 10, boxSizing: "border-box", outline: "none", fontFamily: "var(--font-lato)" }} />
          <button onClick={() => enviar(emailInput)} disabled={enviando || !emailInput.includes("@")} style={{ background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "14px 24px", borderRadius: 12, border: "none", cursor: "pointer", width: "100%", opacity: emailInput.includes("@") ? 1 : 0.5 }}>
            {enviando ? "Enviando..." : "Enviar nuevo link →"}
          </button>
        </div>
      )}
      {sessionEmail && !showInput && (
        <button onClick={() => setShowInput(true)} style={{ background: "none", border: "none", fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.3)", cursor: "pointer", marginTop: 10 }}>Usar otro email</button>
      )}
      <Link href="/" style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", textDecoration: "none", display: "block", marginTop: 14 }}>← Volver al inicio</Link>
    </>
  );
}
