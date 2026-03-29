"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    try {
      const session = sessionStorage.getItem("deseocomer_local_session");
      if (session) {
        const data = JSON.parse(session);
        if (data.loggedIn) {
          setAuthorized(true);
          return;
        }
      }
    } catch {}
    router.replace("/login-local");
  }, [router]);

  if (!authorized) {
    return (
      <div style={{ background: "var(--bg-primary)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "var(--text-muted)" }}>Redirigiendo...</p>
      </div>
    );
  }

  return <>{children}</>;
}
