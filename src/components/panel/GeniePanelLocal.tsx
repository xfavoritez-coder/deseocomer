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

const SHOWN_KEY = "genio_panel_shown";

function getShown(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(SHOWN_KEY) ?? "{}"); } catch { return {}; }
}

function markShown(id: string) {
  try { const s = getShown(); s[id] = true; localStorage.setItem(SHOWN_KEY, JSON.stringify(s)); } catch {}
}

function wasShown(id: string): boolean {
  return !!getShown()[id];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMensajeContextual(path: string, local: any): MensajeGenio | null {
  const tieneConcursos = (local?._count?.concursos ?? 0) > 0;
  const tienePromociones = (local?._count?.promociones ?? 0) > 0;
  const tienePortada = !!local?.portadaUrl;
  const tieneLogo = !!local?.logoUrl;

  // Check for finished contests without confirmed delivery
  const concursos = local?.concursos ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalizadoSinEntrega = concursos.find((c: any) => {
    if (!c.activo) return false;
    const ended = new Date(c.fechaFin) <= new Date();
    const participantes = c._count?.participantes ?? c.participantes?.length ?? 0;
    return ended && participantes > 0;
  });

  // PRIORITY: Finished contest needs winner confirmation
  if (finalizadoSinEntrega) {
    const id = `concurso_finalizado_${finalizadoSinEntrega.id}`;
    if (!wasShown(id)) {
      return { id, tipo: "alerta", texto: `🧞 Tu concurso "${finalizadoSinEntrega.premio}" ha finalizado. Confirma la entrega del premio al ganador.`, accion: { label: "Ver concurso", href: "/panel/concursos" } };
    }
  }

  // DASHBOARD
  if (path === "/panel" || path === "/panel/" || path === "/panel/dashboard") {
    if (!tieneLogo && !wasShown("falta_logo")) return { id: "falta_logo", tipo: "onboarding", texto: "🧞 Agrega tu logo para que los clientes te reconozcan en el explorador", accion: { label: "Subir logo", href: "/panel/mi-local" } };
    if (!tienePortada && !wasShown("falta_portada")) return { id: "falta_portada", tipo: "onboarding", texto: "🧞 Una buena foto de portada es lo primero que ven los clientes. Los locales con foto reciben 3x más clics", accion: { label: "Subir portada", href: "/panel/mi-local" } };
    if (!tieneConcursos && !wasShown("primer_concurso")) return { id: "primer_concurso", tipo: "sugerencia", texto: "🧞 ¿Sabías que un concurso puede traerte decenas de clientes nuevos en días? Prueba regalar algo pequeño", accion: { label: "Crear concurso", href: "/panel/concursos" } };
    if (tieneConcursos && !tienePromociones && !wasShown("primera_promocion")) return { id: "primera_promocion", tipo: "sugerencia", texto: "🧞 Ya tienes concursos. Las promociones son el siguiente paso para fidelizar clientes", accion: { label: "Crear promoción", href: "/panel/promociones" } };
  }

  // MI LOCAL
  if (path === "/panel/mi-local") {
    if (!tienePortada && !wasShown("tip_portada")) return { id: "tip_portada", tipo: "onboarding", texto: "🧞 Una buena foto de portada es lo primero que ven los clientes" };
    if (!tieneLogo && !wasShown("tip_logo")) return { id: "tip_logo", tipo: "onboarding", texto: "🧞 Agrega tu logo para que los clientes te reconozcan" };
  }

  // CONCURSOS
  if (path === "/panel/concursos") {
    if (!tieneConcursos && !wasShown("tip_concursos")) return { id: "tip_concursos", tipo: "onboarding", texto: "🧞 Un concurso funciona así: tus clientes comparten tu local para ganar puntos. Tú ganas visibilidad gratis" };
  }

  // PROMOCIONES
  if (path === "/panel/promociones") {
    if (!tienePromociones && !wasShown("tip_promociones")) return { id: "tip_promociones", tipo: "onboarding", texto: "🧞 Un happy hour publicado aquí llega a miles de personas que buscan dónde ir hoy" };
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

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_local_session") || "{}");
      if (!session.id) return;
      fetch(`/api/locales/${session.id}`).then(r => r.json()).then(d => setDatosLocal(d)).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!datosLocal) return;
    const msg = getMensajeContextual(pathname, datosLocal);
    if (!msg) return;

    const timer = setTimeout(() => {
      setMensaje(msg);
      setGloboVisible(true);
      markShown(msg.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [pathname, datosLocal]);

  const localId = datosLocal?.slug || datosLocal?.id || "";

  const tipoColor = (t: string) => t === "logro" ? "var(--oasis-bright)" : t === "alerta" ? "#ff8080" : "var(--accent)";

  return (
    <>
      <button onClick={() => { setVisible(!visible); setGloboVisible(false); }} style={{ position: "fixed", bottom: "24px", right: "24px", width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 1000, fontSize: "1.6rem", border: "2px solid rgba(245,208,128,0.5)", boxShadow: mensaje ? "0 0 0 3px rgba(232,168,76,0.4), 0 8px 24px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.4)", animation: mensaje && !visible ? "genio-pulse 2s ease-in-out infinite" : "none" }}>
        {visible ? "✕" : "🧞"}
        {mensaje && !visible && !globoVisible && (
          <div style={{ position: "absolute", top: "2px", right: "2px", width: "12px", height: "12px", borderRadius: "50%", background: "#ff4444", border: "2px solid var(--bg-primary)" }} />
        )}
      </button>

      {globoVisible && mensaje && !visible && (
        <div style={{ position: "fixed", bottom: "88px", right: "24px", width: "min(300px, calc(100vw - 48px))", background: "rgba(13,7,3,0.97)", border: `1px solid ${tipoColor(mensaje.tipo)}60`, borderRadius: "16px", padding: "16px", zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", animation: "genio-toast-in 0.3s ease both" }}>
          <button onClick={() => setGloboVisible(false)} style={{ position: "absolute", top: "8px", right: "10px", background: "none", border: "none", color: "rgba(245,208,128,0.4)", fontSize: "0.85rem", cursor: "pointer" }}>✕</button>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.875rem", color: "rgba(245,208,128,0.9)", lineHeight: 1.5, margin: "0 0 12px", paddingRight: "16px" }}>{mensaje.texto}</p>
          {mensaje.accion && (
            <Link href={mensaje.accion.href} onClick={() => setGloboVisible(false)} style={{ display: "inline-block", padding: "8px 16px", background: "rgba(232,168,76,0.15)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "20px", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.1em", color: "var(--accent)", textDecoration: "none" }}>
              {mensaje.accion.label} →
            </Link>
          )}
          <div style={{ position: "absolute", bottom: "-8px", right: "22px", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `8px solid ${tipoColor(mensaje.tipo)}60` }} />
        </div>
      )}

      {visible && (
        <div style={{ position: "fixed", bottom: "88px", right: "24px", width: "min(320px, calc(100vw - 48px))", background: "rgba(10,8,18,0.98)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "20px", zIndex: 999, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", animation: "genio-toast-in 0.3s ease both" }}>
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

          <div style={{ padding: "12px 20px 16px", borderTop: "1px solid rgba(232,168,76,0.08)" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.2em", color: "var(--color-label, rgba(240,234,214,0.4))", textTransform: "uppercase", margin: "0 0 10px" }}>Accesos rápidos</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { icon: "🏆", label: "Crear concurso", href: "/panel/concursos" },
                { icon: "⚡", label: "Nueva promoción", href: "/panel/promociones" },
                { icon: "🏠", label: "Datos de local", href: "/panel/mi-local" },
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
      `}</style>
    </>
  );
}
