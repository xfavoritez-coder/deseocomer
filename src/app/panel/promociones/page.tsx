"use client";
import { useState, useEffect } from "react";
import SubirFoto from "@/components/SubirFoto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PromoDB { id: string; localId: string; tipo: string; titulo: string; descripcion: string | null; condiciones: string | null; porcentajeDescuento: number | null; diasSemana: any; horaInicio: string; horaFin: string; imagenUrl: string | null; activa: boolean }

const I: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };
const L: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "6px", display: "block" };
const B: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700, padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer" };
const TIPOS = ["Descuento %", "2x1", "Happy Hour", "Cupón", "Regalo", "Cumpleaños"];
const DIAS_LABEL = ["L", "M", "M", "J", "V", "S", "D"];

const emptyForm = { tipo: "", titulo: "", descripcion: "", condiciones: "", descuento: "", dias: [true, true, true, true, true, false, false], horaInicio: "12:00", horaFin: "22:00", imagenUrl: "", tieneVencimiento: false, fechaVencimiento: "", modalidad: [] as string[] };

export default function PanelPromociones() {
  const [promos, setPromos] = useState<PromoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [localInfo, setLocalInfo] = useState<{ tieneDelivery: boolean; tieneRetiro: boolean }>({ tieneDelivery: false, tieneRetiro: false });

  const loadPromos = () => {
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (!session.id) return;
      fetch(`/api/promociones?localId=${session.id}`).then(r => r.json()).then(data => {
        if (Array.isArray(data)) setPromos(data.filter((p: PromoDB) => p.localId === session.id));
        else setPromos([]);
      }).catch(() => {}).finally(() => setLoading(false));
    } catch { setLoading(false); }
  };

  useEffect(() => { loadPromos(); }, []);

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (session.id) {
        fetch(`/api/locales/${session.id}`).then(r => r.json()).then(data => {
          if (data) setLocalInfo({ tieneDelivery: !!data.tieneDelivery, tieneRetiro: !!data.tieneRetiro });
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const chip = (sel: boolean): React.CSSProperties => ({ padding: "8px 16px", borderRadius: "20px", cursor: "pointer", background: sel ? "rgba(232,168,76,0.15)" : "transparent", border: sel ? "1px solid var(--accent)" : "1px solid var(--border-color)", color: sel ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: sel ? 700 : 400 });

  const canPublish = form.titulo.trim() && form.tipo && form.imagenUrl;

  const publish = async () => {
    if (!canPublish || saving) return;
    setSaving(true);
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (!session.id) return;

      if (editId) {
        await fetch(`/api/promociones/${editId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: form.tipo, titulo: form.titulo.trim(), descripcion: form.descripcion || null,
            condiciones: form.condiciones || null, porcentajeDescuento: form.descuento ? parseInt(form.descuento) : null,
            horaInicio: form.horaInicio, horaFin: form.horaFin, diasSemana: form.dias, imagenUrl: form.imagenUrl || null,
            fechaVencimiento: form.tieneVencimiento && form.fechaVencimiento ? new Date(form.fechaVencimiento).toISOString() : null,
            modalidad: form.modalidad,
          }),
        });
      } else {
        await fetch("/api/promociones", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localId: session.id, tipo: form.tipo, titulo: form.titulo.trim(),
            descripcion: form.descripcion || null, condiciones: form.condiciones || null,
            porcentajeDescuento: form.descuento ? parseInt(form.descuento) : null,
            horaInicio: form.horaInicio, horaFin: form.horaFin, diasSemana: form.dias,
            esCumpleanos: false, imagenUrl: form.imagenUrl || null,
            fechaVencimiento: form.tieneVencimiento && form.fechaVencimiento ? new Date(form.fechaVencimiento).toISOString() : null,
            modalidad: form.modalidad,
          }),
        });
      }
      loadPromos();
      setToast(editId ? "Promoción actualizada" : "Promoción publicada");
      setTimeout(() => setToast(""), 3000);
    } catch {} finally { setSaving(false); }
    setShowForm(false); setEditId(null); setForm({ ...emptyForm });
  };

  const startEdit = (p: PromoDB) => {
    const dias = Array.isArray(p.diasSemana) ? p.diasSemana : [true, true, true, true, true, false, false];
    setForm({
      tipo: p.tipo, titulo: p.titulo, descripcion: p.descripcion ?? "",
      condiciones: p.condiciones ?? "", descuento: p.porcentajeDescuento ? String(p.porcentajeDescuento) : "",
      dias, horaInicio: p.horaInicio, horaFin: p.horaFin, imagenUrl: p.imagenUrl ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tieneVencimiento: !!(p as any).fechaVencimiento,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fechaVencimiento: (p as any).fechaVencimiento ? new Date((p as any).fechaVencimiento).toISOString().split("T")[0] : "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modalidad: Array.isArray((p as any).modalidad) ? (p as any).modalidad : [],
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const toggleActiva = async (p: PromoDB) => {
    const nueva = !p.activa;
    await fetch(`/api/promociones/${p.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: nueva }),
    });
    loadPromos();
    setToast(nueva ? "Promoción activada" : "Promoción desactivada");
    setTimeout(() => setToast(""), 3000);
  };

  const deletePromo = async (id: string) => {
    await fetch(`/api/promociones/${id}`, { method: "DELETE" });
    loadPromos();
    setToast("Promoción eliminada");
    setTimeout(() => setToast(""), 3000);
  };

  if (showForm) return (
    <div style={{ maxWidth: "560px" }}>
      <button onClick={() => { setShowForm(false); setEditId(null); setForm({ ...emptyForm }); }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}>← Volver</button>
      <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "24px" }}>{editId ? "Editar promoción" : "Nueva promoción"}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={L}>Tipo de promoción</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{TIPOS.map(t => <button key={t} onClick={() => set("tipo", t)} style={chip(form.tipo === t)}>{t}</button>)}</div>
        </div>
        <div><label style={L}>Título</label><input style={I} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ej: 2x1 en hamburguesas" maxLength={50} /><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", marginTop: "4px", textAlign: "right" }}>{form.titulo.length}/50</p></div>
        <div><label style={L}>Foto de la promoción *</label><SubirFoto folder="promociones" preview={form.imagenUrl || null} label="Subir foto" height="140px" onUpload={url => set("imagenUrl", url)} />{!form.imagenUrl && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "#ff8080", marginTop: "4px" }}>La foto es obligatoria</p>}</div>
        <div><label style={L}>Descripción</label><textarea style={{ ...I, resize: "vertical", minHeight: "60px" }} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Describe la promoción..." /></div>
        <div><label style={L}>Condiciones (opcional)</label><textarea style={{ ...I, resize: "vertical", minHeight: "50px" }} value={form.condiciones} onChange={e => set("condiciones", e.target.value)} placeholder="Ej: Válido presentando esta pantalla." rows={3} /></div>
        {form.tipo === "Descuento %" && <div><label style={L}>% de descuento</label><input style={I} value={form.descuento} onChange={e => set("descuento", e.target.value)} placeholder="20" /></div>}
        <div>
          <label style={L}>Días de la semana</label>
          <div style={{ display: "flex", gap: "6px" }}>
            {DIAS_LABEL.map((d, i) => (
              <button key={i} onClick={() => { const n = [...form.dias]; n[i] = !n[i]; set("dias", n); }} style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: form.dias[i] ? "var(--accent)" : "transparent",
                border: form.dias[i] ? "none" : "1px solid var(--border-color)",
                color: form.dias[i] ? "var(--bg-primary)" : "var(--text-muted)",
                fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
              }}>{d}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}><label style={L}>Hora inicio</label><input type="time" style={I} value={form.horaInicio} onChange={e => set("horaInicio", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={L}>Hora fin</label><input type="time" style={I} value={form.horaFin} onChange={e => set("horaFin", e.target.value)} /></div>
        </div>
        {/* Fecha vencimiento */}
        <div style={{ marginTop: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.tieneVencimiento} onChange={e => set("tieneVencimiento", e.target.checked)} style={{ accentColor: "var(--accent)", width: 16, height: 16 }} />
            <span style={{ ...L, margin: 0, display: "inline" }}>Tiene fecha de vencimiento</span>
          </label>
          {form.tieneVencimiento && (
            <div style={{ marginTop: 8 }}><input type="date" style={I} value={form.fechaVencimiento} onChange={e => set("fechaVencimiento", e.target.value)} /></div>
          )}
        </div>
        <div style={{ marginTop: 8 }}>
          <label style={L}>Modalidad</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "6px" }}>
            {[
              { value: "en_local", label: "En local" },
              { value: "delivery", label: "Delivery" },
              { value: "retiro", label: "Retiro" },
            ].map(m => {
              const sel = form.modalidad.includes(m.value);
              return (
                <button key={m.value} type="button" onClick={() => set("modalidad", sel ? form.modalidad.filter((x: string) => x !== m.value) : [...form.modalidad, m.value])} style={{ padding: "8px 16px", borderRadius: "20px", cursor: "pointer", background: sel ? "rgba(232,168,76,0.15)" : "transparent", border: sel ? "1px solid var(--accent)" : "1px solid var(--border-color)", color: sel ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: sel ? 700 : 400 }}>{m.label}</button>
              );
            })}
          </div>
        </div>
        <button onClick={publish} disabled={!canPublish || saving} style={{ ...B, marginTop: "8px", opacity: canPublish ? 1 : 0.5 }}>{saving ? "Guardando..." : editId ? "Guardar cambios" : "Publicar promoción"}</button>
      </div>
    </div>
  );

  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg-primary)", paddingBottom: "12px", paddingTop: "4px" }}>
      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)" }}>Promociones</h1>
      <button onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowForm(true); }} style={B}>+ Promoción</button>
    </div>
    {loading ? (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[1, 2].map(i => (
          <div key={i} style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 70, height: 70, borderRadius: 10, background: "rgba(232,168,76,0.08)", animation: "dc-pp-pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 14, width: "60%", borderRadius: 4, background: "rgba(232,168,76,0.1)", animation: "dc-pp-pulse 1.5s ease-in-out infinite" }} />
              <div style={{ height: 10, width: "40%", borderRadius: 4, background: "rgba(232,168,76,0.06)", animation: "dc-pp-pulse 1.5s ease-in-out infinite" }} />
            </div>
          </div>
        ))}
      </div>
    ) : promos.length === 0 ? (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⚡</div>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "8px" }}>Sin promociones publicadas</p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Crea tu primera promoción y llega a más clientes</p>
        <button onClick={() => setShowForm(true)} style={B}>Crear primera promoción</button>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {promos.map(p => (
          <div key={p.id} style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden", opacity: p.activa ? 1 : 0.5, transition: "opacity 0.2s" }}>
            {/* Top row: image + info */}
            <div style={{ display: "flex", alignItems: "center" }}>
              {p.imagenUrl ? (
                <a href={`/promociones/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                  <img src={p.imagenUrl} alt="" style={{ width: 80, height: 80, objectFit: "cover", display: "block" }} />
                </a>
              ) : (
                <a href={`/promociones/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ width: 80, height: 80, background: "rgba(232,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0, textDecoration: "none" }}>⚡</a>
              )}
              <div style={{ flex: 1, padding: "12px 16px", minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.titulo}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span style={{ background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 20, padding: "3px 10px", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", color: "#e8a84c", fontWeight: 700, letterSpacing: "0.05em" }}>{p.porcentajeDescuento ? `Descuento` : p.tipo}</span>
                  <span style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "3px 10px", fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.5)" }}>{p.horaInicio} - {p.horaFin}</span>
                </div>
              </div>
            </div>
            {/* Bottom row: toggle + actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px 12px", justifyContent: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: "auto" }}>
                <button onClick={() => toggleActiva(p)} aria-label={p.activa ? "Desactivar" : "Activar"} style={{ position: "relative", width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: p.activa ? "rgba(61,184,158,0.7)" : "rgba(255,255,255,0.12)", transition: "background 0.2s", padding: 0 }}>
                  <span style={{ position: "absolute", top: 2, left: p.activa ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: p.activa ? "#fff" : "rgba(255,255,255,0.4)", transition: "left 0.2s" }} />
                </button>
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", color: p.activa ? "rgba(61,184,158,0.9)" : "var(--text-muted)", letterSpacing: "0.05em" }}>{p.activa ? "Activa" : "Inactiva"}</span>
              </div>
              <button onClick={() => startEdit(p)} style={{ background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: 8, padding: "8px 14px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", color: "var(--accent)", cursor: "pointer" }}>Editar</button>
              <button onClick={() => deletePromo(p.id)} style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 8, padding: "8px 14px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", color: "#ff8080", cursor: "pointer" }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    )}
    {toast && <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "rgba(61,184,158,0.95)", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", padding: "14px 28px", borderRadius: "30px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{toast}</div>}
    <style>{`@keyframes dc-pp-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.15} }`}</style>
  </div>);
}
