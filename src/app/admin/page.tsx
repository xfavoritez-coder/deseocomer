"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

export default function AdminDashboard() {
  const [stats, setStats] = useState<S>(null);
  const [sospechosos, setSospechosos] = useState<S[]>([]);

  const [error, setError] = useState(false);
  useEffect(() => {
    adminFetch("/api/admin/stats").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setStats).catch(() => setError(true));
    // Load precalculated sospechosos from cache (no heavy queries)
    adminFetch("/api/admin/stats-cache").then(r => r.json()).then(d => { if (d.sospechosos) setSospechosos(d.sospechosos); }).catch(() => {});
  }, []);

  if (error) return <div style={{ textAlign: "center", padding: "60px 20px" }}><p style={{ fontSize: "2rem", marginBottom: "12px" }}>⚠️</p><p style={{ color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.9rem" }}>Error al cargar datos. Vuelve a iniciar sesión.</p><a href="/admin/login" style={{ color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.8rem" }}>Ir al login →</a></div>;
  if (!stats) return <p style={{ color: "rgba(240,234,214,0.5)", fontFamily: "Georgia" }}>Cargando...</p>;

  const cards = [
    { icon: "👥", label: "Usuarios", value: stats.totalUsuarios },
    { icon: "🏠", label: "Locales activos", value: `${stats.localesActivos}/${stats.totalLocales}` },
    { icon: "🏆", label: "Concursos activos", value: stats.concursosActivos },
    { icon: "⚡", label: "Promociones", value: stats.totalPromociones },
    { icon: "💛", label: "Favoritos", value: stats.totalFavoritos },
    { icon: "⭐", label: "Reseñas", value: stats.totalResenas },
    { icon: "📋", label: "Lista espera", value: stats.listaEspera },
    { icon: "📅", label: "Total concursos", value: stats.totalConcursos },
  ];

  const manualesPendientes = stats.localesManualesPendientes ?? 0;
  const reclamadosPendientes = stats.localesReclamadosPendientes ?? 0;

  return (
    <div>
      <h1 className="adm-dash-title" style={{ fontFamily: "Georgia", color: "#e8a84c", marginBottom: "24px" }}>Dashboard</h1>

      {manualesPendientes > 0 && (
        <div style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: "14px", padding: "16px 20px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", maxWidth: "100%", overflow: "hidden", boxSizing: "border-box" }}>
          <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🔔</span>
          <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#ff8080", flex: 1, margin: 0, minWidth: 0 }}>Tienes <strong>{manualesPendientes} {manualesPendientes === 1 ? "local" : "locales"}</strong> pendientes de aprobación</p>
          <a href="/admin/locales" style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#0a0812", background: "#e8a84c", padding: "8px 16px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>Revisar →</a>
        </div>
      )}
      {reclamadosPendientes > 0 && (
        <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "14px", padding: "16px 20px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", maxWidth: "100%", overflow: "hidden", boxSizing: "border-box" }}>
          <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>🏪</span>
          <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#a78bfa", flex: 1, margin: 0, minWidth: 0 }}><strong>{reclamadosPendientes} {reclamadosPendientes === 1 ? "local reclamado" : "locales reclamados"}</strong> esperando aprobación</p>
          <a href="/admin/locales" style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#0a0812", background: "#a78bfa", padding: "8px 16px", borderRadius: "10px", textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>Revisar →</a>
        </div>
      )}
      <div className="adm-dash-cards" style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
            <div className="adm-dash-card-icon" style={{ marginBottom: "6px" }}>{c.icon}</div>
            <p className="adm-dash-card-value" style={{ fontFamily: "Georgia", color: "#e8a84c", lineHeight: 1 }}>{c.value}</p>
            <p className="adm-dash-card-label" style={{ fontFamily: "Georgia", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,234,214,0.55)", marginTop: "8px" }}>{c.label}</p>
          </div>
        ))}
      </div>

      {/* Usuarios sospechosos */}
      {sospechosos.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ ...TH, color: "#ff6b6b" }}>🚨 Usuarios sospechosos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sospechosos.map((s: S, i: number) => (
              <a key={i} href={`/admin/usuarios?busq=${encodeURIComponent(s.email)}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: s.riesgo >= 60 ? "rgba(255,80,80,0.06)" : "rgba(232,168,76,0.04)", border: `1px solid ${s.riesgo >= 60 ? "rgba(255,80,80,0.15)" : "rgba(232,168,76,0.12)"}`, borderRadius: 10, textDecoration: "none", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", padding: "3px 8px", borderRadius: 8, background: s.riesgo >= 60 ? "rgba(255,80,80,0.2)" : s.riesgo >= 30 ? "rgba(232,168,76,0.2)" : "rgba(61,184,158,0.15)", color: s.riesgo >= 60 ? "#ff6b6b" : s.riesgo >= 30 ? "#e8a84c" : "#3db89e", fontWeight: 700, flexShrink: 0 }}>{s.riesgo}%</span>
                <span style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "#f0ead6", fontWeight: 600 }}>{s.nombre}</span>
                <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.35)" }}>{s.puntos} pts · {s.concurso}</span>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginLeft: "auto" }}>
                  {s.flags.map((f: string, fi: number) => (
                    <span key={fi} style={{ fontFamily: "Georgia", fontSize: "0.65rem", padding: "2px 6px", borderRadius: 6, background: "rgba(255,80,80,0.1)", color: "#ff8080" }}>{f}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="adm-tables">
        <div>
          <h3 style={TH}>Últimos usuarios</h3>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "340px" }}>
            <thead><tr>{["Nombre", "Email", "Ciudad", "Fecha"].map(h => <th key={h} style={THC}>{h}</th>)}</tr></thead>
            <tbody>{(stats.ultimosUsuarios ?? []).map((u: S) => <tr key={u.id} style={TR}><td style={TD}>{u.nombre}</td><td style={TD}>{u.email}</td><td style={TD}>{u.ciudad}</td><td style={TD}>{new Date(u.createdAt).toLocaleDateString("es-CL")}</td></tr>)}</tbody>
          </table>
          </div>
        </div>
        <div>
          <h3 style={TH}>Últimos locales</h3>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "340px" }}>
            <thead><tr>{["Nombre", "Email", "Ciudad", "Estado"].map(h => <th key={h} style={THC}>{h}</th>)}</tr></thead>
            <tbody>{(stats.ultimosLocales ?? []).map((l: S) => <tr key={l.id} style={TR}><td style={TD}>{l.nombre}</td><td style={TD}>{l.email}</td><td style={TD}>{l.ciudad}</td><td style={TD}><span style={{ color: l.activo ? "#3db89e" : "#ff6b6b" }}>{l.activo ? "Activo" : "Inactivo"}</span></td></tr>)}</tbody>
          </table>
          </div>
        </div>
      </div>

      <style>{`
        .adm-dash-title { font-size: 1.5rem; }
        .adm-dash-alert-text { font-size: 0.9rem; }
        .adm-dash-alert-btn { font-size: 0.88rem; }
        .adm-dash-cards { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
        .adm-dash-card-icon { font-size: 1.3rem; }
        .adm-dash-card-value { font-size: 1.6rem; }
        .adm-dash-card-label { font-size: 0.76rem; }
        .adm-tables { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 767px) {
          .adm-dash-title { font-size: 1.8rem; }
          .adm-dash-alert-text { font-size: 1rem; }
          .adm-dash-alert-btn { font-size: 1rem; padding: 12px 22px; }
          .adm-dash-cards { grid-template-columns: repeat(2, 1fr); }
          .adm-dash-card-icon { font-size: 1.6rem; }
          .adm-dash-card-value { font-size: 2rem; }
          .adm-dash-card-label { font-size: 0.85rem; }
          .adm-tables { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#e8a84c", marginBottom: "12px" };
const THC: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.55)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "10px 12px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.9rem", color: "#f0ead6", padding: "12px" };
const TR: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.04)" };
