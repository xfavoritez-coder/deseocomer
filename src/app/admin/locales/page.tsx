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
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [passMode, setPassMode] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
          <div onClick={() => { setSel(null); setEditMode(false); setPassMode(false); setDeleteConfirm(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
          <div style={PANEL}>
            <button onClick={() => { setSel(null); setEditMode(false); setPassMode(false); setDeleteConfirm(false); }} style={BACK}>← Volver</button>
            <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: sel.logoUrl ? "transparent" : "linear-gradient(135deg, #2a7a6f, #3db89e)", border: "2px solid rgba(232,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia", fontSize: "1.2rem", fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>{sel.logoUrl ? <img src={sel.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : sel.nombre?.charAt(0).toUpperCase()}</div>
              <div><h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.1rem", margin: "0 0 2px" }}>{sel.nombre}</h2><p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.8rem", margin: 0 }}>{sel.email}</p></div>
            </div>
            <div style={{ marginBottom: "20px" }}><span style={{ fontSize: "0.72rem", fontWeight: 700, color: sel.activo ? "#3db89e" : "#ff8080", background: sel.activo ? "rgba(61,184,158,0.1)" : "rgba(255,100,100,0.1)", border: `1px solid ${sel.activo ? "rgba(61,184,158,0.3)" : "rgba(255,100,100,0.3)"}`, borderRadius: "20px", padding: "4px 12px" }}>{sel.activo ? "✓ Activo" : "⏳ Pendiente de aprobación"}</span></div>

            <SectionTitle>Datos del local</SectionTitle>
            {[{ label: "Nombre", value: sel.nombre ?? "—" }, { label: "Categoría", value: sel.categoria ?? "—" }, { label: "Ciudad", value: sel.ciudad ?? "—" }, { label: "Comuna", value: sel.comuna ?? "—" }, { label: "Dirección", value: sel.direccion ?? "—" }, { label: "Teléfono", value: sel.telefono ?? "—" }].map(r => <Row key={r.label} label={r.label} value={r.value} />)}

            <SectionTitle style={{ marginTop: "20px" }}>Datos personales</SectionTitle>
            {[{ label: "Dueño", value: sel.nombreDueno ?? "—" }, { label: "Celular", value: sel.celularDueno ?? "—" }, { label: "Email", value: sel.email }, { label: "Registrado", value: new Date(sel.createdAt).toLocaleDateString("es-CL") }].map(r => <Row key={r.label} label={r.label} value={r.value} />)}

            <SectionTitle style={{ marginTop: "20px" }}>Estadísticas</SectionTitle>
            {[{ label: "Concursos", value: String(sel._count?.concursos ?? 0) }, { label: "Promociones", value: String(sel._count?.promociones ?? 0) }, { label: "Favoritos", value: String(sel._count?.favoritos ?? 0) }, { label: "Reseñas", value: String(sel._count?.resenas ?? 0) }].map(r => <Row key={r.label} label={r.label} value={r.value} />)}

            {/* Edit mode */}
            {editMode && (
              <div style={{ marginTop: "20px", background: "rgba(232,168,76,0.05)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <SectionTitle>Editar datos</SectionTitle>
                {[{ key: "nombre", label: "Nombre local" }, { key: "nombreDueno", label: "Nombre dueño" }, { key: "celularDueno", label: "Celular dueño" }, { key: "categoria", label: "Categoría" }, { key: "ciudad", label: "Ciudad" }, { key: "comuna", label: "Comuna" }, { key: "direccion", label: "Dirección" }, { key: "telefono", label: "Teléfono local" }].map(f => (
                  <div key={f.key}><label style={{ fontFamily: "Georgia", fontSize: "0.65rem", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: "4px" }}>{f.label}</label><input style={{ ...I, flex: "none", minWidth: 0, width: "100%" }} value={editData[f.key] ?? ""} onChange={e => setEditData(d => ({ ...d, [f.key]: e.target.value }))} /></div>
                ))}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button onClick={async () => {
                    setLoadingAccion(true);
                    try {
                      const res = await adminFetch(`/api/admin/locales/${sel.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "editar", ...editData }) });
                      if (res.ok) { const d = await res.json(); setSel({ ...sel, ...d.data }); setLocales(prev => prev.map(l => l.id === sel.id ? { ...l, ...d.data } : l)); setEditMode(false); showToast("✓ Datos actualizados"); }
                      else showToast("Error al guardar");
                    } catch { showToast("Error de conexión"); }
                    setLoadingAccion(false);
                  }} disabled={loadingAccion} style={{ flex: 1, background: "#e8a84c", border: "none", borderRadius: "6px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.75rem", fontWeight: 700, padding: "10px", cursor: "pointer" }}>{loadingAccion ? "Guardando..." : "Guardar"}</button>
                  <button onClick={() => setEditMode(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "rgba(240,234,214,0.4)", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px 16px", cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Change password */}
            {passMode && (
              <div style={{ marginTop: "20px", background: "rgba(232,168,76,0.05)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", padding: "16px" }}>
                <SectionTitle>Cambiar contraseña</SectionTitle>
                <input style={{ ...I, flex: "none", minWidth: 0, width: "100%", marginBottom: "10px" }} type="password" placeholder="Nueva contraseña (mín. 8 caracteres)" value={newPass} onChange={e => setNewPass(e.target.value)} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={async () => {
                    if (newPass.length < 8) { showToast("Mínimo 8 caracteres"); return; }
                    setLoadingAccion(true);
                    try {
                      const res = await adminFetch(`/api/admin/locales/${sel.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "cambiar-password", nuevaPassword: newPass }) });
                      if (res.ok) { setPassMode(false); setNewPass(""); showToast("✓ Contraseña cambiada"); }
                      else showToast("Error al cambiar");
                    } catch { showToast("Error de conexión"); }
                    setLoadingAccion(false);
                  }} disabled={loadingAccion} style={{ flex: 1, background: "#e8a84c", border: "none", borderRadius: "6px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.75rem", fontWeight: 700, padding: "10px", cursor: "pointer" }}>{loadingAccion ? "Cambiando..." : "Cambiar"}</button>
                  <button onClick={() => { setPassMode(false); setNewPass(""); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "rgba(240,234,214,0.4)", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px 16px", cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Delete confirm */}
            {deleteConfirm && (
              <div style={{ marginTop: "20px", background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#ff6b6b", marginBottom: "6px", fontWeight: 700 }}>¿Eliminar {sel.nombre}?</p>
                <p style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.5)", marginBottom: "14px" }}>Se eliminarán todos sus datos, concursos, promociones y reseñas. Esta acción no se puede deshacer.</p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={async () => {
                    setLoadingAccion(true);
                    try {
                      const res = await adminFetch(`/api/admin/locales/${sel.id}`, { method: "DELETE" });
                      if (res.ok) { setLocales(prev => prev.filter(l => l.id !== sel.id)); setSel(null); setDeleteConfirm(false); showToast("Local eliminado"); }
                      else showToast("Error al eliminar");
                    } catch { showToast("Error de conexión"); }
                    setLoadingAccion(false);
                  }} disabled={loadingAccion} style={{ flex: 1, background: "#ff6b6b", border: "none", borderRadius: "6px", color: "#fff", fontFamily: "Georgia", fontSize: "0.75rem", fontWeight: 700, padding: "10px", cursor: "pointer" }}>{loadingAccion ? "Eliminando..." : "Sí, eliminar"}</button>
                  <button onClick={() => setDeleteConfirm(false)} style={{ flex: 1, background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "rgba(240,234,214,0.4)", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", cursor: "pointer" }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href={`/locales/${sel.slug || sel.id}`} target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", borderRadius: "8px", border: "1px solid rgba(232,168,76,0.2)", color: "#e8a84c", textDecoration: "none" }}>👁️ Ver local público</a>
              {!sel.activo && <button onClick={() => handleAprobar(sel)} disabled={loadingAccion} style={{ background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.4)", borderRadius: "8px", color: "#3db89e", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", cursor: "pointer", width: "100%" }}>✓ Aprobar y notificar</button>}
              <button onClick={() => { setEditMode(true); setEditData({ nombre: sel.nombre ?? "", nombreDueno: sel.nombreDueno ?? "", celularDueno: sel.celularDueno ?? "", categoria: sel.categoria ?? "", ciudad: sel.ciudad ?? "", comuna: sel.comuna ?? "", direccion: sel.direccion ?? "", telefono: sel.telefono ?? "" }); setPassMode(false); setDeleteConfirm(false); }} style={{ background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", cursor: "pointer", width: "100%" }}>✏️ Editar datos</button>
              <button onClick={() => { setPassMode(true); setNewPass(""); setEditMode(false); setDeleteConfirm(false); }} style={{ background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", cursor: "pointer", width: "100%" }}>🔑 Cambiar contraseña</button>
              {!showRechazoForm ? (
                <button onClick={() => setShowRechazoForm(true)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", cursor: "pointer", width: "100%" }}>✗ {sel.activo ? "Desactivar" : "Rechazar"}</button>
              ) : (
                <div style={{ background: "rgba(255,80,80,0.05)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: "8px", padding: "14px" }}>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.6)", marginBottom: "8px" }}>Motivo (opcional):</p>
                  <textarea value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)} placeholder="Ej: Información incompleta..." rows={2} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.8rem", resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: "8px" }} />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => handleRechazar(sel)} disabled={loadingAccion} style={{ flex: 1, background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "6px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.72rem", padding: "8px", cursor: "pointer" }}>{loadingAccion ? "..." : "Confirmar"}</button>
                    <button onClick={() => { setShowRechazoForm(false); setMotivoRechazo(""); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "rgba(240,234,214,0.4)", fontFamily: "Georgia", fontSize: "0.72rem", padding: "8px 14px", cursor: "pointer" }}>Cancelar</button>
                  </div>
                </div>
              )}
              <button onClick={() => { setDeleteConfirm(true); setEditMode(false); setPassMode(false); }} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.75rem", padding: "10px", cursor: "pointer", width: "100%" }}>🗑️ Eliminar local</button>
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
