"use client";
import { useState, useEffect } from "react";
import SubirFoto from "@/components/SubirFoto";

const SESSION_KEY = "deseocomer_local_session";


const DURACIONES = [{ l: "3 días", v: 3 }, { l: "7 días", v: 7 }, { l: "14 días", v: 14 }, { l: "30 días", v: 30 }];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Concurso = any;

function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "{}"); } catch { return {}; }
}

export default function PanelConcursos() {
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizard, setWizard] = useState(false);
  const [detalle, setDetalle] = useState<Concurso | null>(null);
  const [step, setStep] = useState(1);
  const [premio, setPremio] = useState("");


  const [dur, setDur] = useState(7);
  const [imagenConcurso, setImagenConcurso] = useState("");
  const [descripcionPremio, setDescripcionPremio] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [reportModal, setReportModal] = useState<{ id: string; nombre: string } | null>(null);
  const [reportToast, setReportToast] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState(false);
  const [editPremio, setEditPremio] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editCondiciones, setEditCondiciones] = useState("");
  const [editImagen, setEditImagen] = useState("");
  const [editFechaFin, setEditFechaFin] = useState("");
  const [editError, setEditError] = useState("");
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [actionToast, setActionToast] = useState("");
  const [abrirEditando, setAbrirEditando] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s.id) {
      fetch(`/api/locales/${s.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.concursos) setConcursos(data.concursos);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else setLoading(false);
  }, []);

  useEffect(() => {
    if (abrirEditando && detalle) {
      setEditPremio(detalle.premio ?? "");
      setEditDescripcion(detalle.descripcion ?? "");
      setEditCondiciones(detalle.condiciones ?? "");
      setEditImagen(detalle.imagenUrl ?? "");
      setEditFechaFin(new Date(detalle.fechaFin).toISOString().slice(0, 16));
      setEditError("");
      setEditando(true);
      setAbrirEditando(false);
    }
  }, [abrirEditando, detalle]);

  const pFinal = premio;
  const chip = (sel: boolean): React.CSSProperties => ({ padding: "10px 18px", borderRadius: "20px", cursor: "pointer", background: sel ? "rgba(232,168,76,0.15)" : "transparent", border: sel ? "1px solid var(--accent)" : "1px solid var(--border-color)", color: sel ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: sel ? 700 : 400 });
  const labelReq = (text: string, required = true): React.ReactNode => <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-primary)", margin: "28px 0 16px" }}>{text}{required && <span style={{ color: "#ff6b6b", marginLeft: "4px" }}>*</span>}</h3>;

  const publish = async () => {
    const s = getSession();
    if (!s.id) return;
    const fechaFin = new Date(); fechaFin.setDate(fechaFin.getDate() + dur);
    try {
      const res = await fetch("/api/concursos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localId: s.id, premio: pFinal, descripcion: descripcionPremio.trim() || null, fechaFin: fechaFin.toISOString(), imagenUrl: imagenConcurso || null, condiciones: condiciones.trim() || null }),
      });
      if (res.ok) {
        const nuevo = await res.json();
        setConcursos(prev => [{ ...nuevo, _count: { participantes: 0 } }, ...prev]);
      }
    } catch {}
    setWizard(false); setStep(1); setPremio(""); setImagenConcurso(""); setDescripcionPremio(""); setCondiciones(""); setConfirmPublish(false);
  };

  const copyLink = (c: Concurso) => {
    const slug = c.slug || c.id;
    navigator.clipboard.writeText(`https://deseocomer.com/concursos/${slug}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  // ── Detail view ──
  if (detalle) {
    const restMs = Math.max(0, new Date(detalle.fechaFin).getTime() - Date.now());
    const terminado = restMs <= 0;
    const diasRest = Math.floor(restMs / 86400000);
    const hrsRest = Math.floor((restMs % 86400000) / 3600000);
    const tiempoDetalle = diasRest > 0 ? `${diasRest}d ${hrsRest}h` : `${hrsRest}h`;
    const participantes = detalle._count?.participantes ?? detalle.participantes?.length ?? 0;
    const link = `https://deseocomer.com/concursos/${detalle.slug || detalle.id}`;

    const sinParticipantes = participantes === 0;

    const iniciarEdicion = () => {
      setEditPremio(detalle.premio ?? "");
      setEditDescripcion(detalle.descripcion ?? "");
      setEditCondiciones(detalle.condiciones ?? "");
      setEditImagen(detalle.imagenUrl ?? "");
      setEditFechaFin(new Date(detalle.fechaFin).toISOString().slice(0, 16));
      setEditError("");
      setEditando(true);
    };

    const guardarEdicion = async () => {
      setEditError("");
      try {
        const res = await fetch(`/api/concursos/${detalle.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ premio: editPremio, descripcion: editDescripcion.trim() || null, condiciones: editCondiciones.trim() || null, imagenUrl: editImagen || null, fechaFin: new Date(editFechaFin).toISOString() }),
        });
        if (!res.ok) { const d = await res.json(); setEditError(d.error ?? "Error al guardar"); return; }
        const updated = await res.json();
        setDetalle({ ...detalle, ...updated });
        setConcursos(prev => prev.map(c => c.id === detalle.id ? { ...c, ...updated } : c));
        setEditando(false);
        setActionToast("Concurso actualizado");
        setTimeout(() => setActionToast(""), 3000);
      } catch { setEditError("Error de conexión"); }
    };

    const cancelarConcurso = async () => {
      try {
        const res = await fetch(`/api/concursos/${detalle.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cancelar: true, motivo: cancelMotivo.trim() }),
        });
        if (!res.ok) { const d = await res.json(); setEditError(d.error ?? "Error al cancelar"); setCancelModal(false); return; }
        setConcursos(prev => prev.filter(c => c.id !== detalle.id));
        setCancelModal(false);
        setDetalle(null);
        setActionToast("Concurso cancelado");
        setTimeout(() => setActionToast(""), 3000);
      } catch { setEditError("Error de conexión"); setCancelModal(false); }
    };

    const handleReport = async () => {
      if (!reportModal || !detalle) return;
      const s = getSession();
      try {
        await fetch(`/api/concursos/${detalle.id}/reportar`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participanteId: reportModal.id, localId: s.id, localNombre: s.nombre }),
        });
        setReportedIds(prev => new Set(prev).add(reportModal.id));
        setReportModal(null);
        setReportToast(true);
        setTimeout(() => setReportToast(false), 4000);
      } catch {}
    };

    return (
      <div style={{ maxWidth: "600px" }}>
        {/* Action toast */}
        {actionToast && <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "rgba(61,184,158,0.95)", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", padding: "14px 28px", borderRadius: "30px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{actionToast}</div>}
        {/* Report toast */}
        {reportToast && <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 200, background: "rgba(232,168,76,0.95)", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", padding: "14px 28px", borderRadius: "30px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>Reporte enviado. Revisaremos este participante antes del cierre.</div>}

        {/* Report modal */}
        {reportModal && (<>
          <div onClick={() => setReportModal(null)} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "90%", maxWidth: "400px", zIndex: 1000, background: "rgba(13,7,3,0.98)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "20px", padding: "32px 24px", textAlign: "center" }}>
            <h3 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "#f5d080", marginBottom: "14px" }}>¿Reportar participante sospechoso?</h3>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "24px" }}>Notificaremos al equipo de DeseoComer para revisar a <strong style={{ color: "var(--accent)" }}>{reportModal.nombre}</strong> antes del cierre del concurso.</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setReportModal(null)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", color: "#e8a84c", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleReport} style={{ flex: 1, padding: "12px", background: "#e8a84c", border: "none", borderRadius: "10px", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>Reportar</button>
            </div>
          </div>
        </>)}

        {/* Cancel modal */}
        {cancelModal && (<>
          <div onClick={() => setCancelModal(false)} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "90%", maxWidth: "400px", zIndex: 1000, background: "rgba(13,7,3,0.98)", border: "1px solid rgba(255,80,80,0.4)", borderRadius: "20px", padding: "32px 24px", textAlign: "center" }}>
            <h3 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "#ff6b6b", marginBottom: "14px" }}>¿Cancelar este concurso?</h3>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "16px" }}>Esta acción no se puede deshacer. El concurso dejará de estar visible.</p>
            <textarea style={{ ...I, resize: "vertical", minHeight: "60px", marginBottom: "16px" }} value={cancelMotivo} onChange={e => setCancelMotivo(e.target.value)} placeholder="Motivo de cancelación (opcional)" />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setCancelModal(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", color: "#e8a84c", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", cursor: "pointer" }}>Volver</button>
              <button onClick={cancelarConcurso} style={{ flex: 1, padding: "12px", background: "#ff6b6b", border: "none", borderRadius: "10px", color: "#fff", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>Cancelar concurso</button>
            </div>
          </div>
        </>)}

        <button onClick={() => { setDetalle(null); setEditando(false); }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}>← Volver a concursos</button>

        {/* Header */}
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "16px", overflow: "hidden", marginBottom: "20px" }}>
          {detalle.imagenUrl && <img src={detalle.imagenUrl} alt="" style={{ width: "100%", height: "160px", objectFit: "cover" }} />}
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 10px", borderRadius: "20px", background: terminado ? "rgba(255,255,255,0.06)" : "rgba(61,184,158,0.12)", border: terminado ? "1px solid var(--border-color)" : "1px solid rgba(61,184,158,0.4)", color: terminado ? "var(--text-muted)" : "#3db89e" }}>
                {terminado ? "Finalizado" : "Activo"}
              </span>
              {!terminado && <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>{tiempoDetalle} restantes</span>}
            </div>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "4px" }}>{detalle.premio}</h2>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }}>👥 {participantes} participantes</p>
          </div>
        </div>

        {/* Link para compartir */}
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px" }}>Link del concurso</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "var(--text-muted)", flex: 1, wordBreak: "break-all" }}>{link}</p>
            <button onClick={() => copyLink(detalle)} style={{ background: "var(--accent)", color: "var(--bg-primary)", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
              {copied ? "✓" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Ranking / Participantes */}
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px" }}>
            {terminado ? "🏆 Resultado final" : "📊 Ranking actual"}
          </p>
          {participantes === 0 ? (
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
              Aún no hay participantes. ¡Comparte el link!
            </p>
          ) : (
            <div>
              {(detalle.participantes ?? []).sort((a: Concurso, b: Concurso) => (b.puntos ?? 0) - (a.puntos ?? 0)).slice(0, 10).map((p: Concurso, i: number) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: i < 3 ? "var(--accent)" : "var(--text-muted)", width: "24px", textAlign: "center" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </span>
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)", flex: 1 }}>
                    {p.usuario?.nombre ?? "Participante"}
                    {reportedIds.has(p.id) && <span style={{ marginLeft: "6px", fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "4px", padding: "1px 6px", color: "#e8a84c" }}>En revisión</span>}
                  </span>
                  <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--oasis-bright)" }}>
                    {p.puntos ?? 0} pts
                  </span>
                  {!reportedIds.has(p.id) && (
                    <button onClick={() => setReportModal({ id: p.id, nombre: p.usuario?.nombre ?? "Participante" })} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", fontSize: "0.85rem", opacity: 0.5 }} title="Reportar sospechoso">⚠️</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {terminado && participantes > 0 && (() => {
            const ganador = (detalle.participantes ?? []).sort((a: Concurso, b: Concurso) => (b.puntos ?? 0) - (a.puntos ?? 0))[0];
            const ganadorNombre = ganador?.usuario?.nombre ?? "Sin participantes";
            const entregado = detalle.premioEntregado;
            return (
              <div style={{ marginTop: "16px", padding: "20px", background: entregado ? "rgba(61,184,158,0.08)" : "rgba(232,168,76,0.08)", border: `1px solid ${entregado ? "rgba(61,184,158,0.3)" : "rgba(232,168,76,0.25)"}`, borderRadius: "12px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: entregado ? "#3db89e" : "var(--accent)", fontWeight: 700, marginBottom: "4px" }}>{entregado ? "✓ Premio entregado" : "🏆 Ganador"}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: entregado ? "0" : "14px" }}>{ganadorNombre}</p>
                {entregado && detalle.premioEntregadoAt && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>Confirmado el {new Date(detalle.premioEntregadoAt).toLocaleDateString("es-CL")}</p>}
                {!entregado && (
                  <button onClick={async () => {
                    const s = getSession();
                    try {
                      const res = await fetch(`/api/concursos/${detalle.id}/confirmar-entrega`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ localId: s.id }) });
                      if (res.ok) {
                        setDetalle({ ...detalle, premioEntregado: true, premioEntregadoAt: new Date().toISOString() });
                        setConcursos(prev => prev.map(c => c.id === detalle.id ? { ...c, premioEntregado: true } : c));
                        setActionToast("✓ Entrega del premio confirmada");
                        setTimeout(() => setActionToast(""), 3000);
                      } else { const d = await res.json(); setActionToast(d.error ?? "Error"); setTimeout(() => setActionToast(""), 3000); }
                    } catch { setActionToast("Error de conexión"); setTimeout(() => setActionToast(""), 3000); }
                  }} style={{ padding: "12px 28px", background: "#3db89e", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
                    Confirmar entrega del premio a {ganadorNombre.split(" ")[0]}
                  </button>
                )}
              </div>
            );
          })()}
        </div>

        {/* Formulario de edición (solo sin participantes) */}
        {editando && sinParticipantes && (
          <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "14px", padding: "20px", marginBottom: "20px" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px" }}>Editar concurso</p>
            {editError && <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "10px", padding: "10px", marginBottom: "12px" }}><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "#ff6b6b" }}>⚠️ {editError}</p></div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Premio</label>
                <input style={I} value={editPremio} onChange={e => setEditPremio(e.target.value)} maxLength={80} />
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Descripción del premio</label>
                <input style={I} value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} placeholder="Descripción (opcional)" />
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Fecha de cierre</label>
                <input style={I} type="datetime-local" value={editFechaFin} onChange={e => setEditFechaFin(e.target.value)} />
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Condiciones</label>
                <textarea style={{ ...I, resize: "vertical", minHeight: "60px" }} value={editCondiciones} onChange={e => setEditCondiciones(e.target.value)} placeholder="Condiciones (opcional)" maxLength={500} />
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Foto del concurso</label>
                <SubirFoto folder="concursos" preview={editImagen || null} label="Cambiar foto" height="120px" onUpload={url => setEditImagen(url)} />
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button onClick={() => setEditando(false)} style={{ ...B, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", flex: 1 }}>Cancelar</button>
                <button onClick={guardarEdicion} disabled={!editPremio.trim()} style={{ ...B, flex: 2, opacity: editPremio.trim() ? 1 : 0.5 }}>Guardar cambios</button>
              </div>
            </div>
          </div>
        )}

        {/* Acciones: Editar y Cancelar (solo sin participantes y no terminado) */}
        {!terminado && sinParticipantes && !editando && (
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <button onClick={iniciarEdicion} style={{ ...B, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>✏️ Editar concurso</button>
            <button onClick={() => { setCancelMotivo(""); setCancelModal(true); }} style={{ ...B, flex: 1, background: "transparent", border: "1px solid rgba(255,80,80,0.3)", color: "#ff6b6b", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>Cancelar concurso</button>
          </div>
        )}

        {/* Info: no se puede editar con participantes */}
        {!terminado && !sinParticipantes && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: "10px", padding: "12px 14px", marginBottom: "20px" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.35)", textAlign: "center" }}>No puedes editar ni cancelar un concurso con participantes activos.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Wizard (2 steps) ──
  if (wizard) return (
    <div style={{ maxWidth: "560px" }}>
      <button onClick={() => { setWizard(false); setStep(1); }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}>← Volver</button>
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>{[1, 2].map(s => <div key={s} style={{ flex: 1, height: "3px", borderRadius: "2px", background: s <= step ? "var(--accent)" : "var(--border-color)" }} />)}</div>

      {step === 1 && (<div>
        <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "20px" }}>¿Qué vas a regalar?</h2>

        {labelReq("Premio")}
        <input style={I} value={premio} onChange={e => setPremio(e.target.value)} placeholder="Ej: menú para 3, pizza familiar, café por un mes, etc" maxLength={80} />
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", marginTop: "4px", textAlign: "right" }}>{premio.length}/80</p>

        {labelReq("Descripción del premio")}
        <input style={I} value={descripcionPremio} onChange={e => setDescripcionPremio(e.target.value)} placeholder="Ej: Incluye 2 rollos especiales, nigiri y bebida para dos personas" />

        {labelReq("Duración")}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>{DURACIONES.map(d => <button key={d.v} onClick={() => setDur(d.v)} style={chip(dur === d.v)}>{d.l}</button>)}</div>

        {labelReq("Foto del concurso")}
        <SubirFoto folder="concursos" preview={imagenConcurso || null} label="Subir foto del premio" height="140px" onUpload={url => setImagenConcurso(url)} />

        {labelReq("Condiciones", false)}
        <textarea style={{ ...I, resize: "vertical", minHeight: "80px" }} value={condiciones} onChange={e => setCondiciones(e.target.value)} placeholder="Ej: solo para retiro en local, días de canje, etc" maxLength={500} />
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(240,234,214,0.3)", marginTop: "6px" }}>{condiciones.length}/500</p>

        <button onClick={() => pFinal.trim() && descripcionPremio.trim() && imagenConcurso && setStep(2)} disabled={!pFinal.trim() || !descripcionPremio.trim() || !imagenConcurso} style={{ ...B, marginTop: "28px", opacity: pFinal.trim() && descripcionPremio.trim() && imagenConcurso ? 1 : 0.5 }}>Siguiente →</button>
      </div>)}

      {step === 2 && (<div>
        <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "20px" }}>Previa del concurso</h2>
        {/* Card preview estilo home */}
        <div style={{ background: "rgba(20,12,35,0.95)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "20px", overflow: "hidden", marginBottom: "24px" }}>
          {imagenConcurso && (
            <div style={{ position: "relative", height: "180px" }}>
              <img src={imagenConcurso} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.6)", borderRadius: "20px", padding: "4px 12px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3db89e", animation: "dcPulse 1.8s ease-in-out infinite" }} />
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.1em", color: "#3db89e", textTransform: "uppercase" }}>Activo</span>
              </div>
            </div>
          )}
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(232,168,76,0.3), rgba(232,168,76,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)", border: "1px solid rgba(232,168,76,0.3)" }}>{(getSession().nombre ?? "L").charAt(0).toUpperCase()}</div>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", color: "var(--text-muted)" }}>{getSession().nombre ?? "Tu local"}</span>
            </div>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.1rem, 3vw, 1.4rem)", color: "#f5d080", lineHeight: 1.2, marginBottom: "8px" }}>🏆 {pFinal}</p>
            {descripcionPremio && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "12px" }}>{descripcionPremio}</p>}
            <div style={{ background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Termina en</p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                {[{ v: dur, l: "días" }, { v: 0, l: "hrs" }, { v: 0, l: "min" }].map((t, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.3rem", fontWeight: 700, color: "var(--accent)" }}>{t.v}</span>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>{t.l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }}>👥 0 participantes</span>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.08em", color: "var(--accent)" }}>Participar →</span>
            </div>
          </div>
        </div>
        {condiciones && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "14px", marginBottom: "24px" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Condiciones</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{condiciones}</p>
          </div>
        )}
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setStep(1)} style={{ ...B, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", flex: 1 }}>← Editar</button>
          <button onClick={() => setConfirmPublish(true)} style={{ ...B, flex: 2 }}>Publicar</button>
        </div>

        {/* Modal de confirmación */}
        {confirmPublish && (<>
          <div onClick={() => setConfirmPublish(false)} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.7)" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "90%", maxWidth: "400px", zIndex: 1000, background: "rgba(13,7,3,0.98)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "20px", padding: "32px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🏆</p>
            <h3 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", color: "#f5d080", marginBottom: "14px" }}>¿Publicar concurso?</h3>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "24px" }}>Tu concurso <strong style={{ color: "var(--accent)" }}>{pFinal}</strong> será visible para todos los usuarios de DeseoComer.</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setConfirmPublish(false)} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", color: "#e8a84c", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", cursor: "pointer" }}>Cancelar</button>
              <button onClick={publish} style={{ flex: 1, padding: "12px", background: "#e8a84c", border: "none", borderRadius: "10px", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>Publicar</button>
            </div>
          </div>
        </>)}

        <style>{`@keyframes dcPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
      </div>)}
    </div>
  );

  // ── List ──
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)" }}>Concursos</h1>
      <button onClick={() => setWizard(true)} style={B}>+ Concurso</button>
    </div>
    {loading ? (
      <div style={{ textAlign: "center", padding: "40px" }}><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
    ) : concursos.length === 0 ? (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🏆</div>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "8px" }}>Aún no has publicado ningún concurso</p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Publica tu primer concurso y empieza a ganar visibilidad</p>
        <button onClick={() => setWizard(true)} style={B}>Crear mi primer concurso</button>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {concursos.map(c => {
          const restMs = Math.max(0, new Date(c.fechaFin).getTime() - Date.now());
          const ended = restMs <= 0;
          const dias = Math.floor(restMs / 86400000);
          const hrs = Math.floor((restMs % 86400000) / 3600000);
          const mins = Math.floor((restMs % 3600000) / 60000);
          const tiempoStr = dias > 0 ? `${dias}d ${hrs}h` : hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
          const parts = c._count?.participantes ?? 0;
          return (
            <div key={c.id} style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden", display: "flex", alignItems: "center", transition: "border-color 0.2s" }}>
              {c.imagenUrl ? (
                <a href={`/concursos/${c.slug || c.id}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                  <img src={c.imagenUrl} alt="" style={{ width: "70px", height: "70px", objectFit: "cover", display: "block" }} />
                </a>
              ) : (
                <a href={`/concursos/${c.slug || c.id}`} target="_blank" rel="noopener noreferrer" style={{ width: "70px", height: "70px", flexShrink: 0, background: "linear-gradient(135deg, rgba(232,168,76,0.15), rgba(45,26,8,0.85))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", textDecoration: "none" }}>🏆</a>
              )}
              <div onClick={() => setDetalle(c)} style={{ flex: 1, padding: "12px 16px", cursor: "pointer" }}>
                <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.premio}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {parts} participantes · {ended ? (c.premioEntregado ? <span style={{ color: "#3db89e" }}>✓ Entregado</span> : <span style={{ color: "#ff8080" }}>Pendiente de entrega</span>) : <span style={{ color: "#3db89e" }}>{tiempoStr} restantes</span>}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0, padding: "0 12px 0 0" }}>
                <button onClick={() => { setDetalle(c); setAbrirEditando(true); }} style={{ background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: 8, padding: "6px 12px", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--accent)", cursor: "pointer" }}>Editar</button>
                <button onClick={() => setDetalle(c)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)", cursor: "pointer" }}>Detalle</button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>);
}

const I: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };
const B: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700, padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer" };
