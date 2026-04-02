"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function generarPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}

const L: React.CSSProperties = { fontSize: 9, color: "rgba(80,60,20,0.45)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, marginBottom: 4, display: "block" };
const I: React.CSSProperties = { background: "#faf7f2", border: "1px solid rgba(180,130,40,0.2)", borderRadius: 10, padding: "11px 14px", fontSize: 14, color: "#3a2c0a", fontFamily: "var(--font-lato), Lato, sans-serif", width: "100%", outline: "none", boxSizing: "border-box" };

export default function UnetePage() {
  return <Suspense><UneteInner /></Suspense>;
}

function UneteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [nombreLocal, setNombreLocal] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [emailUsado, setEmailUsado] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("deseocomer_captador_ref", ref);
  }, [searchParams]);

  const canSubmit = nombreLocal.trim() && nombre.trim() && email.trim() && telefono.trim();

  const handleSubmit = async () => {
    if (!canSubmit || saving) return;
    const errs: Record<string, string> = {};
    if (!nombreLocal.trim()) errs.nombreLocal = "Requerido";
    if (!nombre.trim()) errs.nombre = "Requerido";
    if (!email.trim() || !email.includes("@")) errs.email = "Ingresa un email válido";
    if (!telefono.trim()) errs.telefono = "Requerido";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    setEmailUsado("");

    const pw = generarPassword();
    const captadorCodigo = localStorage.getItem("deseocomer_captador_ref") || "";
    try {
      const res = await fetch("/api/locales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreLocal.trim(),
          nombreDueno: nombre.trim(),
          nombreEncargado: nombre.trim(),
          email: email.trim().toLowerCase(),
          telefono: telefono.trim(),
          password: pw,
          ciudad: "Santiago",
          registroRapido: true,
          passwordPlain: pw,
          captadorCodigo,
        }),
      });

      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.error?.includes("ya está registrado")) {
          setEmailUsado(email.trim());
        } else {
          setErrors({ general: data.error ?? "Error al registrar. Intenta de nuevo." });
        }
      }
    } catch {
      setErrors({ general: "Error de conexión. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#f5f0e8", fontFamily: "var(--font-lato), Lato, sans-serif", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", margin: 0 }}>
      <div style={{ background: "#fff", border: "1px solid rgba(180,130,40,0.2)", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(180,130,40,0.12)", width: "100%", maxWidth: 340 }}>

        {/* Hero */}
        <div style={{ background: "linear-gradient(135deg, #e8a84c 0%, #d4922a 100%)", padding: "28px 24px 22px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🧞</div>
          <p style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", fontSize: 18, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, margin: "0 0 6px" }}>Únete a DeseoComer</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.5 }}>Solo 4 datos y tu local estará en la plataforma.<br />El resto lo completas después con calma.</p>
        </div>

        {done ? (
          /* Success screen */
          <div style={{ padding: "40px 24px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontFamily: "var(--font-cinzel), Cinzel, serif", fontSize: 20, color: "#2a6010", fontWeight: 700, marginBottom: 12 }}>¡Ya estás dentro!</p>
            <p style={{ fontSize: 13, color: "rgba(80,60,20,0.6)", lineHeight: 1.6, marginBottom: 24 }}>
              Te enviamos un correo a <strong style={{ color: "#3a2c0a" }}>{email}</strong> con tus datos de acceso. Entra al panel y completa tu perfil para aparecer en DeseoComer.
            </p>
            <button onClick={() => router.push("/login-local")} style={{ width: "100%", padding: 14, background: "#e8a84c", border: "none", borderRadius: 12, fontFamily: "var(--font-cinzel), Cinzel, serif", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer" }}>
              Ir al panel →
            </button>
          </div>
        ) : (
          /* Form */
          <div style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {errors.general && <p style={{ fontSize: 12, color: "#e05555", textAlign: "center", margin: 0 }}>{errors.general}</p>}

            <div>
              <label style={L}>Nombre del local</label>
              <input style={I} value={nombreLocal} onChange={e => setNombreLocal(e.target.value)} placeholder="Ej: Sushi Oasis" />
              {errors.nombreLocal && <p style={{ fontSize: 12, color: "#e05555", margin: "4px 0 0" }}>{errors.nombreLocal}</p>}
            </div>

            <div>
              <label style={L}>Tu nombre</label>
              <input style={I} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Carlos Rodríguez" />
              {errors.nombre && <p style={{ fontSize: 12, color: "#e05555", margin: "4px 0 0" }}>{errors.nombre}</p>}
            </div>

            <div style={{ height: 1, background: "rgba(180,130,40,0.1)" }} />

            <div>
              <label style={L}>Correo electrónico</label>
              <input style={I} type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailUsado(""); }} placeholder="tu@correo.com" />
              {errors.email && <p style={{ fontSize: 12, color: "#e05555", margin: "4px 0 0" }}>{errors.email}</p>}
              {emailUsado && (
                <p style={{ fontSize: 12, color: "#e05555", margin: "4px 0 0" }}>
                  Este correo ya está registrado. <Link href="/login-local" style={{ color: "#c47f1a", fontWeight: 700 }}>¿Quieres iniciar sesión?</Link>
                </p>
              )}
            </div>

            <div>
              <label style={L}>Teléfono</label>
              <input style={I} type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+56 9 1234 5678" />
              {errors.telefono && <p style={{ fontSize: 12, color: "#e05555", margin: "4px 0 0" }}>{errors.telefono}</p>}
            </div>

            <button onClick={handleSubmit} disabled={!canSubmit || saving} style={{ width: "100%", padding: 14, background: "#e8a84c", border: "none", borderRadius: 12, fontFamily: "var(--font-cinzel), Cinzel, serif", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer", marginTop: 4, opacity: canSubmit && !saving ? 1 : 0.5 }}>
              {saving ? "Registrando..." : "Registrarse →"}
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "0 20px 20px", fontSize: 11, color: "rgba(80,60,20,0.35)" }}>
          Al registrarte aceptas nuestros{" "}
          <Link href="/terminos" style={{ color: "#c47f1a" }}>Términos y Condiciones</Link>
          . Es completamente gratis.
        </div>
      </div>
    </div>
  );
}
