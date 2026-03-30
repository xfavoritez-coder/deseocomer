"use client";

export default function SelloGratis({ size = "sm" }: { size?: "sm" | "lg" }) {
  const isSm = size === "sm";
  const w = isSm ? 62 : 112;
  const h = isSm ? 62 : 112;

  return (
    <svg width={w} height={h} viewBox="-35 -35 70 70" style={{ filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.45))" }}>
      <defs>
        <radialGradient id={`gold-${size}`} cx="35%" cy="28%" r="70%">
          <stop offset="0%" stopColor="#fffbe0" />
          <stop offset="20%" stopColor="#f5d060" />
          <stop offset="50%" stopColor="#d4900a" />
          <stop offset="80%" stopColor="#a86010" />
          <stop offset="100%" stopColor="#7a4208" />
        </radialGradient>
        <radialGradient id={`inner-${size}`} cx="35%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#fff8d0" />
          <stop offset="30%" stopColor="#e8b030" />
          <stop offset="70%" stopColor="#b87010" />
          <stop offset="100%" stopColor="#7a4208" />
        </radialGradient>
      </defs>

      {/* 32 dientes */}
      <polygon
        fill={`url(#gold-${size})`}
        stroke="#c07808"
        strokeWidth="0.4"
        points="0,-32 3.5,-29 5.5,-32.5 8.5,-28.5 11.5,-31 13,-27 16,-29 17,-25 20.5,-26 20.5,-22 24,-22.5 23,-18.5 26.5,-16 25,-12.5 28.5,-10 26.5,-6.5 29.5,-3.5 27,1 29.5,4.5 26.5,8 28.5,12 25.5,14.5 27,18.5 23.5,19.5 24,23.5 20.5,23 20,27.5 16.5,26.5 15,30.5 11.5,28.5 9.5,32.5 6,30.5 2.5,33.5 0,31.5 -2.5,33.5 -6,30.5 -9.5,32.5 -11.5,28.5 -15,30.5 -16.5,26.5 -20,27.5 -20.5,23 -24,23.5 -23.5,19.5 -27,18.5 -25.5,14.5 -28.5,12 -26.5,8 -29.5,4.5 -27,1 -29.5,-3.5 -26.5,-6.5 -28.5,-10 -25,-12.5 -26.5,-16 -23,-18.5 -24,-22.5 -20.5,-22 -20.5,-26 -17,-25 -16,-29 -13,-27 -11.5,-31 -8.5,-28.5 -5.5,-32.5 -3.5,-29"
      />

      {/* Anillos interiores */}
      <circle r="26" fill="none" stroke="#fffbe0" strokeWidth="0.9" opacity="0.55" />
      <circle r="23.5" fill="none" stroke="#7a4208" strokeWidth="0.5" opacity="0.4" />
      <circle r="21" fill={`url(#inner-${size})`} opacity="0.35" />
      <circle r="19.5" fill="none" stroke="#fffbe0" strokeWidth="0.6" strokeDasharray="2 1.5" opacity="0.55" />
      <circle r="17.5" fill="none" stroke="#c07808" strokeWidth="0.4" opacity="0.45" />

      {/* Lineas flanqueando PREMIO */}
      <line x1="-12" y1={isSm ? -10.5 : -10} x2="-6" y2={isSm ? -10.5 : -10} stroke="#2a1000" strokeWidth="0.5" opacity="0.5" />
      <line x1="6" y1={isSm ? -10.5 : -10} x2="12" y2={isSm ? -10.5 : -10} stroke="#2a1000" strokeWidth="0.5" opacity="0.5" />

      <text y="-8" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif" fontSize={isSm ? "4.5" : "4.8"} fontWeight="700" fill="#2a1000" letterSpacing="1.5" opacity="0.9">PREMIO</text>
      <text y="2" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif" fontSize={isSm ? "9" : "9.5"} fontWeight="900" fill="#1a0800" letterSpacing="1" opacity="0.95">GRATIS</text>
      <text y="9.5" textAnchor="middle" fontFamily="Georgia,serif" fontSize={isSm ? "4" : "4.5"} fill="#2a1000" letterSpacing="3" opacity="0.8">{"\u2605 \u2605 \u2605"}</text>
      <line x1="-11" y1="13" x2="11" y2="13" stroke="#2a1000" strokeWidth="0.5" opacity="0.4" />
      <text y="18" textAnchor="middle" fontFamily="Georgia,serif" fontSize="3" fill="#2a1000" letterSpacing="1.5" opacity="0.7">DESEOCOMER</text>
    </svg>
  );
}
