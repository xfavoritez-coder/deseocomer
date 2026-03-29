"use client";

export default function SectionDivider({
  fromBg = "var(--bg-primary)",
  toBg = "var(--bg-primary)",
}: {
  fromBg?: string;
  toBg?: string;
}) {
  return (
    <div style={{
      position: "relative",
      height: "48px",
      background: `linear-gradient(to bottom, ${fromBg} 0%, ${fromBg} 30%, ${toBg} 70%, ${toBg} 100%)`,
      overflow: "hidden",
    }}>
      {/* Arena dorada central */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        maxWidth: "600px",
        height: "1px",
        background: "linear-gradient(to right, transparent, rgba(200,146,42,0.5), rgba(200,146,42,0.7), rgba(200,146,42,0.5), transparent)",
      }} />
      {/* Glow sutil */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "40%",
        maxWidth: "300px",
        height: "8px",
        background: "radial-gradient(ellipse, rgba(200,146,42,0.15) 0%, transparent 70%)",
        filter: "blur(4px)",
      }} />
    </div>
  );
}
