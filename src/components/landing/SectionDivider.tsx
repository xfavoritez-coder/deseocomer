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
          d="M0,68 C240,55 480,72 720,58 C960,72 1200,55 1440,68 L1440,80 L0,80 Z"
          fill="#3d2408"
        />
        <path
          d="M0,70 C200,60 400,75 720,62 C1040,75 1240,60 1440,70 L1440,80 L0,80 Z"
          fill="#c8922a"
          opacity="0.35"
        />
        <path
          d="M0,72 C180,64 420,76 720,66 C1020,76 1260,64 1440,72 L1440,80 L0,80 Z"
          fill={toBg}
        />
      </svg>
    </div>
  );
}
