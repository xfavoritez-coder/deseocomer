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
          d="M0,45 C180,15 360,70 540,35 C720,0 900,60 1080,30 C1260,5 1380,50 1440,35 L1440,80 L0,80 Z"
          fill="#3d2408"
        />
        {/* Duna principal: color arena dorada */}
        <path
          d="M0,55 C200,25 400,75 650,40 C850,15 1050,65 1280,38 C1360,28 1410,48 1440,42 L1440,80 L0,80 Z"
          fill="#c8922a"
          opacity="0.35"
        />
        {/* Duna superior: transición al fondo siguiente */}
        <path
          d="M0,62 C240,38 420,72 680,50 C880,32 1100,68 1300,48 C1380,40 1420,55 1440,50 L1440,80 L0,80 Z"
          fill={toBg}
        />
      </svg>
    </div>
  );
}
