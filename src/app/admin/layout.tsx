"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { icon: "📊", label: "Dashboard", href: "/admin" },
  { icon: "🏠", label: "Locales", href: "/admin/locales" },
  { icon: "👥", label: "Usuarios", href: "/admin/usuarios" },
  { icon: "🏆", label: "Concursos", href: "/admin/concursos" },
  { icon: "📋", label: "Lista Espera", href: "/admin/lista-espera" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") { setOk(true); return; }
    try {
      const s = JSON.parse(sessionStorage.getItem("admin_session") ?? "{}");
      if (!s.loggedIn) router.replace("/admin/login"); else setOk(true);
    } catch { router.replace("/admin/login"); }
  }, [pathname, router]);

  if (!ok) return <div style={{ minHeight: "100vh", background: "#0a0812", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.8rem" }}>🧞 Cargando...</p></div>;
  if (pathname === "/admin/login") return <>{children}</>;

  const isActive = (h: string) => h === "/admin" ? pathname === "/admin" : pathname.startsWith(h);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0812" }}>
      <aside style={{ width: "200px", flexShrink: 0, background: "rgba(13,7,3,0.98)", borderRight: "1px solid rgba(232,168,76,0.15)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <Link href="/admin" style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#e8a84c", textDecoration: "none", padding: "20px 16px 16px", borderBottom: "1px solid rgba(232,168,76,0.1)" }}>🧞 Admin</Link>
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", textDecoration: "none", fontFamily: "Georgia", fontSize: "0.75rem", color: isActive(n.href) ? "#e8a84c" : "rgba(240,234,214,0.5)", background: isActive(n.href) ? "rgba(232,168,76,0.1)" : "transparent", borderLeft: isActive(n.href) ? "3px solid #e8a84c" : "3px solid transparent" }}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => { sessionStorage.removeItem("admin_session"); router.push("/admin/login"); }} style={{ padding: "14px 16px", background: "none", border: "none", borderTop: "1px solid rgba(232,168,76,0.1)", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.7rem", cursor: "pointer", textAlign: "left" }}>🚪 Cerrar sesión</button>
      </aside>
      <main style={{ flex: 1, marginLeft: "200px", padding: "24px 32px", minHeight: "100vh" }}>{children}</main>
    </div>
  );
}
