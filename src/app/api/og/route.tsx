import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "DeseoComer";
  const subtitle = searchParams.get("subtitle") || "Gana comida gratis, descubre los mejores locales y promociones";
  const badge = searchParams.get("badge");

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a0e05 0%, #2d1a08 40%, #0a0812 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-100px", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,168,76,0.12) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: "-80px", left: "-80px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(61,184,158,0.08) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,168,76,0.04) 0%, transparent 60%)", display: "flex" }} />

        {/* Border frame */}
        <div style={{ position: "absolute", inset: "24px", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "24px", display: "flex" }} />

        {/* Badge */}
        {badge && (
          <div style={{ position: "absolute", top: "48px", right: "48px", background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.4)", borderRadius: "12px", padding: "8px 20px", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ fontSize: "18px", display: "flex" }}>🎁</div>
            <div style={{ fontSize: "16px", color: "#3db89e", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", display: "flex" }}>{badge}</div>
          </div>
        )}

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "40px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "4px", display: "flex" }}>🧞</div>
          <div style={{ fontSize: "24px", color: "rgba(232,168,76,0.6)", letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 700, display: "flex" }}>
            DeseoComer
          </div>
          <div style={{ width: "60px", height: "2px", background: "rgba(232,168,76,0.3)", margin: "4px 0", display: "flex" }} />
          <div style={{ fontSize: "48px", color: "#f5d080", fontWeight: 700, lineHeight: 1.2, maxWidth: "900px", display: "flex", textAlign: "center" }}>
            {title}
          </div>
          <div style={{ fontSize: "24px", color: "rgba(240,234,214,0.5)", lineHeight: 1.5, maxWidth: "750px", marginTop: "4px", display: "flex", textAlign: "center" }}>
            {subtitle}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ position: "absolute", bottom: "40px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "14px", color: "rgba(240,234,214,0.3)", letterSpacing: "0.15em", textTransform: "uppercase", display: "flex" }}>
            deseocomer.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
