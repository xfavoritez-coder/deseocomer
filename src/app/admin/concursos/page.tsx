"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = any;

export default function AdminConcursos() {
  const [concursos, setConcursos] = useState<C[]>([]);
  const [sel, setSel] = useState<C | null>(null);
  const [detalle, setDetalle] = useState<C | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => { fetch("/api/concursos").then(r => r.json()).then(d => setConcursos(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const cerrar = async (id: string) => {
    await adminFetch(`/api/admin/concursos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: false }) });
    setConcursos(prev => prev.map(c => c.id === id ? { ...c, activo: false } : c));
    if (sel?.id === id) setSel((p: C) => p ? { ...p, activo: false } : p);
  };

  const abrirDetalle = async (c: C) => {
    setSel(c);
    setLoadingDetalle(true);
    try {
      const r = await fetch(`/api/concursos/${c.id}`);
      const d = await r.json();
      setDetalle(d);
    } catch {}
    setLoadingDetalle(false);
  };

  const cerrarPanel = () => { setSel(null); setDetalle(null); };

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", marginBottom: "20px" }}>Concursos ({concursos.length})</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Premio", "Local", "Participantes", "Inicio", "Fin", "Estado", "Acción"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {concursos.map(c => {
            const ended = new Date(c.fechaFin) <= new Date();
            const status = !c.activo ? "Desactivado" : ended ? "Terminado" : "Activo";
            const color = !c.activo ? "#ff6b6b" : ended ? "#e8a84c" : "#3db89e";
            return (
              <tr key={c.id} onClick={() => abrirDetalle(c)} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,168,76,0.06)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <td style={TD}>{c.premio}</td>
                <td style={TD}>{c.local?.nombre ?? "—"}</td>
                <td style={{ ...TD, textAlign: "center" }}>{c._count?.participantes ?? 0}</td>
                <td style={{ ...TD, fontSize: "0.75rem" }}>{new Date(c.fechaInicio ?? c.createdAt).toLocaleDateString("es-CL")}</td>
                <td style={{ ...TD, fontSize: "0.75rem" }}>{new Date(c.fechaFin).toLocaleDateString("es-CL")}</td>
                <td style={TD}><span style={{ color, fontSize: "0.75rem", fontWeight: 700 }}>{status}</span></td>
                <td style={TD} onClick={e => e.stopPropagation()}>{c.activo && !ended && <button onClick={() => cerrar(c.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "6px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.65rem", padding: "4px 10px", cursor: "pointer" }}>Cerrar</button>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {sel && (
        <>
          <div onClick={cerrarPanel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
          <div style={PANEL}>
            <button onClick={cerrarPanel} style={BACK}>← Volver</button>
            <h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.2rem", marginBottom: "4px" }}>{sel.premio}</h2>
            <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.9rem", marginBottom: "24px" }}>{sel.local?.nombre ?? "Local"} {sel.local?.categoria ? `· ${sel.local.categoria}` : ""}</p>

            <SectionTitle>Detalles</SectionTitle>
            {[
              { label: "Inicio", value: new Date(sel.fechaInicio ?? sel.createdAt).toLocaleDateString("es-CL") },
              { label: "Fin", value: new Date(sel.fechaFin).toLocaleDateString("es-CL") },
              { label: "Estado", value: !sel.activo ? "Desactivado" : new Date(sel.fechaFin) <= new Date() ? "Terminado" : "Activo" },
              { label: "Participantes", value: String(sel._count?.participantes ?? 0) },
            ].map(r => <Row key={r.label} label={r.label} value={r.value} />)}

            {/* Participantes */}
            <div style={{ marginTop: "24px" }}>
              <SectionTitle>Ranking de participantes</SectionTitle>
              {loadingDetalle ? (
                <p style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "rgba(240,234,214,0.4)" }}>Cargando...</p>
              ) : detalle?.participantes?.length > 0 ? (
                detalle.participantes.map((p: C, i: number) => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.85rem" }}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}.`}</span>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#f0ead6" }}>{p.usuario?.nombre ?? "Usuario"}</span>
                    </div>
                    <span style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "#e8a84c" }}>{p.puntos ?? 0} pts</span>
                  </div>
                ))
              ) : (
                <p style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "rgba(240,234,214,0.4)" }}>Sin participantes</p>
              )}
            </div>

            {/* Acciones */}
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {sel.activo && new Date(sel.fechaFin) > new Date() && (
                <button onClick={() => cerrar(sel.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", cursor: "pointer", width: "100%" }}>Cerrar concurso</button>
              )}
              <a href={`/concursos/${sel.slug || sel.id}`} target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", borderRadius: "8px", border: "1px solid rgba(232,168,76,0.2)", color: "#e8a84c", textDecoration: "none" }}>Ver concurso público →</a>
            </div>
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

const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "8px 10px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", padding: "10px" };
const PANEL: React.CSSProperties = { position: "fixed", top: 0, right: 0, width: "min(420px, 100vw)", height: "100vh", background: "rgba(10,8,18,0.98)", borderLeft: "1px solid rgba(232,168,76,0.2)", zIndex: 1000, overflowY: "auto", padding: "24px", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", animation: "slideIn 0.2s ease" };
const BACK: React.CSSProperties = { background: "none", border: "none", color: "rgba(240,234,214,0.5)", fontSize: "0.85rem", cursor: "pointer", marginBottom: "20px", padding: 0, fontFamily: "Georgia" };
