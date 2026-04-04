"use client";
import { useState, useEffect, useRef } from "react";
import { adminFetch } from "@/lib/adminFetch";

interface Campana {
  id: string; asunto: string; template: string; estado: string;
  totalContactos: number; totalEnviados: number; totalErrores: number;
  totalAbiertos: number; totalClicks: number; totalRegistrados: number;
  createdAt: string; enviadoAt: string | null;
}

const INVALID_PATTERNS = [/^0@/, /^xd@/, /^hola@gmail/, /^test@/, /^111@/, /^qwe@/, /^no disponible$/i, /^http/i, /yopmail/i, /^\./, /@\./];

function isValidEmail(e: string): boolean {
  if (!e || !e.includes("@") || !e.includes(".")) return false;
  if (e.length < 6) return false;
  for (const p of INVALID_PATTERNS) if (p.test(e)) return false;
  return true;
}

export default function AdminCampanas() {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [asunto, setAsunto] = useState("");
  const [contactos, setContactos] = useState<{ email: string; nombre: string | null }[]>([]);
  const [parseInfo, setParseInfo] = useState("");
  const [creating, setCreating] = useState(false);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Campana | null>(null);
  const [detalleContactos, setDetalleContactos] = useState<any[]>([]);
  const [pruebaId, setPruebaId] = useState<string | null>(null);
  const [pruebaEmail, setPruebaEmail] = useState("");
  const [pruebaEnviando, setPruebaEnviando] = useState(false);
  const [cupos, setCupos] = useState({ total: 50, usados: 0, restantes: 50 });
  const [editCupos, setEditCupos] = useState(false);
  const [newCuposTotal, setNewCuposTotal] = useState("50");
  const fileRef = useRef<HTMLInputElement>(null);

  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      adminFetch("/api/admin/campanas").then(r => r.json()),
      fetch("/api/cupos-founder").then(r => r.json()),
    ]).then(([c, cu]) => {
      if (Array.isArray(c)) setCampanas(c);
      if (cu.total !== undefined) setCupos(cu);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const XLSX = await import("xlsx");
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const emailKey = Object.keys(rows[0] || {}).find(k => /email|correo|mail/i.test(k)) || "email";
    const nombreKey = Object.keys(rows[0] || {}).find(k => /nombre|name|local/i.test(k));

    const seen = new Set<string>();
    let dupes = 0, invalidos = 0;
    const valid: { email: string; nombre: string | null }[] = [];

    for (const row of rows) {
      const raw = String(row[emailKey] || "").trim().toLowerCase();
      if (!raw) continue;
      if (!isValidEmail(raw)) { invalidos++; continue; }
      if (seen.has(raw)) { dupes++; continue; }
      seen.add(raw);
      valid.push({ email: raw, nombre: nombreKey ? String(row[nombreKey] || "").trim() || null : null });
    }

    setContactos(valid);
    setParseInfo(`${valid.length} contactos válidos (${dupes} duplicados eliminados, ${invalidos} inválidos filtrados)`);
  };

  const crearCampana = async () => {
    if (!asunto.trim() || contactos.length === 0) return;
    setCreating(true);
    try {
      const res = await adminFetch("/api/admin/campanas", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asunto, template: "founder", contactos }),
      });
      const data = await res.json();
      if (data.ok) {
        show(`Campaña creada con ${data.contactos} contactos${data.filtradosYaRegistrados > 0 ? ` (${data.filtradosYaRegistrados} ya registrados excluidos)` : ""}`);
        setAsunto(""); setContactos([]); setParseInfo("");
        if (fileRef.current) fileRef.current.value = "";
        fetchData();
      } else show("Error: " + (data.error || "desconocido"));
    } catch { show("Error de conexión"); }
    setCreating(false);
  };

  const enviarCampana = async (id: string) => {
    setEnviando(id);
    try {
      const res = await adminFetch(`/api/admin/campanas/${id}/enviar`, { method: "POST" });
      const data = await res.json();
      if (data.ok) show(`Enviados: ${data.enviados}, Errores: ${data.errores}`);
      else show("Error: " + (data.error || "desconocido"));
      fetchData();
    } catch { show("Error de conexión"); }
    setEnviando(null);
  };

  const enviarPrueba = async (campanaId: string) => {
    if (!pruebaEmail.includes("@")) return;
    setPruebaEnviando(true);
    try {
      const res = await adminFetch(`/api/admin/campanas/${campanaId}/prueba`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailPrueba: pruebaEmail }),
      });
      const data = await res.json();
      if (data.ok) { show(`Email de prueba enviado a ${pruebaEmail}`); setPruebaId(null); setPruebaEmail(""); }
      else show("Error: " + (data.error || "desconocido"));
    } catch { show("Error de conexión"); }
    setPruebaEnviando(false);
  };

  const verDetalle = async (c: Campana) => {
    setDetalle(c);
    try {
      const res = await adminFetch(`/api/admin/campanas/${c.id}/contactos`);
      const data = await res.json();
      if (Array.isArray(data)) setDetalleContactos(data);
    } catch { setDetalleContactos([]); }
  };

  const guardarCupos = async () => {
    try {
      await adminFetch("/api/admin/config", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: "cupos_founder_total", valor: newCuposTotal }),
      });
      show("Cupos actualizados");
      setEditCupos(false);
      fetchData();
    } catch { show("Error"); }
  };

  const pct = (n: number, total: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  const S = {
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 14, padding: 20 } as React.CSSProperties,
    btn: { padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.8rem", fontWeight: 600, border: "none" } as React.CSSProperties,
    input: { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" as const } as React.CSSProperties,
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      borrador: { bg: "rgba(232,168,76,0.1)", color: "#e8a84c" },
      enviando: { bg: "rgba(61,184,158,0.1)", color: "#3db89e" },
      completada: { bg: "rgba(61,184,158,0.15)", color: "#3db89e" },
    };
    const s = map[estado] ?? map.borrador;
    return <span style={{ padding: "3px 10px", borderRadius: 8, background: s.bg, color: s.color, fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{estado}</span>;
  };

  return (
    <div style={{ maxWidth: 900 }}>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, background: "rgba(61,184,158,0.95)", color: "#0a0812", padding: "10px 20px", borderRadius: 10, fontFamily: "var(--font-lato)", fontSize: "0.85rem", fontWeight: 600, zIndex: 999 }}>{toast}</div>}

      <h1 style={{ fontFamily: "var(--font-cinzel-decorative, Georgia)", fontSize: "1.3rem", color: "var(--accent, #e8a84c)", marginBottom: 24 }}>📧 Campañas de email</h1>

      {/* Nueva campaña */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16 }}>Nueva campaña</p>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: 6 }}>Asunto del email</label>
          <input value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Escribe el asunto aquí..." style={S.input} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: 6 }}>Subir lista de contactos (.xlsx o .csv)</label>
          <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" onChange={handleFile} style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }} />
        </div>
        {parseInfo && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "#3db89e", marginBottom: 12 }}>{parseInfo}</p>}
        {contactos.length > 0 && (
          <div style={{ marginBottom: 12, maxHeight: 120, overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 10 }}>
            {contactos.slice(0, 5).map((c, i) => (
              <p key={i} style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.5)", margin: "2px 0" }}>{c.email}{c.nombre ? ` — ${c.nombre}` : ""}</p>
            ))}
            {contactos.length > 5 && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.3)" }}>... y {contactos.length - 5} más</p>}
          </div>
        )}
        <button onClick={crearCampana} disabled={creating || !asunto.trim() || contactos.length === 0} style={{ ...S.btn, background: "#e8a84c", color: "#0a0812", opacity: asunto.trim() && contactos.length > 0 ? 1 : 0.4 }}>{creating ? "Creando..." : "Crear campaña →"}</button>
      </div>

      {/* Cupos founder */}
      <div style={{ ...S.card, marginBottom: 20 }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 12 }}>Cupos de fundador</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "1.1rem", fontWeight: 700, color: "var(--accent)" }}>{cupos.usados}/{cupos.total}</span>
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)" }}>({cupos.restantes} restantes)</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "rgba(0,0,0,0.3)", marginBottom: 10 }}>
          <div style={{ height: "100%", borderRadius: 4, background: "#e8a84c", width: `${pct(cupos.usados, cupos.total)}%`, transition: "width 0.3s" }} />
        </div>
        {editCupos ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="number" value={newCuposTotal} onChange={e => setNewCuposTotal(e.target.value)} style={{ ...S.input, width: 80 }} />
            <button onClick={guardarCupos} style={{ ...S.btn, background: "#3db89e", color: "#0a0812" }}>Guardar</button>
            <button onClick={() => setEditCupos(false)} style={{ ...S.btn, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,234,214,0.5)" }}>Cancelar</button>
          </div>
        ) : (
          <button onClick={() => { setEditCupos(true); setNewCuposTotal(String(cupos.total)); }} style={{ ...S.btn, background: "rgba(232,168,76,0.1)", color: "#e8a84c" }}>Editar cupos</button>
        )}
      </div>

      {/* Campañas existentes */}
      <div style={{ ...S.card }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: 16 }}>Campañas</p>
        {loading ? (
          <p style={{ fontFamily: "var(--font-lato)", color: "rgba(240,234,214,0.4)" }}>Cargando...</p>
        ) : campanas.length === 0 ? (
          <p style={{ fontFamily: "var(--font-lato)", color: "rgba(240,234,214,0.3)" }}>No hay campañas aún</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {campanas.map(c => (
              <div key={c.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 4 }}>{c.asunto}</p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {estadoBadge(c.estado)}
                      {c.enviadoAt && <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)" }}>{new Date(c.enviadoAt).toLocaleDateString("es-CL")}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setPruebaId(pruebaId === c.id ? null : c.id); setPruebaEmail(""); }} style={{ ...S.btn, background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>🧪 Prueba</button>
                    {c.estado === "borrador" && (
                      <button onClick={() => { if (confirm(`¿Enviar a ${c.totalContactos} contactos?`)) enviarCampana(c.id); }} disabled={enviando === c.id} style={{ ...S.btn, background: "#3db89e", color: "#0a0812" }}>{enviando === c.id ? "Enviando..." : "Enviar"}</button>
                    )}
                    <button onClick={() => verDetalle(c)} style={{ ...S.btn, background: "rgba(255,255,255,0.05)", color: "rgba(240,234,214,0.5)" }}>Detalle</button>
                  </div>
                </div>
                {pruebaId === c.id && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, padding: 10, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 8 }}>
                    <input type="email" placeholder="Email de prueba" value={pruebaEmail} onChange={e => setPruebaEmail(e.target.value)} style={{ ...S.input, flex: 1, fontSize: "0.82rem", padding: "8px 12px" }} />
                    <button onClick={() => enviarPrueba(c.id)} disabled={pruebaEnviando || !pruebaEmail.includes("@")} style={{ ...S.btn, background: "#a78bfa", color: "#0a0812", whiteSpace: "nowrap", opacity: pruebaEmail.includes("@") ? 1 : 0.4 }}>{pruebaEnviando ? "..." : "Enviar prueba"}</button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontFamily: "var(--font-lato)", fontSize: "0.78rem" }}>
                  <span style={{ color: "rgba(240,234,214,0.5)" }}>📤 {c.totalEnviados}/{c.totalContactos}</span>
                  <span style={{ color: "rgba(240,234,214,0.5)" }}>👁 {c.totalAbiertos} ({pct(c.totalAbiertos, c.totalEnviados)}%)</span>
                  <span style={{ color: "rgba(240,234,214,0.5)" }}>🖱 {c.totalClicks} ({pct(c.totalClicks, c.totalEnviados)}%)</span>
                  <span style={{ color: "#3db89e" }}>✅ {c.totalRegistrados}</span>
                  {c.totalErrores > 0 && <span style={{ color: "#ff6b6b" }}>❌ {c.totalErrores}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {detalle && (<>
        <div onClick={() => setDetalle(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 16, padding: 28, width: "90%", maxWidth: 500, maxHeight: "80vh", overflowY: "auto", zIndex: 999 }}>
          <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: 16 }}>{detalle.asunto}</h3>
          {detalleContactos.length > 0 ? detalleContactos.map((ct: any) => (
            <div key={ct.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "0.78rem" }}>
              <span style={{ color: "var(--text-muted)" }}>{ct.email}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {ct.abrioEmail && <span style={{ color: "#3db89e" }}>👁</span>}
                {ct.hizoClic && <span style={{ color: "#e8a84c" }}>🖱</span>}
                {ct.seRegistro && <span style={{ color: "#3db89e" }}>✅</span>}
                {ct.errorEnvio && <span style={{ color: "#ff6b6b" }} title={ct.errorEnvio}>❌</span>}
              </div>
            </div>
          )) : <p style={{ color: "rgba(240,234,214,0.3)" }}>Cargando contactos...</p>}
          <button onClick={() => setDetalle(null)} style={{ ...S.btn, marginTop: 16, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,234,214,0.5)", width: "100%" }}>Cerrar</button>
        </div>
      </>)}
    </div>
  );
}
