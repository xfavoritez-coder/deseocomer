"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CitySelector from "@/components/CitySelector";

const NAV_LINKS = [
  { label: "Concursos",   href: "/concursos"   },
  { label: "Promociones", href: "/promociones" },
  { label: "Locales",     href: "/locales"     },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const initials = user?.nombre
    ? user.nombre.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const displayName = user?.nombre?.split(" ")[0] ?? "";

  return (
    <>
      <nav className={`dc-nav${scrolled ? " dc-nav--scrolled" : ""}`}>
        <Link href="/" className="dc-nav-logo">🏮 DeseoComer</Link>

        {/* Desktop links */}
        <div className="dc-nav-links">
          <CitySelector />

          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className="dc-nav-link">{label}</Link>
          ))}

          <Link href="/solo-locales" className="dc-nav-local-link">¿Tienes un local?</Link>

          {/* Auth: show user or "Entrar" */}
          {mounted && (
            isAuthenticated && user ? (
              <div className="dc-nav-user">
                <Link href="/perfil" className="dc-nav-avatar" title={user.nombre} style={{ textDecoration: "none" }}>{initials}</Link>
                <Link href="/perfil" className="dc-nav-username" style={{ textDecoration: "none" }}>{displayName}</Link>
                {user.type === "local" && (
                  <Link href="/panel/dashboard" className="dc-nav-panel">Panel</Link>
                )}
                <button onClick={logout} className="dc-nav-logout">Salir</button>
              </div>
            ) : (
              <Link href="/login" className="dc-nav-cta">Entrar</Link>
            )
          )}
        </div>

        {/* Hamburger */}
        <button
          className="dc-hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Backdrop */}
      {menuOpen && (
        <div className="dc-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      {/* Mobile slide-down menu */}
      <div
        className={`dc-mobile-menu${menuOpen ? " dc-mobile-menu--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        {/* 1. Navigation links */}
        {NAV_LINKS.map(({ label, href }) => (
          <Link key={label} href={href} className="dc-mobile-link" onClick={() => setMenuOpen(false)}
            style={{ padding: "20px 28px", fontSize: "1.05rem" }}>
            {label}
          </Link>
        ))}

        {/* Separator */}
        <div style={{ height: "1px", background: "rgba(232,168,76,0.1)", margin: "4px 0" }} />

        {/* Auth */}
        {mounted && (
          isAuthenticated && user ? (
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(232,168,76,0.08)", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "#1a0e05", fontWeight: 700, flexShrink: 0 }}>
                  {user.nombre?.charAt(0).toUpperCase() ?? "U"}
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--accent)", margin: "0 0 2px", fontWeight: 600 }}>{user.nombre?.split(" ")[0]}</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Miembro de DeseoComer</p>
                </div>
              </div>
              {[
                { href: "/perfil", icon: "👤", label: "Mi perfil" },
                { href: "/perfil", icon: "❤️", label: "Mis favoritos" },
                { href: "/perfil", icon: "🏆", label: "Mis concursos" },
              ].map(item => (
                <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "rgba(245,208,128,0.9)", textDecoration: "none", borderBottom: "1px solid rgba(232,168,76,0.05)" }}>
                  <span style={{ fontSize: "1rem", width: "20px" }}>{item.icon}</span>{item.label}
                </Link>
              ))}
              <button onClick={() => { logout(); setMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", background: "none", border: "none", fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "#ff6b6b", cursor: "pointer", width: "100%", textAlign: "left", marginTop: "4px" }}>
                <span style={{ fontSize: "1rem", width: "20px" }}>🚪</span>Cerrar sesión
              </button>
            </div>
          ) : (
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "10px" }}>Únete gratis o inicia sesión</p>
              <Link href="/login" onClick={() => setMenuOpen(false)} style={{ display: "block", margin: "0 20px", padding: "16px 20px", background: "var(--accent)", borderRadius: "12px", fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--bg-primary)", textDecoration: "none", textAlign: "center", fontWeight: 700 }}>
                Entrar
              </Link>
            </div>
          )
        )}

        {/* Local link */}
        <Link href="/solo-locales" onClick={() => setMenuOpen(false)} style={{ display: "block", margin: "12px 20px 24px", padding: "16px 20px", background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.35)", borderRadius: "14px", fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", letterSpacing: "0.06em", color: "var(--accent)", textDecoration: "none", textAlign: "center", fontWeight: 600 }}>
          <span style={{ textDecoration: "underline" }}>¿Tienes un local?</span>{" →"}
        </Link>
      </div>

      <style>{`
        .dc-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 20px 60px;
          display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(to bottom, rgba(0,0,0,0.3), transparent);
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        .dc-nav--scrolled {
          background: color-mix(in srgb, var(--bg-primary) 97%, black);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-color);
        }
        .dc-nav-logo {
          font-family: var(--font-cinzel-decorative); font-size: 1.1rem;
          color: #e8a84c; text-decoration: none;
          letter-spacing: 0.08em;
          flex-shrink: 0;
          cursor: pointer;
          position: relative;
          z-index: 2;
        }
        .dc-nav-links {
          display: flex; gap: 32px; align-items: center;
        }
        .dc-nav-link {
          font-family: var(--font-cinzel); font-size: 0.75rem;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--text-primary); text-decoration: none; white-space: nowrap;
          font-weight: 500;
        }
        .dc-nav-cta {
          font-family: var(--font-cinzel); font-size: 0.75rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          background: linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright));
          color: var(--bg-primary); padding: 10px 24px; border-radius: 30px;
          text-decoration: none; font-weight: 700; white-space: nowrap;
          min-height: 40px; display: inline-flex; align-items: center;
        }

        /* Auth user area */
        .dc-nav-user {
          display: flex; align-items: center; gap: 10px;
        }
        .dc-nav-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: color-mix(in srgb, var(--accent) 25%, var(--bg-secondary));
          border: 1px solid var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-cinzel); font-size: 0.65rem;
          font-weight: 700; color: var(--accent);
          flex-shrink: 0;
        }
        .dc-nav-avatar--lg { width: 40px; height: 40px; font-size: 0.75rem; }
        .dc-nav-username {
          font-family: var(--font-cinzel); font-size: 0.7rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-primary); white-space: nowrap;
        }
        .dc-nav-panel {
          font-family: var(--font-cinzel); font-size: 0.65rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--oasis-bright); text-decoration: none;
          padding: 6px 12px; border-radius: 20px;
          border: 1px solid rgba(61,184,158,0.35);
          white-space: nowrap;
        }
        .dc-nav-logout {
          font-family: var(--font-cinzel); font-size: 0.65rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          background: none; border: 1px solid var(--border-color);
          color: var(--text-muted); padding: 6px 14px;
          border-radius: 20px; cursor: pointer; white-space: nowrap;
          transition: border-color 0.2s, color 0.2s;
        }
        .dc-nav-logout:hover { border-color: #ff6b6b; color: #ff6b6b; }
        .dc-nav-local-link {
          font-family: var(--font-cinzel); font-size: 0.7rem;
          color: var(--accent); text-decoration: none;
          white-space: nowrap; transition: all 0.2s;
          background: rgba(232,168,76,0.12);
          border: 1px solid rgba(232,168,76,0.35);
          border-radius: 20px; padding: 8px 16px;
          font-weight: 600;
        }
        .dc-nav-local-link:hover {
          background: rgba(232,168,76,0.22);
          border-color: rgba(232,168,76,0.6);
        }

        /* Hamburger button */
        .dc-hamburger {
          display: none;
          width: 44px; height: 44px;
          background: none; border: 1px solid var(--border-color);
          border-radius: 10px; cursor: pointer; padding: 0;
          align-items: center; justify-content: center;
          color: var(--accent); font-size: 1.25rem; line-height: 1;
          flex-shrink: 0;
        }

        /* Dark backdrop */
        .dc-backdrop {
          position: fixed; inset: 0; z-index: 98;
          background: rgba(0,0,0,0.5);
        }

        /* Mobile menu panel */
        .dc-mobile-menu {
          display: none;
          position: fixed; top: 64px; left: 0; right: 0; z-index: 99;
          background: rgba(13,7,3,0.98) !important;
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(232,168,76,0.15);
          padding: 8px 24px 28px;
          flex-direction: column;
          opacity: 0; transform: translateY(-8px);
          pointer-events: none;
          transition: opacity 200ms ease, transform 200ms ease;
        }
        .dc-mobile-menu--open {
          opacity: 1; transform: translateY(0);
          pointer-events: auto;
        }
        .dc-mobile-link {
          font-family: var(--font-cinzel); font-size: 0.9rem;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(245,208,128,0.9) !important; text-decoration: none;
          padding: 16px 4px; border-bottom: 1px solid rgba(232,168,76,0.15) !important;
          display: flex; align-items: center; min-height: 52px;
          font-weight: 500;
        }
        .dc-mobile-cta {
          font-family: var(--font-cinzel); font-size: 0.85rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          background: linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright));
          color: var(--bg-primary); border-radius: 30px;
          text-decoration: none; font-weight: 700; text-align: center;
          margin-top: 16px; display: flex;
          align-items: center; justify-content: center; min-height: 52px;
        }

        /* Mobile user info */
        .dc-mobile-user-info {
          display: flex; align-items: center; gap: 14px;
          padding: 16px 4px; border-bottom: 1px solid rgba(232,168,76,0.15) !important;
        }
        .dc-mobile-user-name {
          font-family: var(--font-cinzel); font-size: 0.8rem;
          letter-spacing: 0.08em; color: rgba(245,208,128,0.9) !important; font-weight: 600;
        }
        .dc-mobile-user-email {
          font-family: var(--font-lato); font-size: 0.75rem;
          color: rgba(245,208,128,0.5) !important; margin-top: 2px;
        }
        .dc-mobile-logout {
          font-family: var(--font-cinzel); font-size: 0.8rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          background: none; border: 1px solid rgba(255,80,80,0.3);
          color: #ff8080; padding: 14px 4px;
          border-radius: 0; cursor: pointer;
          text-align: left; margin-top: 4px;
          min-height: 52px; width: 100%;
        }

        @media (max-width: 767px) {
          .dc-nav { padding: 14px 20px; }
          .dc-nav-links { display: none; }
          .dc-hamburger { display: flex; }
          .dc-mobile-menu { display: flex; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-nav { padding: 18px 32px; }
          .dc-nav-links { gap: 16px; }
          .dc-nav-link { font-size: 0.7rem; }
          .dc-nav-username { display: none; }
        }
      `}</style>
    </>
  );
}
