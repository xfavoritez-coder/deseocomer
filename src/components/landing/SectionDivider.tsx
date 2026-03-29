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
        background: "linear-gradient(to right, transparent, rgba(232,168,76,0.28), transparent)",
      }} />
    </div>
  );
}
