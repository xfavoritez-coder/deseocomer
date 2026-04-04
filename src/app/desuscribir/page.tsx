"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function DesuscribirPage() {
  return <Suspense><DesuscribirContent /></Suspense>;
}

function DesuscribirContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [estado, setEstado] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    if (email) handleDesuscribir();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDesuscribir = async () => {
    if (!email) return;
    setEstado("loading");
    try {
      const res = await fetch("/api/desuscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setEstado("done");
      else setEstado("error");
    } catch {
      setEstado("error");
    }
  };

  return (
    <main style={{ background: "#f0ece4", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Georgia, serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "48px 32px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 4px 24px rgba(180,130,40,0.1)" }}>
        <p style={{ fontSize: 40, marginBottom: 16 }}>🧞</p>

        {estado === "loading" && (
          <p style={{ fontSize: 16, color: "#8a6030" }}>Procesando...</p>
        )}

        {estado === "done" && (
          <>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>✓</div>
            <h1 style={{ fontSize: 22, color: "#2a1a00", marginBottom: 12 }}>Desuscripción exitosa</h1>
            <p style={{ fontSize: 15, color: "#8a6030", lineHeight: 1.6, marginBottom: 16 }}>
              No recibirás más correos promocionales de DeseoComer en <strong style={{ color: "#2a1a00" }}>{email}</strong>.
            </p>
            <div style={{ background: "#faf6ee", border: "1px solid rgba(180,130,40,0.15)", borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "left" }}>
              <p style={{ fontSize: 14, color: "#5a4010", lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: "#2a1a00" }}>¿No tienes un local?</strong> DeseoComer no es solo para restaurantes. En nuestra plataforma puedes descubrir los mejores locales de tu ciudad, participar en concursos para ganar comida gratis y encontrar promociones cerca de ti.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/" style={{ display: "block", padding: "14px 28px", background: "#e8a84c", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "#0a0812", textDecoration: "none", letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "center" }}>
                Descubrir DeseoComer →
              </Link>
              <Link href="/registro" style={{ display: "block", padding: "12px 28px", background: "transparent", border: "1px solid rgba(180,130,40,0.3)", borderRadius: 10, fontSize: 13, color: "#8a6030", textDecoration: "none", textAlign: "center" }}>
                Crear cuenta gratis y ganar comida
              </Link>
            </div>
          </>
        )}

        {estado === "error" && (
          <>
            <h1 style={{ fontSize: 22, color: "#2a1a00", marginBottom: 12 }}>Hubo un error</h1>
            <p style={{ fontSize: 15, color: "#8a6030", lineHeight: 1.6, marginBottom: 24 }}>
              No pudimos procesar tu solicitud. Intenta de nuevo o escríbenos a hola@deseocomer.com.
            </p>
            <button onClick={handleDesuscribir} style={{ padding: "12px 28px", background: "#e8a84c", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "#0a0812", cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Reintentar
            </button>
          </>
        )}

        {estado === "idle" && !email && (
          <>
            <h1 style={{ fontSize: 22, color: "#2a1a00", marginBottom: 12 }}>Desuscribirse</h1>
            <p style={{ fontSize: 15, color: "#8a6030", lineHeight: 1.6 }}>
              No se proporcionó un email. Si llegaste aquí por error, puedes volver a la web.
            </p>
            <Link href="/" style={{ display: "inline-block", marginTop: 20, padding: "12px 28px", background: "#e8a84c", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "#0a0812", textDecoration: "none" }}>
              Ir a DeseoComer →
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
