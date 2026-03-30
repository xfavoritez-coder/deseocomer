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

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    fetch(`/api/verificar-email?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) { setStatus("ok"); setNombre(data.nombre ?? ""); }
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <main style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "420px", width: "100%", background: "rgba(45,26,8,0.9)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", textAlign: "center" }}>
        {status === "loading" && (
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)" }}>Verificando tu email... 🧞</p>
        )}
        {status === "ok" && (
          <>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✨</div>
            <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", color: "var(--accent)", marginBottom: "12px" }}>¡Email verificado!</h1>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "24px" }}>
              {nombre ? `Hola ${nombre}, tu` : "Tu"} cuenta está activa. Ya puedes participar en concursos y guardar favoritos.
            </p>
            <Link href="/" style={{ display: "inline-block", background: "var(--accent)", color: "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", fontWeight: 700, padding: "14px 32px", borderRadius: "12px", textDecoration: "none" }}>
              Ir a DeseoComer →
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>😕</div>
            <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "12px" }}>Link inválido o expirado</h1>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>El link de verificación ya fue usado o expiró.</p>
            <Link href="/" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--oasis-bright)", textDecoration: "none" }}>← Volver al inicio</Link>
          </>
        )}
      </div>
    </main>
  );
}
