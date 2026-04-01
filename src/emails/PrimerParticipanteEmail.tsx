import * as React from "react";

interface Props {
  nombreLocal: string;
  premioConcurso: string;
  nombreParticipante: string;
}

export function PrimerParticipanteEmail({ nombreLocal, premioConcurso, nombreParticipante }: Props) {
  return (
    <html>
      <head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
      <body style={{ backgroundColor: "#1a0e05", fontFamily: "Georgia, serif", margin: 0, padding: 0 }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 24px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <p style={{ fontSize: "28px", margin: "0 0 8px" }}>🧞</p>
            <h1 style={{ color: "#e8a84c", fontSize: "20px", letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 }}>DeseoComer</h1>
          </div>

          {/* Card principal */}
          <div style={{ backgroundColor: "#2d1a08", borderRadius: "20px", border: "1px solid rgba(232,168,76,0.25)", padding: "40px 32px" }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <p style={{ fontSize: "40px", margin: "0 0 12px" }}>🎉</p>
              <h2 style={{ color: "#e8a84c", fontSize: "22px", marginTop: 0, marginBottom: "8px", lineHeight: 1.3 }}>
                ¡Tu concurso tiene su primer participante!
              </h2>
              <p style={{ color: "#8a7040", fontSize: "14px", margin: 0, fontStyle: "italic" }}>
                La magia ha comenzado
              </p>
            </div>

            <div style={{ backgroundColor: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
              <p style={{ color: "#c0a060", fontSize: "15px", lineHeight: "1.7", margin: "0 0 12px" }}>
                <strong style={{ color: "#e8a84c" }}>{nombreLocal}</strong>, alguien acaba de unirse a tu concurso
                {" "}<strong style={{ color: "#f5d080" }}>&ldquo;{premioConcurso}&rdquo;</strong>.
              </p>
              <p style={{ color: "#8a7040", fontSize: "14px", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                Primer participante: <strong style={{ color: "#c0a060" }}>{nombreParticipante}</strong>
              </p>
            </div>

            <p style={{ color: "#c0a060", fontSize: "16px", lineHeight: "1.7", marginBottom: "16px" }}>
              Esto es solo el comienzo. A medida que los participantes compartan su link,
              tu concurso llegará a más personas y tu local ganará visibilidad en toda la plataforma.
            </p>

            <p style={{ color: "#c0a060", fontSize: "16px", lineHeight: "1.7", marginBottom: "28px" }}>
              Cada participante es un nuevo cliente potencial que conoce tu local.
              El Genio ya está trabajando para ti.
            </p>

            {/* CTA */}
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <a href="https://deseocomer.com/panel/concursos" style={{
                backgroundColor: "#e8a84c", color: "#1a0e05", fontSize: "14px",
                fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase",
                textDecoration: "none", padding: "16px 40px", borderRadius: "12px",
                display: "inline-block",
              }}>
                Ver mi concurso →
              </a>
            </div>
          </div>

          {/* Tip */}
          <div style={{ backgroundColor: "rgba(61,184,158,0.08)", border: "1px solid rgba(61,184,158,0.15)", borderRadius: "12px", padding: "16px 20px", marginTop: "16px" }}>
            <p style={{ color: "#3db89e", fontSize: "13px", lineHeight: "1.6", margin: 0, textAlign: "center" }}>
              💡 <strong>Tip:</strong> Comparte el concurso en tus redes sociales para atraer más participantes y hacer crecer tu comunidad.
            </p>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <p style={{ color: "#5a4028", fontSize: "12px", lineHeight: "1.6" }}>
              Hecho con ❤️ y mucha hambre · DeseoComer.com<br />Santiago de Chile
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
