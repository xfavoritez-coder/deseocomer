"use client";

export default function CTASection() {
  return (
    <section className="dc-cta-section" style={{
      backgroundColor: "var(--bg-primary)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "900px", height: "400px",
        background: "radial-gradient(ellipse, rgba(44,122,111,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="dc-cta-card" style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "32px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "32px" }}>🏪</div>

          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.7rem",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--oasis-bright)",
            marginBottom: "20px",
          }}>
            Para Restaurantes y Locales
          </p>

          <h2 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            color: "var(--accent)",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "24px",
            lineHeight: 1.2,
          }}>
            Suma tu Local al Oasis
          </h2>

          <p style={{
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            color: "var(--text-primary)",
            fontWeight: 300,
            lineHeight: 1.8,
            maxWidth: "560px",
            margin: "0 auto 48px",
          }}>
            Crea concursos virales, haz que tus clientes traigan nuevos clientes
            y aparece en el mapa gastronómico de Santiago. Sin comisiones por reserva.
          </p>

          {/* Beneficios */}
          <div className="dc-benefits-grid">
            {[
              { icono: "🎪", titulo: "Concursos virales",   desc: "Tus clientes compiten por comer gratis. La plataforma lo gestiona." },
              { icono: "📊", titulo: "Panel de control",    desc: "Estadísticas en tiempo real, ranking y gestión del menú." },
              { icono: "🧞", titulo: "El Genio recomienda", desc: "Tu local aparece en las sugerencias personalizadas del Genio." },
            ].map(b => (
              <div key={b.titulo} style={{
                padding: "28px 20px",
                background: "rgba(0,0,0,0.2)",
                borderRadius: "16px",
                border: "1px solid var(--border-color)",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "12px" }}>{b.icono}</div>
                <p style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.75rem",
                  color: "var(--accent)",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                }}>{b.titulo}</p>
                <p style={{
                  fontFamily: "var(--font-lato)",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.6,
                  fontWeight: 300,
                }}>{b.desc}</p>
              </div>
            ))}
          </div>

          <div className="dc-cta-btns">
            <a href="/registro" style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.85rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "var(--accent)",
              color: "var(--bg-primary)",
              padding: "18px 44px",
              borderRadius: "50px",
              textDecoration: "none",
              fontWeight: 700,
              boxShadow: "0 0 40px color-mix(in srgb, var(--accent) 35%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: "56px",
            }}>
              Registra tu Local Gratis
            </a>
            <a href="/panel/dashboard" style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.85rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: "1px solid rgba(61,184,158,0.5)",
              color: "var(--oasis-bright)",
              padding: "18px 44px",
              borderRadius: "50px",
              textDecoration: "none",
              fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: "56px",
            }}>
              Ver Demo del Panel
            </a>
          </div>

          <p style={{
            fontFamily: "var(--font-lato)",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            marginTop: "24px",
          }}>
            Sin tarjeta de crédito · Primeros 3 concursos gratis · Cancela cuando quieras
          </p>
        </div>
      </div>

      <style>{`
        .dc-cta-section    { padding: 72px 60px; }
        .dc-cta-card       { padding: 48px 60px; }
        .dc-benefits-grid  {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 56px;
        }
        .dc-cta-btns {
          display: flex; gap: 16px;
          justify-content: center; flex-wrap: wrap;
        }

        @media (max-width: 767px) {
          .dc-cta-section   { padding: 72px 20px; }
          .dc-cta-card      { padding: 36px 24px; border-radius: 24px; }
          .dc-benefits-grid { grid-template-columns: 1fr; gap: 12px; margin-bottom: 36px; }
          .dc-cta-btns      { flex-direction: column; align-items: center; }
          .dc-cta-btns a    { width: 100%; max-width: 320px; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-cta-section { padding: 100px 40px; }
          .dc-cta-card    { padding: 60px 48px; }
        }
      `}</style>
    </section>
  );
}
