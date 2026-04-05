"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Concurso {
  id: string;
  slug: string;
  premio: string;
  imagenUrl: string | null;
  local: string;
  localLogo: string | null;
  puntos: number;
  estado: "activo" | "finalizado" | "ganador" | "programado";
  participantes: number;
}

interface PerfilPublico {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  ciudad: string | null;
  miembroDesde: string;
  totalConcursos: number;
  totalGanados: number;
  mejorPosicion: number | null;
  totalReferidos: number;
  concursos: Concurso[];
}

export default function PerfilUsuarioPage() {
  const { id } = useParams<{ id: string }>();
  const [perfil, setPerfil] = useState<PerfilPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/usuarios/${id}/perfil-publico`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setPerfil(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(232,168,76,0.1)", margin: "0 auto 16px", animation: "dcPulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 20, width: 140, borderRadius: 8, background: "rgba(232,168,76,0.08)", margin: "0 auto 8px", animation: "dcPulse 1.5s ease-in-out infinite" }} />
      <div style={{ height: 14, width: 100, borderRadius: 6, background: "rgba(232,168,76,0.05)", margin: "0 auto", animation: "dcPulse 1.5s ease-in-out infinite" }} />
      <style>{`@keyframes dcPulse { 0%,100% { opacity:0.6; } 50% { opacity:0.2; } }`}</style>
    </div>
  );

  if (error || !perfil) return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <p style={{ fontSize: "2rem", marginBottom: 12 }}>🧞</p>
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--text-muted)" }}>Usuario no encontrado</p>
      <Link href="/concursos" style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)", textDecoration: "underline", marginTop: 12, display: "inline-block" }}>← Volver a concursos</Link>
    </div>
  );

  const miembroDesde = new Date(perfil.miembroDesde).toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const estadoColor: Record<string, { bg: string; border: string; color: string; label: string }> = {
    activo: { bg: "rgba(61,184,158,0.1)", border: "rgba(61,184,158,0.3)", color: "#3db89e", label: "Activo" },
    finalizado: { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", color: "rgba(240,234,214,0.4)", label: "Finalizado" },
    ganador: { bg: "rgba(232,168,76,0.12)", border: "rgba(232,168,76,0.4)", color: "#e8a84c", label: "Ganador 🏆" },
    programado: { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)", color: "#a78bfa", label: "Próximamente" },
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px 60px" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
        {perfil.fotoUrl ? (
          <img src={perfil.fotoUrl} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(232,168,76,0.3)", marginBottom: 14 }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(232,168,76,0.25), rgba(232,168,76,0.08))", border: "2px solid rgba(232,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 28, fontWeight: 700, color: "#e8a84c", marginBottom: 14 }}>
            {perfil.nombre.charAt(0).toUpperCase()}
          </div>
        )}
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.2rem, 4vw, 1.6rem)", color: "#f5d080", margin: "0 0 4px", textAlign: "center" }}>{perfil.nombre}</h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)", margin: 0 }}>Miembro desde {miembroDesde}</p>
        {perfil.totalGanados > 0 && (
          <span style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 20, padding: "4px 14px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", fontWeight: 700, color: "#e8a84c" }}>🏆 Ganador ×{perfil.totalGanados}</span>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 32 }}>
        {[
          { value: perfil.totalConcursos, label: "Concursos" },
          { value: perfil.totalGanados, label: "Ganados" },
          { value: perfil.totalReferidos, label: "Referidos" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 14, padding: "16px 12px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(1.3rem, 4vw, 1.8rem)", fontWeight: 700, color: "#f5d080", margin: "0 0 4px" }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Concursos */}
      {perfil.concursos.length > 0 && (
        <div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: 14 }}>Historial de concursos</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {perfil.concursos.map(c => {
              const est = estadoColor[c.estado] ?? estadoColor.finalizado;
              return (
                <Link key={c.id} href={`/concursos/${c.slug || c.id}`} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 14, padding: 12, textDecoration: "none", transition: "border-color 0.2s" }}>
                  {c.imagenUrl ? (
                    <img src={c.imagenUrl} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(232,168,76,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "1.3rem" }}>🏆</span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#f0ead6", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.premio}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {c.localLogo ? (
                        <img src={c.localLogo} alt="" style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover" }} />
                      ) : null}
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)" }}>{c.local}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", padding: "3px 10px", borderRadius: 20, background: est.bg, border: `1px solid ${est.border}`, color: est.color, whiteSpace: "nowrap" }}>{est.label}</span>
                    <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)" }}>{c.puntos} pts</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {perfil.concursos.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 20px" }}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "rgba(240,234,214,0.35)" }}>Aún no ha participado en concursos</p>
        </div>
      )}
    </div>
  );
}
