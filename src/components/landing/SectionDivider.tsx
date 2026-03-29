"use client";

export default function SectionDivider({
  fromBg = "var(--bg-primary)",
  toBg = "var(--bg-primary)",
}: {
  fromBg?: string;
  toBg?: string;
}) {
  return (
    <div style={{ background: fromBg, lineHeight: 0, display: "block", marginTop: "-1px" }}>
      <svg
        viewBox="0 0 1440 80"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: "80px" }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,65 C360,30 720,75 1080,45 C1260,32 1380,60 1440,65 L1440,80 L0,80 Z"
          fill="#3d2408"
        />
        <path
          d="M0,65 C300,42 600,72 900,52 C1100,38 1300,62 1440,65 L1440,80 L0,80 Z"
          fill="#c8922a"
          opacity="0.35"
        />
        <path
          d="M0,65 C240,50 500,74 780,58 C1020,44 1260,68 1440,65 L1440,80 L0,80 Z"
          fill={toBg}
        />
      </svg>
    </div>
  );
}
