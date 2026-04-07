"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

function CoordinarContent() {
  const searchParams = useSearchParams();
  const concursoId = searchParams.get("id");
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [concurso, setConcurso] = useState<{ premio: string; local: string; ganador: string; codigo: string } | null>(null);
  const [error, setError] = useState("");
  const [fecha, setFecha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (!concursoId || !token) { setError("Link inválido"); setLoading(false); return; }
    fetch(`/api/concursos/${concursoId}/coordinar-info?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setConcurso(d); })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  }, [concursoId, token]);

  const enviar = async () => {
    if (!fecha.trim()) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/concursos/${concursoId}/coordinar-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fecha }),
      });
      const d = await res.json();
      if (res.ok) setEnviado(true);
      else setError(d.error ?? "Error");
    } catch { setError("Error de conexión"); }
    setEnviando(false);
  };

  if (loading) return <div style={{ textAlign: "center", padding: "120px 20px" }}><p style={{ color: "#e8a84c", fontFamily: "Georgia" }}>Cargando...</p></div>;
  if (error) return <div style={{ textAlign: "center", padding: "120px 20px" }}><p style={{ color: "#ff6b6b", fontFamily: "Georgia" }}>{error}</p></div>;
  if (!concurso) return null;

  if (enviado) return (
    <div style={{ textAlign: "center", padding: "120px 24px", maxWidth: 480, margin: "0 auto" }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>✓</p>
      <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.3rem", color: "#3db89e", marginBottom: 12 }}>Fecha enviada al ganador</h2>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "rgba(240,234,214,0.6)", lineHeight: 1.6 }}>
        Le enviamos un email a <strong style={{ color: "#e8a84c" }}>{concurso.ganador}</strong> con la fecha que propusiste. Cuando se presente, pídele el código <strong style={{ color: "#e8a84c" }}>{concurso.codigo}</strong> para verificar su identidad.
      </p>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.35)", marginTop: 20 }}>
        Después de entregar el premio, entra a tu <a href="/panel/concursos" style={{ color: "#e8a84c", textDecoration: "none" }}>panel</a> para confirmar la entrega y subir una foto.
      </p>
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 24px 60px" }}>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 20, padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>🏆</p>
        <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.2rem", color: "#f5d080", marginBottom: 8 }}>Coordinar entrega del premio</h2>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.5)", lineHeight: 1.6, marginBottom: 20 }}>
          El concurso <strong style={{ color: "#e8a84c" }}>&quot;{concurso.premio}&quot;</strong> finalizó. El ganador es <strong style={{ color: "#e8a84c" }}>{concurso.ganador}</strong>.
        </p>

        <div style={{ textAlign: "left", marginBottom: 20 }}>
          <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: 8 }}>¿Cuándo puede retirar su premio?</label>
          <input
            type="text"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            placeholder="Ej: Miércoles 10 abril, de 14:00 a 20:00"
            style={{ width: "100%", padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, color: "#f0ead6", fontFamily: "var(--font-lato)", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
          />
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", marginTop: 6 }}>
            Indica el día y rango de horario. Le enviaremos esta información al ganador por email.
          </p>
        </div>

        <button onClick={enviar} disabled={enviando || !fecha.trim()} style={{ width: "100%", padding: 16, background: enviando ? "rgba(232,168,76,0.3)" : "#e8a84c", border: "none", borderRadius: 12, fontFamily: "var(--font-cinzel)", fontSize: "0.88rem", fontWeight: 700, color: "#0a0812", cursor: enviando ? "default" : "pointer", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {enviando ? "Enviando..." : "Enviar fecha al ganador"}
        </button>
      </div>
    </div>
  );
}

export default function CoordinarPage() {
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />
      <Suspense fallback={<div style={{ textAlign: "center", padding: "120px 20px" }}><p style={{ color: "#e8a84c", fontFamily: "Georgia" }}>Cargando...</p></div>}>
        <CoordinarContent />
      </Suspense>
      <Footer />
    </main>
  );
}
