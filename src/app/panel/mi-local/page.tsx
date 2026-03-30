"use client";
import { useState, useEffect } from "react";

const DATA_KEY = "deseocomer_panel_local_data";
const COMUNAS = ["Providencia", "Santiago Centro", "Ñuñoa", "Las Condes", "Vitacura", "Lo Barnechea", "San Miguel", "Maipú", "Bellavista", "Recoleta", "La Florida", "Otra"];
const CATEGORIAS = ["Pizza", "Sushi", "Hamburguesa", "Vegano", "Café", "Almuerzo", "Pastas", "Mexicano", "Mariscos", "Otro"];
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface HorarioDia { activo: boolean; abre: string; cierra: string }
interface MenuItem { nombre: string; descripcion: string; precio: string; destacado: boolean }
interface MenuCat { nombre: string; items: MenuItem[] }

function load(): Record<string, unknown> { try { return JSON.parse(localStorage.getItem(DATA_KEY) ?? "{}"); } catch { return {}; } }
function save(d: Record<string, unknown>) { localStorage.setItem(DATA_KEY, JSON.stringify(d)); }

const L: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "6px", display: "block" };
const I: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };

export default function MiLocalPage() {
  const [d, setD] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from localStorage first
    const local = load();
    setD(local);
    // Then fetch from BD and merge
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (session.id) {
        fetch(`/api/locales/${session.id}`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (data) {
              const merged = {
                ...local,
                nombre: data.nombre ?? local.nombre,
                categoria: data.categoria ?? local.categoria,
                descripcion: data.descripcion ?? local.descripcion,
                historia: data.historia ?? local.historia,
                telefono: data.telefono ?? local.telefono,
                instagram: data.instagram ?? local.instagram,
                direccion: data.direccion ?? local.direccion,
                comuna: data.comuna ?? local.comuna,
                logoUrl: data.logoUrl ?? local.logoUrl,
                portadaUrl: data.portadaUrl ?? local.portadaUrl,
                galeria: data.galeria ?? local.galeria,
                horarios: data.horarios ?? local.horarios,
                tieneMenu: data.tieneMenu ?? local.tieneMenu,
              };
              setD(merged);
              save(merged);
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  const set = (k: string, v: unknown) => setD(prev => ({ ...prev, [k]: v }));

  const horarios: HorarioDia[] = (d.horarios as HorarioDia[]) ?? DIAS.map(() => ({ activo: true, abre: "12:00", cierra: "22:00" }));
  const setHorario = (i: number, h: Partial<HorarioDia>) => {
    const next = [...horarios]; next[i] = { ...next[i], ...h }; set("horarios", next);
  };

  const tieneMenu = d.tieneMenu as boolean | undefined;
  const menuCats: MenuCat[] = (d.menuCategorias as MenuCat[]) ?? [];
  const setMenuCats = (cats: MenuCat[]) => set("menuCategorias", cats);

  const galeria: string[] = (d.galeria as string[]) ?? [];
  const [newFoto, setNewFoto] = useState("");

  const handleSave = async () => {
    // Save locally as backup
    save(d);
    // Save to Supabase
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (session.id) {
        const res = await fetch(`/api/locales/${session.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: d.nombre, categoria: d.categoria, descripcion: d.descripcion,
            historia: d.historia, telefono: d.telefono, instagram: d.instagram,
            direccion: d.direccion, comuna: d.comuna, horarios: d.horarios,
            logoUrl: d.logoUrl, portadaUrl: d.portadaUrl, galeria: d.galeria, tieneMenu: d.tieneMenu,
          }),
        });
        if (!res.ok) console.warn("[Panel] Error al guardar en BD");
      }
    } catch { /* fallback to localStorage */ }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", marginBottom: "28px" }}>Mi Local</h1>

      {/* Info básica */}
      <SectionTitle>Información básica</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
        <Field label="Nombre del local" value={d.nombre as string ?? ""} onChange={v => set("nombre", v)} placeholder="Pizza Napoli" />
        <div>
          <label style={L}>Categoría</label>
          <select style={I as React.CSSProperties} value={d.categoria as string ?? ""} onChange={e => set("categoria", e.target.value)}>
            <option value="">Selecciona...</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={L}>Descripción ({((d.descripcion as string) ?? "").length}/300)</label>
          <textarea style={{ ...I, resize: "vertical", minHeight: "80px" }} maxLength={300} value={d.descripcion as string ?? ""} onChange={e => set("descripcion", e.target.value)} placeholder="Cuéntale al mundo sobre tu local..." />
        </div>
        <Field label="Teléfono" value={d.telefono as string ?? ""} onChange={v => set("telefono", v)} placeholder="+56 9 1234 5678" />
        <Field label="Instagram" value={d.instagram as string ?? ""} onChange={v => set("instagram", v)} placeholder="@tunegocio" />
      </div>

      {/* Ubicación */}
      <SectionTitle>Ubicación</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
        <Field label="Dirección" value={d.direccion as string ?? ""} onChange={v => set("direccion", v)} placeholder="Av. Providencia 1234" />
        <div>
          <label style={L}>Comuna</label>
          <select style={I as React.CSSProperties} value={d.comuna as string ?? ""} onChange={e => set("comuna", e.target.value)}>
            <option value="">Selecciona...</option>
            {COMUNAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Horarios */}
      <SectionTitle>Horarios</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
        {DIAS.map((dia, i) => (
          <div key={dia} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
            <input type="checkbox" checked={horarios[i]?.activo ?? true} onChange={e => setHorario(i, { activo: e.target.checked })} style={{ accentColor: "var(--accent)", width: "18px", height: "18px" }} />
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--text-primary)", width: "90px" }}>{dia}</span>
            {horarios[i]?.activo ? (
              <>
                <input type="time" style={{ ...I, width: "auto", padding: "8px 10px" }} value={horarios[i]?.abre ?? "12:00"} onChange={e => setHorario(i, { abre: e.target.value })} />
                <span style={{ color: "var(--text-muted)" }}>—</span>
                <input type="time" style={{ ...I, width: "auto", padding: "8px 10px" }} value={horarios[i]?.cierra ?? "22:00"} onChange={e => setHorario(i, { cierra: e.target.value })} />
              </>
            ) : (
              <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "#ff6b6b" }}>Cerrado</span>
            )}
          </div>
        ))}
      </div>

      {/* Fotos */}
      <SectionTitle>Fotos</SectionTitle>
      <div style={{ marginBottom: "32px" }}>
        <label style={L}>Logo (URL)</label>
        <input style={I} value={d.logoUrl as string ?? ""} onChange={e => set("logoUrl", e.target.value)} placeholder="https://..." />
        <label style={{ ...L, marginTop: "16px" }}>Galería ({galeria.length}/6)</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px", marginBottom: "10px" }}>
          {galeria.map((url, i) => (
            <div key={i} style={{ position: "relative", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
              <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => set("galeria", galeria.filter((_, j) => j !== i))} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", border: "none", color: "#ff8080", fontSize: "0.7rem", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer" }}>✕</button>
            </div>
          ))}
        </div>
        {galeria.length < 6 && (
          <div style={{ display: "flex", gap: "8px" }}>
            <input style={{ ...I, flex: 1 }} value={newFoto} onChange={e => setNewFoto(e.target.value)} placeholder="URL de la foto" />
            <button onClick={() => { if (newFoto.trim()) { set("galeria", [...galeria, newFoto.trim()]); setNewFoto(""); } }} style={{ ...I, width: "auto", background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem" }}>+ Agregar</button>
          </div>
        )}
      </div>

      {/* Menú */}
      <SectionTitle>Menú</SectionTitle>
      <div style={{ marginBottom: "32px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", cursor: "pointer" }}>
          <input type="checkbox" checked={tieneMenu ?? false} onChange={e => set("tieneMenu", e.target.checked)} style={{ accentColor: "var(--accent)", width: "18px", height: "18px" }} />
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)" }}>Mi local tiene menú con precios fijos</span>
        </label>
        {tieneMenu === false && (
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
            Tu menú del día se actualiza frecuentemente. Tus clientes lo entenderán.
          </p>
        )}
        {tieneMenu && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {menuCats.map((cat, ci) => (
              <div key={ci} style={{ background: "rgba(0,0,0,0.15)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <input style={{ ...I, flex: 1, fontWeight: 700 }} value={cat.nombre} onChange={e => { const c = [...menuCats]; c[ci] = { ...c[ci], nombre: e.target.value }; setMenuCats(c); }} placeholder="Nombre categoría" />
                  <button onClick={() => setMenuCats(menuCats.filter((_, j) => j !== ci))} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff8080", cursor: "pointer", padding: "8px 12px", fontSize: "0.7rem" }}>✕</button>
                </div>
                {cat.items.map((item, ii) => (
                  <div key={ii} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", marginBottom: "8px" }}>
                    <input style={{ ...I, fontSize: "0.8rem" }} value={item.nombre} onChange={e => { const c = [...menuCats]; c[ci].items[ii] = { ...item, nombre: e.target.value }; setMenuCats(c); }} placeholder="Plato" />
                    <input style={{ ...I, fontSize: "0.8rem" }} value={item.precio} onChange={e => { const c = [...menuCats]; c[ci].items[ii] = { ...item, precio: e.target.value }; setMenuCats(c); }} placeholder="$0" />
                    <button onClick={() => { const c = [...menuCats]; c[ci] = { ...c[ci], items: c[ci].items.filter((_, j) => j !== ii) }; setMenuCats(c); }} style={{ background: "none", border: "none", color: "#ff8080", cursor: "pointer", fontSize: "0.8rem" }}>✕</button>
                  </div>
                ))}
                <button onClick={() => { const c = [...menuCats]; c[ci] = { ...c[ci], items: [...c[ci].items, { nombre: "", descripcion: "", precio: "", destacado: false }] }; setMenuCats(c); }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", color: "var(--oasis-bright)", background: "none", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>+ Agregar plato</button>
              </div>
            ))}
            <button onClick={() => setMenuCats([...menuCats, { nombre: "", items: [] }])} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--accent)", background: "none", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", padding: "10px 16px", cursor: "pointer" }}>+ Agregar categoría</button>
          </div>
        )}
      </div>

      {/* Save */}
      <div style={{ position: "sticky", bottom: "16px", padding: "16px 0" }}>
        <button onClick={handleSave} style={{
          width: "100%", padding: "14px", background: saved ? "var(--oasis-teal)" : "var(--accent)",
          color: saved ? "#fff" : "var(--bg-primary)", fontFamily: "var(--font-cinzel)",
          fontSize: "0.9rem", fontWeight: 700, border: "none", borderRadius: "12px", cursor: "pointer",
        }}>
          {saved ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>{children}</h3>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <div><label style={L}>{label}</label><input style={I} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>;
}
