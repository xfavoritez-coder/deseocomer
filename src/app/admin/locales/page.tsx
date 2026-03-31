"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any;

export default function AdminLocales() {
  const [locales, setLocales] = useState<L[]>([]);
  const [busq, setBusq] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [sel, setSel] = useState<L | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [showRechazoForm, setShowRechazoForm] = useState(false);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => { adminFetch("/api/admin/locales").then(r => r.json()).then(d => setLocales(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3500); };

  const handleAprobar = async (local: L) => {
    setLoadingAccion(true);
    try {
      await adminFetch(`/api/admin/locales/${local.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "aprobar" }) });
      setLocales(prev => prev.map(l => l.id === local.id ? { ...l, activo: true } : l));
      if (sel?.id === local.id) setSel((p: L) => p ? { ...p, activo: true } : p);
      showToast(`✓ ${local.nombre} aprobado y notificado por email`);
    } catch { showToast("Error al aprobar"); }
    setLoadingAccion(false);
  };

  const handleRechazar = async (local: L) => {
    setLoadingAccion(true);
    try {
      await adminFetch(`/api/admin/locales/${local.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "rechazar", motivoRechazo: motivoRechazo || null }) });
      setLocales(prev => prev.map(l => l.id === local.id ? { ...l, activo: false } : l));
      if (sel?.id === local.id) setSel((p: L) => p ? { ...p, activo: false } : p);
      setShowRechazoForm(false); setMotivoRechazo("");
      showToast("Local rechazado y notificado por email");
    } catch { showToast("Error al rechazar"); }
    setLoadingAccion(false);
  };

  const pendientes = locales.filter(l => !l.activo).length;
  const activos = locales.filter(l => l.activo).length;

  const filtered = locales.filter(l => {
    if (busq && !l.nombre.toLowerCase().includes(busq.toLowerCase()) && !l.email.toLowerCase().includes(busq.toLowerCase())) return false;
    if (filtro === "activos" && !l.activo) return false;
    if (filtro === "pendientes" && l.activo) return false;
    return true;
  });

  return (
    <div>
      {toastMsg && <div style={{ position: "fixed", top: "24px", right: "24px", background: "rgba(13,7,3,0.97)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "12px", padding: "12px 20px", fontFamily: "Georgia", fontSize: "0.85rem", color: "#e8a84c", zIndex: 9999, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>{toastMsg}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", margin: 0 }}>Locales ({locales.length})</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: "8px", padding: "6px 14px", fontFamily: "Georgia", fontSize: "0.8rem" }}><span style={{ color: "#ff8080" }}>{pendientes} pendientes</span></div>
          <div style={{ background: "rgba(61,184,158,0.1)", border: "1px solid rgba(61,184,158,0.2)", borderRadius: "8px", padding: "6px 14px", fontFamily: "Georgia", fontSize: "0.8rem" }}><span style={{ color: "#3db89e" }}>{activos} activos</span></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input style={I} placeholder="Buscar por nombre o email..." value={busq} onChange={e => setBusq(e.target.value)} />
        {[{ key: "todos", label: "Todos" }, { key: "pendientes", label: `Pendientes (${pendientes})` }, { key: "activos", label: `Activos (${activos})` }].map(f => (
          <button key={f.key} onClick={() => setFiltro(f.key)} style={{ ...B, background: filtro === f.key ? "#e8a84c" : "transparent", color: filtro === f.key ? "#0a0812" : "rgba(240,234,214,0.5)", border: filtro === f.key ? "none" : "1px solid rgba(255,255,255,0.1)" }}>{f.label}</button>
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Local", "Email", "Ciudad", "Registrado", "Estado", "Acción"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.map(l => (
            <tr key={l.id} onClick={() => { setSel(l); setShowRechazoForm(false); setMotivoRechazo(""); }} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,168,76,0.06)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
              <td style={TD}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #2a7a6f, #3db89e)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia", fontSize: "0.7rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{l.nombre?.charAt(0).toUpperCase()}</div><span>{l.nombre}</span></div></td>
              <td style={{ ...TD, fontSize: "0.75rem", color: "rgba(240,234,214,0.5)" }}>{l.email}</td>
              <td style={TD}>{l.ciudad ?? "—"}</td>
              <td style={{ ...TD, fontSize: "0.75rem", color: "rgba(240,234,214,0.5)" }}>{new Date(l.createdAt).toLocaleDateString("es-CL")}</td>
              <td style={TD}><span style={{ fontSize: "0.72rem", fontWeight: 700, color: l.activo ? "#3db89e" : "#ff8080", background: l.activo ? "rgba(61,184,158,0.1)" : "rgba(255,100,100,0.1)", border: `1px solid ${l.activo ? "rgba(61,184,158,0.3)" : "rgba(255,100,100,0.3)"}`, borderRadius: "20px", padding: "3px 10px" }}>{l.activo ? "✓ Activo" : "⏳ Pendiente"}</span></td>
              <td style={TD} onClick={e => e.stopPropagation()}>{!l.activo ? <button onClick={() => handleAprobar(l)} disabled={loadingAccion} style={{ background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.4)", borderRadius: "6px", color: "#3db89e", fontFamily: "Georgia", fontSize: "0.65rem", padding: "4px 12px", cursor: "pointer" }}>✓ Aprobar</button> : <span style={{ fontSize: "0.72rem", color: "rgba(240,234,214,0.3)" }}>Activo</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {sel && (
        <>
          <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
          <div style={PANEL}>
            <button onClick={() => setSel(null)} style={BACK}>← Volver</button>
            <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #2a7a6f, #3db89e)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia", fontSize: "1.2rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{sel.nombre?.charAt(0).toUpperCase()}</div>
              <div><h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.1rem", margin: "0 0 2px" }}>{sel.nombre}</h2><p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.8rem", margin: 0 }}>{sel.email}</p></div>
            </div>
            <div style={{ marginBottom: "20px" }}><span style={{ fontSize: "0.72rem", fontWeight: 700, color: sel.activo ? "#3db89e" : "#ff8080", background: sel.activo ? "rgba(61,184,158,0.1)" : "rgba(255,100,100,0.1)", border: `1px solid ${sel.activo ? "rgba(61,184,158,0.3)" : "rgba(255,100,100,0.3)"}`, borderRadius: "20px", padding: "4px 12px" }}>{sel.activo ? "✓ Activo" : "⏳ Pendiente de aprobación"}</span></div>
            <SectionTitle>Información</SectionTitle>
            {[{ label: "Ciudad", value: sel.ciudad ?? "—" }, { label: "Categoría", value: sel.categoria ?? "—" }, { label: "Teléfono", value: sel.telefono ?? "—" }, { label: "Registrado", value: new Date(sel.createdAt).toLocaleDateString("es-CL") }].map(r => <Row key={r.label} label={r.label} value={r.value} />)}
            <SectionTitle style={{ marginTop: "20px" }}>Estadísticas</SectionTitle>
            {[{ label: "Concursos", value: String(sel._count?.concursos ?? 0) }, { label: "Promociones", value: String(sel._count?.promociones ?? 0) }, { label: "Favoritos", value: String(sel._count?.favoritos ?? 0) }].map(r => <Row key={r.label} label={r.label} value={r.value} />)}
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href={`/locales/${sel.id}`} target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", borderRadius: "8px", border: "1px solid rgba(232,168,76,0.2)", color: "#e8a84c", textDecoration: "none" }}>Ver local público →</a>
              {!sel.activo && <button onClick={() => handleAprobar(sel)} disabled={loadingAccion} style={{ background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.4)", borderRadius: "8px", color: "#3db89e", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", cursor: "pointer", width: "100%" }}>{loadingAccion ? "Aprobando..." : "✓ Aprobar y notificar por email"}</button>}
              {!showRechazoForm ? (
                <button onClick={() => setShowRechazoForm(true)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", cursor: "pointer", width: "100%" }}>✗ {sel.activo ? "Desactivar" : "Rechazar"}</button>
              ) : (
                <div style={{ background: "rgba(255,80,80,0.05)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: "8px", padding: "14px" }}>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.6)", marginBottom: "8px" }}>Motivo del rechazo (opcional):</p>
                  <textarea value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Ej: Información incompleta..." rows={3} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.8rem", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: "8px" }} />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleRechazar(sel)} disabled={loadingAccion} style={{ flex: 1, background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "6px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.72rem", padding: "8px", cursor: "pointer" }}>{loadingAccion ? "Enviando..." : "Confirmar y notificar"}</button>
                    <button onClick={() => { setShowRechazoForm(false); setMotivoRechazo(""); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "rgba(240,234,214,0.4)", fontFamily: "Georgia", fontSize: "0.72rem", padding: "8px 14px", cursor: "pointer" }}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        </>
      )}
    </div>
  );
}

function SectionTitle({ children, style }: { children: string; style?: React.CSSProperties }) {
  return <h3 style={{ fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(240,234,214,0.4)", textTransform: "uppercase", marginBottom: "12px", ...style }}>{children}</h3>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}><span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)" }}>{label}</span><span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6" }}>{value}</span></div>;
}

const I: React.CSSProperties = { padding: "8px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.85rem", outline: "none", flex: 1, minWidth: "200px" };
const B: React.CSSProperties = { padding: "8px 16px", borderRadius: "8px", fontFamily: "Georgia", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" };
const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "8px 10px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", padding: "10px" };
const PANEL: React.CSSProperties = { position: "fixed", top: 0, right: 0, width: "min(420px, 100vw)", height: "100vh", background: "rgba(10,8,18,0.98)", borderLeft: "1px solid rgba(232,168,76,0.2)", zIndex: 1000, overflowY: "auto", padding: "24px", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", animation: "slideIn 0.2s ease" };
const BACK: React.CSSProperties = { background: "none", border: "none", color: "rgba(240,234,214,0.5)", fontSize: "0.85rem", cursor: "pointer", marginBottom: "20px", padding: 0, fontFamily: "Georgia" };
