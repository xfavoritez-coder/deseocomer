"use client";

const concursosMock = [
  {
    id: 1, local: "Pizza Napoli", premio: "Pizza familiar gratis",
    participantes: 342, horasRestantes: 18, imagen: "🍕",
    topRanking: [
      { nombre: "Valentina R.", referidos: 47 },
      { nombre: "Diego M.",     referidos: 38 },
      { nombre: "Sofía L.",     referidos: 29 },
    ],
  },
  {
    id: 2, local: "Sushi Oasis", premio: "Menú omakase para 2",
    participantes: 218, horasRestantes: 6, imagen: "🍣",
    topRanking: [
      { nombre: "Matías C.",  referidos: 61 },
      { nombre: "Isidora P.", referidos: 44 },
      { nombre: "Tomás A.",   referidos: 31 },
    ],
  },
  {
    id: 3, local: "El Menú de Don Carlos", premio: "Almuerzo semanal gratis",
    participantes: 589, horasRestantes: 42, imagen: "🍲",
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

        <div style={{ textAlign: "center", marginBottom: "80px" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.7rem",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--oasis-bright)",
            marginBottom: "16px",
          }}>
            Concursos Activos
          </p>
          <h2 style={{
            fontFamily: "var(--font-cinzel-decorative)",
            fontSize: "clamp(1.8rem, 5vw, 3.5rem)",
            color: "var(--accent)",
            textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
            marginBottom: "20px",
          }}>
            Gana Comida Gratis 🎪
          </h2>
          <p style={{
            fontFamily: "var(--font-lato)",
            fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
            color: "var(--text-primary)",
            fontWeight: 300,
            maxWidth: "500px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}>
            Comparte tu link con amigos y sube en el ranking. Los mejores ganan premios reales cada semana.
          </p>
        </div>

        <div className="dc-cst-grid">
          {concursosMock.map((c) => (
            <div key={c.id}
              className="dc-cst-card"
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(-6px)";
                el.style.setProperty("border-color", "var(--accent)");
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = "translateY(0)";
                el.style.setProperty("border-color", "var(--border-color)");
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <span style={{ fontSize: "3rem", flexShrink: 0 }}>{c.imagen}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.65rem",
                    letterSpacing: "0.2em",
                    color: "var(--oasis-bright)",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}>{c.local}</p>
                  <p style={{
                    fontFamily: "var(--font-cinzel-decorative)",
                    fontSize: "1rem",
                    color: "var(--accent)",
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
                <div style={{ textAlign: "center", flex: 1 }}>
                  <p style={{
                    fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem",
                    color: c.horasRestantes <= 12 ? "#ff6b6b" : "var(--oasis-bright)",
                  }}>
                    {c.horasRestantes}h
                  </p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
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

              <button style={{
                width: "100%",
                background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
                border: "none", borderRadius: "12px",
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.75rem", letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--bg-primary)",
                fontWeight: 700, cursor: "pointer",
                minHeight: "52px",
              }}>
                Quiero Participar →
              </button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <a href="/concursos" style={{
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.8rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--accent)",
            textDecoration: "none",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "4px",
          }}>
            Ver todos los concursos →
          </a>
        </div>
      </div>

      <style>{`
        .dc-cst-section { padding: 120px 60px; }
        .dc-cst-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 28px;
        }
        .dc-cst-card { padding: 32px; }

        @media (max-width: 767px) {
          .dc-cst-section { padding: 72px 20px; }
          .dc-cst-grid    { grid-template-columns: 1fr; gap: 16px; }
          .dc-cst-card    { padding: 22px; }
        }
        @media (min-width: 768px) and (max-width: 1279px) {
          .dc-cst-section { padding: 100px 40px; }
          .dc-cst-grid    { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </section>
  );
}
