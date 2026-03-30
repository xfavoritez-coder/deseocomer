"use client";
import { useState, useEffect } from "react";
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

const COMUNAS_CON_COBERTURA = [
  "Providencia", "Santiago Centro", "Ñuñoa", "Las Condes", "Vitacura",
  "San Miguel", "Maipú", "Bellavista", "La Reina", "Lo Barnechea",
];

const CATEGORIAS = [
  { emoji: "🍕", label: "Pizza" }, { emoji: "🍣", label: "Sushi" },
  { emoji: "🍔", label: "Hamburguesa" }, { emoji: "🌮", label: "Mexicano" },
  { emoji: "🥗", label: "Saludable" }, { emoji: "🍝", label: "Pastas" },
  { emoji: "🐔", label: "Pollo" }, { emoji: "🎲", label: "Sorpréndeme" },
];

function getSaludo(): string {
  const h = new Date().getHours();
  if (h >= 7 && h < 12) return "Buenos días ✨ ¿Para qué ocasión busco?";
  if (h >= 12 && h < 16) return "Hora de almorzar 🌞 ¿Qué buscas?";
  if (h >= 16 && h < 20) return "Buenas tardes 🌅 ¿Qué se te antoja?";
  if (h >= 20) return "Buenas noches 🌙 ¿Para qué ocasión?";
  return "Trasnochado/a 🌟 ¿Qué necesitas?";
}

function getRazon(local: LocalRecomendado, categoria?: string, comuna?: string): string {
  if (local.descuento > 0) return `tiene ${local.descuento}% de descuento hoy`;
  if (categoria && local.categoria === categoria.toLowerCase()) return "es justo lo que buscas";
  if (comuna && local.comuna.toLowerCase() === comuna.toLowerCase()) return "está en tu zona";
  return "es uno de los más valorados en Santiago";
}

const VOLVER: React.CSSProperties = { background: "none", border: "none", fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(245,208,128,0.4)", cursor: "pointer", padding: "0 0 10px", textTransform: "uppercase", display: "block" };
const PREGUNTA: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "rgba(245,208,128,0.9)", marginBottom: "14px", lineHeight: 1.5 };
const CHIP: React.CSSProperties = { background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "20px", padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(245,208,128,0.85)" };

export default function GeniePanel() {
  const { setIsOpen, addInteraccion, getRecomendacion, isLoggedIn, userName, sessionCount } = useGenie();

  const [stepActual, setStepActual] = useState<number | string>(1);
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
    setResultado(getRecomendacion(c === "Sorpréndeme" ? undefined : c, comuna || undefined));
    setStepActual(4);
  };

  const handleOtra = () => { setResultado(getRecomendacion(categoria === "Sorpréndeme" ? undefined : categoria, comuna || undefined)); };

  return (
    <div style={{ position: "fixed", bottom: "calc(80px + 56px + 12px)", right: "16px", width: "min(320px, 90vw)", maxHeight: "70vh", overflowY: "auto", background: "rgba(13,7,3,0.98)", border: "1px solid rgba(232,168,76,0.35)", borderRadius: "20px", boxShadow: "0 0 40px rgba(0,0,0,0.7), 0 0 20px rgba(232,168,76,0.1)", zIndex: 950, animation: "genieSlideUp 0.3s ease both", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem", color: "var(--sand-gold, #e8a84c)" }}>🧞 El Genio</p>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "rgba(245,208,128,0.5)", fontSize: "1.2rem", cursor: "pointer", padding: "4px" }}>✕</button>
      </div>

      {/* Step 1: Ocasión */}
      {stepActual === 1 && (
        <div>
          <p style={PREGUNTA}>{isLoggedIn && userName ? `Hola ${userName} ✨ ¿Qué deseas hoy?` : getSaludo()}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {OCASIONES.map(o => <button key={o} onClick={() => handleOcasion(o)} style={CHIP}>{o}</button>)}
          </div>
        </div>
      )}

      {/* Step 2: Comuna con buscador */}
      {stepActual === 2 && (
        <div>
          <button onClick={() => setStepActual(1)} style={VOLVER}>← Volver</button>
          <p style={PREGUNTA}>¿En qué zona de Santiago?</p>
          <input type="text" placeholder="🔍 Buscar comuna..." value={busquedaComuna} onChange={e => setBusquedaComuna(e.target.value)} autoFocus
            style={{ width: "100%", padding: "10px 14px", background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "var(--accent)", fontFamily: "var(--font-lato)", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" as const, marginBottom: "10px" }}
            onFocus={e => { e.target.style.borderColor = "var(--accent)"; }} onBlur={e => { e.target.style.borderColor = "rgba(232,168,76,0.2)"; }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
            {COMUNAS.filter(c => c.toLowerCase().includes(busquedaComuna.toLowerCase())).map(c => (
              <button key={c} onClick={() => handleComuna(c)} style={{ background: COMUNAS_CON_COBERTURA.includes(c) ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.04)", border: COMUNAS_CON_COBERTURA.includes(c) ? "1px solid rgba(232,168,76,0.25)" : "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: COMUNAS_CON_COBERTURA.includes(c) ? "rgba(245,208,128,0.85)" : "rgba(245,208,128,0.45)" }}>
                {c}{COMUNAS_CON_COBERTURA.includes(c) && <span style={{ marginLeft: "4px", fontSize: "0.6rem", color: "#3db89e" }}>●</span>}
              </button>
            ))}
            {COMUNAS.filter(c => c.toLowerCase().includes(busquedaComuna.toLowerCase())).length === 0 && (
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(245,208,128,0.4)", padding: "8px 0", width: "100%", textAlign: "center" }}>No encontramos &quot;{busquedaComuna}&quot; aún</p>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.65rem", color: "rgba(245,208,128,0.3)", marginTop: "8px" }}>● Disponible en DeseoComer</p>
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
                const session = JSON.parse(localStorage.getItem("deseocomer_session") || "{}");
                await fetch("/api/lista-espera-comuna", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailSinCobertura, nombre: nombreSinCobertura || null, comuna, usuarioId: session.id || null }) }).catch(() => {});
                setEmailGuardado(true);
              }} disabled={!emailSinCobertura.includes("@")} style={{ width: "100%", padding: "10px", background: emailSinCobertura.includes("@") ? "var(--accent)" : "rgba(232,168,76,0.2)", border: "none", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" as const, color: emailSinCobertura.includes("@") ? "#1a0e05" : "rgba(245,208,128,0.4)", fontWeight: 700, cursor: emailSinCobertura.includes("@") ? "pointer" : "default" }}>
                Avisarme cuando lleguen →
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✨</div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: "6px" }}>¡Anotado{nombreSinCobertura ? `, ${nombreSinCobertura.split(" ")[0]}` : ""}!</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(245,208,128,0.5)", marginBottom: "16px", lineHeight: 1.5 }}>Te avisaremos cuando lleguemos a {comuna} 🧞</p>
              <button onClick={() => { setEmailGuardado(false); setEmailSinCobertura(""); setNombreSinCobertura(""); setStepActual(2); }} style={{ padding: "8px 16px", background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "20px", fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(245,208,128,0.85)", cursor: "pointer" }}>← Buscar en otra zona</button>
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

      {/* Step 4: Resultado */}
      {stepActual === 4 && resultado && (
        <div>
          <button onClick={() => setStepActual(3)} style={VOLVER}>← Volver</button>
          <div style={{ background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "14px", padding: "16px", marginBottom: "12px" }}>
            <div style={{ width: "100%", height: "100px", borderRadius: "10px", background: "linear-gradient(135deg, rgba(45,26,8,0.8), rgba(13,7,3,0.6))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", marginBottom: "12px" }}>
              {resultado.categoria === "sushi" ? "🍣" : resultado.categoria === "pizza" ? "🍕" : resultado.categoria === "hamburguesa" ? "🍔" : resultado.categoria === "mexicano" ? "🌮" : resultado.categoria === "saludable" ? "🥗" : resultado.categoria === "pastas" ? "🍝" : resultado.categoria === "pollo" ? "🐔" : "🍽️"}
            </div>
            <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem", color: "var(--sand-gold, #e8a84c)", marginBottom: "4px" }}>{resultado.nombre}</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(245,208,128,0.5)", marginBottom: "8px" }}>{resultado.categoria} · {resultado.comuna} · ⭐ {resultado.rating}{resultado.descuento > 0 && ` · ${resultado.descuento}% OFF`}</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(245,208,128,0.8)", lineHeight: 1.6 }}>Te recomiendo <strong style={{ color: "var(--sand-gold, #e8a84c)" }}>{resultado.nombre}</strong> porque {getRazon(resultado, categoria, comuna)}.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
            <a href={`/locales/${resultado.id}`} style={{ width: "100%", textAlign: "center", padding: "10px 16px", minHeight: "44px", boxSizing: "border-box" as const, background: "var(--oasis-teal, #2a7a6f)", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>Ver local</a>
            <button onClick={handleOtra} style={{ width: "100%", padding: "10px 16px", minHeight: "44px", boxSizing: "border-box" as const, background: "transparent", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,208,128,0.7)" }}>Dame otra opción</button>
          </div>
          {showRegCta && !isLoggedIn && (
            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(232,168,76,0.15)", textAlign: "center", animation: "genieSlideUp 0.4s ease both" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "8px" }}>🧞</p>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "rgba(245,208,128,0.9)", marginBottom: "6px" }}>Quiero recordarte para la próxima vez</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(245,208,128,0.5)", marginBottom: "12px", lineHeight: 1.5 }}>{sessionCount >= 3 ? `Llevas ${sessionCount} visitas explorando. ¿Te quedas? 🧞` : "Si te registras, aprendo más de ti y mis recomendaciones mejoran con el tiempo"}</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <Link href="/registro" onClick={() => setIsOpen(false)} style={{ flex: 1, textAlign: "center", padding: "10px 12px", minHeight: "40px", boxSizing: "border-box" as const, background: "var(--sand-gold, #e8a84c)", borderRadius: "10px", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#1a0e05", textDecoration: "none", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>Registrarme gratis</Link>
                <button onClick={() => { setShowRegCta(false); setRegDismissed(true); sessionStorage.setItem("genio_registro_descartado", "true"); }} style={{ flex: 1, padding: "10px 12px", minHeight: "40px", boxSizing: "border-box" as const, background: "transparent", border: "1px solid rgba(232,168,76,0.25)", borderRadius: "10px", cursor: "pointer", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,208,128,0.5)" }}>Ahora no</button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes genieSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
