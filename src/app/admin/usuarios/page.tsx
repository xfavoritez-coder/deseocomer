"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = any;

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<U[]>([]);
  const [busq, setBusq] = useState("");
  const [sel, setSel] = useState<U | null>(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [passMode, setPassMode] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => { adminFetch("/api/admin/usuarios").then(r => r.json()).then(d => setUsuarios(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const action = async (accion: string, extra?: Record<string, unknown>) => {
    if (!sel) return false;
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/usuarios/${sel.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion, ...extra }) });
      if (!res.ok) { const d = await res.json(); show(d.error ?? "Error"); setLoading(false); return false; }
      setLoading(false); return true;
    } catch { show("Error de conexión"); setLoading(false); return false; }
  };

  const filtered = usuarios.filter(u => !busq || u.nombre?.toLowerCase().includes(busq.toLowerCase()) || u.email?.toLowerCase().includes(busq.toLowerCase()));
  const resetModes = () => { setEditMode(false); setPassMode(false); setDeleteConfirm(false); };

  // ── DETAIL VIEW ──
  if (sel) return (
    <div>
      {toast && <div style={toastS}>{toast}</div>}
      <button onClick={() => { setSel(null); resetModes(); }} style={backS}>← Usuarios</button>

      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 700, color: "#1a0e05", flexShrink: 0 }}>{sel.nombre?.charAt(0).toUpperCase()}</div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.1rem", margin: 0 }}>{sel.nombre}</h2>
          <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.8rem", margin: "2px 0 0", wordBreak: "break-all" }}>{sel.email}</p>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: sel.emailVerificado ? "#3db89e" : "#ff8080", background: sel.emailVerificado ? "rgba(61,184,158,0.1)" : "rgba(255,100,100,0.1)", border: `1px solid ${sel.emailVerificado ? "rgba(61,184,158,0.3)" : "rgba(255,100,100,0.3)"}`, borderRadius: "20px", padding: "4px 12px" }}>{sel.emailVerificado ? "✓ Verificado" : "⏳ Sin verificar"}</span>
      </div>

      <div style={cardS}>
        <p style={cardTitleS}>Información</p>
        {[["Nombre", sel.nombre], ["Email", sel.email], ["Ciudad", sel.ciudad], ["Cumpleaños", sel.cumpleDia ? `${sel.cumpleDia}/${sel.cumpleMes}` : "No registrado"], ["Registro", new Date(sel.createdAt).toLocaleDateString("es-CL")]].map(([l, v]) => <Row key={l} label={l} value={v ?? "—"} />)}
      </div>

      <div style={cardS}>
        <p style={cardTitleS}>Actividad</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {[["❤️", sel._count?.favoritos ?? 0, "Favs"], ["⭐", sel._count?.resenas ?? 0, "Reseñas"], ["🏆", sel._count?.participaciones ?? 0, "Concursos"]].map(([icon, val, label]) => (
            <div key={String(label)} style={{ textAlign: "center", padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
              <p style={{ fontSize: "1rem", margin: "0 0 2px" }}>{icon}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "1rem", color: "#e8a84c", margin: 0 }}>{val}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "0.6rem", color: "rgba(240,234,214,0.4)", margin: "2px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {editMode && (
        <div style={cardS}>
          <p style={cardTitleS}>Editar datos</p>
          {[["nombre", "Nombre"], ["ciudad", "Ciudad"], ["cumpleDia", "Día cumpleaños"], ["cumpleMes", "Mes cumpleaños"]].map(([key, label]) => (
            <div key={key} style={{ marginBottom: "10px" }}>
              <label style={labelS}>{label}</label>
              <input style={inputS} value={editData[key] ?? ""} onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { if (await action("editar", editData)) { setSel({ ...sel, ...editData }); setUsuarios(p => p.map(u => u.id === sel.id ? { ...u, ...editData } : u)); setEditMode(false); show("✓ Datos actualizados"); } }} disabled={loading} style={btnPrimaryS}>{loading ? "..." : "Guardar"}</button>
            <button onClick={() => setEditMode(false)} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

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

      {deleteConfirm && (
        <div style={{ ...cardS, borderColor: "rgba(255,80,80,0.3)", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#ff6b6b", fontWeight: 700, marginBottom: "6px" }}>¿Eliminar {sel.nombre}?</p>
          <p style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.5)", marginBottom: "14px" }}>Se borran todos sus datos. No se puede deshacer.</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { setLoading(true); try { const r = await adminFetch(`/api/admin/usuarios/${sel.id}`, { method: "DELETE" }); if (r.ok) { setUsuarios(p => p.filter(u => u.id !== sel.id)); setSel(null); show("Eliminado"); } } catch {} setLoading(false); }} disabled={loading} style={{ ...btnPrimaryS, background: "#ff6b6b" }}>{loading ? "..." : "Eliminar"}</button>
            <button onClick={() => setDeleteConfirm(false)} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

      {!editMode && !passMode && !deleteConfirm && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
          <button onClick={() => { resetModes(); setEditMode(true); setEditData({ nombre: sel.nombre ?? "", ciudad: sel.ciudad ?? "", cumpleDia: String(sel.cumpleDia ?? ""), cumpleMes: String(sel.cumpleMes ?? "") }); }} style={btnOutlineS}>✏️ Editar datos</button>
          <button onClick={() => { resetModes(); setPassMode(true); }} style={btnOutlineS}>🔑 Cambiar contraseña</button>
          {!sel.emailVerificado && (
            <>
              <button onClick={async () => { if (await action("activar")) { setSel({ ...sel, emailVerificado: true }); setUsuarios(p => p.map(u => u.id === sel.id ? { ...u, emailVerificado: true } : u)); show("✓ Usuario activado"); } }} disabled={loading} style={{ ...btnOutlineS, color: "#3db89e", borderColor: "rgba(61,184,158,0.4)" }}>✓ Activar cuenta</button>
              <button onClick={async () => { if (await action("reenviar-verificacion")) show("✓ Email de verificación enviado"); }} disabled={loading} style={btnOutlineS}>📧 Reenviar email de verificación</button>
            </>
          )}
          {sel.emailVerificado && (
            <button onClick={async () => { if (await action("desactivar")) { setSel({ ...sel, emailVerificado: false }); setUsuarios(p => p.map(u => u.id === sel.id ? { ...u, emailVerificado: false } : u)); show("Usuario desactivado"); } }} disabled={loading} style={{ ...btnOutlineS, color: "#ff8080", borderColor: "rgba(255,80,80,0.3)" }}>✗ Desactivar cuenta</button>
          )}
          <button onClick={() => { resetModes(); setDeleteConfirm(true); }} style={{ ...btnOutlineS, color: "#ff8080", borderColor: "rgba(255,80,80,0.3)" }}>🗑️ Eliminar usuario</button>
        </div>
      )}
    </div>
  );

  // ── LIST VIEW ──
  return (
    <div>
      {toast && <div style={toastS}>{toast}</div>}
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.3rem", color: "#e8a84c", marginBottom: "16px" }}>Usuarios ({usuarios.length})</h1>
      <input style={{ ...inputS, marginBottom: "16px", maxWidth: "400px" }} placeholder="Buscar por nombre o email..." value={busq} onChange={e => setBusq(e.target.value)} />

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map(u => (
          <div key={u.id} onClick={() => { setSel(u); resetModes(); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", cursor: "pointer" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "#1a0e05", flexShrink: 0 }}>{u.nombre?.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#f0ead6", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nombre}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "0.7rem", color: "rgba(240,234,214,0.4)", margin: "2px 0 0" }}>{u.email}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <span style={{ fontSize: "0.6rem", color: u.emailVerificado ? "#3db89e" : "#ff8080" }}>{u.emailVerificado ? "✓" : "⏳"}</span>
              <p style={{ fontFamily: "Georgia", fontSize: "0.6rem", color: "rgba(240,234,214,0.3)", margin: "2px 0 0" }}>{new Date(u.createdAt).toLocaleDateString("es-CL")}</p>
            </div>
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
const cardTitleS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", margin: "0 0 10px" };
const inputS: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" };
const labelS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.65rem", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: "4px" };
const btnPrimaryS: React.CSSProperties = { flex: 1, padding: "10px", background: "#e8a84c", border: "none", borderRadius: "8px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" };
const btnSecS: React.CSSProperties = { flex: 1, padding: "10px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.8rem", cursor: "pointer" };
const btnOutlineS: React.CSSProperties = { display: "block", width: "100%", padding: "10px", background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.78rem", cursor: "pointer", textAlign: "left" };
