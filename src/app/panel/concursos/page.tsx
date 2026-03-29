"use client";
import { useState, useEffect } from "react";

const DATA_KEY = "deseocomer_panel_local_data";
const AUTH_KEY = "deseocomer_local_auth";

interface Concurso { id: number; premio: string; duracion: number; estado: string; participantes: number; creadoEn: number }

function loadConcursos(): Concurso[] { try { return (JSON.parse(localStorage.getItem(DATA_KEY) ?? "{}").concursos as Concurso[]) ?? []; } catch { return []; } }
function saveConcursos(c: Concurso[]) { try { const d = JSON.parse(localStorage.getItem(DATA_KEY) ?? "{}"); d.concursos = c; localStorage.setItem(DATA_KEY, JSON.stringify(d)); } catch {} }

const I: React.CSSProperties = { width: "100%", padding: "12px 16px", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" };
const PREMIOS = ["Pizza familiar", "Menú para 2", "Postre gratis", "Happy hour para 4", "Café por un mes"];
const DURACIONES = [{ l: "3 días", v: 3 }, { l: "7 días", v: 7 }, { l: "14 días", v: 14 }, { l: "30 días", v: 30 }];

export default function PanelConcursos() {
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [premio, setPremio] = useState("");
  const [custom, setCustom] = useState("");
  const [dur, setDur] = useState(7);
  const [localName, setLocalName] = useState("");

  useEffect(() => { setConcursos(loadConcursos()); try { setLocalName(JSON.parse(localStorage.getItem(AUTH_KEY) ?? "{}").nombreLocal ?? ""); } catch {} }, []);

  const pFinal = premio === "custom" ? custom : premio;
  const chip = (sel: boolean): React.CSSProperties => ({ padding: "10px 18px", borderRadius: "20px", cursor: "pointer", background: sel ? "rgba(232,168,76,0.15)" : "transparent", border: sel ? "1px solid var(--accent)" : "1px solid var(--border-color)", color: sel ? "var(--accent)" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", fontWeight: sel ? 700 : 400 });

  const publish = async () => {
    const n: Concurso = { id: Date.now(), premio: pFinal, duracion: dur, estado: "activo", participantes: 0, creadoEn: Date.now() };
    const next = [n, ...concursos]; setConcursos(next); saveConcursos(next);
    // Save to Supabase
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") ?? "{}");
      if (session.id) {
        const fechaFin = new Date(); fechaFin.setDate(fechaFin.getDate() + dur);
        await fetch("/api/concursos", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ localId: session.id, premio: pFinal, fechaFin: fechaFin.toISOString() }),
        });
      }
    } catch { /* fallback to localStorage */ }
    setWizard(false); setStep(1); setPremio(""); setCustom("");
  };

  if (wizard) return (
    <div style={{ maxWidth: "560px" }}>
      <button onClick={() => { setWizard(false); setStep(1); }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "20px" }}>← Volver</button>
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>{[1, 2, 3].map(s => <div key={s} style={{ flex: 1, height: "3px", borderRadius: "2px", background: s <= step ? "var(--accent)" : "var(--border-color)" }} />)}</div>

      {step === 1 && (<div>
        <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "20px" }}>¿Qué vas a regalar?</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          {PREMIOS.map(p => <button key={p} onClick={() => setPremio(p)} style={chip(premio === p)}>{p}</button>)}
          <button onClick={() => setPremio("custom")} style={chip(premio === "custom")}>Escribe el tuyo...</button>
        </div>
        {premio === "custom" && <input style={I} value={custom} onChange={e => setCustom(e.target.value)} placeholder="Describe el premio..." />}
        <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-primary)", margin: "28px 0 16px" }}>¿Cuánto dura?</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>{DURACIONES.map(d => <button key={d.v} onClick={() => setDur(d.v)} style={chip(dur === d.v)}>{d.l}</button>)}</div>
        <button onClick={() => pFinal.trim() && setStep(2)} disabled={!pFinal.trim()} style={{ ...B, marginTop: "28px", opacity: pFinal.trim() ? 1 : 0.5 }}>Siguiente →</button>
      </div>)}

      {step === 2 && (<div>
        <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "20px" }}>¿Cuándo publicarlo?</h2>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button onClick={() => setStep(3)} style={chip(true)}>Ahora mismo</button>
        </div>
        <button onClick={() => setStep(3)} style={B}>Siguiente →</button>
      </div>)}

      {step === 3 && (<div>
        <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", color: "var(--accent)", marginBottom: "20px" }}>Así se verá tu concurso</h2>
        <div style={{ background: "rgba(45,26,8,0.85)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "20px", overflow: "hidden", marginBottom: "24px" }}>
          <div style={{ height: "100px", background: "linear-gradient(135deg, rgba(45,26,8,0.8), rgba(13,7,3,0.6))", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <span style={{ fontSize: "2.5rem" }}>🏆</span>
            <div style={{ position: "absolute", top: "8px", right: "-20px", background: "linear-gradient(135deg, #f5d080, #e8a84c)", color: "#1a0e05", fontFamily: "var(--font-cinzel)", fontSize: "0.45rem", fontWeight: 900, padding: "4px 30px", transform: "rotate(35deg)" }}>🏆 PREMIO GRATIS</div>
          </div>
          <div style={{ padding: "16px" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", color: "var(--oasis-bright)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>{localName}</p>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem", color: "var(--accent)", marginBottom: "6px" }}>{pFinal}</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "var(--text-muted)" }}>👥 0 · ⏱ {dur} días</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setStep(2)} style={{ ...B, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", flex: 1 }}>← Volver</button>
          <button onClick={publish} style={{ ...B, flex: 2 }}>Publicar 🚀</button>
        </div>
      </div>)}
    </div>
  );

  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
      <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)" }}>Concursos</h1>
      <button onClick={() => setWizard(true)} style={B}>+ Nuevo concurso</button>
    </div>
    {concursos.length === 0 ? (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🏆</div>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", marginBottom: "8px" }}>Aún no has publicado ningún concurso</p>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>Publica tu primer concurso y empieza a ganar visibilidad</p>
        <button onClick={() => setWizard(true)} style={B}>Crear mi primer concurso</button>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {concursos.map(c => (
          <div key={c.id} style={{ background: "rgba(45,26,8,0.85)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "1.6rem" }}>🏆</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)" }}>{c.premio}</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.duracion} días · {c.participantes} participantes · <span style={{ color: "#3db89e" }}>{c.estado}</span></p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>);
}

const B: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", background: "var(--accent)", color: "var(--bg-primary)", fontWeight: 700, padding: "12px 24px", borderRadius: "12px", border: "none", cursor: "pointer" };
