"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

const CATEGORIAS = ["Sushi", "Pizza", "Hamburguesa", "Mexicano", "Vegano", "Vegetariano", "Saludable", "Pastas", "Pollo", "Mariscos", "Carnes / Parrilla", "Árabe", "Peruano", "Ramen", "Café", "Postres", "Brunch", "Empanadas", "Poke Bowl"];

interface Concurso {
  id: string; slug: string; premio: string; modalidadConcurso: string; estado: string; local: { nombre: string };
}

const cardS: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: 14, padding: 20, marginBottom: 20 };
const titleS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.95rem", color: "#e8a84c", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 };
const labelS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.55)", marginBottom: 6, display: "block" };
const selectS: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" as const };
const inputS: React.CSSProperties = { ...selectS };
const btnS: React.CSSProperties = { padding: "12px 24px", background: "#e8a84c", color: "#1a0e05", fontFamily: "Georgia", fontSize: "0.85rem", fontWeight: 700, border: "none", borderRadius: 10, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" };
const btnSecS: React.CSSProperties = { ...btnS, background: "transparent", border: "1px solid rgba(232,168,76,0.3)", color: "#e8a84c" };

const checkboxItemS: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "8px 12px", background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(232,168,76,0.12)", borderRadius: 8,
  cursor: "pointer", transition: "border-color 0.2s",
};
const checkboxItemSelS: React.CSSProperties = {
  ...checkboxItemS,
  background: "rgba(232,168,76,0.06)",
  border: "1px solid rgba(232,168,76,0.35)",
};

export default function AdminEmailUsuarios() {
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [toast, setToast] = useState("");

  // Filters
  const [estilosAlimentarios, setEstilosAlimentarios] = useState<string[]>([]);
  const [categoriaFavorita, setCategoriaFavorita] = useState("");
  const [haParticipado, setHaParticipado] = useState<"cualquiera" | "si" | "no">("cualquiera");
  const [telefonoVerificado, setTelefonoVerificado] = useState<"cualquiera" | "si" | "no">("cualquiera");
  const [emailVerificado, setEmailVerificado] = useState<"todos" | "si" | "no">("si");

  // Template
  const [plantilla, setPlantilla] = useState("nuevo_concurso");
  const [concursoId, setConcursoId] = useState("");
  const [concursoIds, setConcursoIds] = useState<string[]>([]);
  const [asuntoCustom, setAsuntoCustom] = useState("");
  const [tituloCustom, setTituloCustom] = useState("");
  const [cuerpoCustom, setCuerpoCustom] = useState("");
  const [ctaTexto, setCtaTexto] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  // State
  const [preview, setPreview] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resultado, setResultado] = useState<{ enviados: number; errores: number; total: number; log: string[] } | null>(null);
  const [pruebaEmail, setPruebaEmail] = useState("");
  const [pruebaEnviando, setPruebaEnviando] = useState(false);

  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  useEffect(() => {
    adminFetch("/api/admin/email-usuarios").then(r => r.json()).then(d => {
      if (d.concursos) setConcursos(d.concursos);
    }).catch(() => {});
  }, []);

  const buildFiltros = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f: any = {};
    if (estilosAlimentarios.length > 0) f.estilosAlimentarios = estilosAlimentarios;
    if (categoriaFavorita) f.categoriaFavorita = categoriaFavorita;
    if (haParticipado === "si") f.haParticipado = true;
    if (haParticipado === "no") f.haParticipado = false;
    if (telefonoVerificado === "si") f.telefonoVerificado = true;
    if (telefonoVerificado === "no") f.telefonoVerificado = false;
    if (emailVerificado === "si") f.emailVerificado = true;
    else if (emailVerificado === "no") f.emailVerificado = false;
    else f.emailVerificado = "todos";
    return f;
  };

  const handlePreview = async () => {
    setLoading(true);
    setPreview(null);
    try {
      const res = await adminFetch("/api/admin/email-usuarios", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview", filtros: buildFiltros() }),
      });
      const d = await res.json();
      setPreview(d.total ?? 0);
    } catch { show("Error de conexión"); }
    setLoading(false);
  };

  const handleSend = async () => {
    if (plantilla === "nuevo_concurso" && !concursoId) { show("Selecciona un concurso"); return; }
    if (plantilla === "nuevos_concursos" && concursoIds.length === 0) { show("Selecciona al menos un concurso"); return; }
    if (plantilla === "concurso_por_terminar" && !concursoId) { show("Selecciona un concurso"); return; }
    if (plantilla === "personalizado" && !asuntoCustom.trim()) { show("Escribe un asunto"); return; }

    setSending(true);
    setResultado(null);
    try {
      const res = await adminFetch("/api/admin/email-usuarios", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send", filtros: buildFiltros(), plantilla,
          concursoId, concursoIds,
          asuntoCustom, tituloCustom, cuerpoCustom, ctaTexto, ctaUrl,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setResultado(d);
        show(`Enviados: ${d.enviados} / ${d.total}`);
      } else show("Error: " + (d.error || "desconocido"));
    } catch { show("Error de conexión"); }
    setSending(false);
  };

  const toggleConcurso = (id: string) => {
    setConcursoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const concursoSel = concursos.find(c => c.id === concursoId || c.slug === concursoId);
  const concursosSel = concursos.filter(c => concursoIds.includes(c.id));

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.4rem", color: "#e8a84c", marginBottom: 24 }}>📨 Email a Usuarios</h1>

      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 999, background: "rgba(232,168,76,0.95)", color: "#1a0e05", padding: "12px 20px", borderRadius: 12, fontFamily: "Georgia", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>{toast}</div>}

      {/* 1. FILTROS */}
      <div style={cardS}>
        <p style={titleS}>1. Audiencia</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelS}>Estilo alimentario {estilosAlimentarios.length > 0 && `(${estilosAlimentarios.length})`}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { value: "como_de_todo", label: "🍽️ Come de todo" },
                { value: "vegetariano", label: "🌱 Vegetariano" },
                { value: "vegano", label: "🌿 Vegano" },
              ].map(opt => {
                const sel2 = estilosAlimentarios.includes(opt.value);
                return (
                  <button key={opt.value} type="button" onClick={() => setEstilosAlimentarios(prev => sel2 ? prev.filter(v => v !== opt.value) : [...prev, opt.value])} style={{ padding: "6px 12px", borderRadius: 8, border: sel2 ? "1px solid rgba(232,168,76,0.4)" : "1px solid rgba(232,168,76,0.15)", background: sel2 ? "rgba(232,168,76,0.12)" : "transparent", color: sel2 ? "#e8a84c" : "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.78rem", cursor: "pointer" }}>{opt.label}</button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelS}>Categoría favorita</label>
            <select value={categoriaFavorita} onChange={e => setCategoriaFavorita(e.target.value)} style={selectS}>
              <option value="">Cualquiera</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={labelS}>Ha participado en concursos</label>
            <select value={haParticipado} onChange={e => setHaParticipado(e.target.value as "cualquiera" | "si" | "no")} style={selectS}>
              <option value="cualquiera">Cualquiera</option>
              <option value="si">Sí ha participado</option>
              <option value="no">Nunca ha participado</option>
            </select>
          </div>

          <div>
            <label style={labelS}>Teléfono verificado</label>
            <select value={telefonoVerificado} onChange={e => setTelefonoVerificado(e.target.value as "cualquiera" | "si" | "no")} style={selectS}>
              <option value="cualquiera">Cualquiera</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label style={labelS}>Email verificado</label>
            <select value={emailVerificado} onChange={e => setEmailVerificado(e.target.value as "todos" | "si" | "no")} style={selectS}>
              <option value="todos">Todos</option>
              <option value="si">Sí (verificados)</option>
              <option value="no">No (sin verificar)</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={handlePreview} disabled={loading} style={btnSecS}>{loading ? "Contando..." : "Ver cuántos usuarios matchean"}</button>
          {preview !== null && (
            <span style={{ fontFamily: "Georgia", fontSize: "1.1rem", color: "#e8a84c", fontWeight: 700 }}>{preview} usuarios</span>
          )}
        </div>
      </div>

      {/* 2. PLANTILLA */}
      <div style={cardS}>
        <p style={titleS}>2. Plantilla de email</p>

        <div style={{ marginBottom: 16 }}>
          <label style={labelS}>Tipo de email</label>
          <select value={plantilla} onChange={e => { setPlantilla(e.target.value); setConcursoId(""); setConcursoIds([]); }} style={selectS}>
            <option value="nuevo_concurso">🏆 Nuevo concurso (1)</option>
            <option value="nuevos_concursos">🏆🏆 Nuevos concursos (varios)</option>
            <option value="concurso_por_terminar">⏰ Concurso por terminar</option>
            <option value="personalizado">✏️ Personalizado</option>
          </select>
        </div>

        {/* Single concurso select */}
        {(plantilla === "nuevo_concurso" || plantilla === "concurso_por_terminar") && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelS}>Seleccionar concurso</label>
            <select value={concursoId} onChange={e => setConcursoId(e.target.value)} style={selectS}>
              <option value="">— Selecciona —</option>
              {concursos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.modalidadConcurso === "sorteo" ? "🎲" : "🏆"} {c.premio} — {c.local.nombre} ({c.estado})
                </option>
              ))}
            </select>
            {concursoSel && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(232,168,76,0.06)", borderRadius: 10, border: "1px solid rgba(232,168,76,0.15)" }}>
                <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.6)", margin: 0 }}>
                  <strong style={{ color: "#f5d080" }}>{concursoSel.premio}</strong> — {concursoSel.local.nombre} — {concursoSel.modalidadConcurso === "sorteo" ? "🎲 Sorteo" : "🏆 Mérito"} — {concursoSel.estado}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Multi concurso select */}
        {plantilla === "nuevos_concursos" && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelS}>Seleccionar concursos ({concursoIds.length} seleccionados)</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {concursos.map(c => {
                const sel = concursoIds.includes(c.id);
                return (
                  <div key={c.id} onClick={() => toggleConcurso(c.id)} style={sel ? checkboxItemSelS : checkboxItemS}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: sel ? "2px solid #e8a84c" : "2px solid rgba(232,168,76,0.25)",
                      background: sel ? "#e8a84c" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {sel && <span style={{ color: "#1a0e05", fontSize: 12, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: sel ? "#f5d080" : "rgba(240,234,214,0.6)" }}>
                      {c.modalidadConcurso === "sorteo" ? "🎲" : "🏆"} {c.premio} — {c.local.nombre} ({c.estado})
                    </span>
                  </div>
                );
              })}
            </div>
            {concursosSel.length > 0 && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(232,168,76,0.06)", borderRadius: 10, border: "1px solid rgba(232,168,76,0.15)" }}>
                <p style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.45)", margin: "0 0 4px" }}>
                  El email mostrara cada concurso con su foto y premio. Usuarios con referidos previos recibiran un mensaje personalizado.
                </p>
                {concursosSel.map(c => (
                  <p key={c.id} style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#f5d080", margin: "2px 0" }}>
                    {c.modalidadConcurso === "sorteo" ? "🎲" : "🏆"} {c.premio} — {c.local.nombre}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {plantilla === "personalizado" && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Asunto del email</label>
              <input value={asuntoCustom} onChange={e => setAsuntoCustom(e.target.value)} placeholder="Ej: Novedades de DeseoComer" style={inputS} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Título (dentro del email)</label>
              <input value={tituloCustom} onChange={e => setTituloCustom(e.target.value)} placeholder="Ej: ¡Tenemos algo para ti!" style={inputS} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelS}>Cuerpo del mensaje</label>
              <textarea value={cuerpoCustom} onChange={e => setCuerpoCustom(e.target.value)} rows={5} placeholder="Escribe tu mensaje aquí..." style={{ ...inputS, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelS}>Texto del botón (opcional)</label>
                <input value={ctaTexto} onChange={e => setCtaTexto(e.target.value)} placeholder="Ej: Ver más →" style={inputS} />
              </div>
              <div>
                <label style={labelS}>URL del botón</label>
                <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://deseocomer.com/..." style={inputS} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. ENVIAR */}
      <div style={cardS}>
        <p style={titleS}>3. Enviar</p>

        {/* Email de prueba */}
        <div style={{ marginBottom: 20, padding: 16, background: "rgba(61,184,158,0.04)", border: "1px solid rgba(61,184,158,0.15)", borderRadius: 12 }}>
          <label style={{ ...labelS, color: "#3db89e" }}>Enviar email de prueba</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={pruebaEmail} onChange={e => setPruebaEmail(e.target.value)} placeholder="tu@email.com" style={{ ...inputS, flex: 1 }} />
            <button onClick={async () => {
              if (!pruebaEmail.includes("@")) { show("Email inválido"); return; }
              setPruebaEnviando(true);
              try {
                const res = await adminFetch("/api/admin/email-usuarios", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "test", emailPrueba: pruebaEmail, plantilla,
                    concursoId, concursoIds,
                    asuntoCustom, tituloCustom, cuerpoCustom, ctaTexto, ctaUrl,
                  }),
                });
                const d = await res.json();
                if (d.ok) show("✓ Email de prueba enviado a " + pruebaEmail);
                else show("Error: " + (d.error || "desconocido"));
              } catch { show("Error de conexión"); }
              setPruebaEnviando(false);
            }} disabled={pruebaEnviando} style={{ ...btnSecS, whiteSpace: "nowrap" }}>{pruebaEnviando ? "Enviando..." : "Enviar prueba"}</button>
          </div>
        </div>

        {preview !== null && preview > 0 && (
          <p style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "rgba(240,234,214,0.6)", marginBottom: 16 }}>
            Se enviará a <strong style={{ color: "#e8a84c" }}>{preview} usuarios</strong>
          </p>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={handleSend} disabled={sending || preview === null || preview === 0} style={{ ...btnS, opacity: sending || preview === null || preview === 0 ? 0.5 : 1 }}>
            {sending ? "Enviando..." : "Enviar emails"}
          </button>
          {sending && <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)" }}>Esto puede tardar unos segundos...</span>}
        </div>

        {resultado && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
              <span style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "#3db89e" }}>✅ {resultado.enviados} enviados</span>
              {resultado.errores > 0 && <span style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "#ff8080" }}>❌ {resultado.errores} errores</span>}
            </div>
            <details>
              <summary style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)", cursor: "pointer" }}>Ver log ({resultado.log.length} entradas)</summary>
              <div style={{ maxHeight: 200, overflow: "auto", marginTop: 8, padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 8 }}>
                {resultado.log.map((l, i) => (
                  <p key={i} style={{ fontFamily: "monospace", fontSize: "0.72rem", color: l.startsWith("✅") ? "#3db89e" : "#ff8080", margin: "2px 0" }}>{l}</p>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
