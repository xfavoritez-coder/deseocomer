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
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [passMode, setPassMode] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectMotivo, setRejectMotivo] = useState("");

  useEffect(() => { adminFetch("/api/admin/locales").then(r => r.json()).then(d => setLocales(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const action = async (accion: string, extra?: Record<string, unknown>) => {
    if (!sel) return;
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/locales/${sel.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion, ...extra }) });
      if (!res.ok) { const d = await res.json(); show(d.error ?? "Error"); setLoading(false); return false; }
      setLoading(false); return true;
    } catch { show("Error de conexión"); setLoading(false); return false; }
  };

  const pendientes = locales.filter(l => !l.activo).length;
  const activos = locales.filter(l => l.activo).length;
  const filtered = locales.filter(l => {
    if (busq && !l.nombre?.toLowerCase().includes(busq.toLowerCase()) && !l.email?.toLowerCase().includes(busq.toLowerCase())) return false;
    if (filtro === "activos" && !l.activo) return false;
    if (filtro === "pendientes" && l.activo) return false;
    return true;
  });

  const resetModes = () => { setEditMode(false); setPassMode(false); setDeleteConfirm(false); setRejectMode(false); setRejectMotivo(""); };

  // ── DETAIL VIEW ──
  if (sel) return (
    <div>
      {toast && <div style={toastS}>{toast}</div>}
      <button onClick={() => { setSel(null); resetModes(); }} style={backS}>← Locales</button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: sel.logoUrl ? "transparent" : "linear-gradient(135deg, #2a7a6f, #3db89e)", border: "2px solid rgba(232,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden" }}>{sel.logoUrl ? <img src={sel.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : sel.nombre?.charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.1rem", margin: 0, wordBreak: "break-word" }}>{sel.nombre}</h2>
          <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.8rem", margin: "2px 0 0", wordBreak: "break-all" }}>{sel.email}</p>
        </div>
      </div>

      <div style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: sel.activo ? "#3db89e" : "#ff8080", background: sel.activo ? "rgba(61,184,158,0.1)" : "rgba(255,100,100,0.1)", border: `1px solid ${sel.activo ? "rgba(61,184,158,0.3)" : "rgba(255,100,100,0.3)"}`, borderRadius: "20px", padding: "4px 12px" }}>{sel.activo ? "✓ Activo" : "⏳ Pendiente"}</span>
        {sel.captadorCodigo && <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e8a84c", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "6px", padding: "3px 10px" }}>🤝 Captado por {sel.captadorCodigo}</span>}
      </div>
      {sel.captadorCodigo && !sel.activo && (
        <p style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.5)", fontStyle: "italic", marginBottom: 16, background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: 8, padding: "10px 14px" }}>
          Este local fue registrado por un captador ({sel.captadorCodigo}). Verifica que el local haya dado su consentimiento antes de activar.
        </p>
      )}

      {/* Info cards */}
      <div style={cardS}>
        <p style={cardTitleS}>Datos del local</p>
        {[["Nombre", sel.nombre], ["Categoría", sel.categoria], ["Ciudad", sel.ciudad], ["Comuna", sel.comuna], ["Dirección", sel.direccion], ["Teléfono", sel.telefono]].map(([l, v]) => <Row key={l} label={l} value={v ?? "—"} />)}
      </div>

      <div style={cardS}>
        <p style={cardTitleS}>Datos personales</p>
        {[["Dueño", sel.nombreDueno], ["Celular", sel.celularDueno], ["Email", sel.email], ["Registro", new Date(sel.createdAt).toLocaleDateString("es-CL")]].map(([l, v]) => <Row key={l} label={l} value={v ?? "—"} />)}
      </div>

      <div style={cardS}>
        <p style={cardTitleS}>Estadísticas</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {[["🏆", sel._count?.concursos ?? 0, "Concursos"], ["⚡", sel._count?.promociones ?? 0, "Promos"], ["❤️", sel._count?.favoritos ?? 0, "Favs"]].map(([icon, val, label]) => (
            <div key={String(label)} style={{ textAlign: "center", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
              <p style={{ fontSize: "1rem", margin: "0 0 2px" }}>{icon}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "1rem", color: "#e8a84c", margin: 0 }}>{val}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.4)", margin: "2px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      {editMode && (
        <div style={cardS}>
          <p style={cardTitleS}>Editar datos</p>
          {[["nombre", "Nombre local"], ["nombreDueno", "Nombre dueño"], ["celularDueno", "Celular dueño"], ["categoria", "Categoría"], ["ciudad", "Ciudad"], ["comuna", "Comuna"], ["direccion", "Dirección"], ["telefono", "Teléfono"]].map(([key, label]) => (
            <div key={key} style={{ marginBottom: "10px" }}>
              <label style={labelS}>{label}</label>
              <input style={inputS} value={editData[key] ?? ""} onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { if (await action("editar", editData)) { setSel({ ...sel, ...editData }); setLocales(p => p.map(l => l.id === sel.id ? { ...l, ...editData } : l)); setEditMode(false); show("✓ Datos actualizados"); } }} disabled={loading} style={btnPrimaryS}>{loading ? "..." : "Guardar"}</button>
            <button onClick={() => setEditMode(false)} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Change password */}
      {passMode && (
        <div style={cardS}>
          <p style={cardTitleS}>Cambiar contraseña</p>
          <input style={{ ...inputS, marginBottom: "10px" }} type="password" placeholder="Nueva contraseña (mín. 8)" value={newPass} onChange={e => setNewPass(e.target.value)} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { if (newPass.length < 8) { show("Mínimo 8 caracteres"); return; } if (await action("cambiar-password", { nuevaPassword: newPass })) { setPassMode(false); setNewPass(""); show("✓ Contraseña cambiada"); } }} disabled={loading} style={btnPrimaryS}>{loading ? "..." : "Cambiar"}</button>
            <button onClick={() => { setPassMode(false); setNewPass(""); }} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Reject form */}
      {rejectMode && (
        <div style={{ ...cardS, borderColor: "rgba(255,80,80,0.3)" }}>
          <p style={{ ...cardTitleS, color: "#ff6b6b" }}>{sel.activo ? "Desactivar" : "Rechazar"} local</p>
          <textarea style={{ ...inputS, minHeight: "60px", resize: "vertical", marginBottom: "10px" }} value={rejectMotivo} onChange={e => setRejectMotivo(e.target.value)} placeholder="Motivo (opcional)" />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { if (await action("rechazar", { motivoRechazo: rejectMotivo })) { setSel({ ...sel, activo: false }); setLocales(p => p.map(l => l.id === sel.id ? { ...l, activo: false } : l)); setRejectMode(false); show("Local desactivado"); } }} disabled={loading} style={{ ...btnPrimaryS, background: "#ff6b6b" }}>{loading ? "..." : "Confirmar"}</button>
            <button onClick={() => setRejectMode(false)} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ ...cardS, borderColor: "rgba(255,80,80,0.3)", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#ff6b6b", fontWeight: 700, marginBottom: "6px" }}>¿Eliminar {sel.nombre}?</p>
          <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)", marginBottom: "14px" }}>Se borran todos sus datos. No se puede deshacer.</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { setLoading(true); try { const r = await adminFetch(`/api/admin/locales/${sel.id}`, { method: "DELETE" }); if (r.ok) { setLocales(p => p.filter(l => l.id !== sel.id)); setSel(null); show("Eliminado"); } } catch {} setLoading(false); }} disabled={loading} style={{ ...btnPrimaryS, background: "#ff6b6b" }}>{loading ? "..." : "Eliminar"}</button>
            <button onClick={() => setDeleteConfirm(false)} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!editMode && !passMode && !rejectMode && !deleteConfirm && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
          <a href={`/locales/${sel.slug || sel.id}`} target="_blank" rel="noopener" style={{ ...btnOutlineS, textDecoration: "none", textAlign: "center" }}>👁️ Ver local público</a>
          {!sel.activo && <button onClick={async () => { if (await action("aprobar")) { setSel({ ...sel, activo: true }); setLocales(p => p.map(l => l.id === sel.id ? { ...l, activo: true } : l)); show("✓ Aprobado y notificado"); } }} disabled={loading} style={{ ...btnOutlineS, color: "#3db89e", borderColor: "rgba(61,184,158,0.4)" }}>✓ Aprobar y notificar</button>}
          {!sel.activo && <button onClick={async () => { if (await action("reenviar-activacion")) show("✓ Email de activación enviado"); }} disabled={loading} style={btnOutlineS}>📧 Reenviar email de activación</button>}
          <button onClick={() => { resetModes(); setEditMode(true); setEditData({ nombre: sel.nombre ?? "", nombreDueno: sel.nombreDueno ?? "", celularDueno: sel.celularDueno ?? "", categoria: sel.categoria ?? "", ciudad: sel.ciudad ?? "", comuna: sel.comuna ?? "", direccion: sel.direccion ?? "", telefono: sel.telefono ?? "" }); }} style={btnOutlineS}>✏️ Editar datos</button>
          <button onClick={() => { resetModes(); setPassMode(true); }} style={btnOutlineS}>🔑 Cambiar contraseña</button>
          <button onClick={() => { resetModes(); setRejectMode(true); }} style={{ ...btnOutlineS, color: "#ff8080", borderColor: "rgba(255,80,80,0.3)" }}>✗ {sel.activo ? "Desactivar" : "Rechazar"}</button>
          <button onClick={() => { resetModes(); setDeleteConfirm(true); }} style={{ ...btnOutlineS, color: "#ff8080", borderColor: "rgba(255,80,80,0.3)" }}>🗑️ Eliminar</button>
        </div>
      )}
    </div>
  );

  // ── LIST VIEW ──
  return (
    <div>
      {toast && <div style={toastS}>{toast}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h1 style={{ fontFamily: "Georgia", fontSize: "1.3rem", color: "#e8a84c", margin: 0 }}>Locales ({locales.length})</h1>
        <div style={{ display: "flex", gap: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "#ff8080", background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: "6px", padding: "4px 10px" }}>{pendientes} pend.</span>
          <span style={{ fontSize: "0.8rem", color: "#3db89e", background: "rgba(61,184,158,0.1)", border: "1px solid rgba(61,184,158,0.2)", borderRadius: "6px", padding: "4px 10px" }}>{activos} act.</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input style={{ ...inputS, flex: 1, minWidth: "150px" }} placeholder="Buscar..." value={busq} onChange={e => setBusq(e.target.value)} />
        {["todos", "pendientes", "activos"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding: "6px 12px", borderRadius: "6px", fontFamily: "Georgia", fontSize: "0.78rem", textTransform: "uppercase", cursor: "pointer", background: filtro === f ? "#e8a84c" : "transparent", color: filtro === f ? "#0a0812" : "rgba(240,234,214,0.5)", border: filtro === f ? "none" : "1px solid rgba(255,255,255,0.1)" }}>{f}</button>
        ))}
      </div>

      {/* Card list (mobile-friendly) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map(l => (
          <div key={l.id} onClick={() => { setSel(l); resetModes(); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", cursor: "pointer" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: l.logoUrl ? "transparent" : "linear-gradient(135deg, #2a7a6f, #3db89e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0, overflow: "hidden", border: "1px solid rgba(232,168,76,0.2)" }}>{l.logoUrl ? <img src={l.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : l.nombre?.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#f0ead6", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nombre}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)", margin: "2px 0 0" }}>{l.email}</p>
            </div>
            {l.activo ? (
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#3db89e", flexShrink: 0 }}>✓</span>
            ) : (
              <button onClick={async (e) => { e.stopPropagation(); setLoading(true); try { const res = await adminFetch(`/api/admin/locales/${l.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "aprobar" }) }); if (res.ok) { setLocales(p => p.map(x => x.id === l.id ? { ...x, activo: true } : x)); show("✓ " + l.nombre + " activado"); } } catch {} setLoading(false); }} style={{ padding: "4px 10px", background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.4)", borderRadius: "6px", color: "#3db89e", fontFamily: "Georgia", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>Activar</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}><span style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "rgba(240,234,214,0.5)" }}>{label}</span><span style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "#f0ead6", textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>{value}</span></div>;
}

const toastS: React.CSSProperties = { position: "fixed", top: "16px", right: "16px", background: "rgba(13,7,3,0.97)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "10px", padding: "10px 18px", fontFamily: "Georgia", fontSize: "0.8rem", color: "#e8a84c", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" };
const backS: React.CSSProperties = { background: "none", border: "none", color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.85rem", cursor: "pointer", padding: 0, marginBottom: "16px" };
const cardS: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "16px", marginBottom: "12px" };
const cardTitleS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", marginBottom: "10px", margin: "0 0 10px" };
const inputS: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" };
const labelS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: "4px" };
const btnPrimaryS: React.CSSProperties = { flex: 1, padding: "10px", background: "#e8a84c", border: "none", borderRadius: "8px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" };
const btnSecS: React.CSSProperties = { flex: 1, padding: "10px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.8rem", cursor: "pointer" };
const btnOutlineS: React.CSSProperties = { display: "block", width: "100%", padding: "10px", background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.78rem", cursor: "pointer", textAlign: "left" };
