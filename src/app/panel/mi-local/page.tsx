"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import SubirFoto from "@/components/SubirFoto";

const MapaUbicacion = dynamic(() => import("@/components/panel/MapaUbicacion"), { ssr: false, loading: () => <div style={{ height: "220px", borderRadius: "12px", background: "rgba(45,26,8,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)" }}>Cargando mapa...</span></div> });

const DATA_KEY = "deseocomer_panel_local_data";
const COMUNAS_SANTIAGO = ["Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Melipilla","Padre Hurtado","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Puente Alto","Quilicura","Quinta Normal","Recoleta","Renca","San Bernardo","San Joaquín","San Miguel","San Ramón","Santiago Centro","Vitacura","Ñuñoa"].sort();
const CATEGORIAS = ["Pizza", "Sushi", "Hamburguesa", "Vegano", "Café", "Almuerzo", "Pastas", "Mexicano", "Mariscos", "Otro"];
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const TAGS = ["Pizza","Sushi","Hamburguesa","Mexicano","Vegano","Vegetariano","Saludable","Pastas","Pollo","Mariscos","Parrilla","Árabe","Peruano","Japonés","Italiano","Sin gluten","Café","Postres","Desayuno","Brunch","Delivery","Para llevar","Reservas"];

interface HorarioDia { activo: boolean; abre: string; cierra: string }
interface MenuItem { nombre: string; descripcion: string; precio: string; destacado: boolean }
interface MenuCat { nombre: string; items: MenuItem[] }

function load(): Record<string, unknown> { try { return JSON.parse(localStorage.getItem(DATA_KEY) ?? "{}"); } catch { return {}; } }
function save(d: Record<string, unknown>) { localStorage.setItem(DATA_KEY, JSON.stringify(d)); }

function formatearDireccion(displayName: string): string {
  const partes = displayName.split(",").map(p => p.trim());
  if (partes.length < 2) return displayName;

  let calle = partes[0];
  let numero = partes[1];
  const sector = partes[2] ?? "";

  // Nominatim a veces devuelve "68, Dardignac, ..." (número primero)
  if (!isNaN(Number(calle)) && isNaN(Number(numero))) {
    [calle, numero] = [numero, calle];
  }

  const calleFormateada = calle.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  if (numero && !isNaN(Number(numero))) {
    return sector ? `${calleFormateada} ${numero}, ${sector}` : `${calleFormateada} ${numero}`;
  }
  return `${calleFormateada}, ${numero}`;
}

const LS: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "6px", display: "block" };
const IS: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };

export default function MiLocalPage() {
  const [d, setD] = useState<Record<string, unknown>>({});
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sugerencias, setSugerencias] = useState<any[]>([]);

  const showToast = (msg: string, tipo: "ok" | "error" = "ok") => { setToast({ msg, tipo }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    const local = load(); setD(local);
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (session.id) {
        fetch(`/api/locales/${session.id}`).then(r => r.ok ? r.json() : null).then(data => {
          if (data) {
            const merged = { ...local, nombre: data.nombre ?? local.nombre, categoria: data.categoria ?? local.categoria, nombreDueno: data.nombreDueno ?? local.nombreDueno, celularDueno: data.celularDueno ?? local.celularDueno, emailDueno: data.email ?? local.emailDueno, descripcion: data.descripcion ?? local.descripcion, historia: data.historia ?? local.historia, telefono: data.telefono ?? local.telefono, instagram: data.instagram ?? local.instagram, sitioWeb: data.sitioWeb ?? local.sitioWeb, direccion: data.direccion ?? local.direccion, comuna: data.comuna ?? local.comuna, ciudad: data.ciudad ?? local.ciudad, logoUrl: data.logoUrl ?? local.logoUrl, portadaUrl: data.portadaUrl ?? local.portadaUrl, galeria: data.galeria ?? local.galeria, horarios: data.horarios ?? local.horarios, tags: data.tags ?? local.tags ?? [], tieneMenu: data.tieneMenu ?? local.tieneMenu, lat: data.lat ?? local.lat, lng: data.lng ?? local.lng };
            setD(merged); save(merged);
          }
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const set = (k: string, v: unknown) => setD(prev => ({ ...prev, [k]: v }));
  const horarios: HorarioDia[] = (d.horarios as HorarioDia[]) ?? DIAS.map(() => ({ activo: true, abre: "12:00", cierra: "22:00" }));
  const setHorario = (i: number, h: Partial<HorarioDia>) => { const next = [...horarios]; next[i] = { ...next[i], ...h }; set("horarios", next); };
  const tieneMenu = d.tieneMenu as boolean | undefined;
  const menuCats: MenuCat[] = (d.menuCategorias as MenuCat[]) ?? [];
  const setMenuCats = (cats: MenuCat[]) => set("menuCategorias", cats);



  const handleSave = async () => {
    setSaving(true);
    save(d);
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (!session.id) { showToast("No hay sesión activa", "error"); setSaving(false); return; }

      const preposiciones = ["de", "del", "la", "el", "los", "las", "y", "a", "en"];
      const direccionFormateada = (d.direccion as string ?? "").split(" ").map((w: string) => {
        if (preposiciones.includes(w.toLowerCase())) return w.toLowerCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join(" ");

      const res = await fetch(`/api/locales/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: d.nombre,
          categoria: d.categoria,
          descripcion: d.descripcion,
          historia: d.historia,
          telefono: d.telefono,
          instagram: d.instagram,
          sitioWeb: d.sitioWeb,
          direccion: direccionFormateada,
          comuna: d.comuna,
          ciudad: d.ciudad,
          horarios: d.horarios,
          logoUrl: d.logoUrl,
          portadaUrl: d.portadaUrl,
          tags: d.tags ?? [],
          tieneMenu: d.tieneMenu,
          lat: d.lat,
          lng: d.lng,
        }),
      });

      if (res.ok) {
        const updated = await fetch(`/api/locales/${session.id}`).then(r => r.json()).catch(() => null);
        if (updated?.slug && !session.slug) {
          session.slug = updated.slug;
          localStorage.setItem("deseocomer_local_session", JSON.stringify(session));
          sessionStorage.setItem("deseocomer_local_session", JSON.stringify(session));
        }
        setSaving(false);
        setSaved(true);
        setTimeout(() => window.location.reload(), 1200);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error ?? "Error al guardar. Intenta de nuevo.", "error");
        setSaving(false);
      }
    } catch (err) {
      console.error("[handleSave] Error:", err);
      showToast("Error de conexión. Intenta de nuevo.", "error");
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "680px" }}>
      {toast && (
        <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: toast.tipo === "ok" ? "rgba(13,40,35,0.98)" : "rgba(40,10,10,0.98)", border: `1px solid ${toast.tipo === "ok" ? "rgba(61,184,158,0.5)" : "rgba(255,80,80,0.4)"}`, borderRadius: "30px", padding: "14px 28px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", whiteSpace: "nowrap", animation: "dc-slideUp 0.3s ease" }}>
          <span style={{ fontSize: "1.1rem" }}>{toast.tipo === "ok" ? "✓" : "⚠️"}</span>
          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.05em", color: toast.tipo === "ok" ? "#3db89e" : "#ff6b6b" }}>{toast.msg}</span>
        </div>
      )}

      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", marginBottom: "28px" }}>Datos de Local</h1>

      <SectionTitle>Fotos</SectionTitle>
      <div style={{ marginBottom: "32px" }}>
        <label style={LS}>Logo del local</label>
        <SubirFoto folder="logos" circular preview={d.logoUrl as string || null} label="Subir logo" onUpload={url => set("logoUrl", url)} />
        <label style={{ ...LS, marginTop: "20px" }}>Foto de portada</label>
        <SubirFoto folder="portadas" preview={d.portadaUrl as string || null} label="Subir portada" height="160px" onUpload={url => set("portadaUrl", url)} />
      </div>

      <SectionTitle>Información del local</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
        <Field label="Nombre del local" value={d.nombre as string ?? ""} onChange={v => set("nombre", v)} placeholder="Pizza Napoli" />
        <div><label style={LS}>Categoría</label><select style={IS as React.CSSProperties} value={d.categoria as string ?? ""} onChange={e => set("categoria", e.target.value)}><option value="">Selecciona...</option>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        <div>
          <label style={LS}>Especialidades <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)", textTransform: "none", letterSpacing: 0 }}>(máx. 4)</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {TAGS.map(tag => { const tags = (d.tags as string[]) ?? []; const sel = tags.includes(tag); const maxed = tags.length >= 4 && !sel; return <button key={tag} type="button" disabled={maxed} onClick={() => { const cur = (d.tags as string[]) ?? []; set("tags", sel ? cur.filter(t => t !== tag) : [...cur, tag]); }} style={{ padding: "6px 14px", borderRadius: "20px", border: sel ? "1px solid var(--accent)" : "1px solid rgba(232,168,76,0.15)", background: sel ? "rgba(232,168,76,0.15)" : "transparent", color: sel ? "var(--accent)" : maxed ? "rgba(240,234,214,0.2)" : "rgba(240,234,214,0.55)", fontFamily: "var(--font-lato)", fontSize: "0.82rem", cursor: maxed ? "default" : "pointer" }}>{tag}</button>; })}
          </div>
          {((d.tags as string[]) ?? []).length > 0 && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)", marginTop: "8px" }}>{((d.tags as string[]) ?? []).length}/4 etiquetas</p>}
        </div>
        <div><label style={LS}>Descripción ({((d.descripcion as string) ?? "").length}/300)</label><textarea style={{ ...IS, resize: "vertical", minHeight: "80px" }} maxLength={300} value={d.descripcion as string ?? ""} onChange={e => set("descripcion", e.target.value)} placeholder="Cuéntale al mundo sobre tu local..." /></div>
        <Field label="Teléfono del local" value={d.telefono as string ?? ""} onChange={v => set("telefono", v)} placeholder="+56 2 2345 6789" />
        <Field label="Instagram" value={d.instagram as string ?? ""} onChange={v => set("instagram", v)} placeholder="@tunegocio" />
        <Field label="Sitio web" value={d.sitioWeb as string ?? ""} onChange={v => set("sitioWeb", v)} placeholder="https://tunegocio.cl" />
      </div>

      <SectionTitle>Ubicación</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
        <div><label style={LS}>Ciudad</label><select style={IS as React.CSSProperties} value={d.ciudad as string ?? ""} onChange={e => set("ciudad", e.target.value)}><option value="">Selecciona ciudad...</option><option value="Santiago">Santiago</option><option value="Valparaíso">Valparaíso</option><option value="Concepción">Concepción</option><option value="La Serena">La Serena</option><option value="Antofagasta">Antofagasta</option><option value="Temuco">Temuco</option><option value="Otra">Otra</option></select></div>
        {(d.ciudad as string) === "Santiago" && <div><label style={LS}>Comuna</label><select style={IS as React.CSSProperties} value={d.comuna as string ?? ""} onChange={e => set("comuna", e.target.value)}><option value="">Selecciona...</option>{COMUNAS_SANTIAGO.map(c => <option key={c} value={c}>{c}</option>)}</select></div>}

        {/* Dirección con autocomplete */}
        <div style={{ position: "relative" }}>
          <label style={LS}>Dirección</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              style={{ ...IS, flex: 1 }}
              value={d.direccion as string ?? ""}
              onChange={async e => {
                const val = e.target.value;
                set("direccion", val);
                if (val.length > 3) {
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ", Santiago, Chile")}&format=json&limit=4&addressdetails=1`);
                    const data = await res.json();
                    setSugerencias(data);
                  } catch { /* ignore */ }
                } else {
                  setSugerencias([]);
                }
              }}
              placeholder="Av. Providencia 1234"
            />
            <button
              type="button"
              onClick={async () => {
                const dir = d.direccion as string;
                if (!dir) return;
                setBuscandoDireccion(true);
                try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dir + ", Santiago, Chile")}&format=json&limit=1`);
                  const data = await res.json();
                  if (data[0]) {
                    set("lat", parseFloat(data[0].lat));
                    set("lng", parseFloat(data[0].lon));
                    const formatted = formatearDireccion(data[0].display_name);
                    set("direccion", formatted);
                    setSugerencias([]);
                  }
                } catch { /* ignore */ }
                setBuscandoDireccion(false);
              }}
              style={{ padding: "10px 16px", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.08em", color: "var(--accent)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {buscandoDireccion ? "..." : "🔍 Buscar"}
            </button>
          </div>

          {/* Sugerencias dropdown */}
          {sugerencias.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#0a0812", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", overflow: "hidden", marginTop: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
              {sugerencias.map((s: Record<string, string>, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const formatted = formatearDireccion(s.display_name);
                    set("direccion", formatted);
                    set("lat", parseFloat(s.lat));
                    set("lng", parseFloat(s.lon));
                    setSugerencias([]);
                  }}
                  style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderBottom: i < sugerencias.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", textAlign: "left", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.7)", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,168,76,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {formatearDireccion(s.display_name)}
                </button>
              ))}
            </div>
          )}
        </div>

        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)", marginTop: "-6px", marginBottom: "4px" }}>Mueve el pin en el mapa para marcar la ubicación exacta</p>
        <MapaUbicacion lat={d.lat as number || -33.4489} lng={d.lng as number || -70.6693} onChange={(lat, lng) => { set("lat", lat); set("lng", lng); }} />
      </div>

      <SectionTitle>Horarios</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "32px" }}>
        {DIAS.map((dia, i) => (
          <div key={dia} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
            <input type="checkbox" checked={horarios[i]?.activo ?? true} onChange={e => setHorario(i, { activo: e.target.checked })} style={{ accentColor: "var(--accent)", width: "18px", height: "18px" }} />
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--text-primary)", width: "90px" }}>{dia}</span>
            {horarios[i]?.activo ? (<><input type="time" style={{ ...IS, width: "auto", padding: "8px 10px" }} value={horarios[i]?.abre ?? "12:00"} onChange={e => setHorario(i, { abre: e.target.value })} /><span style={{ color: "var(--text-muted)" }}>—</span><input type="time" style={{ ...IS, width: "auto", padding: "8px 10px" }} value={horarios[i]?.cierra ?? "22:00"} onChange={e => setHorario(i, { cierra: e.target.value })} /></>) : <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "#ff6b6b" }}>Cerrado</span>}
          </div>
        ))}
      </div>

      <SectionTitle>Menú</SectionTitle>
      <div style={{ marginBottom: "32px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", cursor: "pointer" }}><input type="checkbox" checked={tieneMenu ?? false} onChange={e => set("tieneMenu", e.target.checked)} style={{ accentColor: "var(--accent)", width: "18px", height: "18px" }} /><span style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)" }}>Mi local tiene menú con precios fijos</span></label>
        {tieneMenu === false && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>Tu menú del día se actualiza frecuentemente. Tus clientes lo entenderán.</p>}
        {tieneMenu && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {menuCats.map((cat, ci) => (
              <div key={ci} style={{ background: "rgba(0,0,0,0.15)", borderRadius: "12px", padding: "16px", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}><input style={{ ...IS, flex: 1, fontWeight: 700 }} value={cat.nombre} onChange={e => { const c = [...menuCats]; c[ci] = { ...c[ci], nombre: e.target.value }; setMenuCats(c); }} placeholder="Nombre categoría" /><button onClick={() => setMenuCats(menuCats.filter((_, j) => j !== ci))} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff8080", cursor: "pointer", padding: "8px 12px", fontSize: "0.7rem" }}>✕</button></div>
                {cat.items.map((item, ii) => (<div key={ii} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", marginBottom: "8px" }}><input style={{ ...IS, fontSize: "0.8rem" }} value={item.nombre} onChange={e => { const c = [...menuCats]; c[ci].items[ii] = { ...item, nombre: e.target.value }; setMenuCats(c); }} placeholder="Plato" /><input style={{ ...IS, fontSize: "0.8rem" }} value={item.precio} onChange={e => { const c = [...menuCats]; c[ci].items[ii] = { ...item, precio: e.target.value }; setMenuCats(c); }} placeholder="$0" /><button onClick={() => { const c = [...menuCats]; c[ci] = { ...c[ci], items: c[ci].items.filter((_, j) => j !== ii) }; setMenuCats(c); }} style={{ background: "none", border: "none", color: "#ff8080", cursor: "pointer", fontSize: "0.8rem" }}>✕</button></div>))}
                <button onClick={() => { const c = [...menuCats]; c[ci] = { ...c[ci], items: [...c[ci].items, { nombre: "", descripcion: "", precio: "", destacado: false }] }; setMenuCats(c); }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", color: "var(--oasis-bright)", background: "none", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}>+ Agregar plato</button>
              </div>
            ))}
            <button onClick={() => setMenuCats([...menuCats, { nombre: "", items: [] }])} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--accent)", background: "none", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", padding: "10px 16px", cursor: "pointer" }}>+ Agregar categoría</button>
          </div>
        )}
      </div>

      <div style={{ padding: "24px 0 40px" }}>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{ width: "100%", maxWidth: "300px", padding: "14px 32px", background: saved ? "#3db89e" : "var(--accent)", color: saved ? "#fff" : "var(--bg-primary)", fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", fontWeight: 700, border: "none", borderRadius: "12px", cursor: saving || saved ? "default" : "pointer", transition: "all 0.3s", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>

      <style>{`
        @keyframes dc-slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>{children}</h3>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <div><label style={LS}>{label}</label><input type={type} style={IS} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>;
}
