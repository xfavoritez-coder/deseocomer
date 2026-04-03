"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = any;
type Participante = { id: string; usuarioId: string; nombre: string; email: string; puntos: number; puntosPendientes: number; referidos: number; estado: string; createdAt: string; flags: string[]; sospechoso: boolean };

export default function AdminConcursos() {
  const [concursos, setConcursos] = useState<C[]>([]);
  const [atencion, setAtencion] = useState<C[]>([]);
  const [sel, setSel] = useState<C | null>(null);
  const [detalle, setDetalle] = useState<C | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [participantesAdmin, setParticipantesAdmin] = useState<Participante[]>([]);
  const [loadingParticipantes, setLoadingParticipantes] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editPremio, setEditPremio] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editCondiciones, setEditCondiciones] = useState("");
  const [editFechaFin, setEditFechaFin] = useState("");
  const [editError, setEditError] = useState("");
  const [accionLoading, setAccionLoading] = useState("");

  useEffect(() => { fetch("/api/concursos").then(r => r.json()).then(d => setConcursos(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  useEffect(() => {
    adminFetch("/api/admin/concursos/atencion").then(r => r.json()).then(d => { if (Array.isArray(d)) setAtencion(d); }).catch(() => {});
  }, []);

  const accionAdmin = async (concursoId: string, accion: string, extra: Record<string, string> = {}) => {
    setAccionLoading(concursoId + accion);
    try {
      const res = await adminFetch(`/api/admin/concursos/${concursoId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, ...extra }),
      });
      if (res.ok) {
        setAtencion(prev => prev.filter(c => c.id !== concursoId));
      }
    } catch {}
    setAccionLoading("");
  };

  const cerrar = async (id: string) => {
    await adminFetch(`/api/admin/concursos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: false }) });
    setConcursos(prev => prev.map(c => c.id === id ? { ...c, activo: false } : c));
    if (sel?.id === id) setSel((p: C) => p ? { ...p, activo: false } : p);
  };

  const abrirDetalle = async (c: C) => {
    setSel(c);
    setLoadingDetalle(true);
    setLoadingParticipantes(true);
    try {
      const r = await fetch(`/api/concursos/${c.id}`);
      const d = await r.json();
      setDetalle(d);
    } catch {}
    setLoadingDetalle(false);
    try {
      const r2 = await adminFetch(`/api/admin/concursos/${c.id}/participantes`);
      const d2 = await r2.json();
      setParticipantesAdmin(Array.isArray(d2) ? d2 : []);
    } catch { setParticipantesAdmin([]); }
    setLoadingParticipantes(false);
  };

  const cambiarEstado = async (participanteId: string, estado: string) => {
    if (!sel) return;
    try {
      await adminFetch(`/api/admin/concursos/${sel.id}/participantes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participanteId, estado }),
      });
      setParticipantesAdmin(prev => prev.map(p =>
        p.id === participanteId ? { ...p, estado, ...(estado === "descalificado" ? { puntos: 0 } : {}) } : p
      ));
    } catch {}
  };

  const iniciarEdicion = () => {
    if (!sel) return;
    setEditPremio(sel.premio ?? "");
    setEditDescripcion(sel.descripcion ?? "");
    setEditCondiciones(sel.condiciones ?? "");
    setEditFechaFin(new Date(sel.fechaFin).toISOString().slice(0, 16));
    setEditError("");
    setEditando(true);
  };

  const guardarEdicion = async () => {
    if (!sel) return;
    setEditError("");
    try {
      const res = await adminFetch(`/api/admin/concursos/${sel.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premio: editPremio, descripcion: editDescripcion.trim() || null, condiciones: editCondiciones.trim() || null, fechaFin: new Date(editFechaFin).toISOString() }),
      });
      if (!res.ok) { const d = await res.json(); setEditError(d.error ?? "Error al guardar"); return; }
      const updated = await res.json();
      setSel({ ...sel, ...updated });
      setConcursos(prev => prev.map(c => c.id === sel.id ? { ...c, ...updated } : c));
      setEditando(false);
    } catch { setEditError("Error de conexión"); }
  };

  const cerrarPanel = () => { setSel(null); setDetalle(null); setParticipantesAdmin([]); setEditando(false); };

  return (
    <div>
      {/* Sección: Requieren atención */}
      {atencion.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Georgia", fontSize: "1.2rem", color: "#ff8080", marginBottom: "16px" }}>⚠️ Requieren atención ({atencion.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {atencion.map(c => (
              <div key={c.id} style={{ background: c.estado === "en_revision" ? "rgba(232,168,76,0.06)" : "rgba(255,80,80,0.06)", border: `1px solid ${c.estado === "en_revision" ? "rgba(232,168,76,0.2)" : "rgba(255,80,80,0.2)"}`, borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontFamily: "Georgia", fontSize: "0.75rem", fontWeight: 700, color: c.estado === "en_revision" ? "#e8a84c" : "#ff6b6b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {c.estado === "en_revision" ? "Fraude detectado" : "Disputa activa"}
                    </span>
                    <h3 style={{ fontFamily: "Georgia", fontSize: "1rem", color: "#f0ead6", marginTop: "4px" }}>{c.premio}</h3>
                    <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.5)" }}>{c.local?.nombre}</p>
                  </div>
                </div>

                {/* Info del ganador */}
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "12px" }}>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#f0ead6" }}>
                    Ganador actual: <strong style={{ color: "#e8a84c" }}>{c.ganadorActual?.nombre ?? "—"}</strong>
                    {c.ganadorActual?.email && <span style={{ color: "rgba(240,234,214,0.4)", marginLeft: "8px" }}>{c.ganadorActual.email}</span>}
                  </p>
                  {c.ganador2 && <p style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "rgba(240,234,214,0.4)", marginTop: "4px" }}>2° lugar: {c.ganador2.nombre}</p>}
                  {c.ganador3 && <p style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "rgba(240,234,214,0.4)" }}>3° lugar: {c.ganador3.nombre}</p>}
                </div>

                {/* Acciones */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {c.estado === "en_revision" && (
                    <>
                      <button
                        onClick={() => accionAdmin(c.id, "aprobar_ganador")}
                        disabled={!!accionLoading}
                        style={{ background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "8px", color: "#3db89e", fontFamily: "Georgia", fontSize: "0.82rem", padding: "8px 16px", cursor: "pointer" }}
                      >✓ Aprobar ganador</button>
                      <button
                        onClick={() => accionAdmin(c.id, "descalificar_ganador")}
                        disabled={!!accionLoading}
                        style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.82rem", padding: "8px 16px", cursor: "pointer" }}
                      >✗ Descalificar y pasar al siguiente</button>
                    </>
                  )}
                  {c.estado === "en_disputa" && (
                    <>
                      <button
                        onClick={() => accionAdmin(c.id, "resolver_disputa", { resolucion: "entregado" })}
                        disabled={!!accionLoading}
                        style={{ background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "8px", color: "#3db89e", fontFamily: "Georgia", fontSize: "0.82rem", padding: "8px 16px", cursor: "pointer" }}
                      >Premio sí fue entregado</button>
                      <button
                        onClick={() => accionAdmin(c.id, "resolver_disputa", { resolucion: "no_entregado" })}
                        disabled={!!accionLoading}
                        style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.82rem", padding: "8px 16px", cursor: "pointer" }}
                      >Premio no fue entregado</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h1 style={{ fontFamily: "Georgia", fontSize: "1.6rem", color: "#e8a84c", marginBottom: "20px" }}>Concursos ({concursos.length})</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Premio", "Local", "Participantes", "Inicio", "Fin", "Estado", "Acción"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {concursos.map(c => {
            const ended = new Date(c.fechaFin) <= new Date();
            const estadoMap: Record<string, { label: string; color: string }> = {
              activo: { label: "Activo", color: "#3db89e" },
              finalizado: { label: "Finalizado", color: "#e8a84c" },
              en_revision: { label: "En revisión", color: "#e8a84c" },
              completado: { label: "Completado", color: "#3db89e" },
              expirado: { label: "Expirado", color: "rgba(240,234,214,0.4)" },
              en_disputa: { label: "Disputa", color: "#ff6b6b" },
              cancelado: { label: "Cancelado", color: "#ff6b6b" },
            };
            const est = c.estado ? estadoMap[c.estado] : null;
            const status = est?.label ?? (!c.activo ? "Desactivado" : ended ? "Terminado" : "Activo");
            const color = est?.color ?? (!c.activo ? "#ff6b6b" : ended ? "#e8a84c" : "#3db89e");
            return (
              <tr key={c.id} onClick={() => abrirDetalle(c)} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.15s" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,168,76,0.06)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <td style={TD}>{c.premio}</td>
                <td style={TD}>{c.local?.nombre ?? "—"}</td>
                <td style={{ ...TD, textAlign: "center" }}>{c._count?.participantes ?? 0}</td>
                {/* Badge sospechosos se muestra al abrir detalle */}
                <td style={{ ...TD, fontSize: "0.82rem" }}>{new Date(c.fechaInicio ?? c.createdAt).toLocaleDateString("es-CL")}</td>
                <td style={{ ...TD, fontSize: "0.82rem" }}>{new Date(c.fechaFin).toLocaleDateString("es-CL")}</td>
                <td style={TD}><span style={{ color, fontSize: "0.82rem", fontWeight: 700 }}>{status}</span></td>
                <td style={TD} onClick={e => e.stopPropagation()}>{c.activo && !ended && <button onClick={() => cerrar(c.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "6px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.75rem", padding: "4px 10px", cursor: "pointer" }}>Cerrar</button>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {sel && (
        <>
          <div onClick={cerrarPanel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999 }} />
          <div style={PANEL}>
            <button onClick={cerrarPanel} style={BACK}>← Volver</button>
            <h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.2rem", marginBottom: "4px" }}>{sel.premio}</h2>
            <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", fontSize: "0.9rem", marginBottom: "24px" }}>{sel.local?.nombre ?? "Local"} {sel.local?.categoria ? `· ${sel.local.categoria}` : ""}</p>

            <SectionTitle>Detalles</SectionTitle>
            {[
              { label: "Inicio", value: new Date(sel.fechaInicio ?? sel.createdAt).toLocaleDateString("es-CL") },
              { label: "Fin", value: new Date(sel.fechaFin).toLocaleDateString("es-CL") },
              { label: "Estado", value: !sel.activo ? "Desactivado" : new Date(sel.fechaFin) <= new Date() ? "Terminado" : "Activo" },
              { label: "Participantes", value: String(sel._count?.participantes ?? 0) },
            ].map(r => <Row key={r.label} label={r.label} value={r.value} />)}

            {/* Participantes con sistema antifraude */}
            <div style={{ marginTop: "24px" }}>
              <SectionTitle>Participantes {participantesAdmin.filter(p => p.sospechoso || p.estado === "sospechoso").length > 0 && <span style={{ background: "rgba(232,168,76,0.2)", color: "#e8a84c", borderRadius: "10px", padding: "2px 8px", fontSize: "0.72rem", marginLeft: "8px" }}>⚠️ {participantesAdmin.filter(p => p.sospechoso || p.estado === "sospechoso").length} sospechosos</span>}</SectionTitle>
              {loadingParticipantes ? (
                <p style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "rgba(240,234,214,0.4)" }}>Cargando...</p>
              ) : participantesAdmin.length > 0 ? (
                participantesAdmin.map((p, i) => (
                  <div key={p.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                        <span style={{ fontSize: "0.85rem", width: "24px" }}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}.`}</span>
                        <div>
                          <span style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "#f0ead6" }}>{p.nombre}</span>
                          <p style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", margin: 0 }}>{p.email}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "#e8a84c" }}>{p.puntos} pts</span>
                        <span style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)" }}>{p.referidos} refs</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px", marginTop: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      {p.estado === "sospechoso" && <span style={{ background: "rgba(232,168,76,0.2)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "6px", padding: "2px 8px", fontFamily: "Georgia", fontSize: "0.72rem", color: "#e8a84c" }}>⚠️ Revisar</span>}
                      {p.estado === "descalificado" && <span style={{ background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "6px", padding: "2px 8px", fontFamily: "Georgia", fontSize: "0.72rem", color: "#ff6b6b" }}>Descalificado</span>}
                      {p.estado === "revisado" && <span style={{ background: "rgba(61,184,158,0.12)", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "6px", padding: "2px 8px", fontFamily: "Georgia", fontSize: "0.72rem", color: "#3db89e" }}>✓ Revisado</span>}
                      {p.flags.map((f, fi) => <span key={fi} style={{ fontFamily: "Georgia", fontSize: "0.68rem", color: "rgba(232,168,76,0.6)", background: "rgba(232,168,76,0.08)", borderRadius: "4px", padding: "1px 6px" }}>{f}</span>)}
                      {p.estado !== "revisado" && p.estado !== "descalificado" && (
                        <button onClick={() => cambiarEstado(p.id, "revisado")} style={{ background: "none", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "6px", color: "#3db89e", fontFamily: "Georgia", fontSize: "0.72rem", padding: "2px 8px", cursor: "pointer" }}>✓ OK</button>
                      )}
                      {p.estado !== "descalificado" && (
                        <button onClick={() => cambiarEstado(p.id, "descalificado")} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "6px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.72rem", padding: "2px 8px", cursor: "pointer" }}>✗ Descalificar</button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "rgba(240,234,214,0.4)" }}>Sin participantes</p>
              )}
            </div>

            {/* Formulario de edición */}
            {editando && (
              <div style={{ marginTop: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", padding: "16px" }}>
                <SectionTitle>Editar concurso</SectionTitle>
                {editError && <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#ff6b6b", marginBottom: "10px" }}>⚠️ {editError}</p>}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontFamily: "Georgia", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: "4px" }}>Premio</label>
                    <input style={EDIT_INPUT} value={editPremio} onChange={e => setEditPremio(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontFamily: "Georgia", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: "4px" }}>Descripción</label>
                    <input style={EDIT_INPUT} value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} placeholder="Opcional" />
                  </div>
                  <div>
                    <label style={{ fontFamily: "Georgia", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: "4px" }}>Fecha de cierre</label>
                    <input style={EDIT_INPUT} type="datetime-local" value={editFechaFin} onChange={e => setEditFechaFin(e.target.value)} />
                    {/* Tiempo restante y ajuste rápido */}
                    {(() => {
                      const fechaMs = new Date(editFechaFin).getTime();
                      const ahora = Date.now();
                      const restMs = Math.max(0, fechaMs - ahora);
                      const d = Math.floor(restMs / 86400000);
                      const h = Math.floor((restMs % 86400000) / 3600000);
                      const m = Math.floor((restMs % 3600000) / 60000);
                      const ajustar = (ms: number) => {
                        const nueva = new Date(fechaMs + ms);
                        setEditFechaFin(nueva.toISOString().slice(0, 16));
                      };
                      const AJUSTE_BTN: React.CSSProperties = { padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(232,168,76,0.2)", background: "rgba(232,168,76,0.06)", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.72rem", cursor: "pointer" };
                      const AJUSTE_BTN_NEG: React.CSSProperties = { ...AJUSTE_BTN, borderColor: "rgba(255,80,80,0.2)", background: "rgba(255,80,80,0.06)", color: "#ff8080" };
                      return (
                        <div style={{ marginTop: "8px" }}>
                          <p style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: restMs > 0 ? "#3db89e" : "#ff6b6b", marginBottom: "8px" }}>
                            {restMs > 0 ? `⏱ ${d}d ${h}h ${m}m restantes` : "⏱ Ya terminó"}
                          </p>
                          <p style={{ fontFamily: "Georgia", fontSize: "0.68rem", color: "rgba(240,234,214,0.3)", marginBottom: "6px" }}>Ajuste rápido:</p>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <button type="button" onClick={() => ajustar(30 * 60000)} style={AJUSTE_BTN}>+30m</button>
                            <button type="button" onClick={() => ajustar(60 * 60000)} style={AJUSTE_BTN}>+1h</button>
                            <button type="button" onClick={() => ajustar(6 * 3600000)} style={AJUSTE_BTN}>+6h</button>
                            <button type="button" onClick={() => ajustar(24 * 3600000)} style={AJUSTE_BTN}>+1d</button>
                            <button type="button" onClick={() => ajustar(3 * 86400000)} style={AJUSTE_BTN}>+3d</button>
                            <button type="button" onClick={() => ajustar(7 * 86400000)} style={AJUSTE_BTN}>+7d</button>
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                            <button type="button" onClick={() => ajustar(-30 * 60000)} style={AJUSTE_BTN_NEG}>-30m</button>
                            <button type="button" onClick={() => ajustar(-60 * 60000)} style={AJUSTE_BTN_NEG}>-1h</button>
                            <button type="button" onClick={() => ajustar(-6 * 3600000)} style={AJUSTE_BTN_NEG}>-6h</button>
                            <button type="button" onClick={() => ajustar(-24 * 3600000)} style={AJUSTE_BTN_NEG}>-1d</button>
                            <button type="button" onClick={() => ajustar(-3 * 86400000)} style={AJUSTE_BTN_NEG}>-3d</button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label style={{ fontFamily: "Georgia", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", display: "block", marginBottom: "4px" }}>Condiciones</label>
                    <textarea style={{ ...EDIT_INPUT, resize: "vertical", minHeight: "50px" }} value={editCondiciones} onChange={e => setEditCondiciones(e.target.value)} placeholder="Opcional" />
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setEditando(false)} style={{ flex: 1, background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "6px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.78rem", padding: "8px", cursor: "pointer" }}>Cancelar</button>
                    <button onClick={guardarEdicion} disabled={!editPremio.trim()} style={{ flex: 2, background: "#e8a84c", border: "none", borderRadius: "6px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.78rem", fontWeight: 700, padding: "8px", cursor: "pointer", opacity: editPremio.trim() ? 1 : 0.5 }}>Guardar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {!editando && (
                <button onClick={iniciarEdicion} style={{ background: "none", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "8px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.82rem", padding: "10px", cursor: "pointer", width: "100%" }}>✏️ Editar concurso</button>
              )}
              {sel.activo && new Date(sel.fechaFin) > new Date() && (
                <button onClick={() => cerrar(sel.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "8px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.82rem", padding: "10px", cursor: "pointer", width: "100%" }}>Cerrar concurso</button>
              )}
              <a href={`/concursos/${sel.slug || sel.id}`} target="_blank" rel="noopener" style={{ display: "block", textAlign: "center", fontFamily: "Georgia", fontSize: "0.82rem", padding: "10px", borderRadius: "8px", border: "1px solid rgba(232,168,76,0.2)", color: "#e8a84c", textDecoration: "none" }}>Ver concurso público →</a>
            </div>
          </div>
          <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
        </>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "Georgia", fontSize: "0.88rem", letterSpacing: "0.18em", color: "rgba(240,234,214,0.45)", textTransform: "uppercase", marginBottom: "12px" }}>{children}</h3>;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontFamily: "Georgia", fontSize: "0.95rem", color: "rgba(240,234,214,0.55)" }}>{label}</span>
      <span style={{ fontFamily: "Georgia", fontSize: "0.95rem", color: "#f0ead6" }}>{value}</span>
    </div>
  );
}

const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.55)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "10px 12px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.92rem", color: "#f0ead6", padding: "12px" };
const PANEL: React.CSSProperties = { position: "fixed", top: 0, right: 0, width: "min(420px, 100vw)", height: "100vh", background: "rgba(10,8,18,0.98)", borderLeft: "1px solid rgba(232,168,76,0.2)", zIndex: 1000, overflowY: "auto", padding: "24px", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)", animation: "slideIn 0.2s ease" };
const BACK: React.CSSProperties = { background: "none", border: "none", color: "rgba(240,234,214,0.55)", fontSize: "1rem", cursor: "pointer", marginBottom: "20px", padding: 0, fontFamily: "Georgia" };
const EDIT_INPUT: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" };
