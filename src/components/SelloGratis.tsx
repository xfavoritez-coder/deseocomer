"use client";

interface SelloGratisProps {
  size?: "sm" | "lg";
}

export default function SelloGratis({ size = "sm" }: SelloGratisProps) {
  const dim = size === "lg" ? 90 : 64;
  const fontSize = size === "lg" ? 8 : 7;
  const iconSize = size === "lg" ? 11 : 9;

  return (
    <svg width={dim} height={dim} viewBox="0 0 64 64" style={{ display: "block" }}>
      <polygon points="32,0 64,0 64,64" fill="rgba(13,7,3,0.92)" />
      <g transform="translate(52,22) rotate(45)">
        <text textAnchor="middle" y={-5} fontFamily="Georgia,'Times New Roman',serif" fontSize={fontSize} fontWeight="700" fill="#e8a84c" letterSpacing="1">GRATIS</text>
        <text textAnchor="middle" y={iconSize - 2} fontFamily="Georgia,serif" fontSize={iconSize} fill="#e8a84c">🏆</text>
      </g>
    </svg>
  );
}
