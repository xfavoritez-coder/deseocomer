"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface MensajeGenio {
  id: string;
  texto: string;
  tipo: "sugerencia" | "alerta" | "logro" | "onboarding";
  accion?: { label: string; href: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calcularPerfil(local: any): number {
  if (!local) return 0;
  let pts = 0;
  if (local.descripcion) pts += 20;
  if (local.logoUrl) pts += 15;
  if (local.galeria?.length > 0) pts += 15;
  if (local.horarios) pts += 20;
  if (local.tieneMenu) pts += 15;
  if ((local._count?.concursos ?? 0) > 0) pts += 15;
  return pts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMensajeContextual(path: string, local: any): MensajeGenio | null {
  const nombre = local?.nombre || "tu local";
  const tieneConcursos = (local?._count?.concursos ?? 0) > 0;
  const tienePromociones = (local?._count?.promociones ?? 0) > 0;
  const perfilCompleto = calcularPerfil(local);
  const tieneLogo = !!local?.logoUrl;
  const tienePortada = !!local?.portadaUrl;
  const tieneFotos = local?.galeria?.length > 0;
  const tieneMenu = local?.tieneMenu && (local?.menuItems?.length ?? 0) > 0;
  const favs = local?._count?.favoritos ?? 0;

  // DASHBOARD
  if (path === "/panel" || path === "/panel/" || path === "/panel/dashboard") {
    if (perfilCompleto < 40) return { id: "onboarding_perfil", tipo: "onboarding", texto: `🧞 ¡Hola! Tu perfil está al ${perfilCompleto}%. Completarlo te ayuda a aparecer mejor en el explorador`, accion: { label: "Completar perfil", href: "/panel/mi-local" } };
    if (!tieneConcursos) return { id: "primer_concurso", tipo: "sugerencia", texto: "🧞 ¿Sabías que un concurso puede traerte decenas de clientes nuevos en días? Prueba regalar algo pequeño", accion: { label: "Crear concurso", href: "/panel/concursos" } };
    if (tieneConcursos && !tienePromociones) return { id: "primera_promocion", tipo: "sugerencia", texto: "🧞 Ya tienes concursos activos. Las promociones son el siguiente paso para fidelizar clientes", accion: { label: "Crear promoción", href: "/panel/promociones" } };
    if (favs > 0) return { id: "favoritos_nuevos", tipo: "logro", texto: `🧞 ¡${favs} ${favs === 1 ? "persona guarda" : "personas guardan"} ${nombre} como favorito! Están esperando tu próxima oferta`, accion: { label: "Crear promoción", href: "/panel/promociones" } };
    if (tieneConcursos && tienePromociones) return { id: "motivacion", tipo: "logro", texto: "🧞 ¡Vas muy bien! Los locales que publican regularmente reciben 5x más visitas", accion: { label: "Nuevo concurso", href: "/panel/concursos" } };
  }

  // MI LOCAL
  if (path === "/panel/mi-local") {
    if (!tienePortada) return { id: "falta_portada", tipo: "onboarding", texto: "🧞 Una buena foto de portada es lo primero que ven los clientes. Los locales con foto reciben 3x más clics" };
    if (!tieneLogo) return { id: "falta_logo", tipo: "onboarding", texto: "🧞 Agrega tu logo para que los clientes te reconozcan fácilmente en el explorador" };
    if (!tieneMenu) return { id: "falta_menu", tipo: "sugerencia", texto: "🧞 Los clientes que ven el menú antes de ir tienen el doble de probabilidad de visitarte" };
    if (!tieneFotos) return { id: "falta_fotos", tipo: "sugerencia", texto: "🧞 Agrega fotos de tus platos. La comida que se ve bien, se pide más" };
  }

  // CONCURSOS
  if (path === "/panel/concursos") {
    if (!tieneConcursos) return { id: "no_concursos", tipo: "onboarding", texto: "🧞 Un concurso funciona así: tus clientes comparten tu local para ganar puntos. Tú ganas visibilidad gratis" };
    return { id: "motivar_concurso", tipo: "sugerencia", texto: "🧞 Los concursos con premios de mayor valor generan más participantes. ¿Qué tal un menú completo para 2?" };
  }

  // PROMOCIONES
  if (path === "/panel/promociones") {
    if (!tienePromociones) return { id: "no_promociones", tipo: "onboarding", texto: "🧞 Un happy hour publicado aquí llega a miles de personas que buscan dónde ir hoy" };
    return { id: "motivar_promo", tipo: "sugerencia", texto: "🧞 Las promociones de fin de semana tienen 2x más views. ¿Tienes algo especial para este viernes?" };
  }

  return null;
}

export default function GeniePanelLocal() {
  const pathname = usePathname();
  const [mensaje, setMensaje] = useState<MensajeGenio | null>(null);
  const [visible, setVisible] = useState(false);
  const [globoVisible, setGloboVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [datosLocal, setDatosLocal] = useState<any>(null);

  // Load local data
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") || "{}");
      if (!session.id) return;
      fetch(`/api/locales/${session.id}`).then(r => r.json()).then(d => setDatosLocal(d)).catch(() => {});
    } catch {}
  }, []);

  // Contextual message per page
  useEffect(() => {
    if (!datosLocal) return;
    const msg = getMensajeContextual(pathname, datosLocal);
    if (!msg) return;

    const key = `genio_panel_${msg.id}_${new Date().toISOString().slice(0, 10)}`;
    try { if (localStorage.getItem(key)) return; } catch {}

    const timer = setTimeout(() => {
      setMensaje(msg);
      setGloboVisible(true);
      try { localStorage.setItem(key, "1"); } catch {}
    }, 3000);
    return () => clearTimeout(timer);
  }, [pathname, datosLocal]);

  const localId = datosLocal?.id || "";

  const tipoLabel = (t: string) => t === "logro" ? "✨ Logro" : t === "alerta" ? "⚠️ Alerta" : t === "onboarding" ? "🧞 Guía" : "💡 Sugerencia";
  const tipoColor = (t: string) => t === "logro" ? "var(--oasis-bright)" : t === "alerta" ? "#ff8080" : "var(--accent)";

  return (
    <>
      {/* Floating bubble */}
      <button onClick={() => { setVisible(!visible); setGloboVisible(false); }} style={{ position: "fixed", bottom: "24px", right: "24px", width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 1000, fontSize: "1.6rem", border: "2px solid rgba(245,208,128,0.5)", boxShadow: mensaje ? "0 0 0 3px rgba(232,168,76,0.4), 0 8px 24px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.4)", animation: mensaje && !visible ? "genio-pulse 2s ease-in-out infinite" : "none" }}>
        {visible ? "✕" : "🧞"}
        {mensaje && !visible && !globoVisible && (
          <div style={{ position: "absolute", top: "2px", right: "2px", width: "12px", height: "12px", borderRadius: "50%", background: "#ff4444", border: "2px solid var(--bg-primary)" }} />
        )}
      </button>

      {/* Auto-popup balloon */}
      {globoVisible && mensaje && !visible && (
        <div style={{ position: "fixed", bottom: "88px", right: "24px", width: "min(300px, calc(100vw - 48px))", background: "rgba(13,7,3,0.97)", border: "1px solid rgba(232,168,76,0.5)", borderRadius: "16px", padding: "16px", zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", animation: "genio-toast-in 0.3s ease both" }}>
          <button onClick={() => setGloboVisible(false)} style={{ position: "absolute", top: "8px", right: "10px", background: "none", border: "none", color: "rgba(245,208,128,0.4)", fontSize: "0.85rem", cursor: "pointer" }}>✕</button>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: tipoColor(mensaje.tipo), margin: "0 0 8px" }}>{tipoLabel(mensaje.tipo)}</p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.875rem", color: "rgba(245,208,128,0.9)", lineHeight: 1.5, margin: "0 0 12px", paddingRight: "16px" }}>{mensaje.texto}</p>
          {mensaje.accion && (
            <Link href={mensaje.accion.href} onClick={() => setGloboVisible(false)} style={{ display: "inline-block", padding: "8px 16px", background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "20px", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--accent)", textDecoration: "none" }}>
              {mensaje.accion.label} →
            </Link>
          )}
          <div style={{ position: "absolute", bottom: "-8px", right: "22px", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "8px solid rgba(232,168,76,0.5)" }} />
        </div>
      )}

      {/* Expanded panel */}
      {visible && (
        <div style={{ position: "fixed", bottom: "88px", right: "24px", width: "min(320px, calc(100vw - 48px))", background: "rgba(10,8,18,0.98)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "20px", zIndex: 999, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", animation: "genio-toast-in 0.3s ease both" }}>
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(232,168,76,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "1.3rem" }}>🧞</span>
              <div>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--accent)", margin: 0 }}>El Genio</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "var(--text-muted)", margin: 0 }}>Tu asistente de DeseoComer</p>
              </div>
            </div>
            <button onClick={() => setVisible(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.9rem", cursor: "pointer" }}>✕</button>
          </div>

          {/* Current message */}
          {mensaje && (
            <div style={{ padding: "16px 20px" }}>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.875rem", color: "rgba(245,208,128,0.9)", lineHeight: 1.6, margin: "0 0 12px" }}>{mensaje.texto}</p>
              {mensaje.accion && (
                <Link href={mensaje.accion.href} onClick={() => setVisible(false)} style={{ display: "block", padding: "12px 16px", background: "var(--accent)", borderRadius: "12px", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.1em", color: "var(--bg-primary)", textDecoration: "none", textAlign: "center", fontWeight: 700 }}>
                  {mensaje.accion.label} →
                </Link>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div style={{ padding: "12px 20px 16px", borderTop: "1px solid rgba(232,168,76,0.08)" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.2em", color: "var(--color-label, rgba(240,234,214,0.4))", textTransform: "uppercase", margin: "0 0 10px" }}>Accesos rápidos</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { icon: "🏆", label: "Crear concurso", href: "/panel/concursos" },
                { icon: "⚡", label: "Nueva promoción", href: "/panel/promociones" },
                { icon: "🏠", label: "Completar perfil", href: "/panel/mi-local" },
                { icon: "👁️", label: "Ver mi local", href: `/locales/${localId}` },
              ].map(item => (
                <Link key={item.label} href={item.href} onClick={() => setVisible(false)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)", textDecoration: "none" }}>
                  <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes genio-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(232,168,76,0.4), 0 8px 24px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(232,168,76,0.2), 0 8px 24px rgba(0,0,0,0.4); }
        }
        @keyframes genio-toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 767px) {
          button[style*="bottom: 24px"][style*="right: 24px"] { bottom: 70px !important; }
        }
      `}</style>
    </>
  );
}
