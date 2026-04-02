"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import GeniePanelLocal from "@/components/panel/GeniePanelLocal";

const PANEL_KEY = "deseocomer_local_auth";
const SESSION_KEY = "deseocomer_local_session";

const NAV = [
  { icon: "📊", label: "Dashboard", href: "/panel" },
  { icon: "🏠", label: "Datos de Local", href: "/panel/mi-local" },
  { icon: "👤", label: "Datos Personales", href: "/panel/datos-personales" },
  { icon: "🏆", label: "Concursos", href: "/panel/concursos" },
  { icon: "⚡", label: "Promociones", href: "/panel/promociones" },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [montado, setMontado] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [localName, setLocalName] = useState("");
  const [localId, setLocalId] = useState("");
  const [localSlug, setLocalSlug] = useState("");
  const [localLogo, setLocalLogo] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [localComuna, setLocalComuna] = useState("");
  const [faltantes, setFaltantes] = useState<string[]>([]);

  useEffect(() => {
    setMontado(true);
    try {
      // Check sessionStorage first, then localStorage
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      const localData = localStorage.getItem(SESSION_KEY);
      const raw = sessionData || localData;
      if (raw) {
        const data = JSON.parse(raw);
        if (data.loggedIn) {
          setAuthorized(true);
          setLocalName(data.nombre ?? "");
          setLocalId(data.id ?? "");
          setLocalSlug(data.slug ?? "");
          setLocalLogo(data.logoUrl ?? "");
          if (!sessionData) sessionStorage.setItem(SESSION_KEY, raw);
          // Fetch fresh data (logo, comuna)
          if (data.id) {
            fetch(`/api/locales/${data.id}`).then(r => r.ok ? r.json() : null).then(info => {
              if (info) {
                setLocalLogo(info.logoUrl ?? "");
                setLocalComuna(info.comuna ?? info.ciudad ?? "");
                // Check completeness
                const missing: string[] = [];
                if (!info.ciudad) missing.push("Ciudad");
                if (!info.comuna) missing.push("Comuna");
                if (!info.direccion) missing.push("Dirección");
                if (!info.categoria) missing.push("Categoría");
                const hrs = info.horarios as { activo: boolean }[] | null;
                if (!hrs || !Array.isArray(hrs) || !hrs.some(h => h.activo)) missing.push("Horario");
                setFaltantes(missing);
                if (info.slug && !data.slug) {
                  data.slug = info.slug;
                  setLocalSlug(info.slug);
                  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
                  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
                }
              }
            }).catch(() => {});
          }
          return;
        }
      }
    } catch {}
    router.replace("/login-local");
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("deseocomer_local_session");
    localStorage.removeItem("deseocomer_session");
    localStorage.removeItem("deseocomer_user_birthday");
    router.push("/login-local");
  };

  if (!montado || !authorized) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", letterSpacing: "0.2em", color: "var(--accent)", opacity: 0.6 }}>🧞 Cargando...</div>
      </div>
    );
  }

  const isActive = (href: string) => href === "/panel" ? pathname === "/panel" || pathname === "/panel/dashboard" : pathname.startsWith(href);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Mobile top bar */}
      <div className="dc-panel-mobilebar">
        <Link href="/panel" style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.9rem", color: "var(--accent)", textDecoration: "none" }}>🏮 DeseoComer</Link>
        <button onClick={() => setMobileMenu(o => !o)} style={{ background: "none", border: "1px solid var(--border-color)", borderRadius: "8px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: "1.1rem", cursor: "pointer" }}>{mobileMenu ? "✕" : "☰"}</button>
      </div>
      {mobileMenu && (<>
        <div onClick={() => setMobileMenu(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998 }} />
        <div className="dc-panel-mobilemenu">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} onClick={() => setMobileMenu(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", textDecoration: "none", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: isActive(n.href) ? "var(--accent)" : "var(--text-muted)", background: isActive(n.href) ? "rgba(232,168,76,0.1)" : "transparent", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
          <a href={localSlug ? `/locales/${localSlug}` : localId ? `/locales/${localId}` : "/locales"} target="_blank" rel="noopener" onClick={() => setMobileMenu(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", textDecoration: "none", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "var(--text-muted)", borderBottom: "1px solid rgba(232,168,76,0.06)" }}>
            <span>👁️</span> Ver mi local
          </a>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", width: "100%", textAlign: "left", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#ff8080", background: "none", border: "none", cursor: "pointer" }}>
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </>)}

      {/* Desktop Sidebar */}
      <aside className="dc-panel-sidebar">
        <Link href="/" style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem", color: "var(--accent)", textDecoration: "none", display: "block", padding: "24px 20px 12px" }}>
          🏮 DeseoComer
        </Link>

        {/* Local profile card */}
        <div style={{ padding: "0 20px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
            background: localLogo ? "transparent" : "linear-gradient(135deg, rgba(232,168,76,0.25), rgba(232,168,76,0.1))",
            border: "2px solid rgba(232,168,76,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {localLogo ? (
              <img src={localLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <span style={{ fontSize: "1.1rem" }}>🏪</span>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {localName || "Mi Local"}
            </p>
            {localComuna && (
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {localComuna}
              </p>
            )}
          </div>
        </div>

        <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderBottom: "1px solid rgba(232,168,76,0.1)", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.1em", color: "var(--text-muted)", textDecoration: "none", textTransform: "uppercase", opacity: 0.7 }}>
          ← Ver DeseoComer
        </a>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "12px 20px", textDecoration: "none",
              fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", letterSpacing: "0.08em",
              color: isActive(n.href) ? "var(--accent)" : "var(--text-muted)",
              background: isActive(n.href) ? "rgba(232,168,76,0.12)" : "transparent",
              borderLeft: isActive(n.href) ? "3px solid var(--accent)" : "3px solid transparent",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "1rem" }}>{n.icon}</span> {n.label}
            </Link>
          ))}
          <a href={localSlug ? `/locales/${localSlug}` : localId ? `/locales/${localId}` : "/locales"} target="_blank" rel="noopener" style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 20px", textDecoration: "none",
            fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", letterSpacing: "0.08em",
            color: "var(--text-muted)",
          }}>
            <span style={{ fontSize: "1rem" }}>👁️</span> Ver mi local
          </a>
        </nav>

        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "16px 20px", width: "100%", textAlign: "left",
          fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.08em",
          color: "#ff8080", background: "none", border: "none",
          borderTop: "1px solid rgba(232,168,76,0.1)", cursor: "pointer",
        }}>
          🚪 Cerrar sesión
        </button>
      </aside>

      {/* Main content */}
      <main className="dc-panel-main">
        {faltantes.length > 0 && (
          <div style={{ background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "14px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ fontSize: "1.3rem", flexShrink: 0, marginTop: "2px" }}>⚠️</span>
            <div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.8rem", color: "var(--accent)", fontWeight: 700, marginBottom: "6px" }}>Tu local aún no está visible en DeseoComer</p>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "8px" }}>Completa los siguientes datos para activar tu local en la plataforma:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {faltantes.map(f => <span key={f} style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.25)", borderRadius: "6px", padding: "3px 10px", color: "#ff8080" }}>{f}</span>)}
              </div>
              <Link href="/panel/mi-local" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.1em", color: "var(--accent)", textDecoration: "underline" }}>Ir a Datos de Local →</Link>
            </div>
          </div>
        )}
        {children}
      </main>

      <GeniePanelLocal />

      <style>{`
        .dc-panel-sidebar {
          width: 240px; flex-shrink: 0;
          background: rgba(13,7,3,0.98);
          border-right: 1px solid rgba(232,168,76,0.15);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
        }
        .dc-panel-main {
          flex: 1; margin-left: 240px; padding: 32px 40px; min-height: 100vh;
        }
        .dc-panel-mobilebar {
          display: none; position: fixed; top: 0; left: 0; right: 0; z-index: 999;
          padding: 14px 20px; background: color-mix(in srgb, var(--bg-primary) 97%, black);
          border-bottom: 1px solid var(--border-color);
          justify-content: space-between; align-items: center;
        }
        .dc-panel-mobilemenu {
          position: fixed; top: 68px; right: 0; width: min(300px, 80vw); bottom: 0;
          background: rgba(13,7,3,0.98); border-left: 1px solid rgba(232,168,76,0.15);
          z-index: 999; overflow-y: auto; animation: dcDrawerIn 0.2s ease;
        }
        @keyframes dcDrawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media (max-width: 767px) {
          .dc-panel-mobilebar { display: flex; }
          .dc-panel-sidebar { display: none; }
          .dc-panel-main { margin-left: 0; padding: 80px 16px 32px; }
        }
      `}</style>
    </div>
  );
}
