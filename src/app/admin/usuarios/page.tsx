"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = any;

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<U[]>([]);
  const [busq, setBusq] = useState("");
  const [sel, setSel] = useState<U | null>(null);

  useEffect(() => { adminFetch("/api/admin/usuarios").then(r => r.json()).then(d => setUsuarios(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const filtered = usuarios.filter(u => !busq || u.nombre.toLowerCase().includes(busq.toLowerCase()) || u.email.toLowerCase().includes(busq.toLowerCase()));

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", marginBottom: "20px" }}>Usuarios ({usuarios.length})</h1>
      <input style={I} placeholder="Buscar por nombre o email..." value={busq} onChange={e => setBusq(e.target.value)} />
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
        <thead><tr>{["Nombre", "Email", "Ciudad", "Favs", "Reseñas", "Concursos", "Cumple", "Registro"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.map(u => (
            <tr key={u.id} onClick={() => setSel(u)} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,168,76,0.06)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <td style={TD}>{u.nombre}</td>
              <td style={{ ...TD, fontSize: "0.75rem", color: "rgba(240,234,214,0.5)" }}>{u.email}</td>
              <td style={TD}>{u.ciudad ?? "—"}</td>
              <td style={{ ...TD, textAlign: "center" }}>{u._count?.favoritos ?? 0}</td>
              <td style={{ ...TD, textAlign: "center" }}>{u._count?.resenas ?? 0}</td>
              <td style={{ ...TD, textAlign: "center" }}>{u._count?.participaciones ?? 0}</td>
              <td style={{ ...TD, textAlign: "center" }}>{u.cumpleMes ? `🎂 ${u.cumpleDia}/${u.cumpleMes}` : "—"}</td>
              <td style={{ ...TD, fontSize: "0.75rem" }}>{new Date(u.createdAt).toLocaleDateString("es-CL")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {sel && (
        <>
          <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
          <div style={PANEL}>
            <button onClick={() => setSel(null)} style={BACK}>← Volver</button>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia", fontSize: "1.5rem", color: "#1a0e05", fontWeight: 700, marginBottom: "16px" }}>
              {sel.nombre?.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.2rem", marginBottom: "4px" }}>{sel.nombre}</h2>
            <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.9rem", marginBottom: "24px" }}>{sel.email}</p>
            <SectionTitle>Información</SectionTitle>
            {[
              { label: "Ciudad", value: sel.ciudad ?? "—" },
              { label: "Registrado", value: new Date(sel.createdAt).toLocaleDateString("es-CL") },
              { label: "Cumpleaños", value: sel.cumpleDia ? `${sel.cumpleDia}/${sel.cumpleMes}/${sel.cumpleAnio}` : "No registrado" },
              { label: "Favoritos", value: sel._count?.favoritos ?? 0 },
              { label: "Reseñas", value: sel._count?.resenas ?? 0 },
              { label: "Concursos", value: sel._count?.participaciones ?? 0 },
            ].map(r => <Row key={r.label} label={r.label} value={String(r.value)} />)}
          </div>
          <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        </>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h3 style={{ fontFamily: "Georgia", fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(240,234,214,0.4)", textTransform: "uppercase", marginBottom: "12px" }}>{children}</h3>;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.5)" }}>{label}</span>
      <span style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#f0ead6" }}>{value}</span>
    </div>
  );
}

const I: React.CSSProperties = { padding: "8px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.85rem", outline: "none", width: "300px" };
const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "8px 10px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", padding: "10px" };
const PANEL: React.CSSProperties = { position: "fixed", top: 0, right: 0, width: "min(420px, 100vw)", height: "100vh", background: "rgba(10,8,18,0.98)", borderLeft: "1px solid rgba(232,168,76,0.2)", zIndex: 1000, overflowY: "auto", padding: "24px", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", animation: "slideIn 0.2s ease" };
const BACK: React.CSSProperties = { background: "none", border: "none", color: "rgba(240,234,214,0.5)", fontSize: "0.85rem", cursor: "pointer", marginBottom: "20px", padding: 0, fontFamily: "Georgia" };
