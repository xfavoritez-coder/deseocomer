"use client";
import { useEffect, useState } from "react";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("genie_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("genie_session_id", sid);
  }
  return sid;
}

export default function GenieLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSessionId();
    setReady(true);
  }, []);

  if (!ready) return (
    <div style={{ minHeight: "100vh", background: "#0a0812", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.2rem", color: "#e8a84c" }}>🧞</p>
    </div>
  );

  return <>{children}</>;
}
