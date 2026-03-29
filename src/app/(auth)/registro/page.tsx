"use client";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getPendingRef, hasEmailCounted, markEmailCounted, incrementRef, clearPendingRef, savePendingRef, getRefUserName } from "@/lib/referrals";

export default function RegistroPage() {
  return <Suspense><RegistroContent /></Suspense>;
}

function RegistroContent() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");
  const concursoId = searchParams.get("concurso");

  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirm: "", terms: false });
  const [showPw, setShowPw] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refMsg, setRefMsg] = useState("");

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  // Save pending ref
  useEffect(() => {
    if (refCode && concursoId) savePendingRef(refCode, Number(concursoId));
  }, [refCode, concursoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!form.email.trim()) return setError("El email es obligatorio.");
    if (form.password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (form.password !== form.confirm) return setError("Las contraseñas no coinciden.");
    if (!form.terms) return setError("Debes aceptar los términos y condiciones.");

    setLoading(true);
    const res = await register({ type: "user", nombre: form.nombre.trim(), email: form.email.trim(), password: form.password, comuna: "" });
    setLoading(false);

    if (res.success) {
      // Process referral
      const pending = getPendingRef();
      let msg = "";
      let redirectTo = "/";
      if (pending && res.userId && pending.refCode !== res.userId) {
        const email = form.email.trim().toLowerCase();
        if (!hasEmailCounted(pending.concursoId, pending.refCode, email)) {
          markEmailCounted(pending.concursoId, pending.refCode, email);
          incrementRef(pending.concursoId, pending.refCode, 2);
          incrementRef(pending.concursoId, res.userId, 1);
          const friendName = getRefUserName(pending.refCode);
          msg = friendName
            ? `✅ Le sumaste 2 puntos a ${friendName} y ganaste 1 punto de bienvenida.`
            : "✅ Le sumaste 2 puntos a tu amigo y ganaste 1 punto de bienvenida.";
          redirectTo = `/concursos/${pending.concursoId}`;
        }
        clearPendingRef();
      }
      setRefMsg(msg);
      setSuccess(true);
      setTimeout(() => router.push(redirectTo), msg ? 2200 : 1500);
    } else {
      setError(res.error ?? "Error al crear la cuenta.");
    }
  };

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "420px", width: "100%", background: "rgba(45,26,8,0.9)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🧞</div>
          <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "var(--accent)" }}>DeseoComer</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>✨</div>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", color: "var(--accent)", marginBottom: "8px" }}>¡Bienvenido/a!</h2>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {refMsg || "Tu cuenta ha sido creada. Redirigiendo..."}
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.6rem, 5vw, 2rem)", color: "var(--color-title, var(--accent))", marginBottom: "8px" }}>Crear cuenta</h1>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "32px" }}>
              ¿Ya tienes cuenta? <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>Inicia sesión</Link>
            </p>

            {error && (
              <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff6b6b" }}>⚠️ {error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={labelS}>Nombre completo</label>
                <input style={inputS} type="text" placeholder="Tu nombre completo" value={form.nombre} onChange={e => set("nombre", e.target.value)} />
              </div>
              <div>
                <label style={labelS}>Email</label>
                <input style={inputS} type="email" placeholder="tu@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
              </div>
              <div>
                <label style={labelS}>Contraseña</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inputS, paddingRight: "48px" }} type={showPw ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => set("password", e.target.value)} />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={eyeBtn}>{showPw ? "🙈" : "👁"}</button>
                </div>
              </div>
              <div>
                <label style={labelS}>Confirmar contraseña</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inputS, paddingRight: "48px" }} type={showConf ? "text" : "password"} placeholder="Repite tu contraseña" value={form.confirm} onChange={e => set("confirm", e.target.value)} />
                  <button type="button" onClick={() => setShowConf(s => !s)} style={eyeBtn}>{showConf ? "🙈" : "👁"}</button>
                </div>
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={form.terms} onChange={e => set("terms", e.target.checked)} style={{ accentColor: "var(--accent)", width: "18px", height: "18px", marginTop: "2px", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Acepto los <a href="#" style={{ color: "var(--accent)", textDecoration: "none" }}>Términos</a> y la <a href="#" style={{ color: "var(--accent)", textDecoration: "none" }}>Política de Privacidad</a>
                </span>
              </label>

              <button type="submit" disabled={loading} style={btnS}>
                {loading ? "Creando cuenta..." : "Crear mi cuenta →"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

const labelS: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "8px", display: "block" };
const inputS: React.CSSProperties = { width: "100%", padding: "14px 16px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box" };
const btnS: React.CSSProperties = { width: "100%", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontWeight: 700, fontSize: "1rem", letterSpacing: "0.1em", padding: "16px", borderRadius: "12px", border: "none", cursor: "pointer" };
const eyeBtn: React.CSSProperties = { position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" };
