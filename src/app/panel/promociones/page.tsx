"use client";
import { useState, useEffect } from "react";

const DATA_KEY = "deseocomer_panel_local_data";

interface Promo { id: number; tipo: string; titulo: string; descripcion: string; descuento: string; dias: boolean[]; horaInicio: string; horaFin: string; creadoEn: number }

function loadPromos(): Promo[] { try { return (JSON.parse(localStorage.getItem(DATA_KEY) ?? "{}").promociones as Promo[]) ?? []; } catch { return []; } }
function savePromos(p: Promo[]) { try { const d = JSON.parse(localStorage.getItem(DATA_KEY) ?? "{}"); d.promociones = p; localStorage.setItem(DATA_KEY, JSON.stringify(d)); } catch {} }

const I: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };
const L: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "6px", display: "block" };
const TIPOS = ["Descuento %", "2x1", "Happy Hour", "Cupón", "Regalo"];
const DIAS_LABEL = ["L", "M", "M", "J", "V", "S", "D"];

export default function PanelPromociones() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: "", titulo: "", descripcion: "", descuento: "", dias: [true, true, true, true, true, false, false], horaInicio: "12:00", horaFin: "22:00" });

  useEffect(() => { setPromos(loadPromos()); }, []);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const publish = async () => {
    if (!form.titulo.trim() || !form.tipo) return;
    const n: Promo = { id: Date.now(), ...form, creadoEn: Date.now() };
    const next = [n, ...promos]; setPromos(next); savePromos(next);
    // Save to Supabase
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (session.id) {
        await fetch("/api/promociones", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localId: session.id, tipo: form.tipo, titulo: form.titulo.trim(),
            descripcion: form.descripcion, porcentajeDescuento: form.descuento ? parseInt(form.descuento) : null,
            horaInicio: form.horaInicio, horaFin: form.horaFin, diasSemana: form.dias, esCumpleanos: false,
          }),
        });
      }
    } catch { /* fallback to localStorage */ }
    setShowForm(false); setForm({ tipo: "", titulo: "", descripcion: "", descuento: "", dias: [true, true, true, true, true, false, false], horaInicio: "12:00", horaFin: "22:00" });
  };

  const chip = (sel: boolean): React.CSSProperties => ({ padding: "8px 16px", borderRadius: "20px", cursor: "pointer", background: sel ? "rgba(232,168,76,0.15)" : "transparent", border: sel ? "1px solid var(--accent)" : "1px solid var(--border-color)", color: sel ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", fontWeight: sel ? 700 : 400 });

  if (showForm) return (
    <div style={{ maxWidth: "560px" }}>
      <button onClick={() => setShowForm(false)} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}>← Volver</button>
      <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "24px" }}>Nueva promoción</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={L}>Tipo de promoción</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{TIPOS.map(t => <button key={t} onClick={() => set("tipo", t)} style={chip(form.tipo === t)}>{t}</button>)}</div>
        </div>
        <div><label style={L}>Título</label><input style={I} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ej: 2x1 en hamburguesas" /></div>
        <div><label style={L}>Descripción</label><textarea style={{ ...I, resize: "vertical", minHeight: "60px" }} value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Describe la promoción..." /></div>
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
                fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
              }}>{d}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}><label style={L}>Hora inicio</label><input type="time" style={I} value={form.horaInicio} onChange={e => set("horaInicio", e.target.value)} /></div>
          <div style={{ flex: 1 }}><label style={L}>Hora fin</label><input type="time" style={I} value={form.horaFin} onChange={e => set("horaFin", e.target.value)} /></div>
        </div>
        <button onClick={publish} disabled={!form.titulo.trim() || !form.tipo} style={{ ...B, marginTop: "8px", opacity: form.titulo.trim() && form.tipo ? 1 : 0.5 }}>Publicar promoción</button>
      </div>
    </div>
  );

  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)" }}>Promociones</h1>
      <button onClick={() => setShowForm(true)} style={B}>+ Nueva promoción</button>
    </div>
    {promos.length === 0 ? (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>⚡</div>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "8px" }}>Sin promociones publicadas</p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Crea tu primera promoción y llega a más clientes</p>
        <button onClick={() => setShowForm(true)} style={B}>Crear primera promoción</button>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {promos.map(p => (
          <div key={p.id} style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "1.6rem" }}>⚡</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)" }}>{p.titulo}</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.tipo}{p.descuento ? ` · ${p.descuento}%` : ""} · {p.horaInicio}-{p.horaFin}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>);
}

const B: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700, padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer" };
