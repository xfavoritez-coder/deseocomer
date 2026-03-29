export default function SectionDivider() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background: "var(--bg-primary)",
      padding: "0 60px",
    }}>
      <span style={{
        fontSize: "1rem",
        marginBottom: "10px",
        opacity: 0.55,
        filter: "drop-shadow(0 0 10px rgba(232,168,76,0.5))",
        display: "block",
      }}>🏮</span>
      <div style={{
        width: "100%",
        maxWidth: "860px",
        height: "1px",
        background: "linear-gradient(to right, transparent, rgba(232,168,76,0.28), transparent)",
      }} />
    </div>
  );
}
