import Link from "next/link";

export default function LocalPendientePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary, #0a0812)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ maxWidth: "440px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🧞</div>
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative, Georgia)", fontSize: "1.4rem", color: "#e8a84c", marginBottom: "12px" }}>Email verificado</h1>
        <p style={{ fontFamily: "var(--font-lato, sans-serif)", fontSize: "1rem", color: "rgba(240,234,214,0.6)", lineHeight: 1.7, marginBottom: "24px" }}>
          Tu email fue verificado correctamente. Ahora tu local está siendo revisado por nuestro equipo.
          Te avisaremos por email cuando esté aprobado y listo para publicar concursos y promociones.
        </p>
        <div style={{ background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "12px", padding: "16px 20px", marginBottom: "28px" }}>
          <p style={{ fontFamily: "var(--font-lato, sans-serif)", fontSize: "0.88rem", color: "rgba(240,234,214,0.45)", lineHeight: 1.6, margin: 0 }}>
            Este proceso normalmente toma menos de 24 horas. Si necesitas ayuda puedes escribirnos a <a href="mailto:hola@deseocomer.com" style={{ color: "#e8a84c", textDecoration: "none" }}>hola@deseocomer.com</a>
          </p>
        </div>
        <Link href="/" style={{ fontFamily: "var(--font-cinzel, Georgia)", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", textDecoration: "underline" }}>Volver al inicio</Link>
      </div>
    </div>
  );
}
