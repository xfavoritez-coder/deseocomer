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
          d="M0,68 Q360,52 720,68 Q1080,52 1440,68 L1440,80 L0,80 Z"
          fill="#3d2408"
        />
        <path
          d="M0,70 Q360,58 720,70 Q1080,58 1440,70 L1440,80 L0,80 Z"
          fill="#c8922a"
          opacity="0.35"
        />
        <path
          d="M0,72 Q360,62 720,72 Q1080,62 1440,72 L1440,80 L0,80 Z"
          fill={toBg}
        />
      </svg>
    </div>
  );
}
