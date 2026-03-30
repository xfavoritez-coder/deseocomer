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
    }}>
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: "80px" }}
        preserveAspectRatio="none"
      >
        {/* Capa 1 — duna trasera arena oscura */}
        <path d="M0,65 C360,30 720,75 1080,45 C1260,32 1380,60 1440,65 L1440,80 L0,80 Z" fill="#3d2408" />
        {/* Capa 2 — duna arena dorada profunda */}
        <path d="M0,68 C280,42 560,72 840,52 C1080,36 1280,64 1440,58 L1440,80 L0,80 Z" fill="#8B5E2A" opacity="0.7" />
        {/* Capa 3 — duna arena media dorada */}
        <path d="M0,70 C200,52 480,76 720,60 C960,44 1200,70 1440,63 L1440,80 L0,80 Z" fill="#C4853A" opacity="0.5" />
        {/* Capa 4 — duna arena clara frontal */}
        <path d="M0,72 C180,58 420,78 680,65 C900,54 1160,74 1440,67 L1440,80 L0,80 Z" fill="#E8A84C" opacity="0.25" />
        {/* Capa 5 — suelo de transición */}
        <path d="M0,65 C240,50 500,74 780,58 C1020,44 1260,68 1440,65 L1440,80 L0,80 Z" fill={toBg} />
      </svg>
    </div>
  );
}
