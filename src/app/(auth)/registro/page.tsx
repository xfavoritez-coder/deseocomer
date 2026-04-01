"use client";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getPendingRef, hasEmailCounted, markEmailCounted, incrementRef, clearPendingRef, savePendingRef, getRefUserName } from "@/lib/referrals";

function OjoIcon({ visible }: { visible: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(245,208,128,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {visible ? (<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>) : (<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>)}
    </svg>
  );
}

export default function RegistroPage() { return <Suspense><RegistroContent /></Suspense>; }

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
  const [emailBlockedMsg, setEmailBlockedMsg] = useState("");
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => { if (refCode && concursoId) savePendingRef(refCode, concursoId); }, [refCode, concursoId]);

  const BLOCKED_DOMAINS = ["tempmail.com", "guerrillamail.com", "mailinator.com", "throwaway.email", "yopmail.com", "10minutemail.com", "trashmail.com", "fakeinbox.com", "sharklasers.com", "guerrillamailblock.com", "grr.la", "dispostable.com", "maildrop.cc", "temp-mail.org"];
  const checkDisposableEmail = (email: string) => {
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && BLOCKED_DOMAINS.includes(domain)) {
      setEmailBlockedMsg("Este tipo de correo no está permitido. Usa Gmail, Outlook u otro correo personal.");
      return false;
    }
    setEmailBlockedMsg("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setEmailBlockedMsg("");
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!form.email.trim()) return setError("El email es obligatorio.");
    if (!checkDisposableEmail(form.email.trim())) return;
    if (form.password.length < 8) return setError("Mínimo 8 caracteres.");
    if (form.password !== form.confirm) return setError("Las contraseñas no coinciden.");
    if (!form.terms) return setError("Debes aceptar los términos.");
    setLoading(true);
    const res = await register({ type: "user", nombre: form.nombre.trim(), email: form.email.trim(), password: form.password, comuna: "" });
    setLoading(false);
    if (res.success) {
      const pending = getPendingRef(); let msg = ""; let redirectTo = "/";
      if (pending && res.userId && pending.refCode !== res.userId) {
        const em = form.email.trim().toLowerCase();
        if (!hasEmailCounted(pending.concursoId, pending.refCode, em)) {
          markEmailCounted(pending.concursoId, pending.refCode, em);
          // Resolve refCode to real userId
          let referidorId = pending.refCode;
          try {
            const refRes = await fetch(`/api/usuarios/by-refcode?code=${encodeURIComponent(pending.refCode)}`);
            if (refRes.ok) { const refData = await refRes.json(); referidorId = refData.id; }
          } catch {}
          // Create new user's participation with referral (referrer must already be participating)
          try {
            await fetch(`/api/concursos/${pending.concursoId}/participar`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ usuarioId: res.userId, referidoPor: referidorId }),
            });
          } catch {}
          const fn = getRefUserName(pending.refCode);
          const refName = fn || (await fetch(`/api/usuarios/by-refcode?code=${encodeURIComponent(pending.refCode)}`).then(r => r.ok ? r.json() : null).then(d => d?.nombre).catch(() => null));
          msg = refName ? `✅ Le sumaste 2 puntos a ${refName} y ganaste 1 punto.` : "✅ Le sumaste 2 puntos a tu amigo y ganaste 1 punto.";
          redirectTo = `/concursos/${pending.concursoId}`;
        } clearPendingRef();
      }
      setRefMsg(msg); setSuccess(true);
      // Show verification message
      if (!msg) msg = "Revisa tu email para verificar tu cuenta.";
      setRefMsg(msg);
      setTimeout(() => router.push(redirectTo), 2500);
    } else { setError(res.error ?? "Error al crear la cuenta."); }
  };

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textDecoration: "none", marginBottom: "24px", alignSelf: "center", maxWidth: "400px", width: "100%" }}>← Volver al inicio</Link>
      <div style={cardS}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}><div style={{ fontSize: "2rem", marginBottom: "8px" }}>🧞</div><p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)", letterSpacing: "0.2em" }}>DeseoComer</p></div>
        {success ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}><div style={{ fontSize: "2rem", marginBottom: "12px" }}>✨</div><h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", marginBottom: "8px" }}>¡Bienvenido/a!</h2><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)" }}>{refMsg || "Tu cuenta ha sido creada. Redirigiendo..."}</p></div>
        ) : (
          <>
            <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem, 5vw, 1.8rem)", color: "var(--accent)", marginBottom: "8px" }}>Crea tu cuenta</h1>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "28px" }}>¿Ya tienes cuenta? <Link href="/login" style={{ color: "var(--oasis-bright)", fontWeight: 700, textDecoration: "none" }}>Inicia sesión →</Link></p>
            {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "10px", padding: "12px", marginBottom: "16px" }}><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "#ff6b6b" }}>⚠️ {error}</p></div>}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div><label style={labelS}>Nombre completo</label><input style={inputS} type="text" placeholder="Tu nombre" value={form.nombre} onChange={e => set("nombre", e.target.value)} onFocus={fi} onBlur={fo} /></div>
              <div><label style={labelS}>Email</label><input style={inputS} type="email" placeholder="tu@email.com" value={form.email} onChange={e => { set("email", e.target.value); setEmailBlockedMsg(""); }} onFocus={fi} onBlur={fo} />{emailBlockedMsg && <p style={{ fontFamily: "var(--font-lato)", fontSize: "12px", color: "#e05555", marginTop: "6px", lineHeight: 1.4 }}>{emailBlockedMsg}</p>}</div>
              <div><label style={labelS}>Contraseña</label><div style={{ position: "relative" }}><input style={{ ...inputS, paddingRight: "48px" }} type={showPw ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => set("password", e.target.value)} onFocus={fi} onBlur={fo} /><button type="button" onClick={() => setShowPw(s => !s)} style={eyeS}><OjoIcon visible={showPw} /></button></div></div>
              <div><label style={labelS}>Confirmar</label><div style={{ position: "relative" }}><input style={{ ...inputS, paddingRight: "48px" }} type={showConf ? "text" : "password"} placeholder="Repite contraseña" value={form.confirm} onChange={e => set("confirm", e.target.value)} onFocus={fi} onBlur={fo} /><button type="button" onClick={() => setShowConf(s => !s)} style={eyeS}><OjoIcon visible={showConf} /></button></div></div>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}><input type="checkbox" checked={form.terms} onChange={e => set("terms", e.target.checked)} style={{ accentColor: "var(--accent)", width: "18px", height: "18px", marginTop: "2px", flexShrink: 0 }} /><span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5 }}>Acepto los <a href="/terminos" style={{ color: "var(--accent)", textDecoration: "none" }}>Términos</a> y <a href="/privacidad" style={{ color: "var(--accent)", textDecoration: "none" }}>Privacidad</a></span></label>
              <button type="submit" disabled={loading} style={btnS}>{loading ? "Creando..." : "Crear cuenta gratis →"}</button>
            </form>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}><div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} /><span style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.2)" }}>¿Tienes un local?</span><div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} /></div>
            <Link href="/registro-local" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "transparent", border: "1px solid rgba(232,168,76,0.12)", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)", textDecoration: "none" }}>🏪 Registra tu local →</Link>
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
