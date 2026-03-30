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
      background: fromBg,
      lineHeight: 0,
      display: "block",
      marginTop: "-1px",
      marginBottom: "-1px",
    }}>
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: "80px" }}
        preserveAspectRatio="none"
      >
        {/* Duna trasera oscura */}
        <path
          d="M0,65 C360,30 720,75 1080,45 C1260,32 1380,60 1440,65 L1440,80 L0,80 Z"
          fill="#2a1600"
        />
        {/* Duna arena oscura */}
        <path
          d="M0,65 C280,42 560,72 840,52 C1080,36 1280,64 1440,65 L1440,80 L0,80 Z"
          fill="#8B5E2A"
          opacity="0.8"
        />
        {/* Duna arena dorada principal */}
        <path
          d="M0,65 C200,50 450,74 720,58 C960,44 1200,70 1440,65 L1440,80 L0,80 Z"
          fill="#C4853A"
          opacity="0.7"
        />
        {/* Duna arena clara frontal */}
        <path
          d="M0,65 C180,55 400,76 660,62 C880,50 1140,72 1440,65 L1440,80 L0,80 Z"
          fill="#c8922a"
          opacity="0.45"
        />
        {/* Capa de transición al fondo siguiente */}
        <path
          d="M0,65 C240,52 500,74 780,60 C1020,46 1260,68 1440,65 L1440,80 L0,80 Z"
          fill={toBg}
        />
      </svg>
    </div>
  );
}
