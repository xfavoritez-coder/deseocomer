"use client";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function StoryUserPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const [copied, setCopied] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/usuarios/by-refcode?code=${encodeURIComponent(userId)}`).then(r => r.ok ? r.json() : null).then(d => {
      if (d?.codigoRef) setRefCode(d.codigoRef);
      if (d?.nombre) setUserName(d.nombre.split(" ")[0]);
    }).catch(() => {});
  }, [userId]);

  const link = refCode
    ? `deseocomer.com/concursos/${slug}/${encodeURIComponent(userName || "amigo")}/${refCode}`
    : `deseocomer.com/concursos/${slug}`;

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
        src={`/api/concursos/${slug}/story-user?userId=${userId}`}
        alt="Tu historia de Instagram"
        style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 16, display: "block" }}
      />

      {/* Instrucciones */}
      <div style={{ maxWidth: 400, width: "100%", marginTop: "20px" }}>
        <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "16px", color: "#e8a84c", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>
          ¿Cómo compartir en Instagram?
        </h3>
        <div style={{ fontFamily: "var(--font-lato)", fontSize: "14px", color: "rgba(240,234,214,0.7)", lineHeight: 1.8 }}>
          <p style={{ margin: "0 0 6px" }}>1. Mantén presionada la imagen y guárdala</p>
          <p style={{ margin: "0 0 6px" }}>2. Abre Instagram y crea una nueva historia</p>
          <p style={{ margin: "0 0 6px" }}>3. Selecciona la imagen guardada</p>
          <p style={{ margin: "0 0 14px" }}>4. Agrega el sticker de link apuntando al botón y pon este link:</p>
        </div>

        {/* Link box — tap to copy */}
        <button
          onClick={copyLink}
          style={{
            width: "100%",
            background: copied ? "rgba(61,184,158,0.1)" : "rgba(225,48,108,0.06)",
            border: `1px solid ${copied ? "rgba(61,184,158,0.35)" : "rgba(225,48,108,0.2)"}`,
            borderRadius: "14px",
            padding: "16px",
            cursor: "pointer",
            textAlign: "center",
            transition: "all 0.3s",
          }}
        >
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "12px", color: copied ? "#3db89e" : "rgba(240,234,214,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {copied ? "✓ Copiado al portapapeles" : "Toca para copiar tu link"}
          </p>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "14px", color: copied ? "#3db89e" : "#E1306C", wordBreak: "break-all", margin: 0, fontWeight: 600 }}>
            {link}
          </p>
        </button>
      </div>
    </div>
  );
}
