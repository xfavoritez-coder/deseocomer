"use client";

const concursosMock = [
  {
    id: 1, local: "Pizza Napoli", premio: "Pizza familiar gratis",
    participantes: 342, horasRestantes: 18, imagen: "🍕",
    imagenUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
    topRanking: [
      { nombre: "Valentina R.", referidos: 47 },
      { nombre: "Diego M.",     referidos: 38 },
      { nombre: "Sofía L.",     referidos: 29 },
    ],
  },
  {
    id: 2, local: "Sushi Oasis", premio: "Menú omakase para 2",
    participantes: 218, horasRestantes: 6, imagen: "🍣",
    imagenUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600",
    topRanking: [
      { nombre: "Matías C.",  referidos: 61 },
      { nombre: "Isidora P.", referidos: 44 },
      { nombre: "Tomás A.",   referidos: 31 },
    ],
  },
  {
    id: 3, local: "El Menú de Don Carlos", premio: "Almuerzo semanal gratis",
    participantes: 589, horasRestantes: 42, imagen: "🍲",
    imagenUrl: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600",
    topRanking: [
      { nombre: "Catalina V.", referidos: 93 },
      { nombre: "Benjamín S.", referidos: 77 },
      { nombre: "Antonia F.",  referidos: 65 },
    ],
  },
];

export default function ConcursosSection() {
  return (
    <section className="dc-cst-section" style={{ backgroundColor: "var(--bg-primary)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "clamp(0.75rem, 2vw, 0.85rem)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--color-label)",
            marginBottom: "16px",
          }}>
            Concursos Activos
          </p>
          <h2 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            fontWeight: 800, letterSpacing: "0.02em",
            color: "var(--color-title)",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "20px",
          }}>
            Gana Comida Gratis
          </h2>
          <p className="section-description">
            Comparte tu link con amigos y sube en el ranking. Los mejores ganan premios reales cada semana.
          </p>
        </div>

        <div className="dc-cst-grid">
          {concursosMock.map((c) => (
            <a key={c.id}
              href={`/concursos/${c.id}`}
              className="dc-cst-card"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "transform 0.2s ease, border-color 0.2s ease",
                textDecoration: "none",
                display: "block",
                color: "inherit",
              }}
            >
              <div style={{ height: "160px", overflow: "hidden", borderRadius: "20px 20px 0 0", flexShrink: 0, pointerEvents: "none", background: "rgba(45,26,8,0.8)", position: "relative" }}>
                <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{
                  position: "absolute", top: "14px", right: "-28px",
                  background: "linear-gradient(135deg, #f5d080, #e8a84c, #c4853a)",
                  color: "#1a0e05", fontFamily: "var(--font-cinzel)", fontSize: "0.55rem",
                  fontWeight: 900, letterSpacing: "0.12em", padding: "6px 40px",
                  transform: "rotate(35deg)", boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                  whiteSpace: "nowrap",
                }}>
                  🏆 PREMIO GRATIS
                </div>
              </div>
              <div style={{ padding: "24px 24px 0", pointerEvents: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.65rem",
                      letterSpacing: "0.2em",
                      color: "var(--color-label)",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}>{c.local}</p>
                    <p style={{
                      fontFamily: "var(--font-cinzel-decorative)",
                      fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
                      color: "var(--color-title)",
                    }}>{c.premio}</p>
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  display: "flex", gap: "20px",
                  marginBottom: "24px", padding: "16px",
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: "12px",
                }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)" }}>
                      {c.participantes}
                    </p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                      PARTICIPANTES
                    </p>
                  </div>
                  <div style={{ width: "1px", background: "var(--border-color)" }} />
                  <div style={{ textAlign: "center", flex: 1, paddingRight: "4px" }}>
                    <p style={{
                      fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem",
                      color: c.horasRestantes <= 2 ? "#ff4444" : c.horasRestantes <= 6 ? "#ff6b6b" : "var(--oasis-bright)",
                      animation: c.horasRestantes <= 2 ? "dc-cst-pulse 1.5s ease-in-out infinite" : "none",
                    }}>
                      {c.horasRestantes}h
                    </p>
                    <p style={{
                      fontFamily: "var(--font-lato)", fontSize: "0.65rem", letterSpacing: "0.08em", fontWeight: 700,
                      color: c.horasRestantes <= 2 ? "#ff4444" : c.horasRestantes <= 6 ? "#ff6b6b" : "var(--text-muted)",
                      whiteSpace: "nowrap",
                    }}>
                      RESTANTES
                    </p>
                  </div>
                </div>

                {/* Ranking top 3 */}
                <div style={{ marginBottom: "24px" }}>
                  {c.topRanking.map((r, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0",
                      borderBottom: i < 2 ? "1px solid var(--border-color)" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1rem" }}>{["🥇","🥈","🥉"][i]}</span>
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                          {r.nombre}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "var(--oasis-bright)", whiteSpace: "nowrap", paddingLeft: "8px" }}>
                        {r.referidos} amigos
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <a href="/concursos" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.8rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--color-link)",
            textDecoration: "none",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "4px",
            transition: "border-color 0.2s",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-color)"; }}
          >
            Ver todos los concursos →
          </a>
        </div>
      </div>

      <style>{`
        .dc-cst-section { padding: 64px 60px 32px; }
        .dc-cst-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 28px;
        }
        .dc-cst-card { padding: 0; overflow: hidden; }
        .dc-cst-card:hover { transform: translateY(-6px); border-color: var(--accent) !important; }
        @keyframes dc-cst-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 767px) {
          .dc-cst-section { padding: 48px 20px 24px; }
          .dc-cst-grid    { display: flex !important; flex-direction: row; overflow-x: auto; gap: 16px; padding-bottom: 8px; scrollbar-width: none; -ms-overflow-style: none; }
          .dc-cst-grid::-webkit-scrollbar { display: none; }
          .dc-cst-card    { flex-shrink: 0 !important; width: 300px !important; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-cst-section { padding: 100px 40px; }
          .dc-cst-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
}
