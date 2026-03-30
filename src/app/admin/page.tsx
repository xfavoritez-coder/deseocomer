"use client";
import { useState, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = any;

export default function AdminDashboard() {
  const [stats, setStats] = useState<S>(null);

  useEffect(() => { fetch("/api/admin/stats").then(r => r.json()).then(setStats).catch(() => {}); }, []);

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

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", marginBottom: "24px" }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "32px" }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "18px", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "6px" }}>{c.icon}</div>
            <p style={{ fontFamily: "Georgia", fontSize: "1.6rem", color: "#e8a84c", lineHeight: 1 }}>{c.value}</p>
            <p style={{ fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", marginTop: "6px" }}>{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <h3 style={TH}>Últimos usuarios</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Nombre", "Email", "Ciudad", "Fecha"].map(h => <th key={h} style={THC}>{h}</th>)}</tr></thead>
            <tbody>{(stats.ultimosUsuarios ?? []).map((u: S) => <tr key={u.id} style={TR}><td style={TD}>{u.nombre}</td><td style={TD}>{u.email}</td><td style={TD}>{u.ciudad}</td><td style={TD}>{new Date(u.createdAt).toLocaleDateString("es-CL")}</td></tr>)}</tbody>
          </table>
        </div>
        <div>
          <h3 style={TH}>Últimos locales</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Nombre", "Email", "Ciudad", "Estado"].map(h => <th key={h} style={THC}>{h}</th>)}</tr></thead>
            <tbody>{(stats.ultimosLocales ?? []).map((l: S) => <tr key={l.id} style={TR}><td style={TD}>{l.nombre}</td><td style={TD}>{l.email}</td><td style={TD}>{l.ciudad}</td><td style={TD}><span style={{ color: l.activo ? "#3db89e" : "#ff6b6b", fontSize: "0.75rem" }}>{l.activo ? "Activo" : "Inactivo"}</span>{l.verificado && " ✓"}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#e8a84c", marginBottom: "12px" };
const THC: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "8px 12px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", padding: "10px 12px" };
const TR: React.CSSProperties = { borderBottom: "1px solid rgba(255,255,255,0.04)" };
