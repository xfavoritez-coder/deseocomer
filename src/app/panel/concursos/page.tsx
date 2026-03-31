"use client";
import { useState, useEffect } from "react";
import SubirFoto from "@/components/SubirFoto";

const SESSION_KEY = "deseocomer_local_session";
const PREMIOS = ["Pizza familiar", "Menú para 2", "Postre gratis", "Happy hour para 4", "Café por un mes"];
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
  const [custom, setCustom] = useState("");
  const [dur, setDur] = useState(7);
  const [imagenConcurso, setImagenConcurso] = useState("");
  const [descripcionPremio, setDescripcionPremio] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [copied, setCopied] = useState(false);

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

  const pFinal = premio === "custom" ? custom : premio;
  const chip = (sel: boolean): React.CSSProperties => ({ padding: "10px 18px", borderRadius: "20px", cursor: "pointer", background: sel ? "rgba(232,168,76,0.15)" : "transparent", border: sel ? "1px solid var(--accent)" : "1px solid var(--border-color)", color: sel ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: sel ? 700 : 400 });

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
    setWizard(false); setStep(1); setPremio(""); setCustom(""); setImagenConcurso(""); setDescripcionPremio(""); setCondiciones("");
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

    return (
      <div style={{ maxWidth: "600px" }}>
        <button onClick={() => setDetalle(null)} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}>← Volver a concursos</button>

        {/* Header */}
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "16px", overflow: "hidden", marginBottom: "20px" }}>
          {detalle.imagenUrl && <img src={detalle.imagenUrl} alt="" style={{ width: "100%", height: "160px", objectFit: "cover" }} />}
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 10px", borderRadius: "20px", background: terminado ? "rgba(255,255,255,0.06)" : "rgba(61,184,158,0.12)", border: terminado ? "1px solid var(--border-color)" : "1px solid rgba(61,184,158,0.4)", color: terminado ? "var(--text-muted)" : "#3db89e" }}>
                {terminado ? "Finalizado" : "Activo"}
              </span>
              {!terminado && <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "var(--text-muted)" }}>{tiempoDetalle} restantes</span>}
            </div>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "4px" }}>{detalle.premio}</h2>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)" }}>👥 {participantes} participantes</p>
          </div>
        </div>

        {/* Link para compartir */}
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px" }}>Link del concurso</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "var(--text-muted)", flex: 1, wordBreak: "break-all" }}>{link}</p>
            <button onClick={() => copyLink(detalle)} style={{ background: "var(--accent)", color: "var(--bg-primary)", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>
              {copied ? "✓" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Ranking / Participantes */}
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "16px", marginBottom: "20px" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px" }}>
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
                  </span>
                  <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--oasis-bright)" }}>
                    {p.puntos ?? 0} pts
                  </span>
                </div>
              ))}
            </div>
          )}

          {terminado && participantes > 0 && (
            <div style={{ marginTop: "16px", padding: "16px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "10px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--accent)", fontWeight: 700, marginBottom: "4px" }}>🏆 Ganador</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "1rem", color: "var(--text-primary)" }}>
                {(detalle.participantes ?? []).sort((a: Concurso, b: Concurso) => (b.puntos ?? 0) - (a.puntos ?? 0))[0]?.usuario?.nombre ?? "Sin participantes"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Wizard (2 steps) ──
  if (wizard) return (
    <div style={{ maxWidth: "560px" }}>
      <button onClick={() => { setWizard(false); setStep(1); }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}>← Volver</button>
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>{[1, 2].map(s => <div key={s} style={{ flex: 1, height: "3px", borderRadius: "2px", background: s <= step ? "var(--accent)" : "var(--border-color)" }} />)}</div>

      {step === 1 && (<div>
        <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "20px" }}>¿Qué vas a regalar?</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          {PREMIOS.map(p => <button key={p} onClick={() => setPremio(p)} style={chip(premio === p)}>{p}</button>)}
          <button onClick={() => setPremio("custom")} style={chip(premio === "custom")}>Escribe el tuyo...</button>
        </div>
        {premio === "custom" && <input style={I} value={custom} onChange={e => setCustom(e.target.value)} placeholder="Describe el premio..." />}

        <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-primary)", margin: "28px 0 16px" }}>Descripción del premio (opcional)</h3>
        <input style={I} value={descripcionPremio} onChange={e => setDescripcionPremio(e.target.value)} placeholder="Ej: Incluye 2 rollos especiales, nigiri y bebida para dos personas" />

        <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-primary)", margin: "28px 0 16px" }}>¿Cuánto dura?</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>{DURACIONES.map(d => <button key={d.v} onClick={() => setDur(d.v)} style={chip(dur === d.v)}>{d.l}</button>)}</div>

        <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-primary)", margin: "28px 0 16px" }}>Foto del concurso (opcional)</h3>
        <SubirFoto folder="concursos" preview={imagenConcurso || null} label="Subir foto del premio" height="140px" onUpload={url => setImagenConcurso(url)} />

        <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-primary)", margin: "28px 0 16px" }}>Condiciones (opcional)</h3>
        <textarea style={{ ...I, resize: "vertical", minHeight: "80px" }} value={condiciones} onChange={e => setCondiciones(e.target.value)} placeholder="Ej: Deben seguir nuestra cuenta de Instagram, compartir la publicación..." maxLength={500} />
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.3)", marginTop: "6px" }}>{condiciones.length}/500</p>

        <button onClick={() => pFinal.trim() && setStep(2)} disabled={!pFinal.trim()} style={{ ...B, marginTop: "28px", opacity: pFinal.trim() ? 1 : 0.5 }}>Siguiente →</button>
      </div>)}

      {step === 2 && (<div>
        <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "20px" }}>Confirmar y publicar</h2>
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div><span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>Premio</span><p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem", color: "var(--accent)", marginTop: "4px" }}>{pFinal}</p></div>
            <div><span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>Duración</span><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)", marginTop: "4px" }}>{dur} días</p></div>
            {imagenConcurso && <div><span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>Foto</span><img src={imagenConcurso} alt="" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "10px", marginTop: "6px" }} /></div>}
            {condiciones && <div><span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)" }}>Condiciones</span><p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.5 }}>{condiciones}</p></div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setStep(1)} style={{ ...B, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", flex: 1 }}>← Editar</button>
          <button onClick={publish} style={{ ...B, flex: 2 }}>Publicar 🚀</button>
        </div>
      </div>)}
    </div>
  );

  // ── List ──
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)" }}>Concursos</h1>
      <button onClick={() => setWizard(true)} style={B}>+ Nuevo concurso</button>
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
            <div key={c.id} onClick={() => setDetalle(c)} style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", overflow: "hidden", display: "flex", alignItems: "center", cursor: "pointer", transition: "border-color 0.2s" }}>
              {c.imagenUrl ? (
                <img src={c.imagenUrl} alt="" style={{ width: "70px", height: "70px", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "70px", height: "70px", flexShrink: 0, background: "linear-gradient(135deg, rgba(232,168,76,0.15), rgba(45,26,8,0.85))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>🏆</div>
              )}
              <div style={{ flex: 1, padding: "12px 16px" }}>
                <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)" }}>{c.premio}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {parts} participantes · {ended ? <span style={{ color: "var(--text-muted)" }}>Finalizado</span> : <span style={{ color: "#3db89e" }}>{tiempoStr} restantes</span>}
                </p>
              </div>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", color: "var(--accent)", padding: "0 16px 0 0" }}>Ver →</span>
            </div>
          );
        })}
      </div>
    )}
  </div>);
}

const I: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };
const B: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700, padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer" };
