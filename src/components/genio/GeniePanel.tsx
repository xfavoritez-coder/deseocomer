"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useGenie, type LocalRecomendado } from "@/contexts/GenieContext";
import { CATEGORIAS as CATEGORIAS_MASTER, CATEGORIA_EMOJI } from "@/lib/categorias";

const OCASIONES = ["Almuerzo solo", "Con amigos", "Cena romántica", "Antojo rápido", "Para llevar"];

import { COMUNAS_MAESTRAS } from "@/lib/comunas";
const COMUNAS = [...COMUNAS_MAESTRAS];

// Frases del genio por ocasión
const FRASES: Record<string, Record<string, string>> = {
  "Almuerzo solo": { pizza: "Para tu almuerzo solo en {comuna}, este no falla 👌", sushi: "Sushi para un almuerzo tranquilo en {comuna} 🍣", hamburguesa: "Una burger para almorzar solo en {comuna}, buena elección 🍔", _default: "Para tu almuerzo en {comuna}, encontramos esto 👌" },
  "Con amigos": { pizza: "¿Pizza con amigos en {comuna}? Mira este lugar 🍕", sushi: "Sushi con los amigos en {comuna}, este es buena opción 🍣", hamburguesa: "Burgers con amigos en {comuna}, aquí la pasan bien 🍔", _default: "Para salir con amigos en {comuna}, este lugar pinta bien 🔥" },
  "Cena romántica": { _default: "Para una cena romántica en {comuna}, este es buena opción ✨" },
  "Antojo rápido": { _default: "Antojo rápido en {comuna}, aquí lo encuentras 🔥" },
  "Para llevar": { _default: "Para llevar en {comuna}, este tiene buenas referencias 👍" },
};

function getFrase(ocasion: string, categoria: string, comuna: string): string {
  const cat = categoria.toLowerCase();
  const oFrases = FRASES[ocasion];
  if (cat === "sorpréndeme" || cat === "sorprendeme") return `No sabías que lo necesitabas, pero aquí está 😄`;
  if (oFrases) {
    const frase = oFrases[cat] || oFrases._default;
    if (frase) return frase.replace("{comuna}", comuna);
  }
  return `En ${comuna} encontramos esto para ti 👌`;
}

function getOcasiones(mod: string): string[] {
  const h = new Date().getHours();
  if (mod === "Comer en el local") {
    if (h >= 7 && h < 12) return ["Desayuno", "Brunch", "Café de mañana"];
    if (h >= 12 && h < 16) return ["Almuerzo solo", "Con amigos", "Reunión de trabajo", "Antojo rápido"];
    if (h >= 16 && h < 20) return ["Once", "Café de tarde", "Antojo rápido"];
    if (h >= 20) return ["Cena romántica", "Con amigos", "Cena en familia", "Antojo nocturno"];
    return ["Antojo nocturno"];
  }
  if (mod === "Delivery a domicilio") {
    if (h >= 7 && h < 12) return ["Desayuno a domicilio", "Brunch en casa"];
    if (h >= 12 && h < 16) return ["Almuerzo", "Para la oficina", "Reunión de trabajo"];
    if (h >= 16 && h < 20) return ["Once en casa", "Antojo de tarde"];
    if (h >= 20) return ["Cena romántica en casa", "Cena en pareja", "Cena en casa", "Antojo nocturno", "Para la familia"];
    return ["Antojo nocturno"];
  }
  if (mod === "Retiro en local") {
    if (h >= 7 && h < 12) return ["Desayuno", "Café de mañana"];
    if (h >= 12 && h < 16) return ["Almuerzo", "Antojo rápido", "Para llevar"];
    if (h >= 16 && h < 20) return ["Once para llevar", "Antojo rápido"];
    if (h >= 20) return ["Cena para llevar", "Antojo nocturno"];
    return ["Antojo nocturno"];
  }
  return ["Almuerzo", "Con amigos", "Antojo rápido"];
}

function getSaludo(): string {
  const h = new Date().getHours();
  if (h >= 7 && h < 12) return "Buenos días ✨ ¿Para qué ocasión busco?";
  if (h >= 12 && h < 16) return "Hora de almorzar 🌞 ¿Qué buscas?";
  if (h >= 16 && h < 20) return "Buenas tardes 🌅 ¿Qué se te antoja?";
  if (h >= 20) return "Buenas noches 🌙 ¿Para qué ocasión?";
  return "Trasnochado/a 🌟 ¿Qué necesitas?";
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

const VOLVER: React.CSSProperties = { background: "none", border: "none", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(245,208,128,0.4)", cursor: "pointer", padding: "0 0 10px", textTransform: "uppercase", display: "block" };
const PREGUNTA: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "rgba(245,208,128,0.9)", marginBottom: "14px", lineHeight: 1.5 };
const CHIP: React.CSSProperties = { background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "20px", padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(245,208,128,0.85)" };

export default function GeniePanel() {
  const { setIsOpen, addInteraccion, getRecomendacion, isLoggedIn, userName, sessionCount, comunasConLocales, comunasDelivery, quickRec, setQuickRec } = useGenie();
  const COMUNAS_CON_COBERTURA = useMemo(() => comunasConLocales, [comunasConLocales]);
  const COMUNAS_DELIVERY = useMemo(() => comunasDelivery, [comunasDelivery]);

  const [stepActual, setStepActual] = useState<number | string>(0);
  const [modalidad, setModalidad] = useState("");
  const [ocasion, setOcasion] = useState("");
  const [comuna, setComuna] = useState("");
  const [categoria, setCategoria] = useState("");
  const [resultado, setResultado] = useState<LocalRecomendado | null>(null);
  const [showRegCta, setShowRegCta] = useState(false);
  const [regDismissed, setRegDismissed] = useState(false);
  const [busquedaComuna, setBusquedaComuna] = useState("");
  const [emailSinCobertura, setEmailSinCobertura] = useState("");
  const [nombreSinCobertura, setNombreSinCobertura] = useState("");
  const [emailGuardado, setEmailGuardado] = useState(false);
  const [emailSinResultados, setEmailSinResultados] = useState("");
  const [nombreSinResultados, setNombreSinResultados] = useState("");
  const [sinResultadosGuardado, setSinResultadosGuardado] = useState(false);
  const [sinResultadosLoading, setSinResultadosLoading] = useState(false);
  const CATEGORIAS = useMemo(() => {
    const all = CATEGORIAS_MASTER.map(c => ({ emoji: CATEGORIA_EMOJI[c] ?? "🍽️", label: c }));

    // Excluir por estilo alimentario
    let session: { estiloAlimentario?: string; comidasFavoritas?: string[] } = {};
    try { session = JSON.parse(localStorage.getItem("deseocomer_session") ?? "{}"); } catch {}
    const estilo = session.estiloAlimentario ?? "";
    const excluir = estilo === "vegano" ? ["Pollo", "Carnes / Parrilla", "Mariscos", "Vegano"]
      : estilo === "vegetariano" ? ["Pollo", "Carnes / Parrilla", "Vegetariano"] : [];
    const filtered = all.filter(c => !excluir.includes(c.label));

    // Scores: favoritas del registro + historial del genio + hora
    const favoritas = new Set(session.comidasFavoritas ?? []);
    let perfil: { gustos?: { categorias?: Record<string, number> } } = {};
    try { perfil = JSON.parse(localStorage.getItem("deseocomer_genio_perfil") ?? "{}"); } catch {}
    const historial = perfil.gustos?.categorias ?? {};

    const h = new Date().getHours();
    const horaPref: Record<string, number> = {};
    if (h >= 7 && h < 12) { horaPref["Café"] = 3; horaPref["Brunch"] = 2; horaPref["Saludable"] = 1; }
    else if (h >= 12 && h < 16) { horaPref["Hamburguesa"] = 1; horaPref["Sushi"] = 1; horaPref["Pizza"] = 1; }
    else if (h >= 16 && h < 20) { horaPref["Café"] = 2; horaPref["Postres"] = 2; }
    else { horaPref["Pizza"] = 1; horaPref["Sushi"] = 1; horaPref["Ramen"] = 2; }

    const scored = filtered.map(c => {
      let score = 0;
      if (favoritas.has(c.label)) score += 10;
      score += (historial[c.label.toLowerCase()] ?? 0) * 2;
      score += horaPref[c.label] ?? 0;
      return { ...c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return [...scored, { emoji: "🎲", label: "Sorpréndeme", score: 0 }];
  }, []);
  const shownIds = useRef<string[]>([]);

  // Quick recommendation from toast "Muéstrame"
  useEffect(() => {
    if (quickRec) {
      setResultado(quickRec);
      setCategoria(quickRec.categorias?.[0] ?? "");
      setComuna(quickRec.comuna ?? "");
      shownIds.current = [quickRec.id];
      setStepActual(4);
      setQuickRec(null);
    }
  }, [quickRec, setQuickRec]);

  useEffect(() => {
    if (stepActual !== 4 || isLoggedIn || regDismissed) return;
    const dismissed = sessionStorage.getItem("genio_registro_descartado");
    if (dismissed) { setRegDismissed(true); return; }
    const t = setTimeout(() => setShowRegCta(true), 2000);
    return () => clearTimeout(t);
  }, [stepActual, isLoggedIn, regDismissed]);

  const handleOcasion = (o: string) => { setOcasion(o); addInteraccion("ocasion_seleccionada", { ocasion: o }); setStepActual(2); };

  const handleComuna = (c: string) => {
    setComuna(c);
    addInteraccion("comuna_seleccionada", { comuna: c });
    setBusquedaComuna("");
    const cobertura = modalidad === "Delivery a domicilio" ? COMUNAS_DELIVERY : COMUNAS_CON_COBERTURA;
    setStepActual(cobertura.some(x => x.toLowerCase() === c.toLowerCase()) ? 3 : "sin_cobertura");
  };

  const handleCategoria = async (c: string) => {
    setCategoria(c);
    addInteraccion("categoria_seleccionada", { categoria: c });
    shownIds.current = [];
    // Try from cache first
    let rec = getRecomendacion(c === "Sorpréndeme" ? undefined : c, comuna || undefined, [], modalidad);
    if (rec) {
      shownIds.current.push(rec.id);
      setResultado(rec);
      setStepActual(4);
      return;
    }
    // Fetch from API and retry
    setStepActual("buscando");
    try {
      const params = new URLSearchParams();
      if (c && c !== "Sorpréndeme") params.set("categoria", c);
      if (comuna) params.set("comuna", comuna);
      if (modalidad === "Delivery a domicilio") params.set("modalidad", "delivery");
      const res = await fetch(`/api/locales/recomendar?${params}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Pick random from top rated
        const pool = data.filter((l: any) => (l.googleRating ?? 0) >= 4.0);
        const candidates = pool.length >= 3 ? pool : data;
        const pick = candidates[Math.floor(Math.random() * Math.min(5, candidates.length))];
        if (pick) {
          shownIds.current.push(pick.id);
          setResultado(pick);
          setStepActual(4);
          return;
        }
      }
    } catch {}
    setStepActual("sin_resultados");
  };

  const handleOtra = () => {
    const rec = getRecomendacion(categoria === "Sorpréndeme" ? undefined : categoria, comuna || undefined, shownIds.current, modalidad);
    if (rec) {
      shownIds.current.push(rec.id);
      setResultado(rec);
    } else {
      setStepActual("sin_resultados");
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "calc(24px + 56px + 12px)", right: "16px", width: "min(320px, 90vw)", maxHeight: "70vh", overflowY: "auto", background: "rgba(13,7,3,0.98)", border: "1px solid rgba(232,168,76,0.35)", borderRadius: "20px", boxShadow: "0 0 40px rgba(0,0,0,0.7), 0 0 20px rgba(232,168,76,0.1)", zIndex: 950, animation: "genieSlideUp 0.3s ease both", padding: stepActual === 4 ? "0" : "20px" }}>

      {/* Steps 1-3 wrapper */}
      {stepActual !== 4 && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem", color: "var(--sand-gold, #e8a84c)" }}>🧞 El Genio</p>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "rgba(245,208,128,0.5)", fontSize: "1.2rem", cursor: "pointer", padding: "4px" }}>✕</button>
          </div>

          {/* Step 0: Modalidad */}
          {stepActual === 0 && (
            <div>
              <p style={PREGUNTA}>{isLoggedIn && userName ? `Hola ${userName} ✨ ¿Cómo quieres comer hoy?` : "¿Cómo quieres comer hoy? 🧞"}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["Comer en el local", "Delivery a domicilio", "Retiro en local"].map(m => <button key={m} onClick={() => { setModalidad(m); addInteraccion("modalidad_seleccionada", { modalidad: m }); setStepActual(2); }} style={CHIP}>{m}</button>)}
              </div>
            </div>
          )}

          {/* Step 2: Comuna */}
          {stepActual === 2 && (
            <div>
              <button onClick={() => setStepActual(0)} style={VOLVER}>← Volver</button>
              <p style={PREGUNTA}>{modalidad === "Delivery a domicilio" ? "¿A qué comuna quieres que te llegue?" : modalidad === "Retiro en local" ? "¿Desde qué zona vas a retirar?" : "¿En qué zona estás?"}</p>
              <input type="text" placeholder="🔍 Buscar comuna..." value={busquedaComuna} onChange={e => setBusquedaComuna(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--accent)", fontFamily: "var(--font-lato)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" as const, marginBottom: "10px" }} />
              {(() => {
                const cobertura = modalidad === "Delivery a domicilio" ? COMUNAS_DELIVERY : COMUNAS_CON_COBERTURA;
                const coberturaLower = cobertura.map(c => c.toLowerCase());
                const filtered = COMUNAS.filter(c => c.toLowerCase().includes(busquedaComuna.toLowerCase()));
                const activas = filtered.filter(c => coberturaLower.includes(c.toLowerCase())).sort((a, b) => a.localeCompare(b));
                const noActivas = filtered.filter(c => !coberturaLower.includes(c.toLowerCase())).sort((a, b) => a.localeCompare(b));
                return (
                  <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                    {activas.length > 0 && (
                      <>
                        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.68rem", color: "#3db89e", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>{modalidad === "Delivery a domicilio" ? "Delivery disponible" : "Disponibles"}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                          {activas.map(c => (
                            <button key={c} onClick={() => handleComuna(c)} style={{ background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "20px", padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(245,208,128,0.85)" }}>
                              {c}<span style={{ marginLeft: "4px", fontSize: "0.72rem", color: "#3db89e" }}>●</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {noActivas.length > 0 && (
                      <>
                        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.68rem", color: "rgba(245,208,128,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Aún no disponibles</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          {noActivas.map(c => (
                            <button key={c} onClick={() => handleComuna(c)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(245,208,128,0.35)" }}>
                              {c}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(245,208,128,0.3)", marginTop: "8px" }}>● {modalidad === "Delivery a domicilio" ? "Delivery disponible" : "Disponible en DeseoComer"}</p>
            </div>
          )}

          {/* Step sin_cobertura */}
          {stepActual === "sin_cobertura" && (
            <div>
              <button onClick={() => { setEmailGuardado(false); setEmailSinCobertura(""); setNombreSinCobertura(""); setStepActual(2); }} style={VOLVER}>← Volver</button>
              {!emailGuardado ? (
                <>
                  <p style={{ ...PREGUNTA, marginBottom: "8px" }}>🧞 Aún no llegamos a {comuna}</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(245,208,128,0.5)", marginBottom: "16px", lineHeight: 1.5 }}>Estamos creciendo rápido. Déjanos tu nombre y email y te avisamos cuando tengamos algo en {comuna} 🙌</p>
                  <input type="text" placeholder="Tu nombre" value={nombreSinCobertura} onChange={e => setNombreSinCobertura(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--accent)", fontFamily: "var(--font-lato)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" as const, marginBottom: "8px" }} />
                  <input type="email" placeholder="tu@email.com" value={emailSinCobertura} onChange={e => setEmailSinCobertura(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--accent)", fontFamily: "var(--font-lato)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" as const, marginBottom: "10px" }} />
                  <button onClick={async () => {
                    if (!emailSinCobertura.includes("@")) return;
                    await fetch("/api/lista-espera-comuna", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailSinCobertura, nombre: nombreSinCobertura || null, comuna }) }).catch(() => {});
                    setEmailGuardado(true);
                  }} disabled={!emailSinCobertura.includes("@")} style={{ width: "100%", padding: "10px", background: emailSinCobertura.includes("@") ? "var(--accent)" : "rgba(232,168,76,0.2)", border: "none", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: emailSinCobertura.includes("@") ? "#1a0e05" : "rgba(245,208,128,0.4)", fontWeight: 700, cursor: emailSinCobertura.includes("@") ? "pointer" : "default" }}>
                    Avisarme cuando lleguen →
                  </button>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✨</div>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: "6px" }}>¡Anotado{nombreSinCobertura ? `, ${nombreSinCobertura.split(" ")[0]}` : ""}!</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(245,208,128,0.5)", marginBottom: "16px", lineHeight: 1.5 }}>Te avisaremos cuando lleguemos a {comuna} 🧞</p>
                  <button onClick={() => { setEmailGuardado(false); setEmailSinCobertura(""); setNombreSinCobertura(""); setStepActual(2); }} style={{ padding: "8px 16px", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "20px", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(245,208,128,0.85)", cursor: "pointer" }}>← Buscar en otra zona</button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Categoría */}
          {stepActual === 3 && (
            <div>
              <button onClick={() => setStepActual(2)} style={VOLVER}>← Volver</button>
              <p style={PREGUNTA}>¿Qué te provoca hoy?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {CATEGORIAS.map(c => <button key={c.label} onClick={() => handleCategoria(c.label)} style={CHIP}>{c.emoji} {c.label}</button>)}
              </div>
            </div>
          )}

          {/* Step sin_resultados */}
          {stepActual === "buscando" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "2rem", marginBottom: "10px", animation: "dc-pulse 1s ease-in-out infinite" }}>🧞</div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "rgba(245,208,128,0.7)" }}>Buscando locales...</p>
              <style>{`@keyframes dc-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>
            </div>
          )}

          {stepActual === "sin_resultados" && (
            <div>
              <button onClick={() => { setSinResultadosGuardado(false); setEmailSinResultados(""); setNombreSinResultados(""); setStepActual(3); }} style={VOLVER}>← Volver</button>
              {!sinResultadosGuardado ? (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🧞</div>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: "8px", lineHeight: 1.4 }}>
                    Aún no tenemos {categoria.toLowerCase()} en {comuna}
                  </p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(245,208,128,0.5)", marginBottom: "16px", lineHeight: 1.5 }}>
                    Estamos sumando locales cada semana. Déjanos tu email y te avisamos cuando haya {categoria.toLowerCase()} en {comuna}, junto con concursos y promociones de tu zona.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                    <input type="text" placeholder="Tu nombre" value={nombreSinResultados} onChange={e => setNombreSinResultados(e.target.value)} style={{ padding: "10px 14px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--accent)", fontFamily: "var(--font-lato)", fontSize: "0.85rem", outline: "none" }} />
                    <input type="email" placeholder="tu@email.com" value={emailSinResultados} onChange={e => setEmailSinResultados(e.target.value)} style={{ padding: "10px 14px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--accent)", fontFamily: "var(--font-lato)", fontSize: "0.85rem", outline: "none" }} />
                    <button
                      disabled={sinResultadosLoading || !emailSinResultados.includes("@")}
                      onClick={async () => {
                        setSinResultadosLoading(true);
                        try {
                          await fetch("/api/lista-espera-comuna", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: emailSinResultados.trim().toLowerCase(), nombre: nombreSinResultados.trim() || null, comuna, categoria }),
                          });
                          setSinResultadosGuardado(true);
                        } catch {}
                        setSinResultadosLoading(false);
                      }}
                      style={{ padding: "12px", background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: 700, color: "#e8a84c", cursor: "pointer", letterSpacing: "0.06em", opacity: emailSinResultados.includes("@") ? 1 : 0.5 }}
                    >
                      {sinResultadosLoading ? "Guardando..." : "🔔 Avísame cuando haya"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setStepActual(3)} style={{ flex: 1, padding: "9px", background: "transparent", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(245,208,128,0.45)", cursor: "pointer" }}>Otra categoría</button>
                    <button onClick={() => { setStepActual(2); setComuna(""); }} style={{ flex: 1, padding: "9px", background: "transparent", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(245,208,128,0.45)", cursor: "pointer" }}>Otra zona</button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "8px 0" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✨</div>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "#3db89e", marginBottom: "6px" }}>¡Listo{nombreSinResultados ? `, ${nombreSinResultados.split(" ")[0]}` : ""}!</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(245,208,128,0.5)", marginBottom: "16px", lineHeight: 1.5 }}>Te avisaremos cuando tengamos {categoria.toLowerCase()} en {comuna}, con concursos y promociones incluidas 🧞</p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => { setSinResultadosGuardado(false); setEmailSinResultados(""); setNombreSinResultados(""); setStepActual(3); }} style={{ flex: 1, padding: "9px", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(245,208,128,0.85)", cursor: "pointer" }}>Buscar otra cosa</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Step 4: RESULTADO - NEW DESIGN */}
      {stepActual === 4 && resultado && (() => {
        const r = resultado;
        const promoActiva = r.promociones?.find(p => p.activa !== false);
        const concursoActivo = r.concursos?.find(c => c.activo !== false && !c.cancelado && new Date(c.fechaFin) > new Date());
        const diasRestantes = concursoActivo ? Math.max(0, Math.ceil((new Date(concursoActivo.fechaFin).getTime() - Date.now()) / 86400000)) : 0;

        return (
          <div style={{ background: "rgba(20,12,35,0.98)", borderRadius: "20px", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid rgba(232,168,76,0.08)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>🧞</span>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "12px", color: "rgba(240,234,214,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, flex: 1 }}>Tu sugerencia está lista</span>
              <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", fontSize: "18px", color: "rgba(240,234,214,0.25)", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
            </div>

            {/* Frase del genio */}
            <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "14px", color: "#f5d080", lineHeight: 1.5, margin: 0 }}>{getFrase(ocasion, categoria, comuna)}</p>
            </div>

            {/* Imagen del local */}
            <div style={{ height: "130px", overflow: "hidden", position: "relative" }}>
              {r.portadaUrl || r.foto ? (
                <img src={(r.portadaUrl || r.foto)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #2d1a08 0%, #1a0e05 40%, #0a0812 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "2.5rem", opacity: 0.2 }}>🍽️</span>
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,8,18,0) 30%, rgba(10,8,18,0.82) 100%)" }} />
              <div style={{ position: "absolute", bottom: "10px", left: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1.5px solid rgba(232,168,76,0.4)", background: r.logoUrl ? "transparent" : "rgba(20,12,35,0.9)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontSize: "11px", fontWeight: 700, color: "#e8a84c" }}>
                  {r.logoUrl ? <img src={r.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getInitials(r.nombre)}
                </div>
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "13px", color: "rgba(245,238,220,0.95)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{r.nombre}</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", gap: "6px", fontSize: "13px", marginBottom: "12px", alignItems: "center" }}>
                <span style={{ color: "rgba(240,234,214,0.4)" }}>{r.comuna}</span>
                <span style={{ color: "rgba(240,234,214,0.18)" }}>·</span>
                <span style={{ color: "#3db89e" }}>{CATEGORIA_EMOJI[r.categorias?.[0] ?? ""] ?? "🍽️"} {r.categorias?.[0] ?? r.categoria}</span>
                {(() => {
                  const ratingMostrar = r.rating > 0 ? r.rating : (r as any).googleRating;
                  const esGoogle = r.rating === 0 && (r as any).googleRating;
                  if (!ratingMostrar) return null;
                  return (<><span style={{ color: "rgba(240,234,214,0.18)" }}>·</span><span style={{ color: "#e8a84c", fontWeight: 600 }}>★ {ratingMostrar.toFixed ? ratingMostrar.toFixed(1) : ratingMostrar}{esGoogle && <span style={{ fontSize: "10px", opacity: 0.5, marginLeft: "2px" }}>G</span>}</span></>);
                })()}
              </div>

              {/* Extras: promo + concurso */}
              {(promoActiva || concursoActivo) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  {promoActiva && (
                    <Link href={`/promociones/${promoActiva.slug || promoActiva.id}`} onClick={() => setIsOpen(false)} style={{ background: "rgba(61,184,158,0.08)", border: "1px solid rgba(61,184,158,0.22)", borderRadius: "8px", padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                      <span style={{ fontSize: "14px" }}>🏷️</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "11px", color: "#3db89e", textTransform: "uppercase", fontWeight: 700, margin: 0 }}>Promoción activa</p>
                        <p style={{ fontFamily: "var(--font-lato)", fontSize: "13px", color: "rgba(240,234,214,0.45)", margin: "2px 0 0" }}>{promoActiva.titulo}</p>
                      </div>
                      <span style={{ color: "rgba(240,234,214,0.2)" }}>→</span>
                    </Link>
                  )}
                  {concursoActivo && (
                    <Link href={`/concursos/${concursoActivo.slug || concursoActivo.id}`} onClick={() => setIsOpen(false)} style={{ background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.18)", borderRadius: "8px", padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
                      <span style={{ fontSize: "14px" }}>🏆</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "11px", color: "#e8a84c", textTransform: "uppercase", fontWeight: 700, margin: 0 }}>Concurso activo</p>
                        <p style={{ fontFamily: "var(--font-lato)", fontSize: "13px", color: "rgba(240,234,214,0.45)", margin: "2px 0 0" }}>Gana {concursoActivo.premio} · {diasRestantes} días restantes</p>
                      </div>
                      <span style={{ color: "rgba(240,234,214,0.2)" }}>→</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <Link href={`/locales/${r.slug || r.id}`} onClick={() => setIsOpen(false)} style={{ flex: 1, padding: "11px", background: "#e8a84c", border: "none", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "14px", fontWeight: 700, color: "#0a0812", letterSpacing: "0.04em", textTransform: "uppercase", textDecoration: "none", textAlign: "center" }}>Ver local</Link>
                <button onClick={handleOtra} style={{ padding: "11px 14px", background: "transparent", border: "1px solid rgba(232,168,76,0.22)", borderRadius: "10px", fontSize: "14px", color: "rgba(240,234,214,0.4)", cursor: "pointer" }}>Otra sugerencia</button>
              </div>

              {/* Reg CTA */}
              {showRegCta && !isLoggedIn && (
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(232,168,76,0.1)", textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(245,208,128,0.5)", marginBottom: "10px", lineHeight: 1.5 }}>{sessionCount >= 3 ? `Llevas ${sessionCount} visitas. ¿Te quedas? 🧞` : "Regístrate y mis recomendaciones mejoran"}</p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link href="/registro" onClick={() => setIsOpen(false)} style={{ flex: 1, textAlign: "center", padding: "9px", background: "#e8a84c", borderRadius: "8px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#1a0e05", textDecoration: "none", fontWeight: 700 }}>Registrarme</Link>
                    <button onClick={() => { setShowRegCta(false); setRegDismissed(true); sessionStorage.setItem("genio_registro_descartado", "true"); }} style={{ flex: 1, padding: "9px", background: "transparent", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", color: "rgba(245,208,128,0.4)", cursor: "pointer" }}>Ahora no</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <style>{`@keyframes genieSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
