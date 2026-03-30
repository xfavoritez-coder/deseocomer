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
      height: "80px",
      background: fromBg,
      overflow: "hidden",
      lineHeight: 0,
      fontSize: 0,
    }}>
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: "80px" }}
        preserveAspectRatio="none"
      >
        {/* Capa 1 — duna oscura */}
        <path d="M0,65 C360,30 720,75 1080,45 C1260,32 1380,60 1440,65 L1440,80 L0,80 Z" fill="#3d2408" opacity="0.5" />
        {/* Capa 2 — transición al fondo destino */}
        <path d="M0,68 C280,42 560,72 840,52 C1080,36 1280,64 1440,58 L1440,80 L0,80 Z" fill={toBg} />
      </svg>
    </div>
  );
}
