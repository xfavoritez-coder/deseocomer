"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D = any;

export default function CaptadorPanel() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<D>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [requiereTerminos, setRequiereTerminos] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("deseocomer_captador_codigo");
    if (saved) { setCodigo(saved); loadData(saved); }
  }, []);

  const loadData = async (c: string) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/captador/${encodeURIComponent(c)}`);
      if (!res.ok) { setError("Código no encontrado"); setLoading(false); return; }
      const d = await res.json();
      if (d.requiereAceptarTerminos) { setRequiereTerminos(true); setCodigo(c); setLoading(false); return; }
      setData(d); setCodigo(c); localStorage.setItem("deseocomer_captador_codigo", c);
    } catch { setError("Error de conexión"); }
    setLoading(false);
  };

  const handleAccess = async () => {
    if (!input.trim()) return;
    const c = input.trim().toUpperCase();
    if (requiereTerminos && aceptaTerminos) {
      setLoading(true);
      try {
        await fetch(`/api/captador/${encodeURIComponent(c)}/terminos`, { method: "PATCH" });
        setRequiereTerminos(false);
        loadData(c);
      } catch { setError("Error al aceptar términos"); setLoading(false); }
      return;
    }
    loadData(c);
  };

  const logout = () => { localStorage.removeItem("deseocomer_captador_codigo"); setCodigo(""); setData(null); setInput(""); };

  const fmt = (n: number) => n.toLocaleString("es-CL");
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-CL");
  const link = `https://deseocomer.com/unete?ref=${data?.codigo || codigo}`;

  const copyLink = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const descargarQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a"); a.href = url; a.download = `qr-${data?.codigo || "captador"}.png`; a.click();
  };

  const I: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: 10, color: "#f0ead6", fontFamily: "var(--font-lato)", fontSize: "1rem", outline: "none", boxSizing: "border-box", textTransform: "uppercase" };

  // ── LOGIN ──
  if (!data) return (
    <div style={{ background: "#0a0812", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 340, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧞</div>
        <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: 20, color: "#f5d080", textTransform: "uppercase", marginBottom: 24 }}>Acceder a tu panel</h1>
        {!requiereTerminos && (
          <div style={{ marginBottom: 16 }}>
            <input style={I} value={input} onChange={e => setInput(e.target.value.toUpperCase())} placeholder="Ej: JUAN234" onKeyDown={e => e.key === "Enter" && handleAccess()} />
          </div>
        )}
        {error && <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        {requiereTerminos && (
          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" checked={aceptaTerminos} onChange={e => setAceptaTerminos(e.target.checked)} style={{ accentColor: "#e8a84c", width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "rgba(240,234,214,0.5)", lineHeight: 1.5 }}>
                Acepto los <a href="/terminos-captadores" target="_blank" style={{ color: "#e8a84c", textDecoration: "underline" }}>términos del programa de captadores</a>. Entiendo que registrar locales sin su consentimiento explícito está prohibido y es motivo de descalificación sin derecho a pago.
              </span>
            </label>
          </div>
        )}
        <button onClick={handleAccess} disabled={loading || (requiereTerminos && !aceptaTerminos)} style={{ width: "100%", padding: 14, background: "#e8a84c", border: "none", borderRadius: 12, fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, color: "#0a0812", textTransform: "uppercase", cursor: "pointer", opacity: (loading || (requiereTerminos && !aceptaTerminos)) ? 0.5 : 1 }}>
          {loading ? "Verificando..." : requiereTerminos ? "Aceptar y acceder →" : "Acceder →"}
        </button>
        <button onClick={() => window.location.href = "/"} style={{ background: "none", border: "none", color: "rgba(240,234,214,0.3)", fontSize: 12, cursor: "pointer", marginTop: 20 }}>← Volver a DeseoComer</button>
      </div>
    </div>
  );

  // ── PANEL ──
  return (
    <div style={{ background: "#0a0812", minHeight: "100vh", fontFamily: "var(--font-lato)" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 40px" }}>

        {/* Header */}
        <div style={{ padding: "32px 0 20px" }}>
          <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: 18, color: "#f5d080", marginBottom: 4 }}>Hola, {data.nombre} 👋</h1>
          <p style={{ fontSize: 12, color: "rgba(240,234,214,0.4)" }}>Tu código: {data.codigo}</p>
        </div>

        {/* QR Button */}
        <button onClick={() => { localStorage.setItem("deseocomer_captador_nombre", data.nombre); router.push("/qr"); }} style={{ width: "100%", padding: 16, background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, textTransform: "uppercase", borderRadius: 12, border: "none", cursor: "pointer", marginBottom: 20 }}>
          📱 Mostrar QR a un local
        </button>

        {/* Tips */}
        <TipsCaptar />

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Locales registrados", value: data.totalLocales, color: "#e8a84c" },
            { label: "Con concurso", value: data.localesConConcurso, color: "#3db89e" },
            { label: "Total ganado", value: `$${fmt(data.totalGanado)}`, color: "#f5d080" },
            { label: "Pendiente de cobro", value: `$${fmt(Math.max(data.pendiente, 0))}`, color: data.pendiente > 0 ? "#ff8080" : "#3db89e" },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 22, color: s.color, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(240,234,214,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Link */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 10, color: "rgba(240,234,214,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Tu link de captador</p>
          <code style={{ fontSize: 13, color: "#3db89e", wordBreak: "break-all", display: "block", marginBottom: 12 }}>{link}</code>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copyLink} style={{ flex: 1, padding: "10px", background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 8, color: "#e8a84c", fontFamily: "var(--font-cinzel)", fontSize: 12, cursor: "pointer" }}>{copied ? "¡Copiado!" : "Copiar"}</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Regístrate en DeseoComer: ${link}`)}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: "10px", background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.3)", borderRadius: 8, color: "#3db89e", fontFamily: "var(--font-cinzel)", fontSize: 12, textAlign: "center", textDecoration: "none" }}>WhatsApp</a>
          </div>
        </div>

        {/* QR */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div ref={qrRef} style={{ display: "inline-block", background: "#fff", padding: 16, borderRadius: 12 }}>
            <QRCodeCanvas value={link} size={160} bgColor="#ffffff" fgColor="#0a0812" />
          </div>
          <div><button onClick={descargarQR} style={{ marginTop: 8, background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 8, padding: "8px 16px", color: "#e8a84c", fontSize: 12, cursor: "pointer" }}>Descargar QR</button></div>
        </div>

        {/* Locales */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 10, color: "rgba(240,234,214,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Locales captados</p>
          {data.locales?.length === 0 && <p style={{ fontSize: 13, color: "rgba(240,234,214,0.3)" }}>Aún no has captado locales</p>}
          {data.locales?.map((l: D) => (
            <div key={l.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 10, padding: "12px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: "#f0ead6", fontSize: 13 }}>{l.nombre}</span>
                <span style={{ fontSize: 11, color: "rgba(240,234,214,0.3)", marginLeft: 8 }}>{fmtDate(l.createdAt)}</span>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {l.concursos?.length > 0 && <span style={{ fontSize: 10, color: "#3db89e", background: "rgba(61,184,158,0.1)", padding: "2px 6px", borderRadius: 6 }}>Con concurso ✓</span>}
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, color: "#e8a84c" }}>${fmt(10000 + (l.concursos?.length > 0 ? 5000 : 0))}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pagos */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 10, color: "rgba(240,234,214,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Historial de pagos</p>
          {data.pagos?.length === 0 && <p style={{ fontSize: 13, color: "rgba(240,234,214,0.3)" }}>Sin pagos registrados</p>}
          {data.pagos?.map((p: D, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.08)", borderRadius: 8, padding: "10px 12px", marginBottom: 4 }}>
              <span style={{ color: "rgba(240,234,214,0.5)", fontSize: 12 }}>{fmtDate(p.createdAt)}{p.referencia ? ` · ${p.referencia}` : ""}</span>
              <span style={{ color: "#3db89e", fontSize: 13, fontFamily: "var(--font-cinzel)" }}>${fmt(p.monto)}</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <button onClick={logout} style={{ width: "100%", padding: 12, background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 10, color: "#ff6b6b", fontFamily: "var(--font-cinzel)", fontSize: 12, textTransform: "uppercase", cursor: "pointer" }}>Cerrar sesión</button>
      </div>
    </div>
  );
}

const GUION = `Hola, soy de DeseoComer, una plataforma gastronómica nueva en Santiago donde la gente busca dónde comer. Registrar tu local es gratis y apareces en la plataforma de inmediato. Lo más potente es que puedes publicar concursos — tus clientes y personas nuevas invitan a sus amigos a ganar un premio, y tú consigues visibilidad con el nombre de tu local siendo visto por muchas personas nuevas sin pagar publicidad. Es gratis, toma 5 minutos, y mientras más temprano te registres mejor posicionado quedas porque recién estamos creciendo.`;

const OBJECIONES = [
  { q: "¿Cuánto cuesta?", a: "Es completamente gratis. Siempre." },
  { q: "¿Para qué me sirve?", a: "Para que más gente te encuentre cuando busca dónde comer en tu comuna." },
  { q: "No tengo tiempo.", a: "Te registro yo mismo ahora, solo necesito tu nombre, correo y teléfono. En 5 minutos listo." },
  { q: "Ya tengo Instagram.", a: "Acá la gente está buscando activamente dónde comer, no scrolleando. Es más directo para conseguir clientes nuevos." },
  { q: "¿Qué es un concurso?", a: "Tú decides el premio. La gente participa e invita amigos. Te genera visibilidad gratis sin invertir nada." },
];

function TipsCaptar() {
  const [copiado, setCopiado] = useState(false);
  const copiar = () => { navigator.clipboard.writeText(GUION); setCopiado(true); setTimeout(() => setCopiado(false), 2000); };

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ background: "rgba(232,168,76,0.08)", borderBottom: "1px solid rgba(232,168,76,0.1)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>💡</span>
        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700, color: "#e8a84c", textTransform: "uppercase", letterSpacing: "0.04em" }}>Cómo convencer a un local</span>
      </div>
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 9, color: "rgba(240,234,214,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Di esto cuando entres al local:</p>
        <div style={{ background: "rgba(10,8,18,0.5)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ fontSize: 13, color: "rgba(240,234,214,0.7)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>&ldquo;{GUION}&rdquo;</p>
        </div>
        <button onClick={copiar} style={{ background: "transparent", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "rgba(240,234,214,0.4)", cursor: "pointer", marginTop: 8 }}>
          {copiado ? "✓ Copiado" : "Copiar guión"}
        </button>

        <div style={{ height: 1, background: "rgba(232,168,76,0.08)", margin: "14px 0" }} />

        <p style={{ fontSize: 9, color: "rgba(240,234,214,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Si te ponen objeciones:</p>
        {OBJECIONES.map((o, i) => (
          <div key={o.q} style={{ marginBottom: i < OBJECIONES.length - 1 ? 10 : 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(240,234,214,0.5)", marginBottom: 3 }}>{o.q}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#e8a84c", fontSize: 12, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 12, color: "rgba(240,234,214,0.6)", lineHeight: 1.4 }}>{o.a}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
