"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import GeniePanelLocal from "@/components/panel/GeniePanelLocal";

const PANEL_KEY = "deseocomer_local_auth";
const SESSION_KEY = "deseocomer_local_session";

const NAV = [
  { icon: "📊", label: "Dashboard", href: "/panel" },
  { icon: "🏠", label: "Mi Local", href: "/panel/mi-local" },
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
          if (!sessionData) sessionStorage.setItem(SESSION_KEY, raw);
          return;
        }
      }
    } catch {}
    router.replace("/login-local");
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
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
      {/* Desktop Sidebar */}
      <aside className="dc-panel-sidebar">
        <Link href="/" style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem", color: "var(--accent)", textDecoration: "none", display: "block", padding: "24px 20px 8px" }}>
          🏮 DeseoComer
        </Link>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--text-muted)", padding: "0 20px 10px" }}>
          {localName || "Mi Local"}
        </p>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderBottom: "1px solid rgba(232,168,76,0.1)", fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--text-muted)", textDecoration: "none", textTransform: "uppercase", opacity: 0.7 }}>
          ← Ver DeseoComer
        </a>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "12px 20px", textDecoration: "none",
              fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.08em",
              color: isActive(n.href) ? "var(--accent)" : "var(--text-muted)",
              background: isActive(n.href) ? "rgba(232,168,76,0.12)" : "transparent",
              borderLeft: isActive(n.href) ? "3px solid var(--accent)" : "3px solid transparent",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "1rem" }}>{n.icon}</span> {n.label}
            </Link>
          ))}
          <a href={localId ? `/locales/${localId}` : "/locales"} target="_blank" rel="noopener" style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "12px 20px", textDecoration: "none",
            fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.08em",
            color: "var(--text-muted)",
          }}>
            <span style={{ fontSize: "1rem" }}>👁️</span> Ver mi local
          </a>
        </nav>

        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "16px 20px", width: "100%", textAlign: "left",
          fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.08em",
          color: "#ff8080", background: "none", border: "none",
          borderTop: "1px solid rgba(232,168,76,0.1)", cursor: "pointer",
        }}>
          🚪 Cerrar sesión
        </button>
      </aside>

      {/* Main content */}
      <main className="dc-panel-main">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="dc-panel-mobile-nav">
        <a href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", textDecoration: "none", flex: 1, padding: "8px 0", color: "var(--text-muted)", fontSize: "0.6rem", fontFamily: "var(--font-cinzel)", letterSpacing: "0.05em" }}>
          <span style={{ fontSize: "1.2rem" }}>🏮</span>
          Home
        </a>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            textDecoration: "none", flex: 1, padding: "8px 0",
            color: isActive(n.href) ? "var(--accent)" : "var(--text-muted)",
            fontSize: "0.6rem", fontFamily: "var(--font-cinzel)", letterSpacing: "0.05em",
          }}>
            <span style={{ fontSize: "1.2rem" }}>{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>

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
        .dc-panel-mobile-nav { display: none; }
        @media (max-width: 767px) {
          .dc-panel-sidebar { display: none; }
          .dc-panel-main { margin-left: 0; padding: 20px 16px 80px; }
          .dc-panel-mobile-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            background: rgba(13,7,3,0.98); border-top: 1px solid rgba(232,168,76,0.15);
            z-index: 50; padding: 4px 0;
          }
        }
      `}</style>
    </div>
  );
}
