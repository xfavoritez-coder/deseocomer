"use client";

interface SelloGratisProps {
  size?: "sm" | "lg";
}

export default function SelloGratis({ size = "sm" }: SelloGratisProps) {
  const dim = size === "lg" ? 90 : 68;
  const fontSize = size === "lg" ? 8.5 : 7.5;
  const iconSize = size === "lg" ? 13 : 11;

  return (
    <svg width={dim} height={dim} viewBox="0 0 68 68" style={{ display: "block" }}>
      <polygon points="0,0 68,0 68,68" fill="rgba(13,7,3,0.88)" />
      <g transform="translate(46,22) rotate(45)">
        <text textAnchor="middle" y="0" fontFamily="Georgia,serif" fontSize={fontSize} fontWeight="700" fill="#e8a84c" letterSpacing="1">GRATIS</text>
      </g>
    </svg>
  );
}
