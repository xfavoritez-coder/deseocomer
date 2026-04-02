"use client";
import { useState, useRef } from "react";
import InstagramStory from "./InstagramStory";

interface Props {
  concurso: { id: string; slug?: string; premio: string; imagenUrl?: string | null; local?: { nombre: string } };
  onClose: () => void;
}

export default function ModalInstagram({ concurso, onClose }: Props) {
  const [generando, setGenerando] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  const descargar = async () => {
    if (!storyRef.current) return;
    setGenerando(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(storyRef.current, {
        backgroundColor: null,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `concurso-${concurso.slug || concurso.id}-story.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setGenerando(false);
    }
  };

  const slug = concurso.slug || concurso.id;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,8,18,0.92)", zIndex: 1000 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(20,12,35,0.98)", border: "1px solid rgba(232,168,76,0.25)", borderRadius: 20, padding: 24, maxWidth: 420, width: "90vw", zIndex: 1001, maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: 16, color: "#f5d080", textTransform: "uppercase", margin: 0 }}>Compartir en Instagram</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(240,234,214,0.4)", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>

        {/* Preview */}
        <div style={{ width: 270, height: 480, overflow: "hidden", borderRadius: 16, margin: "0 auto 16px", position: "relative" }}>
          <div style={{ transformOrigin: "top left", transform: "scale(0.25)", width: 1080, height: 1920 }}>
            <InstagramStory ref={storyRef} concurso={concurso} local={{ nombre: concurso.local?.nombre || "Local" }} />
          </div>
        </div>

        {/* Instructions */}
        <div style={{ fontSize: 12, color: "rgba(240,234,214,0.4)", lineHeight: 1.7, marginBottom: 16 }}>
          <p style={{ margin: "0 0 4px" }}>1. Descarga la imagen</p>
          <p style={{ margin: "0 0 4px" }}>2. Súbela a tu historia de Instagram</p>
          <p style={{ margin: "0 0 4px" }}>3. Agrega el sticker de link apuntando al botón</p>
          <p style={{ margin: 0 }}>4. En el link pon: <strong style={{ color: "#3db89e" }}>deseocomer.com/concursos/{slug}</strong></p>
        </div>

        {/* Download button */}
        <button onClick={descargar} disabled={generando} style={{ width: "100%", padding: 14, background: "#e8a84c", color: "#0a0812", fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, textTransform: "uppercase", borderRadius: 12, border: "none", cursor: "pointer", opacity: generando ? 0.5 : 1 }}>
          {generando ? "Generando imagen..." : "Descargar imagen →"}
        </button>
      </div>
    </>
  );
}
