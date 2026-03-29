export default function SectionDivider() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      background: "var(--bg-primary)",
      padding: "0 60px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "860px",
        height: "1px",
        background: "linear-gradient(to right, transparent, color-mix(in srgb, var(--accent) 55%, transparent), transparent)",
      }} />
    </div>
  );
}
