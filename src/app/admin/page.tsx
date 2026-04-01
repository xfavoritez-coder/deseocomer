"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

export default function AdminDashboard() {
  const [stats, setStats] = useState<S>(null);

  const [error, setError] = useState(false);
  useEffect(() => { adminFetch("/api/admin/stats").then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setStats).catch(() => setError(true)); }, []);

  if (error) return <div style={{ textAlign: "center", padding: "60px 20px" }}><p style={{ fontSize: "2rem", marginBottom: "12px" }}>⚠️</p><p style={{ color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.9rem" }}>Error al cargar datos. Vuelve a iniciar sesión.</p><a href="/admin/login" style={{ color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.8rem" }}>Ir al login →</a></div>;
  if (!stats) return <p style={{ color: "rgba(240,234,214,0.5)", fontFamily: "Georgia" }}>Cargando...</p>;

  const cards = [
    { icon: "👥", label: "Usuarios", value: stats.totalUsuarios },
    { icon: "🏠", label: "Locales activos", value: `${stats.localesActivos}/${stats.totalLocales}` },
    { icon: "🏆", label: "Concursos activos", value: stats.concursosActivos },
    { icon: "⚡", label: "Promociones", value: stats.totalPromociones },
    { icon: "❤️", label: "Favoritos", value: stats.totalFavoritos },
    { icon: "⭐", label: "Reseñas", value: stats.totalResenas },
    { icon: "📋", label: "Lista espera", value: stats.listaEspera },
    { icon: "📅", label: "Total concursos", value: stats.totalConcursos },
  ];

  const pendientes = (stats.totalLocales ?? 0) - (stats.localesActivos ?? 0);

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", marginBottom: "24px" }}>Dashboard</h1>

      {pendientes > 0 && (
        <div style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.25)", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "1.2rem" }}>🔔</span>
          <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#ff8080", flex: 1, margin: 0 }}>Tienes <strong>{pendientes} {pendientes === 1 ? "local pendiente" : "locales pendientes"}</strong> de aprobación</p>
          <a href="/admin/locales" style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#0a0812", background: "#e8a84c", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, whiteSpace: "nowrap" }}>Revisar ahora →</a>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "32px" }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "18px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "6px" }}>{c.icon}</div>
            <p style={{ fontFamily: "Georgia", fontSize: "1.6rem", color: "#e8a84c", lineHeight: 1 }}>{c.value}</p>
            <p style={{ fontFamily: "Georgia", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", marginTop: "6px" }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div className="adm-tables">
        <div>
          <h3 style={TH}>Últimos usuarios</h3>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
            <thead><tr>{["Nombre", "Email", "Ciudad", "Fecha"].map(h => <th key={h} style={THC}>{h}</th>)}</tr></thead>
            <tbody>{(stats.ultimosUsuarios ?? []).map((u: S) => <tr key={u.id} style={TR}><td style={TD}>{u.nombre}</td><td style={TD}>{u.email}</td><td style={TD}>{u.ciudad}</td><td style={TD}>{new Date(u.createdAt).toLocaleDateString("es-CL")}</td></tr>)}</tbody>
          </table>
          </div>
        </div>
        <div>
          <h3 style={TH}>Últimos locales</h3>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "400px" }}>
            <thead><tr>{["Nombre", "Email", "Ciudad", "Estado"].map(h => <th key={h} style={THC}>{h}</th>)}</tr></thead>
            <tbody>{(stats.ultimosLocales ?? []).map((l: S) => <tr key={l.id} style={TR}><td style={TD}>{l.nombre}</td><td style={TD}>{l.email}</td><td style={TD}>{l.ciudad}</td><td style={TD}><span style={{ color: l.activo ? "#3db89e" : "#ff6b6b", fontSize: "0.82rem" }}>{l.activo ? "Activo" : "Inactivo"}</span>{l.verificado && " ✓"}</td></tr>)}</tbody>
          </table>
          </div>
        </div>
      </div>

      <style>{`
        .adm-tables { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 767px) { .adm-tables { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.78rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#e8a84c", marginBottom: "12px" };
const THC: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "8px 12px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", padding: "10px 12px" };
const TR: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.04)" };
