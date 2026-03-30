"use client";
import { useState, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any;

export default function AdminLocales() {
  const [locales, setLocales] = useState<L[]>([]);
  const [busq, setBusq] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [sel, setSel] = useState<L | null>(null);

  useEffect(() => { fetch("/api/admin/locales").then(r => r.json()).then(d => setLocales(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const toggle = async (id: string, field: string, value: boolean) => {
    await fetch(`/api/admin/locales/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    setLocales(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    if (sel?.id === id) setSel((p: L) => p ? { ...p, [field]: value } : p);
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
            <tr key={l.id} onClick={() => setSel(l)} style={{ cursor: "pointer", transition: "background 0.15s", borderBottom: "1px solid rgba(255,255,255,0.04)" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,168,76,0.06)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <td style={TD}>{l.nombre}</td>
              <td style={{ ...TD, fontSize: "0.75rem", color: "rgba(240,234,214,0.5)" }}>{l.email}</td>
              <td style={TD}>{l.ciudad}</td>
              <td style={TD}>{l.categoria ?? "—"}</td>
              <td style={{ ...TD, textAlign: "center" }}>{l._count?.concursos ?? 0}</td>
              <td style={{ ...TD, textAlign: "center" }}>{l._count?.favoritos ?? 0}</td>
              <td style={TD} onClick={e => e.stopPropagation()}><Toggle on={l.activo} onChange={v => toggle(l.id, "activo", v)} /></td>
              <td style={TD} onClick={e => e.stopPropagation()}><Toggle on={l.verificado} onChange={v => toggle(l.id, "verificado", v)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {sel && (
        <>
          <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
          <div style={PANEL}>
            <button onClick={() => setSel(null)} style={BACK}>← Volver</button>

            {/* Logo + name */}
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia", fontSize: "1.5rem", color: "#1a0e05", fontWeight: 700, marginBottom: "16px" }}>
              {sel.nombre?.charAt(0).toUpperCase()}
            </div>
            <h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.2rem", marginBottom: "4px" }}>{sel.nombre}</h2>
            <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.9rem", marginBottom: "24px" }}>{sel.email}</p>

            <SectionTitle>Información</SectionTitle>
            {[
              { label: "Ciudad", value: sel.ciudad ?? "—" },
              { label: "Categoría", value: sel.categoria ?? "—" },
              { label: "Teléfono", value: sel.telefono ?? "—" },
              { label: "Registrado", value: new Date(sel.createdAt).toLocaleDateString("es-CL") },
            ].map(r => <Row key={r.label} label={r.label} value={r.value} />)}

            <SectionTitle style={{ marginTop: "24px" }}>Estadísticas</SectionTitle>
            {[
              { label: "Concursos", value: String(sel._count?.concursos ?? 0) },
              { label: "Promociones", value: String(sel._count?.promociones ?? 0) },
              { label: "Favoritos recibidos", value: String(sel._count?.favoritos ?? 0) },
            ].map(r => <Row key={r.label} label={r.label} value={r.value} />)}

            {/* Toggles */}
            <div style={{ marginTop: "24px" }}>
              <SectionTitle>Estado</SectionTitle>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.5)" }}>Activo</span>
                <Toggle on={sel.activo} onChange={v => toggle(sel.id, "activo", v)} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.5)" }}>Verificado</span>
                <Toggle on={sel.verificado} onChange={v => toggle(sel.id, "verificado", v)} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href={`/locales/${sel.id}`} target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", borderRadius: "8px", border: "1px solid rgba(232,168,76,0.2)", color: "#e8a84c", textDecoration: "none" }}>Ver local público →</a>
            </div>
          </div>
          <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        </>
      )}
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

function SectionTitle({ children, style }: { children: string; style?: React.CSSProperties }) {
  return <h3 style={{ fontFamily: "Georgia", fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(240,234,214,0.4)", textTransform: "uppercase", marginBottom: "12px", ...style }}>{children}</h3>;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.5)" }}>{label}</span>
      <span style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#f0ead6" }}>{value}</span>
    </div>
  );
}

const I: React.CSSProperties = { padding: "8px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.85rem", outline: "none" };
const B: React.CSSProperties = { padding: "8px 16px", borderRadius: "8px", fontFamily: "Georgia", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" };
const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "8px 10px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", padding: "10px" };
const PANEL: React.CSSProperties = { position: "fixed", top: 0, right: 0, width: "min(420px, 100vw)", height: "100vh", background: "rgba(10,8,18,0.98)", borderLeft: "1px solid rgba(232,168,76,0.2)", zIndex: 1000, overflowY: "auto", padding: "24px", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", animation: "slideIn 0.2s ease" };
const BACK: React.CSSProperties = { background: "none", border: "none", color: "rgba(240,234,214,0.5)", fontSize: "0.85rem", cursor: "pointer", marginBottom: "20px", padding: 0, fontFamily: "Georgia" };
