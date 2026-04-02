"use client";
import { QRCodeSVG } from "qrcode.react";

export default function QRPage() {
  return (
    <div style={{ background: "#f5f0e8", fontFamily: "var(--font-lato)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", margin: 0 }}>
      <div style={{ background: "#fff", border: "1px solid rgba(180,130,40,0.2)", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(180,130,40,0.12)", width: "100%", maxWidth: 340 }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #e8a84c 0%, #d4922a 100%)", padding: "28px 24px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🧞</div>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 22, color: "#fff", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>DESEOCOMER</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "6px 0 0" }}>La plataforma gastronómica de Chile</p>
        </div>

        {/* Middle */}
        <div style={{ background: "#fff", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 180, height: 180, background: "#fff", border: "2px solid rgba(180,130,40,0.15)", borderRadius: 16, padding: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QRCodeSVG
              value="https://deseocomer.com/unete"
              size={156}
              bgColor="#ffffff"
              fgColor="#2a1a00"
              level="H"
            />
          </div>
          <p style={{ fontSize: 12, color: "rgba(80,60,20,0.5)", textAlign: "center", lineHeight: 1.5, margin: 0 }}>Escanea con la cámara de tu teléfono y únete gratis en segundos</p>
          <a href="https://deseocomer.com/unete" target="_blank" rel="noopener noreferrer" style={{ background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 20, padding: "7px 16px", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <span style={{ fontSize: 12 }}>🔗</span>
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, color: "#c47f1a", fontWeight: 700 }}>deseocomer.com/unete</span>
          </a>
        </div>

        {/* Footer */}
        <div style={{ background: "rgba(232,168,76,0.06)", borderTop: "1px solid rgba(180,130,40,0.12)", padding: "18px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700, color: "#8a6010", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>¿Por qué unirte?</p>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { icon: "🏆", label: "Concursos gratis" },
              { icon: "📣", label: "Más visibilidad" },
              { icon: "⚡", label: "Promociones" },
            ].map(b => (
              <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
                <span style={{ fontSize: 9, color: "rgba(80,60,20,0.45)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
