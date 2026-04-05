"use client";
import { useState, useEffect } from "react";
import SubirFoto from "@/components/SubirFoto";

const SESSION_KEY = "deseocomer_local_session";


const DURACIONES = [{ l: "1 día", v: 1 }, { l: "3 días", v: 3 }];

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
  const [step, setStep] = useState(0);
  const [premio, setPremio] = useState("");
  const [modalidadConcurso, setModalidadConcurso] = useState<"meritos" | "sorteo">("meritos");

  const [dur, setDur] = useState(3);
  const [activacion, setActivacion] = useState<"ahora" | "programar">("ahora");
  const [fechaActivacion, setFechaActivacion] = useState("");
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
  const [filtroPanel, setFiltroPanel] = useState<"todos" | "activos" | "pendientes" | "entregados">("todos");
  const [sharePrompt, setSharePrompt] = useState(false);

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
    const esProgramado = activacion === "programar" && fechaActivacion && new Date(fechaActivacion) > new Date();
    const inicio = esProgramado ? new Date(fechaActivacion) : new Date();
    const fechaFin = new Date(inicio); fechaFin.setDate(fechaFin.getDate() + dur);
    try {
      const res = await fetch("/api/concursos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localId: s.id, premio: pFinal, descripcion: descripcionPremio.trim() || null, fechaFin: fechaFin.toISOString(), imagenUrl: imagenConcurso || null, condiciones: condiciones.trim() || null, fechaActivacion: esProgramado ? new Date(fechaActivacion).toISOString() : null, modalidadConcurso }),
      });
      if (res.ok) {
        const nuevo = await res.json();
        setConcursos(prev => [{ ...nuevo, _count: { participantes: 0 } }, ...prev]);
        setDetalle({ ...nuevo, _count: { participantes: 0 }, participantes: [] });
        setSharePrompt(true);
      }
    } catch {}
    setWizard(false); setStep(0); setPremio(""); setImagenConcurso(""); setDescripcionPremio(""); setCondiciones(""); setConfirmPublish(false); setActivacion("ahora"); setFechaActivacion(""); setModalidadConcurso("meritos");
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>👥 {participantes} {participantes === 1 ? "participante" : "participantes"}</p>
              {detalle.modalidadConcurso === "sorteo" && <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", fontWeight: 700, color: "#ec4899", background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 20, padding: "2px 10px" }}>🎲 Sorteo</span>}
              {detalle.modalidadConcurso !== "sorteo" && <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", fontWeight: 700, color: "#e8a84c", background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 20, padding: "2px 10px" }}>🏆 Méritos</span>}
            </div>
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

        {/* Share prompt after creating */}
        {sharePrompt && (
          <div style={{ background: "linear-gradient(135deg, rgba(232,168,76,0.12), rgba(232,168,76,0.04))", border: "1px solid rgba(232,168,76,0.35)", borderRadius: "14px", padding: "20px", marginBottom: "20px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "#f5d080", marginBottom: "6px" }}>¡Tu concurso está en vivo! 🎉</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.55)", lineHeight: 1.5, marginBottom: "16px" }}>Comparte el link en tus redes sociales para que más personas participen. Mientras más personas compartan, mayor alcance tendrá tu local.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a href={`https://wa.me/?text=${encodeURIComponent(`¡Participa en nuestro concurso y gana ${detalle.premio}! 🏆\n${link}`)}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.35)", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", fontWeight: 700, color: "#25d366", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em" }}>Compartir en WhatsApp</a>
              <a href={`https://www.instagram.com/`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "11px", background: "rgba(225,48,108,0.08)", border: "1px solid rgba(225,48,108,0.3)", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", fontWeight: 700, color: "#e1306c", textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em" }}>Publicar en Instagram</a>
            </div>
            <button onClick={() => setSharePrompt(false)} style={{ background: "none", border: "none", fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.3)", cursor: "pointer", marginTop: "10px" }}>Ahora no</button>
          </div>
        )}

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
            const estado = detalle.estado ?? (detalle.premioEntregado ? "completado" : "finalizado");
            const _fn = (n: string) => { const p = n.trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length-1][0]}.` : p[0]; };
            const ganadorActualNombre = detalle.ganadorActual?.nombre ? _fn(detalle.ganadorActual.nombre) : _fn(ganadorNombre);
            const codigo = detalle.codigoEntrega;

            if (estado === "completado") {
              return (
                <div style={{ marginTop: "16px", padding: "20px", background: "rgba(61,184,158,0.08)", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "12px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "#3db89e", fontWeight: 700, marginBottom: "4px" }}>Premio entregado ✓</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "0" }}>{ganadorActualNombre}</p>
                  {(detalle.premioConfirmadoAt || detalle.premioEntregadoAt) && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>Confirmado el {new Date(detalle.premioConfirmadoAt || detalle.premioEntregadoAt).toLocaleDateString("es-CL")}</p>}
                </div>
              );
            }
            if (estado === "en_disputa") {
              return (
                <div style={{ marginTop: "16px", padding: "20px", background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.25)", borderRadius: "14px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "#ff6b6b", fontWeight: 700, marginBottom: "8px" }}>Disputa activa</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>El ganador reportó no haber recibido el premio. Nuestro equipo está investigando el caso.</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.35)", marginTop: "8px" }}>Contáctanos: deseocomer.com/contacto</p>
                </div>
              );
            }
            if (estado === "expirado") {
              return (
                <div style={{ marginTop: "16px", padding: "20px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "8px" }}>Premio no reclamado</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.4)", lineHeight: 1.6 }}>Ningún participante reclamó el premio dentro del plazo establecido.</p>
                </div>
              );
            }
            if (estado === "en_revision") {
              return (
                <div style={{ marginTop: "16px", padding: "20px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "14px", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--accent)", fontWeight: 700, marginBottom: "8px" }}>Verificando resultados</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>Estamos verificando los resultados para anunciar al ganador oficial.</p>
                </div>
              );
            }
            // estado === "finalizado" — esperando confirmación
            return (
              <div style={{ marginTop: "16px", padding: "20px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "14px" }}>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#f5d080", fontWeight: 700, marginBottom: "12px" }}>Concurso finalizado — Esperando confirmación</p>

                <div style={{ marginBottom: "16px" }}>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "4px" }}>Ganador: {ganadorActualNombre}</p>
                  {detalle.ganadorNotificadoAt && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>Notificado por email el {new Date(detalle.ganadorNotificadoAt).toLocaleDateString("es-CL")}</p>}
                  {codigo && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)" }}>Código de verificación: <strong style={{ color: "var(--accent)", letterSpacing: "0.05em" }}>{codigo}</strong></p>}
                </div>

                {/* Timeline */}
                <div style={{ textAlign: "left", marginBottom: "16px" }}>
                  {[
                    { done: true, label: "Concurso finalizado" },
                    { done: !!detalle.ganadorNotificadoAt, label: "Ganador notificado" },
                    { done: false, active: true, label: "Esperando confirmación de entrega" },
                    { done: false, label: "Premio confirmado" },
                  ].map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: step.done ? "#3db89e" : step.active ? "#e8a84c" : "rgba(240,234,214,0.25)" }}>
                        {step.done ? "✓" : step.active ? "⏳" : "○"}
                      </span>
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: step.done ? "#3db89e" : step.active ? "var(--text-primary)" : "rgba(240,234,214,0.3)" }}>{step.label}</span>
                    </div>
                  ))}
                </div>

                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.45)", lineHeight: 1.5, marginBottom: "16px" }}>
                  El ganador fue notificado por email con tus datos de contacto. Si se presenta en tu local, verifica su identidad pidiendo el código: <strong style={{ color: "var(--accent)" }}>{codigo}</strong>
                </p>

                <button onClick={async () => {
                  const s = getSession();
                  try {
                    const res = await fetch(`/api/concursos/${detalle.id}/confirmar-entrega`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ localId: s.id }) });
                    if (res.ok) {
                      setDetalle({ ...detalle, estado: "completado", premioEntregado: true, premioEntregadoAt: new Date().toISOString(), premioConfirmadoAt: new Date().toISOString() });
                      setConcursos(prev => prev.map(c => c.id === detalle.id ? { ...c, estado: "completado", premioEntregado: true } : c));
                      setActionToast("✓ Entrega del premio confirmada");
                      setTimeout(() => setActionToast(""), 3000);
                    } else { const d = await res.json(); setActionToast(d.error ?? "Error"); setTimeout(() => setActionToast(""), 3000); }
                  } catch { setActionToast("Error de conexión"); setTimeout(() => setActionToast(""), 3000); }
                }} style={{ width: "100%", padding: "12px 28px", background: "#3db89e", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
                  Confirmar entrega del premio
                </button>
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
                <input style={I} value={editPremio} onChange={e => setEditPremio(e.target.value)} maxLength={50} />
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Descripción del premio</label>
                <textarea style={{ ...I, resize: "vertical", minHeight: "80px" }} value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} placeholder="Descripción del premio (opcional)" />
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Fecha de cierre</label>
                <input style={I} type="datetime-local" value={editFechaFin} onChange={e => setEditFechaFin(e.target.value)} />
              </div>
              <div>
                <label style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px", display: "block" }}>Condiciones</label>
                <textarea style={{ ...I, resize: "vertical", minHeight: "60px" }} value={editCondiciones} onChange={e => setEditCondiciones(e.target.value)} placeholder="Condiciones (opcional)" />
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
      <button onClick={() => { if (step === 0) { setWizard(false); setStep(0); } else setStep(step - 1); }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}>← Volver</button>
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>{[0, 1, 2].map(s => <div key={s} style={{ flex: 1, height: "3px", borderRadius: "2px", background: s <= step ? "var(--accent)" : "var(--border-color)" }} />)}</div>

      {/* Step 0: Introducción */}
      {step === 0 && (<div>
        <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "8px" }}>¿Cómo funcionan los concursos?</h2>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "24px" }}>Los concursos son la forma más efectiva de que personas reales compartan tu local con sus amigos. Así funciona:</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
          {[
            { icon: "🎁", title: "Tú pones el premio", desc: "Puede ser un menú, un descuento, un plato gratis... algo que motive a participar. Tú decides qué ofrecer." },
            { icon: "🔗", title: "Los participantes comparten tu local", desc: "Cada persona que participa recibe un link único. Mientras más amigos inviten, más puntos ganan y más personas conocen tu local." },
            { icon: "🏆", title: "El ganador recibe el premio", desc: "Al terminar el concurso, te avisamos quién ganó. Tú coordinas la entrega del premio directamente con el ganador." },
            { icon: "📈", title: "Tu local gana visibilidad real", desc: "Cada concurso genera decenas de compartidos orgánicos. Personas reales recomendando tu local a personas reales." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "rgba(232,168,76,0.04)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: "12px", padding: "14px" }}>
              <span style={{ fontSize: "1.3rem", flexShrink: 0, marginTop: "2px" }}>{item.icon}</span>
              <div>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: 700, color: "#f5d080", margin: "0 0 4px" }}>{item.title}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)", lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "rgba(61,184,158,0.06)", border: "1px solid rgba(61,184,158,0.2)", borderRadius: "12px", padding: "14px", marginBottom: "24px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "#3db89e", lineHeight: 1.5, margin: 0 }}>Los concursos son <strong>100% gratis</strong> para tu local. Solo necesitas definir un premio que puedas entregar.</p>
        </div>

        <button onClick={() => setStep(1)} style={B}>Entendido, crear mi concurso →</button>
      </div>)}

      {step === 1 && (<div>
        <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "20px" }}>Configura tu concurso</h2>

        {labelReq("Tipo de concurso")}
        <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
          {(["meritos", "sorteo"] as const).map(m => {
            const sel = modalidadConcurso === m;
            const isSorteo = m === "sorteo";
            const c = isSorteo ? "#ec4899" : "#e8a84c";
            const bg = isSorteo ? "rgba(236,72,153,0.12)" : "rgba(232,168,76,0.15)";
            return (
              <button key={m} onClick={() => setModalidadConcurso(m)} style={{ flex: 1, padding: "14px 12px", borderRadius: 12, cursor: "pointer", background: sel ? bg : "transparent", border: `1px solid ${sel ? c : "rgba(255,255,255,0.1)"}`, textAlign: "center", transition: "all 0.2s" }}>
                <p style={{ fontSize: 24, margin: "0 0 4px" }}>{isSorteo ? "🎲" : "🏆"}</p>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, color: sel ? c : "rgba(240,234,214,0.5)", margin: 0 }}>{isSorteo ? "Sorteo" : "Méritos"}</p>
              </button>
            );
          })}
        </div>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)", lineHeight: 1.4, marginBottom: "16px" }}>{modalidadConcurso === "meritos" ? "Gana quien más puntos acumule compartiendo tu local. Ideal para maximizar alcance." : "Se sortea entre los participantes. Más puntos = más boletos = más chances de ganar. Ideal para generar expectativa."}</p>

        {labelReq("Premio")}
        <input style={I} value={premio} onChange={e => setPremio(e.target.value)} placeholder="Ej: menú para 3, pizza familiar, etc" maxLength={50} />
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", marginTop: "4px", textAlign: "right" }}>{premio.length}/50</p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", lineHeight: 1.4, marginTop: "2px" }}>Escribe algo concreto y atractivo. Ej: &quot;Menú para 2&quot; funciona mejor que &quot;descuento&quot;.</p>

        {labelReq("Descripción del premio")}
        <textarea style={{ ...I, resize: "vertical", minHeight: "80px" }} value={descripcionPremio} onChange={e => setDescripcionPremio(e.target.value)} placeholder="Ej: Incluye 2 rollos especiales, nigiri y bebida para dos personas" />
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", lineHeight: 1.4, marginTop: "4px" }}>Detalla qué incluye el premio para que los participantes sepan exactamente qué pueden ganar.</p>

        {labelReq("Duración")}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>{DURACIONES.map(d => <button key={d.v} onClick={() => setDur(d.v)} style={chip(dur === d.v)}>{d.l}</button>)}</div>

        {labelReq("¿Cuándo se activa?", false)}
        {(() => {
          const yaHayProgramado = concursos.some((c: any) => c.estado === "programado");
          return (
            <div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={() => { setActivacion("ahora"); setFechaActivacion(""); }} style={chip(activacion === "ahora")}>Ahora mismo</button>
                <div style={{ position: "relative" }}>
                  <button disabled={yaHayProgramado} onClick={() => !yaHayProgramado && setActivacion("programar")} style={{ ...chip(activacion === "programar"), opacity: yaHayProgramado ? 0.4 : 1, cursor: yaHayProgramado ? "default" : "pointer" }}>Programar fecha</button>
                  {yaHayProgramado && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "#e8a84c", marginTop: "4px", maxWidth: "200px", lineHeight: 1.4 }}>Ya tienes un concurso programado. Espera a que se active para programar otro.</p>}
                </div>
              </div>
              {activacion === "programar" && (
                <div style={{ marginTop: "12px" }}>
                  <input type="datetime-local" value={fechaActivacion} onChange={e => {
                    const val = e.target.value;
                    const selected = new Date(val);
                    const now = new Date();
                    const max7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    if (selected > max7d) { setFechaActivacion(""); return; }
                    setFechaActivacion(val);
                  }} min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)} max={new Date(Date.now() + 7 * 24 * 3600000).toISOString().slice(0, 16)} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none" }} />
                  {fechaActivacion && new Date(fechaActivacion) > new Date(Date.now() + 7 * 24 * 3600000) && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "#ff6b6b", marginTop: "6px" }}>Máximo 7 días de anticipación</p>}
                </div>
              )}
            </div>
          );
        })()}

        {labelReq("Foto del concurso")}
        <SubirFoto folder="concursos" preview={imagenConcurso || null} label="Subir foto del premio" height="140px" onUpload={url => setImagenConcurso(url)} />

        {labelReq("Condiciones", false)}
        <textarea style={{ ...I, resize: "vertical", minHeight: "80px" }} value={condiciones} onChange={e => setCondiciones(e.target.value)} placeholder="Ej: solo para retiro en local, días de canje, etc" />

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
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activacion === "programar" && fechaActivacion ? "#a78bfa" : "#3db89e", animation: "dcPulse 1.8s ease-in-out infinite" }} />
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.1em", color: activacion === "programar" && fechaActivacion ? "#a78bfa" : "#3db89e", textTransform: "uppercase" }}>{activacion === "programar" && fechaActivacion ? "🔮 Próximamente" : "Activo"}</span>
              </div>
            </div>
          )}
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(232,168,76,0.3), rgba(232,168,76,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", fontWeight: 700, color: "var(--accent)", border: "1px solid rgba(232,168,76,0.3)" }}>{(getSession().nombre ?? "L").charAt(0).toUpperCase()}</div>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", color: "var(--text-muted)" }}>{getSession().nombre ?? "Tu local"}</span>
            </div>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.1rem, 3vw, 1.4rem)", color: "#f5d080", lineHeight: 1.2, marginBottom: "8px" }}>🏆 {pFinal}</p>
            {descripcionPremio && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "12px", whiteSpace: "pre-wrap" }}>{descripcionPremio}</p>}
            {activacion === "programar" && fechaActivacion && (
              <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "12px", padding: "12px", marginBottom: "8px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#a78bfa", marginBottom: "4px" }}>🔮 Se activa el</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "#a78bfa" }}>{new Date(fechaActivacion).toLocaleDateString("es-CL")} a las {new Date(fechaActivacion).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            )}
            <div style={{ background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>{activacion === "programar" && fechaActivacion ? "Duración" : "Termina en"}</p>
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
              <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }}>{activacion === "programar" && fechaActivacion ? "🔔 Lista de espera" : "👥 0 participantes"}</span>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.08em", color: activacion === "programar" && fechaActivacion ? "#a78bfa" : "var(--accent)" }}>{activacion === "programar" && fechaActivacion ? "Avisarme →" : "Participar →"}</span>
            </div>
          </div>
        </div>
        {condiciones && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "14px", marginBottom: "24px" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "6px" }}>Condiciones</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{condiciones}</p>
          </div>
        )}
        {/* Info sobre entrega del premio */}
        <div style={{ background: "rgba(232,168,76,0.04)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.4)", marginBottom: "8px" }}>¿Cómo se entrega el premio?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {[
              "Al terminar el concurso, te mostramos quién ganó con su nombre y datos",
              "El ganador recibirá un código único que deberá presentarte",
              "Tú verificas el código y entregas el premio directamente",
              "Todo queda registrado en tu panel para tu tranquilidad",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <span style={{ color: "#3db89e", fontSize: "0.7rem", marginTop: "3px", flexShrink: 0 }}>✓</span>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.45)", lineHeight: 1.4, margin: 0 }}>{t}</p>
              </div>
            ))}
          </div>
        </div>

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
  const concursosFiltrados = concursos.filter(c => {
    const ended = new Date(c.fechaFin).getTime() <= Date.now();
    if (filtroPanel === "activos") return !ended && c.estado !== "cancelado";
    if (filtroPanel === "pendientes") return ended && c.estado !== "completado" && c.estado !== "expirado" && c.estado !== "cancelado";
    if (filtroPanel === "entregados") return c.estado === "completado" || c.premioEntregado;
    return true;
  }).sort((a, b) => {
    const endedA = new Date(a.fechaFin).getTime() <= Date.now();
    const endedB = new Date(b.fechaFin).getTime() <= Date.now();
    if (!endedA && endedB) return -1;
    if (endedA && !endedB) return 1;
    return new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime();
  });

  const chipFiltro = (key: typeof filtroPanel, label: string) => (
    <button onClick={() => setFiltroPanel(key)} style={{ padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.06em", background: filtroPanel === key ? "rgba(232,168,76,0.15)" : "transparent", border: filtroPanel === key ? "1px solid var(--accent)" : "1px solid var(--border-color)", color: filtroPanel === key ? "var(--accent)" : "var(--text-muted)" }}>{label}</button>
  );

  return (<div style={{ width: "100%", maxWidth: "100%", overflowX: "hidden", boxSizing: "border-box" }}>
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg-primary)", paddingBottom: "8px", paddingTop: "4px", width: "100%", boxSizing: "border-box", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)", margin: 0 }}>Concursos</h1>
          <button onClick={() => { setStep(0); setWizard(true); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)", marginTop: "2px" }}>¿Cómo funcionan?</button>
        </div>
        <button onClick={() => { setStep(concursos.length > 0 ? 1 : 0); setWizard(true); }} style={{ ...B, whiteSpace: "nowrap", flexShrink: 0, fontSize: "0.78rem", padding: "10px 16px" }}>+ Concurso</button>
      </div>
    </div>

    {/* Filtros */}
    {concursos.length > 0 && (
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "4px", width: "100%", boxSizing: "border-box" }}>
        {chipFiltro("todos", "Todos")}
        {chipFiltro("activos", "Activos")}
        {chipFiltro("pendientes", "Pendientes")}
        {chipFiltro("entregados", "Entregados")}
      </div>
    )}

    {loading ? (
      <div style={{ textAlign: "center", padding: "40px" }}><p style={{ color: "var(--text-muted)" }}>Cargando...</p></div>
    ) : concursos.length === 0 ? (
      <div style={{ textAlign: "center", padding: "48px 20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🏆</div>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "8px" }}>Aún no has publicado ningún concurso</p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "20px", maxWidth: "400px", margin: "0 auto 20px" }}>Los concursos son la forma más rápida de que personas reales compartan tu local con sus amigos. Solo necesitas elegir un premio y nosotros nos encargamos del resto.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "340px", margin: "0 auto 24px", textAlign: "left" }}>
          {[
            { icon: "🎁", text: "Tú eliges el premio (un menú, un plato, un descuento)" },
            { icon: "🔗", text: "Los participantes comparten tu local para ganar puntos" },
            { icon: "📈", text: "Tu local llega a cientos de personas nuevas" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)", margin: 0, lineHeight: 1.4 }}>{item.text}</p>
            </div>
          ))}
        </div>
        <button onClick={() => { setStep(0); setWizard(true); }} style={B}>Crear mi primer concurso →</button>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.25)", marginTop: "12px" }}>Es gratis y toma menos de 2 minutos</p>
      </div>
    ) : concursosFiltrados.length === 0 ? (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-muted)" }}>No hay concursos en esta categoría</p>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
        {concursosFiltrados.map(c => {
          const restMs = Math.max(0, new Date(c.fechaFin).getTime() - Date.now());
          const ended = restMs <= 0;
          const dias = Math.floor(restMs / 86400000);
          const hrs = Math.floor((restMs % 86400000) / 3600000);
          const mins = Math.floor((restMs % 3600000) / 60000);
          const tiempoStr = dias > 0 ? `${dias}d ${hrs}h` : hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
          const parts = c._count?.participantes ?? 0;
          return (
            <div key={c.id} style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: 14, overflow: "hidden", width: "100%", maxWidth: 800, boxSizing: "border-box", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "stretch" }}>
              <a href={`/concursos/${c.slug || c.id}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0, display: "block" }}>
                {c.imagenUrl ? (
                  <img src={c.imagenUrl} alt="" style={{ width: "clamp(80px, 10vw, 120px)", height: "clamp(80px, 10vw, 120px)", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ width: "clamp(80px, 10vw, 120px)", height: "clamp(80px, 10vw, 120px)", background: "linear-gradient(135deg, rgba(232,168,76,0.1), rgba(45,26,8,0.9))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏆</div>
                )}
              </a>
              <a href={`/concursos/${c.slug || c.id}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, minWidth: 0, textDecoration: "none" }}>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 13, fontWeight: 700, color: "#f5d080", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{c.premio}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {c.estado === "programado" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: "#a78bfa" }}>🔮 Programado</span>
                  ) : !ended ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(61,184,158,0.1)", border: "1px solid rgba(61,184,158,0.3)", fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: "#3db89e" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3db89e", flexShrink: 0, animation: "dcPulse 1.5s ease-in-out infinite" }} />
                      {tiempoStr} restantes
                    </span>
                  ) : c.estado === "completado" || c.premioEntregado ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(245,208,128,0.08)", border: "1px solid rgba(245,208,128,0.3)", fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: "#f5d080" }}>✓ Premio entregado</span>
                  ) : c.estado === "en_disputa" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.25)", fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: "#ff6b6b" }}>Disputa activa</span>
                  ) : c.estado === "expirado" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "var(--font-cinzel)", fontSize: 10, color: "rgba(240,234,214,0.3)" }}>Expirado</span>
                  ) : c.estado === "en_revision" ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: "#e8a84c" }}>En revisión</span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: "rgba(255,128,128,0.08)", border: "1px solid rgba(255,128,128,0.2)", fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: "#ff8080" }}>⏳ Pendiente</span>
                  )}
                </div>
                {c.estado === "programado" && c.fechaActivacion && <p style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: "rgba(240,234,214,0.4)", margin: 0 }}>Se activa el {new Date(c.fechaActivacion).toLocaleDateString("es-CL")} a las {new Date(c.fechaActivacion).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</p>}
                {c.estado === "programado" && (c._count?.listaEspera ?? 0) > 0 && <p style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: "#a78bfa", margin: 0 }}>{c._count?.listaEspera ?? 0} personas en lista de espera</p>}
                {c.estado !== "programado" && <p style={{ fontFamily: "var(--font-lato)", fontSize: 11, color: "rgba(240,234,214,0.3)", margin: 0 }}>{parts} {parts === 1 ? "participante" : "participantes"}</p>}
              </a>
              </div>
              <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderTop: "1px solid rgba(232,168,76,0.06)" }}>
                {c.estado !== "cancelado" && !c.cancelado && (
                  <button onClick={e => { e.stopPropagation(); window.open(`/story/${c.slug || c.id}`, "_blank"); }} style={{ flex: 1, background: "transparent", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 8, padding: "6px 0", fontFamily: "var(--font-cinzel)", fontSize: 10, color: "rgba(240,234,214,0.45)", cursor: "pointer" }}>📸 Compartir</button>
                )}
                <button onClick={e => { e.stopPropagation(); setDetalle(c); setAbrirEditando(true); }} style={{ flex: 1, background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 8, padding: "6px 0", fontFamily: "var(--font-cinzel)", fontSize: 10, color: "#e8a84c", cursor: "pointer" }}>Editar</button>
                <button onClick={e => { e.stopPropagation(); setDetalle(c); }} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 0", fontFamily: "var(--font-cinzel)", fontSize: 10, color: "rgba(240,234,214,0.4)", cursor: "pointer" }}>Detalle</button>
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
