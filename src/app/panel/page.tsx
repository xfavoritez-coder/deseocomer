"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const SESSION_KEY = "deseocomer_local_session";
const LOCAL_DATA_KEY = "deseocomer_panel_local_data";

function getProfile(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) ?? "{}"); } catch { return {}; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PerfilCheck { label: string; done: boolean }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPerfilChecks(p: any): PerfilCheck[] {
  return [
    { label: "Descripción del local", done: !!p.descripcion },
    { label: "Logo", done: !!p.logoUrl },
    { label: "Foto de portada", done: !!p.portadaUrl },
    { label: "Dirección", done: !!p.direccion },
    { label: "Horarios", done: p.horarios?.length > 0 || (Array.isArray(p.horarios) && p.horarios.length > 0) },
    { label: "Categoría", done: !!p.categoria },
  ];
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPerfilPct(p: any): number {
  const checks = getPerfilChecks(p);
  const done = checks.filter(c => c.done).length;
  return Math.round((done / checks.length) * 100);
}

export default function PanelDashboard() {
  return <Suspense><DashboardContent /></Suspense>;
}

function DashboardContent() {
  const params = useSearchParams();
  const bienvenido = params.get("bienvenido") === "1";
  const [localName, setLocalName] = useState("");
  const [pct, setPct] = useState(0);
  const [checks, setChecks] = useState<PerfilCheck[]>([]);
  const [stats, setStats] = useState({ favoritos: 0, resenas: 0, concursos: 0, promociones: 0 });

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "{}");
      setLocalName(session.nombre ?? "");
      const cached = getProfile();
      if (Object.keys(cached).length > 0) { setPct(getPerfilPct(cached)); setChecks(getPerfilChecks(cached)); }
      if (session.id) {
        fetch(`/api/locales/${session.id}`).then(r => r.ok ? r.json() : null).then(data => {
          if (data) {
            setPct(getPerfilPct(data)); setChecks(getPerfilChecks(data));
            setStats({
              favoritos: data._count?.favoritos ?? 0,
              resenas: data._count?.resenas ?? 0,
              concursos: data._count?.concursos ?? data.concursos?.length ?? 0,
              promociones: data._count?.promociones ?? data.promociones?.length ?? 0,
            });
            const merged = { ...cached, ...data };
            localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(merged));
          }
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const now = new Date();
  const fecha = now.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.3rem, 4vw, 1.8rem)", color: "var(--accent)", marginBottom: "4px" }}>
        Hola, {localName} 👋
      </h1>
      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: bienvenido ? "16px" : "28px", textTransform: "capitalize" }}>{fecha}</p>

      {bienvenido && (
        <div style={{ background: "rgba(61,184,158,0.08)", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "14px", padding: "20px 24px", marginBottom: "28px" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--oasis-bright)", marginBottom: "6px", fontWeight: 700 }}>🎉 ¡Bienvenido a DeseoComer!</p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>Tu local está registrado. Completa tu perfil en <Link href="/panel/mi-local" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Datos Local</Link> para empezar a publicar concursos y promociones.</p>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "Favoritos", value: stats.favoritos, icon: "💛" },
          { label: "Reseñas", value: stats.resenas, icon: "⭐" },
          { label: "Concursos", value: stats.concursos, icon: "🏆" },
          { label: "Promociones", value: stats.promociones, icon: "⚡" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "14px", padding: "16px", textAlign: "center" }}>
            <p style={{ fontSize: "1.4rem", marginBottom: "4px" }}>{s.icon}</p>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.2rem", color: "var(--accent)", fontWeight: 700 }}>{s.value}</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Profile progress */}
      <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "16px", padding: "20px 24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "var(--text-primary)" }}>Tu perfil está {pct}% completo</span>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "var(--accent)" }}>{pct}%</span>
        </div>
        <div style={{ height: "8px", borderRadius: "4px", background: "rgba(0,0,0,0.3)" }}>
          <div style={{ height: "100%", borderRadius: "4px", background: "var(--accent)", width: `${pct}%`, transition: "width 0.5s" }} />
        </div>
        {pct < 100 && checks.length > 0 && (
          <div style={{ marginTop: "14px" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Te falta:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {checks.filter(c => !c.done).map(c => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", border: "1px solid rgba(232,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "rgba(232,168,76,0.4)", flexShrink: 0 }}>○</span>
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>{c.label}</span>
                </div>
              ))}
            </div>
            <Link href="/panel/mi-local" style={{ display: "inline-block", marginTop: "12px", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none", letterSpacing: "0.05em" }}>Completar ahora →</Link>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px" }}>Acciones rápidas</h3>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <Link href="/panel/concursos" style={actionBtn}>🏆 Nuevo concurso</Link>
        <Link href="/panel/promociones" style={actionBtn}>⚡ Nueva promoción</Link>
        <Link href="/panel/mi-local" style={{ ...actionBtn, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)" }}>Completar perfil</Link>
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.08em",
  background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700,
  padding: "12px 24px", borderRadius: "12px", textDecoration: "none",
  display: "inline-flex", alignItems: "center", gap: "6px",
};
