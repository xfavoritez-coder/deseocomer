interface Props {
  fromBg?: "primary" | "secondary";
  toBg?: "primary" | "secondary";
}

export default function SectionDivider({ fromBg = "primary", toBg = "secondary" }: Props) {
  const bgFrom = fromBg === "secondary" ? "var(--bg-secondary)" : "var(--bg-primary)";
  const bgTo   = toBg === "secondary" ? "var(--bg-secondary)" : "var(--bg-primary)";

  return (
    <div style={{ background: bgFrom, lineHeight: 0 }}>
      <svg
        viewBox="0 0 1440 60"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block", width: "100%", height: "60px" }}
        preserveAspectRatio="none"
      >
        <path
          d="M0,40 C360,0 720,60 1080,20 C1260,0 1380,30 1440,20 L1440,60 L0,60 Z"
          fill={bgTo}
        />
      </svg>
      <style>{`
        @media (max-width: 767px) {
          svg { height: 40px !important; }
        }
      `}</style>
    </div>
  );
}
