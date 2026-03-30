"use client";

interface SelloGratisProps {
  size?: "sm" | "lg";
}

export default function SelloGratis({ size = "sm" }: SelloGratisProps) {
  const dim = size === "lg" ? 96 : 72;

  return (
    <div style={{ width: dim, height: dim, position: "relative", overflow: "visible" }}>
      <svg width={dim} height={dim} viewBox="0 0 72 72" style={{ display: "block", overflow: "visible" }}>
        <polygon points="0,0 72,0 72,72" fill="rgba(13,7,3,0.9)" />
        <g transform="translate(48,24) rotate(45)">
          <text textAnchor="middle" y="-8" fontFamily="Georgia,'Times New Roman',serif" fontSize={size === "lg" ? 9 : 8} fontWeight="700" fill="#e8a84c" letterSpacing="0.8">GRATIS</text>
          <text textAnchor="middle" y="8" fontFamily="Georgia,serif" fontSize={size === "lg" ? 12 : 10} fill="#e8a84c">🏆</text>
        </g>
      </svg>
    </div>
  );
}
