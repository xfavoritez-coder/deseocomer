"use client";
import { useState, useEffect, useRef } from "react";
import { adminFetch } from "@/lib/adminFetch";
import { QRCodeCanvas } from "qrcode.react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = any;

function genCodigo(nombre: string) {
  return nombre.split(" ")[0].toUpperCase().slice(0, 4) + Math.floor(Math.random() * 900 + 100);
}

export default function AdminCaptadores() {
  const [captadores, setCaptadores] = useState<C[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [sel, setSel] = useState<C | null>(null);
  const [detalle, setDetalle] = useState<C | null>(null);
  const [showPagar, setShowPagar] = useState<C | null>(null);
  const [pagarRef, setPagarRef] = useState("");
  const [toast, setToast] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  // New captador form
  const [fNombre, setFNombre] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fTel, setFTel] = useState("");
  const [fRut, setFRut] = useState("");
  const [fCodigo, setFCodigo] = useState("");
  const [saving, setSaving] = useState(false);

  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const load = () => {
    adminFetch("/api/admin/captadores").then(r => r.json()).then(d => setCaptadores(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const loadDetalle = (id: string) => {
    adminFetch(`/api/admin/captadores/${id}`).then(r => r.json()).then(setDetalle).catch(() => show("Error al cargar detalle"));
  };

  const crearCaptador = async () => {
    if (!fNombre || !fEmail || !fCodigo) return;
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/captadores", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: fNombre, email: fEmail, telefono: fTel, rut: fRut, codigo: fCodigo }) });
      if (!res.ok) { const d = await res.json(); show(d.error ?? "Error"); setSaving(false); return; }
      show("Captador creado"); setShowNew(false); setFNombre(""); setFEmail(""); setFTel(""); setFRut(""); setFCodigo(""); load();
    } catch { show("Error de conexión"); }
    setSaving(false);
  };

  const marcarPagado = async (c: C) => {
    const monto = c.pendiente;
    if (monto <= 0) { show("No hay monto pendiente"); return; }
    try {
      const res = await adminFetch(`/api/admin/captadores/${c.id}/pagar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monto, referencia: pagarRef }) });
      if (res.ok) { show("Pago registrado"); setShowPagar(null); setPagarRef(""); load(); } else show("Error al registrar pago");
    } catch { show("Error de conexión"); }
  };

  const toggleActivo = async (c: C) => {
    try {
      await adminFetch(`/api/admin/captadores/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: !c.activo }) });
      load();
    } catch { show("Error"); }
  };

  const descargarQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `qr-captador-${detalle?.codigo || "code"}.png`; a.click();
  };

  const fmt = (n: number) => n.toLocaleString("es-CL");
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-CL");

  const I: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: 8, color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" };
  const L: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: 4, display: "block" };

  // ── DETALLE VIEW ──
  if (sel && detalle) return (
    <div>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, background: "#e8a84c", color: "#0a0812", padding: "10px 20px", borderRadius: 8, fontFamily: "Georgia", fontSize: "0.82rem", zIndex: 999 }}>{toast}</div>}
      <button onClick={() => { setSel(null); setDetalle(null); }} style={{ background: "none", border: "none", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.82rem", cursor: "pointer", marginBottom: 16 }}>← Captadores</button>

      <h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.1rem", marginBottom: 4 }}>{detalle.nombre}</h2>
      <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.4)", fontSize: "0.8rem", marginBottom: 16 }}>{detalle.email} · {detalle.codigo} · Desde {fmtDate(detalle.createdAt)}</p>

      {/* Link + QR */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <p style={{ ...L, marginBottom: 8 }}>Link de captador</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <code style={{ flex: 1, fontSize: "0.78rem", color: "#3db89e", wordBreak: "break-all" }}>deseocomer.com/unete?ref={detalle.codigo}</code>
          <button onClick={() => { navigator.clipboard.writeText(`https://deseocomer.com/unete?ref=${detalle.codigo}`); show("Link copiado"); }} style={{ background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 6, padding: "6px 12px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.75rem", cursor: "pointer" }}>Copiar</button>
        </div>
        <div ref={qrRef} style={{ marginTop: 16, display: "inline-block", background: "#fff", padding: 12, borderRadius: 8 }}>
          <QRCodeCanvas value={`https://deseocomer.com/unete?ref=${detalle.codigo}`} size={200} bgColor="#ffffff" fgColor="#0a0812" />
        </div>
        <div><button onClick={descargarQR} style={{ marginTop: 8, background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 6, padding: "6px 12px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.75rem", cursor: "pointer" }}>Descargar QR</button></div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Locales", value: detalle.totalLocales, color: "#e8a84c" },
          { label: "Con concurso", value: detalle.localesConConcurso, color: "#3db89e" },
          { label: "Total ganado", value: `$${fmt(detalle.totalGanado)}`, color: "#f5d080" },
          { label: "Pendiente", value: `$${fmt(detalle.pendiente)}`, color: detalle.pendiente > 0 ? "#ff8080" : "#3db89e" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 100, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia", fontSize: "1.1rem", color: s.color, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: "0.65rem", color: "rgba(240,234,214,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Locales */}
      <h3 style={{ fontFamily: "Georgia", color: "#e8a84c", fontSize: "0.85rem", marginBottom: 10 }}>Locales captados</h3>
      {detalle.locales?.length === 0 && <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.3)", fontSize: "0.82rem" }}>Sin locales aún</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
        {detalle.locales?.map((l: C) => (
          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 8, padding: "10px 12px" }}>
            <div>
              <span style={{ fontFamily: "Georgia", color: "#f0ead6", fontSize: "0.82rem" }}>{l.nombre}</span>
              <span style={{ fontSize: "0.72rem", color: "rgba(240,234,214,0.3)", marginLeft: 8 }}>{fmtDate(l.createdAt)}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {l.concursos?.length > 0 && <span style={{ fontSize: "0.7rem", color: "#3db89e", background: "rgba(61,184,158,0.1)", padding: "2px 8px", borderRadius: 6 }}>Con concurso ✓</span>}
              <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "#e8a84c" }}>${fmt(10000 + (l.concursos?.length > 0 ? 5000 : 0))}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagos */}
      <h3 style={{ fontFamily: "Georgia", color: "#e8a84c", fontSize: "0.85rem", marginBottom: 10 }}>Historial de pagos</h3>
      {detalle.pagos?.length === 0 && <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.3)", fontSize: "0.82rem" }}>Sin pagos registrados</p>}
      {detalle.pagos?.map((p: C) => (
        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 8, padding: "10px 12px", marginBottom: 4 }}>
          <span style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.8rem" }}>{fmtDate(p.createdAt)}{p.referencia ? ` · ${p.referencia}` : ""}</span>
          <span style={{ fontFamily: "Georgia", color: "#3db89e", fontSize: "0.82rem" }}>${fmt(p.monto)}</span>
        </div>
      ))}
    </div>
  );

  // ── MAIN LIST ──
  const activos = captadores.filter(c => c.activo).length;
  const totalLocales = captadores.reduce((s: number, c: C) => s + (c.totalLocales || 0), 0);
  const totalPendiente = captadores.reduce((s: number, c: C) => s + Math.max(c.pendiente || 0, 0), 0);
  const totalPagado = captadores.reduce((s: number, c: C) => s + (c.totalPagado || 0), 0);

  return (
    <div>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, background: "#e8a84c", color: "#0a0812", padding: "10px 20px", borderRadius: 8, fontFamily: "Georgia", fontSize: "0.82rem", zIndex: 999 }}>{toast}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", margin: 0 }}>Captadores</h1>
        <button onClick={() => { setShowNew(true); setFCodigo(genCodigo("CAPT")); }} style={{ background: "#e8a84c", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.8rem", fontWeight: 700, padding: "10px 18px", borderRadius: 8, border: "none", cursor: "pointer" }}>+ Nuevo captador</button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Activos", value: activos, color: "#e8a84c" },
          { label: "Locales captados", value: totalLocales, color: "#3db89e" },
          { label: "Pendiente CLP", value: `$${fmt(totalPendiente)}`, color: "#ff8080" },
          { label: "Pagado total", value: `$${fmt(totalPagado)}`, color: "#3db89e" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, minWidth: 120, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontFamily: "Georgia", fontSize: "1.2rem", color: s.color, fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: "0.65rem", color: "rgba(240,234,214,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading && <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)" }}>Cargando...</p>}

      {/* Table */}
      {!loading && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Georgia", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(232,168,76,0.15)" }}>
                {["Nombre", "Código", "Locales", "Con concurso", "Ganado", "Pendiente", "Estado", "Acciones"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 8px", color: "rgba(240,234,214,0.4)", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {captadores.map((c: C) => (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
                  <td style={{ padding: "10px 8px", color: "#f0ead6" }}>{c.nombre}</td>
                  <td style={{ padding: "10px 8px", color: "#3db89e", fontFamily: "monospace" }}>{c.codigo}</td>
                  <td style={{ padding: "10px 8px", color: "#e8a84c" }}>{c.totalLocales}</td>
                  <td style={{ padding: "10px 8px", color: "#3db89e" }}>{c.localesConConcurso}</td>
                  <td style={{ padding: "10px 8px", color: "#f5d080" }}>${fmt(c.totalGanado)}</td>
                  <td style={{ padding: "10px 8px", color: c.pendiente > 0 ? "#ff8080" : "rgba(240,234,214,0.3)" }}>${fmt(Math.max(c.pendiente, 0))}</td>
                  <td style={{ padding: "10px 8px" }}><span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 6, background: c.activo ? "rgba(61,184,158,0.1)" : "rgba(255,100,100,0.1)", color: c.activo ? "#3db89e" : "#ff6b6b" }}>{c.activo ? "Activo" : "Inactivo"}</span></td>
                  <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                    <button onClick={() => { setSel(c); loadDetalle(c.id); }} style={{ background: "none", border: "none", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", marginRight: 8 }}>Ver</button>
                    <button onClick={() => setShowPagar(c)} style={{ background: "none", border: "none", color: "#3db89e", fontFamily: "Georgia", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline", marginRight: 8 }}>Pagar</button>
                    <button onClick={() => toggleActivo(c)} style={{ background: "none", border: "none", color: c.activo ? "#ff6b6b" : "#3db89e", fontFamily: "Georgia", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}>{c.activo ? "Desactivar" : "Activar"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nuevo */}
      {showNew && (<>
        <div onClick={() => setShowNew(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#0d0703", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 16, padding: 24, width: "min(400px,90vw)", zIndex: 999 }}>
          <h3 style={{ fontFamily: "Georgia", color: "#e8a84c", fontSize: "1rem", marginBottom: 16 }}>Nuevo captador</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><label style={L}>Nombre completo</label><input style={I} value={fNombre} onChange={e => { setFNombre(e.target.value); if (e.target.value.length >= 2) setFCodigo(genCodigo(e.target.value)); }} placeholder="Juan Pérez" /></div>
            <div><label style={L}>Email</label><input style={I} value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="juan@email.com" /></div>
            <div><label style={L}>Teléfono</label><input style={I} value={fTel} onChange={e => setFTel(e.target.value)} placeholder="+56 9 1234 5678" /></div>
            <div><label style={L}>RUT</label><input style={I} value={fRut} onChange={e => setFRut(e.target.value)} placeholder="12.345.678-9" /></div>
            <div>
              <label style={L}>Código único</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...I, flex: 1, fontFamily: "monospace", color: "#3db89e" }} value={fCodigo} readOnly />
                <button onClick={() => setFCodigo(genCodigo(fNombre || "CAPT"))} style={{ background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 8, padding: "8px 12px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}>Regenerar</button>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <button onClick={() => setShowNew(false)} style={{ background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 8, padding: "10px 18px", color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.8rem", cursor: "pointer" }}>Cancelar</button>
            <button onClick={crearCaptador} disabled={saving} style={{ background: "#e8a84c", border: "none", borderRadius: 8, padding: "10px 18px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>{saving ? "Creando..." : "Crear captador"}</button>
          </div>
        </div>
      </>)}

      {/* Modal Pagar */}
      {showPagar && (<>
        <div onClick={() => { setShowPagar(null); setPagarRef(""); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998 }} />
        <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#0d0703", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 16, padding: 24, width: "min(380px,90vw)", zIndex: 999 }}>
          <h3 style={{ fontFamily: "Georgia", color: "#e8a84c", fontSize: "1rem", marginBottom: 12 }}>Confirmar pago</h3>
          <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.6)", fontSize: "0.85rem", marginBottom: 16 }}>¿Marcar como pagado el monto pendiente de <strong style={{ color: "#f5d080" }}>{showPagar.nombre}</strong>? (<strong style={{ color: "#e8a84c" }}>${fmt(Math.max(showPagar.pendiente, 0))}</strong>)</p>
          <div style={{ marginBottom: 16 }}><label style={L}>Referencia de transferencia (opcional)</label><input style={I} value={pagarRef} onChange={e => setPagarRef(e.target.value)} placeholder="Ej: transferencia #1234" /></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button onClick={() => { setShowPagar(null); setPagarRef(""); }} style={{ background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 8, padding: "10px 18px", color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.8rem", cursor: "pointer" }}>Cancelar</button>
            <button onClick={() => marcarPagado(showPagar)} style={{ background: "#3db89e", border: "none", borderRadius: 8, padding: "10px 18px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>Confirmar pago</button>
          </div>
        </div>
      </>)}
    </div>
  );
}
