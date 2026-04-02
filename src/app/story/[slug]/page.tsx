"use client";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function StoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);
  const link = `deseocomer.com/concursos/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${link}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
      {/* Logo */}
      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "14px", color: "rgba(232,168,76,0.6)", marginBottom: "16px" }}>
        🧞 DeseoComer
      </p>

      {/* Imagen generada */}
      <img
        src={`/api/concursos/${slug}/story-image`}
        alt="Historia de Instagram"
        style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 16, display: "block" }}
      />

      {/* Instrucciones */}
      <div style={{ maxWidth: 400, width: "100%", marginTop: "20px" }}>
        <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "14px", color: "#e8a84c", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
          ¿Cómo compartir en Instagram?
        </h3>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: "12px", color: "rgba(240,234,214,0.4)", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 4px" }}>1. Mantén presionada la imagen y guárdala</p>
          <p style={{ margin: "0 0 4px" }}>2. Abre Instagram y crea una nueva historia</p>
          <p style={{ margin: "0 0 4px" }}>3. Selecciona la imagen guardada</p>
          <p style={{ margin: "0 0 12px" }}>4. Agrega el sticker de link apuntando al botón y pon este link:</p>
        </div>

        {/* Link box */}
        <div style={{ background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px" }}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "13px", color: "#e8a84c", wordBreak: "break-all", margin: 0 }}>{link}</p>
        </div>

        {/* Boton copiar */}
        <button
          onClick={copyLink}
          style={{
            width: "100%",
            padding: "12px",
            background: copied ? "rgba(61,184,158,0.15)" : "rgba(232,168,76,0.1)",
            border: `1px solid ${copied ? "rgba(61,184,158,0.4)" : "rgba(232,168,76,0.25)"}`,
            borderRadius: "10px",
            color: copied ? "#3db89e" : "#e8a84c",
            fontFamily: "var(--font-cinzel)",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {copied ? "✓ Link copiado" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}
