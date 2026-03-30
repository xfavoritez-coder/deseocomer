"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function BirthdayBanner() {
  const { user, isAuthenticated } = useAuth();
  const [mostrar, setMostrar] = useState(false);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    try {
      const birthday = JSON.parse(localStorage.getItem("deseocomer_user_birthday") || "{}");
      if (!birthday?.dia || !birthday?.mes) return;
      const hoy = new Date();
      const esCumple = hoy.getDate() === Number(birthday.dia) && (hoy.getMonth() + 1) === Number(birthday.mes);
      if (esCumple) {
        const dismissKey = `cumple_banner_dismissed_${hoy.toISOString().slice(0, 10)}`;
        if (localStorage.getItem(dismissKey)) return;
        setNombre(user?.nombre?.split(" ")[0] || "");
        setMostrar(true);
      }
    } catch {}
  }, [isAuthenticated, user]);

  if (!mostrar) return null;

  const dismiss = () => {
    setMostrar(false);
    try {
      localStorage.setItem(`cumple_banner_dismissed_${new Date().toISOString().slice(0, 10)}`, "1");
    } catch {}
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(232,168,76,0.15), rgba(180,30,100,0.15))",
      borderBottom: "1px solid rgba(232,168,76,0.3)",
      padding: "12px 40px 12px 20px",
      textAlign: "center",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 101,
      overflow: "hidden",
      backdropFilter: "blur(12px)",
    }}>
      {["🎊", "🎂", "✨", "🎉", "🎈"].map((emoji, i) => (
        <span key={i} style={{
          position: "absolute",
          top: "50%",
          left: `${10 + i * 20}%`,
          transform: "translateY(-50%)",
          fontSize: "1.2rem",
          opacity: 0.4,
          pointerEvents: "none",
        }}>
          {emoji}
        </span>
      ))}
      <p style={{
        fontFamily: "var(--font-cinzel)",
        fontSize: "clamp(0.75rem, 2vw, 0.9rem)",
        color: "var(--accent)",
        margin: 0,
        letterSpacing: "0.05em",
        position: "relative",
        zIndex: 1,
      }}>
        🎂 ¡Feliz cumpleaños{nombre ? `, ${nombre}` : ""}! Hoy los restaurantes tienen{" "}
        <a href="/promociones?cumpleanos=1" style={{
          color: "var(--accent)",
          textDecoration: "underline",
          fontWeight: 700,
        }}>
          ofertas especiales para ti
        </a>
        {" "}🎉
      </p>
      <button onClick={dismiss} style={{
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        color: "var(--text-muted)",
        fontSize: "0.8rem",
        cursor: "pointer",
        zIndex: 2,
      }}>
        ✕
      </button>
    </div>
  );
}
