"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface Participacion {
  id: string;
  nombre: string;
  premio: string;
  slug: string;
  timestamp: number;
}

function tiempoRelativo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 120) return "hace 1 min";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  return "";
}

export default function LiveActivityToast() {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<Participacion | null>(null);
  const [exiting, setExiting] = useState(false);
  const shownIds = useRef<Set<string>>(new Set());
  const queue = useRef<Participacion[]>([]);
  const showing = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showNext = useCallback(() => {
    if (queue.current.length === 0) {
      showing.current = false;
      return;
    }
    showing.current = true;
    const next = queue.current.shift()!;
    setCurrent(next);
    setExiting(false);
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        setCurrent(null);
        // Wait before showing next
        setTimeout(showNext, 3000);
      }, 400);
    }, 5000);
  }, []);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      if (!active) return;
      try {
        const res = await fetch("/api/participaciones-recientes");
        const data: Participacion[] = await res.json();
        if (!Array.isArray(data)) return;

        // Get session user id to skip own participations
        let myId = "";
        try {
          const session = JSON.parse(localStorage.getItem("deseocomer_session") ?? "{}");
          myId = session.id ?? "";
        } catch {}

        for (const p of data) {
          if (shownIds.current.has(p.id)) continue;
          shownIds.current.add(p.id);

          // Don't show if it's the current user (check by name match is imperfect but ok)
          if (myId && p.id === myId) continue;

          queue.current.push(p);
        }

        if (queue.current.length > 0 && !showing.current) {
          showNext();
        }
      } catch {}
    };

    // Initial delay to not compete with page load
    const initTimer = setTimeout(poll, 5000);
    const interval = setInterval(poll, 45000);

    return () => {
      active = false;
      clearTimeout(initTimer);
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showNext]);

  // Keep shownIds from growing too large
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (shownIds.current.size > 100) shownIds.current.clear();
    }, 300000);
    return () => clearInterval(cleanup);
  }, []);

  if (!visible || !current) return null;

  const premioCorto = current.premio.length > 30
    ? current.premio.substring(0, 30).trim() + "..."
    : current.premio;
  const tiempo = tiempoRelativo(current.timestamp);

  return (
    <>
      <div
        onClick={() => { setExiting(true); setTimeout(() => { setVisible(false); setCurrent(null); }, 300); }}
        style={{
          position: "fixed",
          bottom: 20,
          left: 16,
          zIndex: 800,
          maxWidth: 320,
          width: "calc(100vw - 32px)",
          background: "rgba(13,7,3,0.95)",
          border: "1px solid rgba(232,168,76,0.2)",
          borderRadius: 14,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          animation: exiting ? "dc-live-exit 0.4s ease forwards" : "dc-live-enter 0.4s ease",
        }}
      >
        <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "var(--font-lato)",
            fontSize: 13,
            color: "rgba(240,234,214,0.85)",
            margin: 0,
            lineHeight: 1.4,
          }}>
            <strong style={{ color: "#e8a84c" }}>{current.nombre}</strong> se unió a{" "}
            <strong style={{ color: "#f5d080" }}>{premioCorto}</strong>
          </p>
          {tiempo && (
            <p style={{
              fontFamily: "var(--font-lato)",
              fontSize: 11,
              color: "rgba(240,234,214,0.3)",
              margin: "2px 0 0",
            }}>{tiempo}</p>
          )}
        </div>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3db89e", flexShrink: 0, animation: "dc-live-dot 1.5s ease-in-out infinite" }} />
      </div>

      <style>{`
        @keyframes dc-live-enter {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dc-live-exit {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(20px); }
        }
        @keyframes dc-live-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (min-width: 768px) {
          .dc-live-toast { bottom: 24px !important; left: 24px !important; max-width: 360px !important; }
        }
      `}</style>
    </>
  );
}
