"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";
import SubirFoto from "@/components/SubirFoto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type P = any;

const TIPO_LABEL: Record<string, string> = { happy_hour: "Happy Hour", descuento: "Descuento", "2x1": "2×1", promo: "Promo", precio_especial: "Especial", cumpleanos: "Cumpleaños" };
const DIAS_NOMBRE = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function AdminPromociones() {
  const [promos, setPromos] = useState<P[]>([]);
  const [sel, setSel] = useState<P | null>(null);
  const [editando, setEditando] = useState(false);
  const [editTitulo, setEditTitulo] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editCondiciones, setEditCondiciones] = useState("");
  const [editHoraInicio, setEditHoraInicio] = useState("");
  const [editHoraFin, setEditHoraFin] = useState("");
  const [editDias, setEditDias] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [editPorcentaje, setEditPorcentaje] = useState("");
  const [editActiva, setEditActiva] = useState(true);
  const [editError, setEditError] = useState("");
  const [toast, setToast] = useState("");
  const [filtro, setFiltro] = useState<"todas" | "activas" | "inactivas">("todas");
  const [creando, setCreando] = useState(false);
  const [crearForm, setCrearForm] = useState({ localId: "", tipo: "happy_hour", titulo: "", descripcion: "", condiciones: "", horaInicio: "", horaFin: "", diasSemana: [false, false, false, false, false, false, false] as boolean[], porcentajeDescuento: "", imagenUrl: "" });
  const [localesList, setLocalesList] = useState<{ id: string; nombre: string }[]>([]);
  const [crearError, setCrearError] = useState("");

  useEffect(() => {
    if (creando) {
      adminFetch("/api/admin/locales").then(r => r.json()).then(d => setLocalesList(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [creando]);

  const crearPromocion = async () => {
    setCrearError("");
    if (!crearForm.localId || !crearForm.titulo.trim()) { setCrearError("Local y titulo son obligatorios"); return; }
    try {
      const res = await adminFetch("/api/promociones", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localId: crearForm.localId,
          tipo: crearForm.tipo,
          titulo: crearForm.titulo,
          descripcion: crearForm.descripcion.trim() || null,
          condiciones: crearForm.condiciones.trim() || null,
          horaInicio: crearForm.horaInicio,
          horaFin: crearForm.horaFin,
          diasSemana: crearForm.diasSemana,
          porcentajeDescuento: crearForm.porcentajeDescuento ? parseInt(crearForm.porcentajeDescuento) : null,
          imagenUrl: crearForm.imagenUrl || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setCrearError(d.error ?? "Error al crear"); return; }
      const nuevo = await res.json();
      setPromos(prev => [nuevo, ...prev]);
      setCreando(false);
      setCrearForm({ localId: "", tipo: "happy_hour", titulo: "", descripcion: "", condiciones: "", horaInicio: "", horaFin: "", diasSemana: [false, false, false, false, false, false, false], porcentajeDescuento: "", imagenUrl: "" });
      setToast("Promocion creada");
      setTimeout(() => setToast(""), 3000);
    } catch { setCrearError("Error de conexion"); }
  };

  useEffect(() => {
    fetch("/api/promociones?all=1").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setPromos(d);
    }).catch(() => {});
  }, []);

  const filtradas = promos.filter(p => {
    if (filtro === "activas") return p.activa;
    if (filtro === "inactivas") return !p.activa;
    return true;
  });

  const abrirDetalle = (p: P) => {
    setSel(p);
    setEditando(false);
  };

  const iniciarEdicion = () => {
    if (!sel) return;
    setEditTitulo(sel.titulo ?? "");
    setEditTipo(sel.tipo ?? "");
    setEditDescripcion(sel.descripcion ?? "");
    setEditCondiciones(sel.condiciones ?? "");
    setEditHoraInicio(sel.horaInicio ?? "");
    setEditHoraFin(sel.horaFin ?? "");
    setEditPorcentaje(sel.porcentajeDescuento?.toString() ?? "");
    setEditActiva(sel.activa ?? true);
    const dias = Array.isArray(sel.diasSemana) ? sel.diasSemana : [false, false, false, false, false, false, false];
    setEditDias(dias.length === 7 && typeof dias[0] === "boolean" ? dias : [false, false, false, false, false, false, false]);
    setEditError("");
    setEditando(true);
  };

  const guardarEdicion = async () => {
    if (!sel) return;
    setEditError("");
    try {
      const res = await adminFetch(`/api/promociones/${sel.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: editTitulo,
          tipo: editTipo,
          descripcion: editDescripcion.trim() || null,
          condiciones: editCondiciones.trim() || null,
          horaInicio: editHoraInicio,
          horaFin: editHoraFin,
          diasSemana: editDias,
          porcentajeDescuento: editPorcentaje ? parseInt(editPorcentaje) : null,
          activa: editActiva,
        }),
      });
      if (!res.ok) { const d = await res.json(); setEditError(d.error ?? "Error al guardar"); return; }
      const updated = await res.json();
      setSel({ ...sel, ...updated });
      setPromos(prev => prev.map(p => p.id === sel.id ? { ...p, ...updated } : p));
      setEditando(false);
      setToast("Promoción actualizada");
      setTimeout(() => setToast(""), 3000);
    } catch { setEditError("Error de conexión"); }
  };

  const toggleActiva = async (p: P) => {
    try {
      const res = await adminFetch(`/api/promociones/${p.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !p.activa }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPromos(prev => prev.map(x => x.id === p.id ? { ...x, ...updated } : x));
        if (sel?.id === p.id) setSel({ ...sel, ...updated });
        setToast(updated.activa ? "Promoción activada" : "Promoción desactivada");
        setTimeout(() => setToast(""), 3000);
      }
    } catch {}
  };

  const eliminar = async (p: P) => {
    try {
      const res = await adminFetch(`/api/promociones/${p.id}`, { method: "DELETE" });
      if (res.ok) {
        setPromos(prev => prev.filter(x => x.id !== p.id));
        if (sel?.id === p.id) setSel(null);
        setToast("Promoción eliminada");
        setTimeout(() => setToast(""), 3000);
      }
    } catch {}
  };

  const cerrarPanel = () => { setSel(null); setEditando(false); };

  const formatDias = (dias: unknown) => {
    if (!Array.isArray(dias)) return "—";
    if (dias.length === 7 && typeof dias[0] === "boolean") {
      const activos = dias.map((v, i) => v ? DIAS_NOMBRE[i] : null).filter(Boolean);
      return activos.length === 7 ? "Todos" : activos.join(", ") || "—";
    }
    return "—";
  };

  return (
    <div>
      {toast && <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 2000, background: "rgba(61,184,158,0.95)", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.82rem", padding: "14px 28px", borderRadius: "30px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{toast}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c" }}>Promociones ({filtradas.length})</h1>
          <button onClick={() => setCreando(!creando)} style={{ background: creando ? "none" : "#e8a84c", border: creando ? "1px solid rgba(232,168,76,0.3)" : "none", borderRadius: "8px", color: creando ? "#e8a84c" : "#0a0812", fontFamily: "Georgia", fontSize: "0.82rem", fontWeight: 700, padding: "8px 18px", cursor: "pointer" }}>{creando ? "Cancelar" : "+ Crear promocion"}</button>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["todas", "activas", "inactivas"] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{ padding: "6px 14px", borderRadius: "20px", border: filtro === f ? "1px solid #e8a84c" : "1px solid rgba(232,168,76,0.2)", background: filtro === f ? "rgba(232,168,76,0.12)" : "transparent", color: filtro === f ? "#e8a84c" : "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.75rem", cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
          ))}
        </div>
      </div>

      {creando && (
        <div style={{ marginBottom: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", padding: "16px" }}>
          <h3 style={{ fontFamily: "Georgia", fontSize: "0.88rem", letterSpacing: "0.18em", color: "rgba(240,234,214,0.45)", textTransform: "uppercase", marginBottom: "12px" }}>Crear promocion</h3>
          {crearError && <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#ff6b6b", marginBottom: "10px" }}>⚠️ {crearError}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={LBL}>Local</label>
              <select style={INP} value={crearForm.localId} onChange={e => setCrearForm(f => ({ ...f, localId: e.target.value }))}>
                <option value="">Seleccionar local...</option>
                {localesList.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Tipo</label>
              <select style={INP} value={crearForm.tipo} onChange={e => setCrearForm(f => ({ ...f, tipo: e.target.value }))}>
                {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={LBL}>Titulo</label>
              <input style={INP} value={crearForm.titulo} onChange={e => setCrearForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: 2x1 en pizzas" />
            </div>
            <div>
              <label style={LBL}>Descripcion</label>
              <textarea style={{ ...INP, resize: "vertical", minHeight: "50px" }} value={crearForm.descripcion} onChange={e => setCrearForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Opcional" />
            </div>
            <div>
              <label style={LBL}>Condiciones</label>
              <textarea style={{ ...INP, resize: "vertical", minHeight: "50px" }} value={crearForm.condiciones} onChange={e => setCrearForm(f => ({ ...f, condiciones: e.target.value }))} placeholder="Opcional" />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}><label style={LBL}>Hora inicio</label><input style={INP} type="time" value={crearForm.horaInicio} onChange={e => setCrearForm(f => ({ ...f, horaInicio: e.target.value }))} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Hora fin</label><input style={INP} type="time" value={crearForm.horaFin} onChange={e => setCrearForm(f => ({ ...f, horaFin: e.target.value }))} /></div>
            </div>
            <div>
              <label style={LBL}>Dias de la semana</label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {DIAS_NOMBRE.map((d, i) => (
                  <button key={d} type="button" onClick={() => setCrearForm(f => ({ ...f, diasSemana: f.diasSemana.map((v, j) => j === i ? !v : v) }))} style={{ padding: "6px 12px", borderRadius: "8px", border: crearForm.diasSemana[i] ? "1px solid #e8a84c" : "1px solid rgba(232,168,76,0.2)", background: crearForm.diasSemana[i] ? "rgba(232,168,76,0.15)" : "transparent", color: crearForm.diasSemana[i] ? "#e8a84c" : "rgba(240,234,214,0.4)", fontFamily: "Georgia", fontSize: "0.78rem", cursor: "pointer" }}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={LBL}>% Descuento</label>
              <input style={INP} type="number" value={crearForm.porcentajeDescuento} onChange={e => setCrearForm(f => ({ ...f, porcentajeDescuento: e.target.value }))} placeholder="Opcional" />
            </div>
            <div>
              <label style={LBL}>Imagen</label>
              <SubirFoto folder="promociones" preview={crearForm.imagenUrl || null} label="Subir foto" height="100px" onUpload={url => setCrearForm(f => ({ ...f, imagenUrl: url }))} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setCreando(false); setCrearError(""); }} style={{ flex: 1, background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "6px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.78rem", padding: "8px", cursor: "pointer" }}>Cancelar</button>
              <button onClick={crearPromocion} disabled={!crearForm.localId || !crearForm.titulo.trim()} style={{ flex: 2, background: "#e8a84c", border: "none", borderRadius: "6px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.78rem", fontWeight: 700, padding: "8px", cursor: "pointer", opacity: crearForm.localId && crearForm.titulo.trim() ? 1 : 0.5 }}>Crear promocion</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead><tr>{["Título", "Tipo", "Local", "Horario", "Días", "Vistas", "Estado", "Acción"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {filtradas.map(p => (
              <tr key={p.id} onClick={() => abrirDetalle(p)} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,168,76,0.06)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <td style={{ ...TD, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.titulo}</td>
                <td style={TD}><span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: "10px", background: "rgba(232,168,76,0.1)", color: "#e8a84c" }}>{TIPO_LABEL[p.tipo] ?? p.tipo}</span></td>
                <td style={TD}>{p.local?.nombre ?? "—"}</td>
                <td style={{ ...TD, fontSize: "0.8rem" }}>{p.horaInicio} – {p.horaFin}</td>
                <td style={{ ...TD, fontSize: "0.8rem" }}>{formatDias(p.diasSemana)}</td>
                <td style={{ ...TD, textAlign: "center", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)" }}>{p.vistas ?? 0}</td>
                <td style={TD}><span style={{ color: p.activa ? "#3db89e" : "#ff6b6b", fontSize: "0.82rem", fontWeight: 700 }}>{p.activa ? "Activa" : "Inactiva"}</span></td>
                <td style={TD} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => toggleActiva(p)} style={{ background: "none", border: `1px solid ${p.activa ? "rgba(255,80,80,0.3)" : "rgba(61,184,158,0.3)"}`, borderRadius: "6px", color: p.activa ? "#ff6b6b" : "#3db89e", fontFamily: "Georgia", fontSize: "0.72rem", padding: "4px 8px", cursor: "pointer" }}>{p.activa ? "Desactivar" : "Activar"}</button>
                    <button onClick={() => eliminar(p)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "6px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.72rem", padding: "4px 8px", cursor: "pointer" }}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtradas.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: "2rem", marginBottom: "12px" }}>⚡</p>
          <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.9rem" }}>No hay promociones {filtro !== "todas" ? filtro : ""}</p>
        </div>
      )}

      {/* Panel lateral de detalle */}
      {sel && (<>
        <div onClick={cerrarPanel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
        <div style={PANEL}>
          <button onClick={cerrarPanel} style={BACK}>← Volver</button>
          <h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.2rem", marginBottom: "4px" }}>{sel.titulo}</h2>
          <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.9rem", marginBottom: "20px" }}>{sel.local?.nombre ?? "Local"} · {TIPO_LABEL[sel.tipo] ?? sel.tipo}</p>

          {sel.imagenUrl && <img src={sel.imagenUrl} alt="" style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "10px", marginBottom: "16px" }} />}

          <SectionTitle>Detalles</SectionTitle>
          {[
            { label: "Tipo", value: TIPO_LABEL[sel.tipo] ?? sel.tipo },
            { label: "Horario", value: `${sel.horaInicio} – ${sel.horaFin}` },
            { label: "Días", value: formatDias(sel.diasSemana) },
            { label: "Estado", value: sel.activa ? "Activa" : "Inactiva" },
            ...(sel.porcentajeDescuento ? [{ label: "Descuento", value: `${sel.porcentajeDescuento}%` }] : []),
            ...(sel.descripcion ? [{ label: "Descripción", value: sel.descripcion }] : []),
            ...(sel.condiciones ? [{ label: "Condiciones", value: sel.condiciones }] : []),
            { label: "Creada", value: new Date(sel.createdAt).toLocaleDateString("es-CL") },
          ].map(r => <Row key={r.label} label={r.label} value={r.value} />)}

          {/* Formulario edición */}
          {editando && (
            <div style={{ marginTop: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", padding: "16px" }}>
              <SectionTitle>Editar promoción</SectionTitle>
              {editError && <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#ff6b6b", marginBottom: "10px" }}>⚠️ {editError}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={LBL}>Título</label>
                  <input style={INP} value={editTitulo} onChange={e => setEditTitulo(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Tipo</label>
                  <select style={INP} value={editTipo} onChange={e => setEditTipo(e.target.value)}>
                    {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={LBL}>Descripción</label>
                  <textarea style={{ ...INP, resize: "vertical", minHeight: "50px" }} value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} />
                </div>
                <div>
                  <label style={LBL}>Condiciones</label>
                  <textarea style={{ ...INP, resize: "vertical", minHeight: "50px" }} value={editCondiciones} onChange={e => setEditCondiciones(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}><label style={LBL}>Hora inicio</label><input style={INP} type="time" value={editHoraInicio} onChange={e => setEditHoraInicio(e.target.value)} /></div>
                  <div style={{ flex: 1 }}><label style={LBL}>Hora fin</label><input style={INP} type="time" value={editHoraFin} onChange={e => setEditHoraFin(e.target.value)} /></div>
                </div>
                <div>
                  <label style={LBL}>Días de la semana</label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {DIAS_NOMBRE.map((d, i) => (
                      <button key={d} onClick={() => setEditDias(prev => prev.map((v, j) => j === i ? !v : v))} style={{ padding: "6px 12px", borderRadius: "8px", border: editDias[i] ? "1px solid #e8a84c" : "1px solid rgba(232,168,76,0.2)", background: editDias[i] ? "rgba(232,168,76,0.15)" : "transparent", color: editDias[i] ? "#e8a84c" : "rgba(240,234,214,0.4)", fontFamily: "Georgia", fontSize: "0.78rem", cursor: "pointer" }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={LBL}>% Descuento</label>
                  <input style={INP} type="number" value={editPorcentaje} onChange={e => setEditPorcentaje(e.target.value)} placeholder="Opcional" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ ...LBL, marginBottom: 0 }}>Activa</label>
                  <button onClick={() => setEditActiva(!editActiva)} style={{ padding: "4px 14px", borderRadius: "20px", border: editActiva ? "1px solid #3db89e" : "1px solid rgba(255,80,80,0.3)", background: editActiva ? "rgba(61,184,158,0.12)" : "rgba(255,80,80,0.08)", color: editActiva ? "#3db89e" : "#ff6b6b", fontFamily: "Georgia", fontSize: "0.78rem", cursor: "pointer" }}>{editActiva ? "Sí" : "No"}</button>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setEditando(false)} style={{ flex: 1, background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "6px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.78rem", padding: "8px", cursor: "pointer" }}>Cancelar</button>
                  <button onClick={guardarEdicion} disabled={!editTitulo.trim()} style={{ flex: 2, background: "#e8a84c", border: "none", borderRadius: "6px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.78rem", fontWeight: 700, padding: "8px", cursor: "pointer", opacity: editTitulo.trim() ? 1 : 0.5 }}>Guardar</button>
                </div>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {!editando && <button onClick={iniciarEdicion} style={ACTION_BTN}>✏️ Editar promoción</button>}
            <button onClick={() => toggleActiva(sel)} style={{ ...ACTION_BTN, borderColor: sel.activa ? "rgba(255,80,80,0.3)" : "rgba(61,184,158,0.3)", color: sel.activa ? "#ff6b6b" : "#3db89e" }}>{sel.activa ? "Desactivar" : "Activar"}</button>
            <button onClick={() => eliminar(sel)} style={{ ...ACTION_BTN, borderColor: "rgba(255,80,80,0.3)", color: "#ff6b6b" }}>🗑 Eliminar promoción</button>
          </div>
        </div>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      </>)}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "Georgia", fontSize: "0.88rem", letterSpacing: "0.18em", color: "rgba(240,234,214,0.45)", textTransform: "uppercase", marginBottom: "12px" }}>{children}</h3>;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", gap: "12px" }}>
      <span style={{ fontFamily: "Georgia", fontSize: "0.95rem", color: "rgba(240,234,214,0.55)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: "Georgia", fontSize: "0.95rem", color: "#f0ead6", textAlign: "right" }}>{value}</span>
    </div>
  );
}

const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.55)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "10px 12px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.92rem", color: "#f0ead6", padding: "12px" };
const PANEL: React.CSSProperties = { position: "fixed", top: 0, right: 0, width: "min(420px, 100vw)", height: "100vh", background: "rgba(10,8,18,0.98)", borderLeft: "1px solid rgba(232,168,76,0.2)", zIndex: 1000, overflowY: "auto", padding: "24px", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", animation: "slideIn 0.2s ease" };
const BACK: React.CSSProperties = { background: "none", border: "none", color: "rgba(240,234,214,0.55)", fontSize: "1rem", cursor: "pointer", marginBottom: "20px", padding: 0, fontFamily: "Georgia" };
const INP: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
const LBL: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.45)", display: "block", marginBottom: "6px" };
const ACTION_BTN: React.CSSProperties = { background: "none", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.95rem", padding: "14px", cursor: "pointer", width: "100%" };
