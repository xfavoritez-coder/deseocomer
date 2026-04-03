"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useGenie, type LocalRecomendado } from "@/contexts/GenieContext";

const OCASIONES = ["Almuerzo solo", "Con amigos", "Cena romántica", "Antojo rápido", "Para llevar"];

const COMUNAS = [
  "Providencia", "Santiago Centro", "Ñuñoa", "Las Condes", "Vitacura", "San Miguel", "Maipú",
  "La Florida", "Pudahuel", "Peñalolén", "Macul", "La Reina", "Lo Barnechea", "Huechuraba",
  "Recoleta", "Independencia", "Estación Central", "Cerrillos", "Cerro Navia", "Conchalí",
  "El Bosque", "La Cisterna", "La Granja", "La Pintana", "Lo Espejo", "Lo Prado", "Quilicura",
  "Quinta Normal", "Renca", "San Bernardo", "San Joaquín", "San Ramón", "Padre Hurtado",
  "Melipilla", "Talagante", "Puente Alto", "Pirque", "Bellavista",
];

// COMUNAS_CON_COBERTURA se obtiene dinámicamente del context

const CATEGORIAS = [
  { emoji: "🍕", label: "Pizza" }, { emoji: "🍣", label: "Sushi" },
  { emoji: "🍔", label: "Hamburguesa" }, { emoji: "🌮", label: "Mexicano" },
  { emoji: "🥗", label: "Saludable" }, { emoji: "🍝", label: "Pastas" },
  { emoji: "🐔", label: "Pollo" }, { emoji: "🎲", label: "Sorpréndeme" },
];

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
  return `En ${comuna} encontramos esto para ti 🧞`;
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
    if (h >= 20) return ["Cena en casa", "Antojo nocturno", "Para la familia"];
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
  const { setIsOpen, addInteraccion, getRecomendacion, isLoggedIn, userName, sessionCount, comunasConLocales } = useGenie();
  const COMUNAS_CON_COBERTURA = useMemo(() => comunasConLocales, [comunasConLocales]);

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
  const shownIds = useRef<string[]>([]);

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
    setStepActual(COMUNAS_CON_COBERTURA.includes(c) ? 3 : "sin_cobertura");
  };

  const handleCategoria = (c: string) => {
    setCategoria(c);
    addInteraccion("categoria_seleccionada", { categoria: c });
    shownIds.current = [];
    const rec = getRecomendacion(c === "Sorpréndeme" ? undefined : c, comuna || undefined, [], modalidad);
    if (rec) {
      shownIds.current.push(rec.id);
      setResultado(rec);
      setStepActual(4);
    } else {
      setStepActual("sin_resultados");
    }
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
                {["Comer en el local", "Delivery a domicilio", "Retiro en local"].map(m => <button key={m} onClick={() => { setModalidad(m); addInteraccion("modalidad_seleccionada", { modalidad: m }); setStepActual(1); }} style={CHIP}>{m}</button>)}
              </div>
            </div>
          )}

          {/* Step 1: Ocasión */}
          {stepActual === 1 && (
            <div>
              <button onClick={() => setStepActual(0)} style={VOLVER}>← Volver</button>
              <p style={PREGUNTA}>{isLoggedIn && userName ? `Hola ${userName} ✨ ¿Qué deseas hoy?` : getSaludo()}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {getOcasiones(modalidad).map(o => <button key={o} onClick={() => handleOcasion(o)} style={CHIP}>{o}</button>)}
              </div>
            </div>
          )}

          {/* Step 2: Comuna */}
          {stepActual === 2 && (
            <div>
              <button onClick={() => setStepActual(1)} style={VOLVER}>← Volver</button>
              <p style={PREGUNTA}>{modalidad === "Delivery a domicilio" ? "¿A qué comuna quieres que te llegue?" : modalidad === "Retiro en local" ? "¿Desde qué zona vas a retirar?" : "¿En qué zona de Santiago?"}</p>
              <input type="text" placeholder="🔍 Buscar comuna..." value={busquedaComuna} onChange={e => setBusquedaComuna(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--accent)", fontFamily: "var(--font-lato)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" as const, marginBottom: "10px" }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                {COMUNAS.filter(c => c.toLowerCase().includes(busquedaComuna.toLowerCase())).map(c => (
                  <button key={c} onClick={() => handleComuna(c)} style={{ background: COMUNAS_CON_COBERTURA.includes(c) ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.04)", border: COMUNAS_CON_COBERTURA.includes(c) ? "1px solid rgba(232,168,76,0.25)" : "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: COMUNAS_CON_COBERTURA.includes(c) ? "rgba(245,208,128,0.85)" : "rgba(245,208,128,0.45)" }}>
                    {c}{COMUNAS_CON_COBERTURA.includes(c) && <span style={{ marginLeft: "4px", fontSize: "0.72rem", color: "#3db89e" }}>●</span>}
                  </button>
                ))}
              </div>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(245,208,128,0.3)", marginTop: "8px" }}>● Disponible en DeseoComer</p>
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
          {stepActual === "sin_resultados" && (
            <div>
              <button onClick={() => setStepActual(3)} style={VOLVER}>← Volver</button>
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🧞</div>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: "8px", lineHeight: 1.4 }}>
                  Aún no tenemos {categoria.toLowerCase()} en {comuna}
                </p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(245,208,128,0.5)", marginBottom: "16px", lineHeight: 1.5 }}>
                  Estamos creciendo. ¿Probamos con otra categoría o buscamos en otra zona?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button onClick={() => setStepActual(3)} style={{ padding: "10px", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(245,208,128,0.85)", cursor: "pointer" }}>Cambiar categoría</button>
                  <button onClick={() => { setStepActual(2); setComuna(""); }} style={{ padding: "10px", background: "transparent", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(245,208,128,0.45)", cursor: "pointer" }}>Buscar en otra zona</button>
                </div>
              </div>
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
                <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "13px", color: "rgba(240,234,214,0.65)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>{r.nombre}</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: "12px 16px" }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "15px", fontWeight: 700, color: "#f5d080", textTransform: "uppercase", marginBottom: "4px" }}>{r.nombre}</p>
              <div style={{ display: "flex", gap: "6px", fontSize: "13px", marginBottom: "12px", alignItems: "center" }}>
                <span style={{ color: "rgba(240,234,214,0.4)" }}>{r.comuna}</span>
                <span style={{ color: "rgba(240,234,214,0.18)" }}>·</span>
                <span style={{ color: "#3db89e" }}>{r.categoria}</span>
                {r.rating > 0 && (<><span style={{ color: "rgba(240,234,214,0.18)" }}>·</span><span style={{ color: "#e8a84c", fontWeight: 600 }}>★ {r.rating.toFixed ? r.rating.toFixed(1) : r.rating}</span></>)}
              </div>

              {/* Extras: promo + concurso */}
              {(promoActiva || concursoActivo) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  {promoActiva && (
                    <Link href={`/promociones/${promoActiva.id}`} onClick={() => setIsOpen(false)} style={{ background: "rgba(61,184,158,0.08)", border: "1px solid rgba(61,184,158,0.22)", borderRadius: "8px", padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
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
                <Link href={`/locales/${r.id}`} onClick={() => setIsOpen(false)} style={{ flex: 1, padding: "11px", background: "#e8a84c", border: "none", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "14px", fontWeight: 700, color: "#0a0812", letterSpacing: "0.04em", textTransform: "uppercase", textDecoration: "none", textAlign: "center" }}>Ver local →</Link>
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
