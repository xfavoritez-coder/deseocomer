"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { label: "Concursos",   href: "/concursos"   },
  { label: "Promociones", href: "/promociones" },
  { label: "Locales",     href: "/locales"     },
  { label: "El Genio",    href: "/genio"       },
];

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const theme = useTheme();
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
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className="dc-nav-link">{label}</Link>
          ))}

          {mounted && (
            <div className="dc-nav-period">
              <span style={{ fontSize: "0.9rem" }}>{theme.icon}</span>
              <span className="dc-nav-period-label">{theme.label}</span>
            </div>
          )}

          {/* Auth: show user or "Entrar" */}
          {mounted && (
            isAuthenticated && user ? (
              <div className="dc-nav-user">
                <div className="dc-nav-avatar" title={user.nombre}>{initials}</div>
                <span className="dc-nav-username">{displayName}</span>
                {user.type === "local" && (
                  <Link href="/panel/dashboard" className="dc-nav-panel">Panel</Link>
                )}
                <button onClick={logout} className="dc-nav-logout">Salir</button>
              </div>
            ) : (
              <Link href="/registro" className="dc-nav-cta">Entrar</Link>
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
        {NAV_LINKS.map(({ label, href }) => (
          <Link key={label} href={href} className="dc-mobile-link" onClick={() => setMenuOpen(false)}>
            {label}
          </Link>
        ))}

        {mounted && (
          <div className="dc-mobile-period">
            <span style={{ fontSize: "1rem" }}>{theme.icon}</span>
            <span>{theme.label}</span>
          </div>
        )}

        {/* Mobile auth section */}
        {mounted && (
          isAuthenticated && user ? (
            <>
              <div className="dc-mobile-user-info">
                <div className="dc-nav-avatar dc-nav-avatar--lg">{initials}</div>
                <div>
                  <div className="dc-mobile-user-name">{user.nombre}</div>
                  <div className="dc-mobile-user-email">{user.email}</div>
                </div>
              </div>
              {user.type === "local" && (
                <Link href="/panel/dashboard" className="dc-mobile-link" onClick={() => setMenuOpen(false)}>
                  📊 Panel de control
                </Link>
              )}
              <button
                className="dc-mobile-logout"
                onClick={() => { logout(); setMenuOpen(false); }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link href="/registro" className="dc-mobile-cta" onClick={() => setMenuOpen(false)}>
              Entrar
            </Link>
          )
        )}
      </div>

      <style>{`
        .dc-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 20px 60px;
          display: flex; justify-content: space-between; align-items: center;
          transition: background 0.3s ease, border-color 0.3s ease;
        }
        .dc-nav--scrolled {
          background: color-mix(in srgb, var(--bg-primary) 97%, black);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-color);
        }
        .dc-nav-logo {
          font-family: var(--font-cinzel-decorative); font-size: 1.1rem;
          color: var(--accent); text-decoration: none;
          letter-spacing: 0.08em; text-shadow: 0 0 20px var(--accent);
          flex-shrink: 0;
        }
        .dc-nav-links {
          display: flex; gap: 32px; align-items: center;
        }
        .dc-nav-link {
          font-family: var(--font-cinzel); font-size: 0.75rem;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--text-primary); text-decoration: none; white-space: nowrap;
        }
        .dc-nav-period {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 20px;
          background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
          white-space: nowrap;
        }
        .dc-nav-period-label {
          font-family: var(--font-cinzel); font-size: 0.6rem;
          letter-spacing: 0.15em; text-transform: uppercase; color: var(--accent);
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
          background: color-mix(in srgb, var(--bg-primary) 97%, black);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          padding: 8px 24px 28px;
          flex-direction: column;
          opacity: 0; transform: translateY(-8px);
          transition: opacity 200ms ease, transform 200ms ease;
        }
        .dc-mobile-menu--open {
          opacity: 1; transform: translateY(0);
        }
        .dc-mobile-link {
          font-family: var(--font-cinzel); font-size: 0.9rem;
          letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--text-primary); text-decoration: none;
          padding: 16px 4px; border-bottom: 1px solid var(--border-color);
          display: flex; align-items: center; min-height: 52px;
        }
        .dc-mobile-period {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 4px; border-bottom: 1px solid var(--border-color);
          font-family: var(--font-cinzel); font-size: 0.7rem;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent);
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
          padding: 16px 4px; border-bottom: 1px solid var(--border-color);
        }
        .dc-mobile-user-name {
          font-family: var(--font-cinzel); font-size: 0.8rem;
          letter-spacing: 0.08em; color: var(--text-primary); font-weight: 600;
        }
        .dc-mobile-user-email {
          font-family: var(--font-lato); font-size: 0.75rem;
          color: var(--text-muted); margin-top: 2px;
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
