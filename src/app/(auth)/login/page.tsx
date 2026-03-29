"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthStyles } from "@/app/(auth)/registro/page";

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

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();

  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [remember,  setRemember]  = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [googleMsg, setGoogleMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim())    return setError("El email es obligatorio.");
    if (!password)        return setError("La contraseña es obligatoria.");

    setLoading(true);
    const res = await login(email.trim(), password, remember);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      // Redirect based on user type — AuthContext has user updated synchronously
      setTimeout(() => {
        // We can't access user here easily; just go to a smart landing
        router.push("/panel/dashboard");
      }, 1400);
    } else {
      setError(res.error ?? "Error al iniciar sesión.");
    }
  };

  return (
    <main className="dc-auth-page">
      <div className="dc-auth-glow" aria-hidden="true" />
      <Link href="/" className="dc-auth-back">← Volver al inicio</Link>

      <div className="dc-auth-card">
        {success ? (
          <div className="dc-auth-success">
            <div className="dc-auth-success-lamp">🏮</div>
            <h2 className="dc-auth-success-title">¡Bienvenido!</h2>
            <p className="dc-auth-success-sub">El Genio te abre las puertas...</p>
          </div>
        ) : (
          <>
            <div className="dc-auth-logo">
              <span className="dc-auth-lamp-icon">🏮</span>
              <span className="dc-auth-logo-text">DeseoComer</span>
            </div>

            <h1 className="dc-auth-title">Iniciar sesión</h1>
            <p className="dc-auth-subtitle">Accede a tu cuenta en la plataforma gastronómica</p>

            {error && (
              <div className="dc-auth-error" role="alert">
                <span>⚠️ {error}</span>
                <button type="button" onClick={() => setError("")} className="dc-auth-error-close">✕</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="dc-auth-form" noValidate>
              <div className="dc-field">
                <label className="dc-label">Correo electrónico</label>
                <input
                  type="email" className="dc-input"
                  placeholder="tu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" required
                />
              </div>

              <div className="dc-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label className="dc-label">Contraseña</label>
                  <a href="#" className="dc-label dc-link" style={{ marginBottom: 0 }}>
                    ¿Olvidé mi contraseña?
                  </a>
                </div>
                <div className="dc-pw-wrap">
                  <input
                    type={showPw ? "text" : "password"}
                    className="dc-input dc-input--pw"
                    placeholder="Tu contraseña"
                    value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password" required
                  />
                  <button type="button" className="dc-pw-btn" onClick={() => setShowPw(s => !s)}
                    aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              <label className="dc-check-label">
                <input type="checkbox" className="dc-checkbox"
                  checked={remember} onChange={e => setRemember(e.target.checked)} />
                <span>Recordarme en este dispositivo</span>
              </label>

              <button type="submit" className="dc-btn-primary" disabled={loading}>
                {loading ? <span className="dc-spinner" /> : "✨ Iniciar sesión"}
              </button>
            </form>

            <div className="dc-divider"><span>o</span></div>

            <button type="button" className="dc-btn-google"
              onClick={() => setGoogleMsg("Autenticación con Google próximamente 🧞")}>
              <span className="dc-google-g">G</span>
              Continuar con Google
            </button>
            {googleMsg && <p className="dc-google-msg">{googleMsg}</p>}

            <p className="dc-auth-foot">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="dc-link">Registrarse gratis</Link>
            </p>
          </>
        )}
      </div>

      <AuthStyles />
    </main>
  );
}
