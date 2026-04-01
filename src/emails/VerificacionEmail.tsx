import * as React from "react";

interface Props { nombre: string; verificationUrl: string }

export function VerificacionEmail({ nombre, verificationUrl }: Props) {
  return (
    <html>
      <head><meta charSet="utf-8" /></head>
      <body style={{ backgroundColor: "#1a0e05", fontFamily: "Georgia, serif", margin: 0, padding: 0 }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <p style={{ fontSize: "28px", margin: "0 0 8px" }}>🧞</p>
            <h1 style={{ color: "#e8a84c", fontSize: "20px", letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>DeseoComer</h1>
          </div>
          <div style={{ backgroundColor: "#2d1a08", borderRadius: "20px", border: "1px solid rgba(232,168,76,0.25)", padding: "40px 32px" }}>
            <h2 style={{ color: "#e8a84c", fontSize: "22px", marginTop: 0, marginBottom: "16px" }}>Confirma tu email, {nombre}</h2>
            <p style={{ color: "#c0a060", fontSize: "16px", lineHeight: "1.7", marginBottom: "32px" }}>Para activar tu cuenta y participar en concursos, confirma tu dirección de email:</p>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <a href={verificationUrl} style={{ backgroundColor: "#e8a84c", color: "#1a0e05", fontSize: "14px", fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", padding: "16px 40px", borderRadius: "12px", display: "inline-block" }}>Activar mi cuenta →</a>
            </div>
            <p style={{ color: "#5a4028", fontSize: "13px", lineHeight: "1.6" }}>El link expira en 24 horas. Si no creaste esta cuenta, ignora este email.</p>
          </div>
          <div style={{ textAlign: "center", marginTop: "32px" }}><p style={{ color: "#5a4028", fontSize: "12px" }}>Hecho con ❤️ y mucha hambre · DeseoComer.com</p></div>
        </div>
      </body>
    </html>
  );
}
