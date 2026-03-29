"use client";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPendingRef,
  hasEmailCounted,
  markEmailCounted,
  incrementRef,
  clearPendingRef,
  savePendingRef,
  getRefUserName,
} from "@/lib/referrals";

// ─── Data ────────────────────────────────────────────────────────────────────


// ─── Icons ───────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ─── Form state types ────────────────────────────────────────────────────────

const initUser = { nombre: "", apellido: "", email: "", password: "", confirm: "", terms: false };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroContent />
    </Suspense>
  );
}

function RegistroContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const refCode     = searchParams.get("ref");
  const concursoId  = searchParams.get("concurso");

  const [userForm, setUserForm] = useState(initUser);
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [refMsg,   setRefMsg]   = useState("");
  const [googleMsg, setGoogleMsg] = useState("");
  const [refName,  setRefName]  = useState<string | null>(null);
  const [refPremio, setRefPremio] = useState<string | null>(null);

  // Save pending ref from URL params and resolve names
  useEffect(() => {
    if (refCode && concursoId) {
      savePendingRef(refCode, Number(concursoId));
      const name = getRefUserName(refCode);
      setRefName(name);
      // Try to get concurso name from mockConcursos
      try {
        // Dynamic import not needed - use localStorage or just show generic text
        setRefPremio(null); // Will show generic text
      } catch { /* noop */ }
    }
  }, [refCode, concursoId]);

  // ── User form submit ──────────────────────────────────────────────────────
  const handleUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userForm.nombre.trim())    return setError("El nombre es obligatorio.");
    if (!userForm.apellido.trim())  return setError("El apellido es obligatorio.");
    if (!userForm.email.trim())     return setError("El email es obligatorio.");
    if (userForm.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    if (userForm.password !== userForm.confirm) return setError("Las contraseñas no coinciden.");
    if (!userForm.terms)            return setError("Debes aceptar los términos y condiciones.");

    setLoading(true);
    const res = await register({
      type:     "user",
      nombre:   `${userForm.nombre.trim()} ${userForm.apellido.trim()}`,
      email:    userForm.email.trim(),
      password: userForm.password,
      comuna:   "",
    });
    setLoading(false);

    if (res.success) {
      // Process pending referral if any
      const pending = getPendingRef();
      let msg = "";
      let redirectTo = "/concursos";

      if (pending && res.userId && pending.refCode !== res.userId) {
        const email = userForm.email.trim().toLowerCase();
        if (!hasEmailCounted(pending.concursoId, pending.refCode, email)) {
          markEmailCounted(pending.concursoId, pending.refCode, email);
          // +2 puntos para el referidor
          incrementRef(pending.concursoId, pending.refCode, 2);
          // +1 punto de bienvenida para el nuevo usuario
          incrementRef(pending.concursoId, res.userId, 1);
          const friendName = getRefUserName(pending.refCode);
          msg = friendName
            ? `✅ ¡Listo! Le sumaste 2 puntos a ${friendName} y tú ganaste 1 punto de bienvenida.`
            : "✅ ¡Listo! Le sumaste 2 puntos a tu amigo y tú ganaste 1 punto de bienvenida.";
          redirectTo = `/concursos/${pending.concursoId}`;
        }
        clearPendingRef();
      }

      setRefMsg(msg);
      setSuccess(true);
      setTimeout(() => router.push(redirectTo), msg ? 2200 : 1600);
    } else {
      setError(res.error ?? "Error al crear la cuenta.");
    }
  };

  const uSet = (k: keyof typeof initUser, v: string | boolean) =>
    setUserForm(f => ({ ...f, [k]: v }));

  return (
    <main className="dc-auth-page">
      {/* Background glow */}
      <div className="dc-auth-glow" aria-hidden="true" />

      {/* Back link */}
      <Link href="/" className="dc-auth-back">← Volver al inicio</Link>

      {/* Card */}
      <div className="dc-auth-card">

        {/* Success screen */}
        {success ? (
          <div className="dc-auth-success">
            <div className="dc-auth-success-lamp">🏮</div>
            <h2 className="dc-auth-success-title">
              ¡Bienvenido!
            </h2>
            <p className="dc-auth-success-sub">
              {refMsg || "El Genio te está esperando..."}
            </p>
          </div>
        ) : (
          <>
            {/* Referral banner */}
            {refCode && concursoId && (
              <div style={{
                background: "rgba(232,168,76,0.15)",
                border: "1px solid rgba(232,168,76,0.4)",
                borderRadius: "12px",
                padding: "16px 20px",
                marginBottom: "20px",
                textAlign: "center",
              }}>
                <p style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)",
                  color: "var(--accent)",
                  marginBottom: "6px",
                  fontWeight: 600,
                }}>
                  🏮 {refName
                    ? `¡Estás a un paso de sumarle un punto a ${refName}!`
                    : "¡Te invitaron a ganar comida gratis!"
                  }
                </p>
                <p style={{
                  fontFamily: "var(--font-lato)",
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                  lineHeight: 1.6,
                  fontWeight: 400,
                }}>
                  {refName
                    ? `Completa tu registro y automáticamente le darás un punto a ${refName} en el concurso. Tú también podrás participar y ganar comida gratis.`
                    : "Completa tu registro para participar en el concurso y ganar comida gratis."
                  }
                </p>
              </div>
            )}

            {/* Logo */}
            <div className="dc-auth-logo">
              <span className="dc-auth-lamp-icon">🏮</span>
              <span className="dc-auth-logo-text">DeseoComer</span>
            </div>

            <h1 className="dc-auth-title">Crear cuenta</h1>
            <p className="dc-auth-subtitle">Únete a la plataforma gastronómica de Santiago</p>

            {/* Error */}
            {error && (
              <div className="dc-auth-error" role="alert">
                <span>⚠️ {error}</span>
                <button type="button" onClick={() => setError("")} className="dc-auth-error-close">✕</button>
              </div>
            )}

            {/* ── USER FORM ── */}
            <form onSubmit={handleUser} className="dc-auth-form" noValidate>
              <div className="dc-field-row">
                <div className="dc-field">
                  <label className="dc-label">Nombre</label>
                  <input type="text" className="dc-input" placeholder="Ej: María"
                    value={userForm.nombre} onChange={e => uSet("nombre", e.target.value)} required />
                </div>
                <div className="dc-field">
                  <label className="dc-label">Apellido</label>
                  <input type="text" className="dc-input" placeholder="Ej: González"
                    value={userForm.apellido} onChange={e => uSet("apellido", e.target.value)} required />
                </div>
              </div>

              <div className="dc-field">
                <label className="dc-label">Correo electrónico</label>
                <input type="email" className="dc-input" placeholder="tu@email.com"
                  value={userForm.email} onChange={e => uSet("email", e.target.value)} required />
              </div>

              <div className="dc-field-row">
                <div className="dc-field">
                  <label className="dc-label">Contraseña</label>
                  <div className="dc-pw-wrap">
                    <input type={showPw ? "text" : "password"} className="dc-input dc-input--pw"
                      placeholder="Mínimo 6 caracteres"
                      value={userForm.password} onChange={e => uSet("password", e.target.value)} required />
                    <button type="button" className="dc-pw-btn" onClick={() => setShowPw(s => !s)}
                      aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </div>
                <div className="dc-field">
                  <label className="dc-label">Confirmar contraseña</label>
                  <div className="dc-pw-wrap">
                    <input type={showConf ? "text" : "password"} className="dc-input dc-input--pw"
                      placeholder="Repetir contraseña"
                      value={userForm.confirm} onChange={e => uSet("confirm", e.target.value)} required />
                    <button type="button" className="dc-pw-btn" onClick={() => setShowConf(s => !s)}
                      aria-label={showConf ? "Ocultar contraseña" : "Mostrar contraseña"}>
                      <EyeIcon open={showConf} />
                    </button>
                  </div>
                </div>
              </div>

              <label className="dc-check-label">
                <input type="checkbox" className="dc-checkbox"
                  checked={userForm.terms} onChange={e => uSet("terms", e.target.checked)} />
                <span>
                  Acepto los{" "}
                  <a href="#" className="dc-link">Términos y Condiciones</a>
                  {" "}y la{" "}
                  <a href="#" className="dc-link">Política de Privacidad</a>
                </span>
              </label>

              <button type="submit" className="dc-btn-primary" disabled={loading}>
                {loading ? <span className="dc-spinner" /> : "✨ Crear mi cuenta"}
              </button>
            </form>

            {/* Divider */}
            <div className="dc-divider"><span>o</span></div>

            {/* Google */}
            <button type="button" className="dc-btn-google"
              onClick={() => setGoogleMsg("Autenticación con Google próximamente 🧞")}>
              <span className="dc-google-g">G</span>
              Continuar con Google
            </button>
            {googleMsg && <p className="dc-google-msg">{googleMsg}</p>}

            {/* Links */}
            <p className="dc-auth-foot">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="dc-link">Iniciar sesión</Link>
            </p>
          </>
        )}
      </div>

      <AuthStyles />
    </main>
  );
}

// ─── Shared styles (used in both auth pages) ─────────────────────────────────

export function AuthStyles() {
  return (
    <style>{`
      .dc-auth-page {
        min-height: 100vh;
        background-color: var(--bg-primary);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 60px 20px 48px;
        position: relative;
        overflow: hidden;
      }
      .dc-auth-glow {
        position: absolute; top: 40%; left: 50%;
        transform: translate(-50%, -50%);
        width: 700px; height: 500px;
        background: radial-gradient(ellipse,
          color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 65%);
        pointer-events: none;
      }
      .dc-auth-back {
        font-family: var(--font-cinzel); font-size: 0.65rem;
        letter-spacing: 0.15em; text-transform: uppercase;
        color: var(--text-muted); text-decoration: none;
        margin-bottom: 24px; align-self: flex-start;
        max-width: 580px; width: 100%;
        transition: color 0.2s ease;
      }
      .dc-auth-back:hover { color: var(--accent); }

      .dc-auth-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 24px;
        padding: 48px 44px;
        width: 100%; max-width: 580px;
        position: relative;
        z-index: 1;
      }

      /* Logo */
      .dc-auth-logo {
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 24px;
      }
      .dc-auth-lamp-icon { font-size: 1.6rem; }
      .dc-auth-logo-text {
        font-family: var(--font-cinzel-decorative); font-size: 1.1rem;
        color: var(--accent);
        text-shadow: 0 0 20px color-mix(in srgb, var(--accent) 50%, transparent);
      }

      /* Title */
      .dc-auth-title {
        font-family: var(--font-cinzel-decorative);
        font-size: clamp(1.4rem, 4vw, 1.9rem);
        color: var(--text-primary); margin-bottom: 8px;
      }
      .dc-auth-subtitle {
        font-family: var(--font-lato); font-size: 0.9rem;
        color: var(--text-muted); font-weight: 400; margin-bottom: 28px;
      }

      /* Tabs */
      .dc-auth-tabs {
        display: flex; gap: 8px; margin-bottom: 24px;
        background: rgba(0,0,0,0.25);
        border-radius: 14px; padding: 6px;
      }
      .dc-auth-tab {
        flex: 1; padding: 10px 16px; border-radius: 10px;
        border: 1px solid transparent;
        background: transparent; cursor: pointer;
        font-family: var(--font-cinzel); font-size: 0.7rem;
        letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--text-muted); transition: all 0.2s ease;
        min-height: 44px;
      }
      .dc-auth-tab--active {
        background: color-mix(in srgb, var(--accent) 15%, transparent);
        border-color: color-mix(in srgb, var(--accent) 40%, transparent);
        color: var(--accent); font-weight: 700;
      }

      /* Error */
      .dc-auth-error {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; background: rgba(255,80,80,0.12);
        border: 1px solid rgba(255,80,80,0.35);
        border-radius: 12px; padding: 12px 16px;
        margin-bottom: 20px;
        font-family: var(--font-lato); font-size: 0.85rem;
        color: #ff8080; line-height: 1.4;
      }
      .dc-auth-error-close {
        background: none; border: none; cursor: pointer;
        color: #ff8080; font-size: 0.9rem; padding: 4px; flex-shrink: 0;
      }

      /* Form */
      .dc-auth-form { display: flex; flex-direction: column; gap: 18px; }
      .dc-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .dc-field { display: flex; flex-direction: column; gap: 6px; }
      .dc-label {
        font-family: var(--font-cinzel); font-size: 0.6rem;
        letter-spacing: 0.15em; text-transform: uppercase;
        color: var(--text-muted);
      }

      /* Input */
      .dc-input {
        width: 100%; padding: 13px 16px;
        background: #1a1008;
        border: 1px solid var(--border-color);
        border-radius: 12px;
        font-family: var(--font-lato); font-size: 0.92rem;
        color: var(--text-primary);
        outline: none; box-sizing: border-box;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        -webkit-appearance: none;
      }
      .dc-input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent);
      }
      .dc-input::placeholder { color: var(--text-muted); opacity: 0.6; }
      .dc-input--pw { padding-right: 48px; }

      /* Select */
      .dc-select-wrap { position: relative; }
      .dc-select {
        appearance: none; -webkit-appearance: none;
        cursor: pointer; padding-right: 40px;
      }
      .dc-select option {
        background: var(--bg-primary); color: var(--text-primary);
      }
      .dc-select-arrow {
        position: absolute; right: 14px; top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted); pointer-events: none;
        font-size: 0.85rem;
      }

      /* Password toggle */
      .dc-pw-wrap { position: relative; }
      .dc-pw-btn {
        position: absolute; right: 14px; top: 50%;
        transform: translateY(-50%);
        background: none; border: none; cursor: pointer;
        color: var(--text-muted); padding: 4px;
        display: flex; align-items: center;
        transition: color 0.2s;
      }
      .dc-pw-btn:hover { color: var(--accent); }

      /* Checkbox */
      .dc-check-label {
        display: flex; align-items: flex-start; gap: 12px;
        font-family: var(--font-lato); font-size: 0.85rem;
        color: var(--text-muted); cursor: pointer;
        line-height: 1.5;
      }
      .dc-checkbox {
        appearance: none; -webkit-appearance: none;
        width: 20px; height: 20px; flex-shrink: 0;
        border: 2px solid var(--border-color);
        border-radius: 6px; background: transparent;
        cursor: pointer; position: relative; margin-top: 2px;
        transition: border-color 0.2s, background 0.2s;
      }
      .dc-checkbox:checked {
        background: var(--accent); border-color: var(--accent);
      }
      .dc-checkbox:checked::after {
        content: "✓"; position: absolute;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
        color: var(--bg-primary); font-size: 11px; font-weight: 900;
      }
      .dc-link {
        color: var(--accent); text-decoration: none;
        border-bottom: 1px solid transparent;
        transition: border-color 0.2s;
      }
      .dc-link:hover { border-bottom-color: var(--accent); }

      /* Buttons */
      .dc-btn-primary {
        width: 100%; min-height: 52px; padding: 14px;
        background: var(--accent); color: var(--bg-primary);
        border: none; border-radius: 14px; cursor: pointer;
        font-family: var(--font-cinzel); font-size: 0.8rem;
        letter-spacing: 0.12em; text-transform: uppercase;
        font-weight: 700; margin-top: 4px;
        transition: opacity 0.2s ease, box-shadow 0.2s ease;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 20px color-mix(in srgb, var(--accent) 30%, transparent);
      }
      .dc-btn-primary:hover:not(:disabled) {
        box-shadow: 0 6px 28px color-mix(in srgb, var(--accent) 45%, transparent);
      }
      .dc-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

      /* Spinner */
      .dc-spinner {
        width: 18px; height: 18px; border-radius: 50%;
        border: 2px solid rgba(0,0,0,0.3);
        border-top-color: var(--bg-primary);
        animation: dc-spin 0.7s linear infinite;
        display: inline-block;
      }
      @keyframes dc-spin { to { transform: rotate(360deg); } }

      /* Divider */
      .dc-divider {
        display: flex; align-items: center; gap: 16px;
        margin: 24px 0 20px;
      }
      .dc-divider::before, .dc-divider::after {
        content: ""; flex: 1;
        height: 1px; background: var(--border-color);
      }
      .dc-divider span {
        font-family: var(--font-lato); font-size: 0.8rem;
        color: var(--text-muted); text-transform: uppercase;
        letter-spacing: 0.15em;
      }

      /* Google button */
      .dc-btn-google {
        width: 100%; min-height: 52px; padding: 14px;
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: 14px; cursor: pointer;
        font-family: var(--font-lato); font-size: 0.9rem;
        color: var(--text-primary); font-weight: 500;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        transition: border-color 0.2s, background 0.2s;
      }
      .dc-btn-google:hover {
        border-color: var(--accent);
        background: rgba(255,255,255,0.03);
      }
      .dc-google-g {
        font-size: 1rem; font-weight: 700;
        color: #4285F4; font-family: Arial, sans-serif;
      }
      .dc-google-msg {
        font-family: var(--font-lato); font-size: 0.8rem;
        color: var(--text-muted); text-align: center;
        margin-top: 8px;
      }

      /* Footer link */
      .dc-auth-foot {
        font-family: var(--font-lato); font-size: 0.85rem;
        color: var(--text-muted); text-align: center;
        margin-top: 24px;
      }

      /* Success screen */
      .dc-auth-success {
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        padding: 24px 0 16px; gap: 16px; text-align: center;
        min-height: 200px;
      }
      .dc-auth-success-lamp {
        font-size: 5rem;
        animation: dc-lamp-bounce 0.8s cubic-bezier(0.34,1.56,0.64,1) both;
        filter: drop-shadow(0 0 30px var(--accent));
      }
      .dc-auth-success-title {
        font-family: var(--font-cinzel-decorative);
        font-size: 1.8rem; color: var(--accent);
        text-shadow: 0 0 30px color-mix(in srgb, var(--accent) 50%, transparent);
      }
      .dc-auth-success-sub {
        font-family: var(--font-lato); font-size: 0.95rem;
        color: var(--text-muted); font-weight: 400;
      }
      @keyframes dc-lamp-bounce {
        0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
        60%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); }
      }

      /* Responsive */
      @media (max-width: 640px) {
        .dc-auth-page { padding: 48px 16px 36px; }
        .dc-auth-card { padding: 32px 22px; border-radius: 20px; }
        .dc-field-row { grid-template-columns: 1fr; }
        .dc-auth-tabs { flex-direction: column; }
      }
      @media (max-width: 400px) {
        .dc-auth-card { padding: 28px 18px; }
      }
    `}</style>
  );
}
