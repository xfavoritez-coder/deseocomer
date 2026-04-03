"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function BirthdayBanner() {
  const { user, isAuthenticated } = useAuth();
  const [mostrar, setMostrar] = useState(false);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    try {
      // Check birthday from localStorage OR from the user object (server-side data)
      let dia: number | null = null;
      let mes: number | null = null;

      const birthday = JSON.parse(localStorage.getItem("deseocomer_user_birthday") || "{}");
      if (birthday?.dia && birthday?.mes) {
        dia = Number(birthday.dia);
        mes = Number(birthday.mes);
      } else if (user?.cumpleDia && user?.cumpleMes) {
        dia = Number(user.cumpleDia);
        mes = Number(user.cumpleMes);
      }

      if (!dia || !mes) return;

      const hoy = new Date();
      const esCumple = hoy.getDate() === dia && (hoy.getMonth() + 1) === mes;
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
    <>
      {/* Spacer so fixed banner doesn't overlap page content */}
      <div style={{ height: "44px" }} />
      <div className="dc-birthday-banner">
        {["🎊", "🎂", "✨", "🎉", "🎈"].map((emoji, i) => (
          <span key={i} style={{
            position: "absolute",
            top: "50%",
            left: `${10 + i * 20}%`,
            transform: "translateY(-50%)",
            fontSize: "1.2rem",
            opacity: 0.3,
            pointerEvents: "none",
          }}>
            {emoji}
          </span>
        ))}
        <p style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: "clamp(0.7rem, 2vw, 0.85rem)",
          color: "var(--accent)",
          margin: 0,
          letterSpacing: "0.05em",
          position: "relative",
          zIndex: 1,
        }}>
          🎂 ¡Feliz cumpleaños{nombre ? `, ${nombre}` : ""}! Hoy los restaurantes tienen{" "}
          <a href="/promociones" style={{
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
      <style>{`
        .dc-birthday-banner {
          position: fixed;
          top: 66px;
          left: 0;
          right: 0;
          z-index: 99;
          background: linear-gradient(135deg, rgba(232,168,76,0.15), rgba(180,30,100,0.15));
          border-bottom: 1px solid rgba(232,168,76,0.3);
          padding: 10px 40px 10px 20px;
          text-align: center;
          overflow: hidden;
          backdrop-filter: blur(12px);
          background-color: color-mix(in srgb, var(--bg-primary) 85%, transparent);
        }
        @media (max-width: 767px) {
          .dc-birthday-banner { top: 52px; padding: 8px 36px 8px 12px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-birthday-banner { top: 60px; }
        }
      `}</style>
    </>
  );
}
