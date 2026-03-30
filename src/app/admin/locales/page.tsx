"use client";
import { useState, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any;

export default function AdminLocales() {
  const [locales, setLocales] = useState<L[]>([]);
  const [busq, setBusq] = useState("");
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => { fetch("/api/admin/locales").then(r => r.json()).then(d => setLocales(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const toggle = async (id: string, field: string, value: boolean) => {
    await fetch(`/api/admin/locales/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    setLocales(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const filtered = locales.filter(l => {
    if (busq && !l.nombre.toLowerCase().includes(busq.toLowerCase()) && !l.email.toLowerCase().includes(busq.toLowerCase())) return false;
    if (filtro === "activos" && !l.activo) return false;
    if (filtro === "inactivos" && l.activo) return false;
    if (filtro === "verificados" && !l.verificado) return false;
    return true;
  });

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", marginBottom: "20px" }}>Locales ({locales.length})</h1>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input style={I} placeholder="Buscar..." value={busq} onChange={e => setBusq(e.target.value)} />
        {["todos", "activos", "inactivos", "verificados"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ ...B, background: filtro === f ? "#e8a84c" : "transparent", color: filtro === f ? "#0a0812" : "rgba(240,234,214,0.5)", border: filtro === f ? "none" : "1px solid rgba(255,255,255,0.1)" }}>{f}</button>
        ))}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Nombre", "Email", "Ciudad", "Cat.", "Concursos", "Favs", "Activo", "Verificado"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.map(l => (
            <tr key={l.id} style={TR}>
              <td style={TD}>{l.nombre}</td>
              <td style={{ ...TD, fontSize: "0.75rem", color: "rgba(240,234,214,0.5)" }}>{l.email}</td>
              <td style={TD}>{l.ciudad}</td>
              <td style={TD}>{l.categoria ?? "—"}</td>
              <td style={{ ...TD, textAlign: "center" }}>{l._count?.concursos ?? 0}</td>
              <td style={{ ...TD, textAlign: "center" }}>{l._count?.favoritos ?? 0}</td>
              <td style={TD}><Toggle on={l.activo} onChange={v => toggle(l.id, "activo", v)} /></td>
              <td style={TD}><Toggle on={l.verificado} onChange={v => toggle(l.id, "verificado", v)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", background: on ? "#e8a84c" : "rgba(255,255,255,0.15)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
      <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: on ? "21px" : "3px", transition: "left 0.2s" }} />
    </button>
  );
}

const I: React.CSSProperties = { padding: "8px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.85rem", outline: "none" };
const B: React.CSSProperties = { padding: "8px 16px", borderRadius: "8px", fontFamily: "Georgia", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" };
const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "8px 10px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.04)" };
const TR: React.CSSProperties = {};
