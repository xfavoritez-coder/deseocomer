"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import SubirFoto from "@/components/SubirFoto";
import { CATEGORIAS as CATEGORIAS_MASTER, CATEGORIA_EMOJI } from "@/lib/categorias";

const MapaUbicacion = dynamic(() => import("@/components/panel/MapaUbicacion"), { ssr: false, loading: () => <div style={{ height: "220px", borderRadius: "12px", background: "rgba(45,26,8,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)" }}>Cargando mapa...</span></div> });

const DATA_KEY = "deseocomer_panel_local_data";
const COMUNAS_POR_CIUDAD: Record<string, string[]> = {
  Santiago: ["Cerrillos","Cerro Navia","Conchalí","El Bosque","Estación Central","Huechuraba","Independencia","La Cisterna","La Florida","La Granja","La Pintana","La Reina","Las Condes","Lo Barnechea","Lo Espejo","Lo Prado","Macul","Maipú","Melipilla","Padre Hurtado","Pedro Aguirre Cerda","Peñalolén","Providencia","Pudahuel","Puente Alto","Quilicura","Quinta Normal","Recoleta","Renca","San Bernardo","San Joaquín","San Miguel","San Ramón","Santiago Centro","Vitacura","Ñuñoa"].sort(),
  Valparaíso: ["Valparaíso","Viña del Mar","Quilpué","Villa Alemana","Con Con","Limache","Olmué","Casablanca","Reñaca"].sort(),
  Concepción: ["Concepción","Talcahuano","Hualpén","Chiguayante","San Pedro de la Paz","Penco","Tomé","Coronel","Lota"].sort(),
  "La Serena": ["La Serena","Coquimbo","Ovalle","Vicuña","Andacollo"].sort(),
  Antofagasta: ["Antofagasta","Calama","Mejillones","Taltal","San Pedro de Atacama"].sort(),
  Temuco: ["Temuco","Padre Las Casas","Villarrica","Pucón","Angol","Victoria","Lautaro"].sort(),
};
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface HorarioDia { activo: boolean; abre: string; cierra: string }
interface MenuItem { nombre: string; descripcion: string; precio: string; destacado: boolean }
interface MenuCat { nombre: string; items: MenuItem[] }

function load(): Record<string, unknown> { try { return JSON.parse(localStorage.getItem(DATA_KEY) ?? "{}"); } catch { return {}; } }
function save(d: Record<string, unknown>) { localStorage.setItem(DATA_KEY, JSON.stringify(d)); }

function formatearDireccion(displayName: string, addressObj?: Record<string, string>): string {
  const partes = displayName.split(",").map(p => p.trim());
  if (partes.length < 2) return displayName;

  let calle = partes[0];
  let numero = partes[1];

  // Nominatim a veces devuelve "68, Dardignac, ..." (número primero)
  if (!isNaN(Number(calle)) && isNaN(Number(numero))) {
    [calle, numero] = [numero, calle];
  }

  const calleFormateada = calle.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  // Buscar comuna del addressObj de Nominatim
  const comuna = addressObj?.city_district || addressObj?.suburb || addressObj?.town || addressObj?.city || "";

  if (numero && !isNaN(Number(numero))) {
    return comuna ? `${calleFormateada} ${numero}, ${comuna}` : `${calleFormateada} ${numero}`;
  }
  return comuna ? `${calleFormateada}, ${numero}, ${comuna}` : `${calleFormateada}, ${numero}`;
}

const LS: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--color-label, var(--text-muted))", marginBottom: "6px", display: "block" };
const IS: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };

export default function MiLocalPage() {
  const [d, setD] = useState<Record<string, unknown>>({});
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [buscandoDireccion, setBuscandoDireccion] = useState(false);
  const [busquedaMsg, setBusquedaMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sugerencias, setSugerencias] = useState<any[]>([]);

  const CATEGORIAS = [...CATEGORIAS_MASTER];

  const showToast = (msg: string, tipo: "ok" | "error" = "ok") => { setToast({ msg, tipo }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    const local = load(); setD(local);
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (session.id) {
        fetch(`/api/locales/${session.id}`).then(r => r.ok ? r.json() : null).then(data => {
          if (data) {
            const merged = { ...local, nombre: data.nombre ?? local.nombre, categorias: data.categorias ?? local.categorias ?? [], nombreDueno: data.nombreDueno ?? local.nombreDueno, celularDueno: data.celularDueno ?? local.celularDueno, emailDueno: data.email ?? local.emailDueno, descripcion: data.descripcion ?? local.descripcion, historia: data.historia ?? local.historia, telefono: data.telefono ?? local.telefono, instagram: data.instagram ?? local.instagram, sitioWeb: data.sitioWeb ?? local.sitioWeb, direccion: data.direccion ?? local.direccion, comuna: data.comuna ?? local.comuna, ciudad: data.ciudad ?? local.ciudad, logoUrl: data.logoUrl ?? local.logoUrl, portadaUrl: data.portadaUrl ?? local.portadaUrl, galeria: data.galeria ?? local.galeria, horarios: data.horarios ?? local.horarios, tieneMenu: data.tieneMenu ?? local.tieneMenu, lat: data.lat ?? local.lat, lng: data.lng ?? local.lng, sirveEnMesa: data.sirveEnMesa ?? local.sirveEnMesa ?? true, tieneDelivery: data.tieneDelivery ?? local.tieneDelivery ?? false, comunasDelivery: data.comunasDelivery ?? local.comunasDelivery ?? [], tieneRetiro: data.tieneRetiro ?? local.tieneRetiro ?? false, linkPedido: data.linkPedido ?? local.linkPedido ?? "" };
            setD(merged); save(merged);
          }
        }).catch(() => {});
      }
    } catch {}
  }, []);

  const set = (k: string, v: unknown) => setD(prev => ({ ...prev, [k]: v }));
  const horarios: HorarioDia[] = (d.horarios as HorarioDia[]) ?? DIAS.map(() => ({ activo: false, abre: "12:00", cierra: "22:00" }));
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
          categorias: d.categorias ?? [],
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
        showToast("Cambios guardados con éxito", "ok");
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

      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", marginBottom: "28px" }}>Datos Local</h1>

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
        <div>
          <label style={LS}>Categorías <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", textTransform: "none", letterSpacing: 0 }}>(elige hasta 3)</span></label>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "11px", color: "rgba(240,234,214,0.3)", marginBottom: "12px", lineHeight: 1.5 }}>La primera que elijas aparecerá en tu card. Las otras sirven para que te encuentren cuando buscan ese tipo de comida.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {CATEGORIAS.map(cat => {
              const cats = (d.categorias as string[]) ?? [];
              const idx = cats.indexOf(cat);
              const sel = idx !== -1;
              const isPrimary = idx === 0;
              const maxed = cats.length >= 3 && !sel;
              return (
                <button key={cat} type="button" disabled={maxed}
                  onClick={() => {
                    const cur = (d.categorias as string[]) ?? [];
                    set("categorias", sel ? cur.filter(c => c !== cat) : [...cur, cat]);
                  }}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", position: "relative",
                    border: sel
                      ? isPrimary ? "1px solid #e8a84c" : "1px solid rgba(61,184,158,0.3)"
                      : "1px solid rgba(232,168,76,0.15)",
                    background: sel
                      ? isPrimary ? "rgba(232,168,76,0.2)" : "rgba(61,184,158,0.12)"
                      : "transparent",
                    color: sel
                      ? isPrimary ? "#e8a84c" : "#3db89e"
                      : maxed ? "rgba(240,234,214,0.2)" : "rgba(240,234,214,0.45)",
                    fontFamily: "var(--font-lato)", fontSize: "0.82rem",
                    cursor: maxed ? "not-allowed" : "pointer",
                    opacity: maxed ? 0.3 : 1,
                  }}>
                  {CATEGORIA_EMOJI[cat] ?? "🍽️"} {cat}
                  {isPrimary && <span style={{ marginLeft: "6px", fontSize: "0.7rem", opacity: 0.8 }}>★ Principal</span>}
                </button>
              );
            })}
          </div>
          {((d.categorias as string[]) ?? []).length > 0 && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", marginTop: "8px" }}>{((d.categorias as string[]) ?? []).length}/3 categorías</p>}
        </div>
        <div><label style={LS}>Descripción ({((d.descripcion as string) ?? "").length}/300)</label><textarea style={{ ...IS, resize: "vertical", minHeight: "80px" }} maxLength={300} value={d.descripcion as string ?? ""} onChange={e => set("descripcion", e.target.value)} placeholder="Cuéntale al mundo sobre tu local..." /></div>
        <Field label="Teléfono del local" value={d.telefono as string ?? ""} onChange={v => set("telefono", v)} placeholder="+56 2 2345 6789" />
        <Field label="Instagram" value={d.instagram as string ?? ""} onChange={v => set("instagram", v)} placeholder="@tunegocio" />
        <Field label="Sitio web" value={d.sitioWeb as string ?? ""} onChange={v => set("sitioWeb", v)} placeholder="https://tunegocio.cl" />
      </div>

      <SectionTitle>Ubicación</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
        <div><label style={LS}>Ciudad</label><select style={IS as React.CSSProperties} value={d.ciudad as string ?? ""} onChange={e => set("ciudad", e.target.value)}><option value="">Selecciona ciudad...</option><option value="Santiago">Santiago</option><option value="Valparaíso">Valparaíso</option><option value="Concepción">Concepción</option><option value="La Serena">La Serena</option><option value="Antofagasta">Antofagasta</option><option value="Temuco">Temuco</option><option value="Otra">Otra</option></select></div>
        {COMUNAS_POR_CIUDAD[d.ciudad as string] && <div><label style={LS}>Comuna</label><select style={IS as React.CSSProperties} value={d.comuna as string ?? ""} onChange={e => set("comuna", e.target.value)}><option value="">Selecciona...</option>{COMUNAS_POR_CIUDAD[d.ciudad as string].map(c => <option key={c} value={c}>{c}</option>)}</select></div>}
        {(d.ciudad as string) === "Otra" && <div><label style={LS}>Comuna / Sector</label><input style={IS} value={d.comuna as string ?? ""} onChange={e => set("comuna", e.target.value)} placeholder="Escribe tu comuna o sector" /></div>}

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
                    const ciudad = (d.ciudad as string) || "Santiago";
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val + ", " + ciudad + ", Chile")}&format=json&limit=4&addressdetails=1`);
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
                setBuscandoDireccion(true); setBusquedaMsg("");
                try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(dir + ", Santiago, Chile")}&format=json&limit=1&addressdetails=1`);
                  const data = await res.json();
                  if (data[0]) {
                    set("lat", parseFloat(data[0].lat));
                    set("lng", parseFloat(data[0].lon));
                    const formatted = formatearDireccion(data[0].display_name, data[0].address);
                    set("direccion", formatted);
                    setSugerencias([]);
                    setBusquedaMsg("✓ Dirección encontrada");
                  } else {
                    setBusquedaMsg("No se encontró la dirección. Intenta ser más específico.");
                  }
                } catch { setBusquedaMsg("Error al buscar. Intenta de nuevo."); }
                setBuscandoDireccion(false);
                setTimeout(() => setBusquedaMsg(""), 4000);
              }}
              style={{ padding: "10px 16px", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.08em", color: "var(--accent)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
            >
              {buscandoDireccion ? "..." : "🔍 Buscar"}
            </button>
          </div>

          {/* Sugerencias dropdown */}
          {sugerencias.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#0a0812", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", overflow: "hidden", marginTop: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {sugerencias.map((s: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const formatted = formatearDireccion(s.display_name, s.address);
                    set("direccion", formatted);
                    set("lat", parseFloat(s.lat));
                    set("lng", parseFloat(s.lon));
                    setSugerencias([]);
                  }}
                  style={{ display: "block", width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderBottom: i < sugerencias.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", textAlign: "left", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.7)", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,168,76,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  {formatearDireccion(s.display_name, s.address)}
                </button>
              ))}
            </div>
          )}
        </div>

        {busquedaMsg && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: busquedaMsg.startsWith("✓") ? "#3db89e" : "#ff8080", marginTop: "6px", marginBottom: "4px" }}>{busquedaMsg}</p>}
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", marginTop: busquedaMsg ? "2px" : "-6px", marginBottom: "4px" }}>Mueve el pin en el mapa para marcar la ubicación exacta</p>
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

      {/* Pedidos y modalidades */}
      <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px" }}>Pedidos y modalidades</p>

        {/* Toggle Sirve en mesa */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)" }}>¿Atienden en mesa?</span>
          <button onClick={() => {
            const v = !(d.sirveEnMesa as boolean ?? true);
            set("sirveEnMesa", v);
            try {
              const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
              if (session.id) fetch(`/api/locales/${session.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sirveEnMesa: v }) });
            } catch {}
          }} style={{ width: "48px", height: "26px", borderRadius: "13px", border: "none", cursor: "pointer", background: (d.sirveEnMesa as boolean ?? true) ? "#3db89e" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: (d.sirveEnMesa as boolean ?? true) ? "25px" : "3px", transition: "left 0.2s" }} />
          </button>
        </div>

        {/* Toggle Retiro */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)" }}>¿Ofreces retiro en local?</span>
          <button onClick={() => {
            const v = !(d.tieneRetiro as boolean);
            set("tieneRetiro", v);
            try {
              const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
              if (session.id) fetch(`/api/locales/${session.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tieneRetiro: v }) });
            } catch {}
          }} style={{ width: "48px", height: "26px", borderRadius: "13px", border: "none", cursor: "pointer", background: (d.tieneRetiro as boolean) ? "#3db89e" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: (d.tieneRetiro as boolean) ? "25px" : "3px", transition: "left 0.2s" }} />
          </button>
        </div>

        {/* Toggle Delivery */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)" }}>¿Ofreces delivery?</span>
          <button onClick={() => {
            const v = !(d.tieneDelivery as boolean);
            set("tieneDelivery", v);
            try {
              const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
              if (session.id) fetch(`/api/locales/${session.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tieneDelivery: v }) });
            } catch {}
          }} style={{ width: "48px", height: "26px", borderRadius: "13px", border: "none", cursor: "pointer", background: (d.tieneDelivery as boolean) ? "#3db89e" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: (d.tieneDelivery as boolean) ? "25px" : "3px", transition: "left 0.2s" }} />
          </button>
        </div>

        {/* Comunas delivery */}
        {(d.tieneDelivery as boolean) && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Comunas donde haces delivery</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "160px", overflowY: "auto" }}>
              {(COMUNAS_POR_CIUDAD[d.ciudad as string] ?? COMUNAS_POR_CIUDAD.Santiago).map((c: string) => {
                const comunas = (d.comunasDelivery as string[]) ?? [];
                const sel = comunas.includes(c);
                return (
                  <button key={c} onClick={() => {
                    const cur = (d.comunasDelivery as string[]) ?? [];
                    const next = sel ? cur.filter(x => x !== c) : [...cur, c];
                    set("comunasDelivery", next);
                    try {
                      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
                      if (session.id) fetch(`/api/locales/${session.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ comunasDelivery: next }) });
                    } catch {}
                  }} style={{ padding: "5px 12px", borderRadius: "20px", cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.78rem", background: sel ? "rgba(232,168,76,0.15)" : "transparent", border: sel ? "1px solid rgba(232,168,76,0.5)" : "1px solid rgba(255,255,255,0.1)", color: sel ? "#e8a84c" : "rgba(240,234,214,0.45)" }}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Link pedidos */}
        <div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Link o número para recibir pedidos (opcional)</p>
          <input value={(d.linkPedido as string) ?? ""} onChange={e => set("linkPedido", e.target.value)} onBlur={() => {
            try {
              const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
              if (session.id) fetch(`/api/locales/${session.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ linkPedido: d.linkPedido }) });
            } catch {}
          }} placeholder="Ej: +56912345678 o https://tupedido.com" style={{ width: "100%", padding: "12px 16px", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", marginTop: "6px", lineHeight: 1.4 }}>Puede ser tu número de WhatsApp o tu web de pedidos. Los clientes verán un botón para contactarte directamente.</p>
        </div>
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
  return <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>{children}</h3>;
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <div><label style={LS}>{label}</label><input type={type} style={IS} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></div>;
}
