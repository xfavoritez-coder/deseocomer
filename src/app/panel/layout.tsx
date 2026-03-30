"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

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
  const [authorized, setAuthorized] = useState(false);
  const [localName, setLocalName] = useState("");

  useEffect(() => {
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
          // Ensure sessionStorage has session for current tab
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

  if (!authorized) {
    return (
      <div style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "var(--text-muted)" }}>Cargando...</p>
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
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--text-muted)", padding: "0 20px 20px", borderBottom: "1px solid rgba(232,168,76,0.1)" }}>
          {localName || "Mi Local"}
        </p>

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
          <a href="/locales/1" target="_blank" rel="noopener" style={{
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
