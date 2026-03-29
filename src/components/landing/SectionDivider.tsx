"use client";

export default function SectionDivider({
  fromBg = "var(--bg-primary)",
  toBg = "var(--bg-primary)"
}: {
  fromBg?: string;
  toBg?: string;
}) {
  return (
    <div style={{
      background: fromBg,
      lineHeight: 0,
      marginBottom: "-2px",
    }}>
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%" }}
        preserveAspectRatio="none"
      >
        {/* Duna de fondo: color arena oscura */}
        <path
          d="M0,50 C240,20 480,65 720,40 C960,15 1200,55 1440,45 L1440,80 L0,80 Z"
          fill="#3d2408"
        />
        {/* Duna dorada */}
        <path
          d="M0,58 C200,35 450,72 720,50 C990,28 1240,62 1440,52 L1440,80 L0,80 Z"
          fill="#c8922a"
          opacity="0.35"
        />
        {/* Duna superior que hace transición */}
        <path
          d="M0,65 C180,48 420,75 720,58 C1020,42 1260,68 1440,60 L1440,80 L0,80 Z"
          fill={toBg}
        />
      </svg>
    </div>
  );
}
