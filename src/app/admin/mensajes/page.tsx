"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type M = any;

export default function AdminMensajes() {
  const [tab, setTab] = useState<"mensajes" | "dismissed">("mensajes");
  const [mensajes, setMensajes] = useState<M[]>([]);
  const [dismissed, setDismissed] = useState<M[]>([]);
  const [toast, setToast] = useState("");
  const [creando, setCreando] = useState(false);
  const [contenido, setContenido] = useState("");
  const [destinatario, setDestinatario] = useState("todos");
  const [fijo, setFijo] = useState(false);
  const [duracion, setDuracion] = useState("");
  const [detalle, setDetalle] = useState<M | null>(null);

  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  useEffect(() => {
    adminFetch("/api/admin/mensajes").then(r => r.json()).then(d => { if (Array.isArray(d)) setMensajes(d); }).catch(() => {});
    adminFetch("/api/admin/mensajes?tipo=dismissed").then(r => r.json()).then(d => { if (Array.isArray(d)) setDismissed(d); }).catch(() => {});
  }, []);

  const crearMensaje = async () => {
    if (!contenido.trim()) return;
    try {
      const res = await adminFetch("/api/admin/mensajes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "crear", contenido: contenido.trim(), tipo: "importante", destinatario, fijo, duracion: duracion || null }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMensajes(prev => [{ ...msg, _count: { vistas: 0 }, vistas: [] }, ...prev]);
        setContenido(""); setDestinatario("todos"); setFijo(false); setDuracion(""); setCreando(false);
        show("Mensaje creado");
      }
    } catch { show("Error"); }
  };

  const accionMensaje = async (mensajeId: string, accion: string) => {
    try {
      const res = await adminFetch("/api/admin/mensajes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, mensajeId }),
      });
      if (res.ok) {
        setMensajes(prev => prev.map(m => m.id === mensajeId ? { ...m, activo: accion === "reactivar" } : m));
        show(accion === "reactivar" ? "Mensaje reactivado" : "Mensaje desactivado");
      }
    } catch {}
  };

  const reactivarToast = async (dismissId: string) => {
    try {
      const res = await adminFetch("/api/admin/mensajes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "reactivar_toast", dismissId }),
      });
      if (res.ok) {
        setDismissed(prev => prev.filter(d => d.id !== dismissId));
        show("Toast reactivado para el usuario");
      }
    } catch {}
  };

  const cardS: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "12px", padding: "16px", marginBottom: "12px" };
  const inputS: React.CSSProperties = { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };
  const btnS: React.CSSProperties = { padding: "6px 14px", borderRadius: "6px", fontFamily: "Georgia", fontSize: "0.78rem", cursor: "pointer", border: "1px solid rgba(232,168,76,0.3)", background: "none", color: "#e8a84c" };

  return (
    <div>
      {toast && <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "rgba(61,184,158,0.95)", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.85rem", padding: "12px 28px", borderRadius: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>{toast}</div>}

      <h1 style={{ fontFamily: "Georgia", fontSize: "1.4rem", color: "#e8a84c", marginBottom: "20px" }}>Mensajes del Genio</h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button onClick={() => setTab("mensajes")} style={{ ...btnS, background: tab === "mensajes" ? "#e8a84c" : "none", color: tab === "mensajes" ? "#0a0812" : "#e8a84c", fontWeight: tab === "mensajes" ? 700 : 400 }}>Mensajes ({mensajes.length})</button>
        <button onClick={() => setTab("dismissed")} style={{ ...btnS, background: tab === "dismissed" ? "#e8a84c" : "none", color: tab === "dismissed" ? "#0a0812" : "#e8a84c", fontWeight: tab === "dismissed" ? 700 : 400 }}>Toasts silenciados ({dismissed.length})</button>
      </div>

      {tab === "mensajes" && (
        <>
          {/* Crear mensaje */}
          {!creando ? (
            <button onClick={() => setCreando(true)} style={{ ...btnS, width: "100%", marginBottom: "16px", padding: "12px", background: "rgba(232,168,76,0.1)" }}>+ Crear mensaje</button>
          ) : (
            <div style={{ ...cardS, borderColor: "rgba(232,168,76,0.4)" }}>
              <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#e8a84c", fontWeight: 700, marginBottom: "12px" }}>Nuevo mensaje</p>
              <textarea style={{ ...inputS, minHeight: "80px", resize: "vertical", marginBottom: "10px" }} value={contenido} onChange={e => setContenido(e.target.value)} placeholder="Escribe el mensaje..." />
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                <div>
                  <label style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: "4px" }}>Destinatario</label>
                  <select value={destinatario} onChange={e => setDestinatario(e.target.value)} style={{ ...inputS, width: "auto" }}>
                    <option value="todos">Todos los usuarios</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: "4px" }}>Duración (seg)</label>
                  <input type="number" value={duracion} onChange={e => setDuracion(e.target.value)} placeholder="Vacío = hasta cerrar" style={{ ...inputS, width: "120px" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <button onClick={() => setFijo(!fijo)} style={{ width: "40px", height: "22px", borderRadius: "11px", border: "none", cursor: "pointer", background: fijo ? "#3db89e" : "rgba(255,255,255,0.1)", position: "relative" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: fijo ? "21px" : "3px", transition: "left 0.2s" }} />
                </button>
                <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.6)" }}>Fijo hasta que el usuario lo cierre</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={crearMensaje} disabled={!contenido.trim()} style={{ ...btnS, background: "#e8a84c", color: "#0a0812", fontWeight: 700, opacity: contenido.trim() ? 1 : 0.5 }}>Publicar</button>
                <button onClick={() => setCreando(false)} style={btnS}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Lista mensajes */}
          {mensajes.map(m => (
            <div key={m.id} style={{ ...cardS, borderColor: m.activo ? "rgba(232,168,76,0.2)" : "rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", fontWeight: 700, color: m.activo ? "#3db89e" : "#ff8080", textTransform: "uppercase", letterSpacing: "0.08em" }}>{m.activo ? "Activo" : "Inactivo"}</span>
                  {m.fijo && <span style={{ marginLeft: "8px", fontFamily: "Georgia", fontSize: "0.72rem", color: "#e8a84c" }}>Fijo</span>}
                  {m.duracion && <span style={{ marginLeft: "8px", fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.4)" }}>{m.duracion}s</span>}
                </div>
                <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.3)" }}>{new Date(m.createdAt).toLocaleDateString("es-CL")}</span>
              </div>
              <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#f0ead6", lineHeight: 1.5, marginBottom: "8px" }}>{m.contenido}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)" }}>
                  👁 {m._count?.vistas ?? 0} vistas · Para: {m.destinatario === "todos" ? "Todos" : m.destinatario}
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => setDetalle(detalle?.id === m.id ? null : m)} style={btnS}>{detalle?.id === m.id ? "Cerrar" : "Detalle"}</button>
                  {m.activo ? (
                    <button onClick={() => accionMensaje(m.id, "desactivar")} style={{ ...btnS, color: "#ff8080", borderColor: "rgba(255,80,80,0.3)" }}>Desactivar</button>
                  ) : (
                    <button onClick={() => accionMensaje(m.id, "reactivar")} style={{ ...btnS, color: "#3db89e", borderColor: "rgba(61,184,158,0.3)" }}>Reactivar</button>
                  )}
                </div>
              </div>
              {/* Detalle de vistas */}
              {detalle?.id === m.id && m.vistas?.length > 0 && (
                <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.4)", textTransform: "uppercase", marginBottom: "8px" }}>Usuarios que vieron ({m.vistas.length})</p>
                  {m.vistas.map((v: M) => (
                    <div key={v.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6" }}>{v.usuario?.nombre ?? "—"} <span style={{ color: "rgba(240,234,214,0.3)" }}>{v.usuario?.email}</span></span>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: v.noMostrar ? "#ff8080" : v.dismissedAt ? "#e8a84c" : "#3db89e" }}>
                        {v.noMostrar ? "No mostrar más" : v.dismissedAt ? "Cerrado" : "Visto"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {mensajes.length === 0 && <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "rgba(240,234,214,0.4)", textAlign: "center", padding: "40px" }}>No hay mensajes creados</p>}
        </>
      )}

      {tab === "dismissed" && (
        <>
          <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", marginBottom: "16px" }}>Toasts que usuarios marcaron como "no mostrar más"</p>
          {dismissed.length === 0 ? (
            <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "rgba(240,234,214,0.3)", textAlign: "center", padding: "40px" }}>Ningún toast ha sido silenciado</p>
          ) : dismissed.map(d => (
            <div key={d.id} style={cardS}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#f0ead6" }}>{d.usuario?.nombre ?? "—"} <span style={{ color: "rgba(240,234,214,0.3)" }}>{d.usuario?.email}</span></p>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "#e8a84c", marginTop: "2px" }}>Toast: <strong>{d.toastId}</strong></p>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.3)", marginTop: "2px" }}>{new Date(d.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <button onClick={() => reactivarToast(d.id)} style={{ ...btnS, color: "#3db89e", borderColor: "rgba(61,184,158,0.3)" }}>Reactivar</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
