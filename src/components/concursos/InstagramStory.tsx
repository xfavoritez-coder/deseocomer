import { forwardRef } from "react";

interface InstagramStoryProps {
  concurso: { premio: string; imagenUrl?: string | null };
  local: { nombre: string };
}

const InstagramStory = forwardRef<HTMLDivElement, InstagramStoryProps>(({ concurso, local }, ref) => {
  return (
    <div ref={ref} style={{ width: 1080, height: 1920, position: "relative", overflow: "hidden", fontFamily: "Arial, sans-serif" }}>
      {/* Background */}
      {concurso.imagenUrl ? (
        <img src={concurso.imagenUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} crossOrigin="anonymous" />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a0e05, #2d1a08, #1a1505)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 400, opacity: 0.22 }}>🍱</span>
        </div>
      )}

      {/* Top overlay */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 520, background: "linear-gradient(to bottom, rgba(10,8,18,0.65), transparent)" }} />

      {/* Bottom overlay */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1200, background: "linear-gradient(to top, rgba(10,8,18,0.98) 0%, rgba(10,8,18,0.75) 50%, transparent 100%)" }} />

      {/* Diagonal ribbon */}
      <div style={{ position: "absolute", top: 88, left: -112, width: 480, background: "#3db89e", padding: "24px 0", textAlign: "center", fontSize: 36, fontWeight: 800, color: "#0a0812", letterSpacing: "0.1em", textTransform: "uppercase", transform: "rotate(-45deg)", zIndex: 10 }}>
        CONCURSO
      </div>

      {/* Logo top right */}
      <div style={{ position: "absolute", top: 72, right: 72, display: "flex", alignItems: "center", gap: 20, background: "rgba(10,8,18,0.55)", border: "2px solid rgba(232,168,76,0.2)", borderRadius: 80, padding: "20px 40px" }}>
        <span style={{ fontSize: 52 }}>🧞</span>
        <span style={{ fontSize: 40, fontWeight: 700, color: "rgba(232,168,76,0.8)", letterSpacing: "0.06em", textTransform: "uppercase" }}>DeseoComer</span>
      </div>

      {/* Bottom content */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 80px 160px", display: "flex", flexDirection: "column", gap: 32 }}>
        <span style={{ fontSize: 44, color: "rgba(240,234,214,0.45)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>{local.nombre}</span>

        <span style={{ fontSize: 36, fontWeight: 800, color: "#e8a84c", letterSpacing: "0.18em", textTransform: "uppercase" }}>PREMIO</span>

        <span style={{ fontSize: 88, fontWeight: 700, color: "#f5d080", textTransform: "uppercase", lineHeight: 1.15, letterSpacing: "0.02em" }}>{concurso.premio}</span>

        <div style={{ height: 2, background: "rgba(232,168,76,0.12)", margin: "8px 0" }} />

        <span style={{ fontSize: 48, color: "rgba(240,234,214,0.45)", lineHeight: 1.4 }}>Participa gratis e invita amigos para ganar</span>

        {/* Link sticker */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, background: "rgba(20,20,28,0.85)", border: "2px solid rgba(255,255,255,0.15)", borderRadius: 48, padding: "40px 56px", marginTop: 8 }}>
          <div style={{ width: 112, height: 112, borderRadius: "50%", background: "rgba(232,168,76,0.15)", border: "2px solid rgba(232,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, flexShrink: 0 }}>🔗</div>
          <span style={{ fontSize: 52, fontWeight: 700, color: "rgba(240,234,214,0.85)" }}>Participar gratis</span>
          <span style={{ marginLeft: "auto", fontSize: 52, color: "rgba(240,234,214,0.3)" }}>→</span>
        </div>
      </div>
    </div>
  );
});

InstagramStory.displayName = "InstagramStory";
export default InstagramStory;
