"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getAllRefCounts } from "@/lib/referrals";
import { CONCURSOS, CONCURSOS_FINALIZADOS } from "@/lib/mockConcursos";

export default function PerfilPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  const [refCounts, setRefCounts] = useState<Array<{ concursoId: number; count: number }>>([]);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login?next=/perfil");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) setRefCounts(getAllRefCounts(user.id));
  }, [user]);

  if (isLoading || !user) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ padding: "160px 40px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🏮</div>
        </div>
      </main>
    );
  }

  const copyLink = async (concursoId: number) => {
    const url = `https://deseocomer.com/concursos/${concursoId}?ref=${user.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(concursoId);
      setTimeout(() => setCopied(null), 2500);
    } catch { /* noop */ }
  };

  const getConcursoName = (id: number) => {
    const c = CONCURSOS.find(x => x.id === id) ?? CONCURSOS_FINALIZADOS.find(x => x.id === id);
    return c ? { nombre: c.premio, local: c.local, imagen: c.imagen } : null;
  };

  const firstName = user.nombre.split(" ")[0];
  const initials  = user.nombre
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const totalRefs = refCounts.reduce((s, r) => s + r.count, 0);

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      <div className="dc-pf-wrap">

        {/* ── Header card ── */}
        <div className="dc-pf-header">
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "color-mix(in srgb, var(--accent) 20%, var(--bg-primary))",
            border: "2px solid var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.6rem",
            color: "var(--accent)", flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: "var(--font-cinzel)", fontSize: "0.6rem",
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: "var(--oasis-bright)", marginBottom: "8px",
            }}>
              {user.type === "local" ? "Local registrado" : "Usuario"}
            </p>
            <h1 style={{
              fontFamily: "var(--font-cinzel-decorative)",
              fontSize: "clamp(1.4rem, 4vw, 2rem)",
              color: "var(--accent)", marginBottom: "6px",
            }}>
              {user.nombre}
            </h1>
            <p style={{
              fontFamily: "var(--font-lato)", fontSize: "0.88rem",
              color: "var(--text-muted)",
            }}>
              {user.email}{user.comuna ? ` · ${user.comuna}` : ""}
            </p>
          </div>
          <button
            onClick={() => { logout(); router.push("/"); }}
            style={{
              alignSelf: "flex-start",
              fontFamily: "var(--font-cinzel)", fontSize: "0.6rem",
              letterSpacing: "0.12em", textTransform: "uppercase",
              background: "transparent",
              border: "1px solid var(--border-color)",
              borderRadius: "20px", padding: "8px 18px",
              color: "var(--text-muted)", cursor: "pointer",
              transition: "border-color 0.2s, color 0.2s",
            }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="dc-pf-stats">
          {[
            { label: "Referidos totales", value: totalRefs, icon: "👥" },
            { label: "Concursos activos", value: refCounts.filter(r => CONCURSOS.some(c => c.id === r.concursoId)).length, icon: "🎪" },
            { label: "Puntos en concursos", value: refCounts.length, icon: "🏆" },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px", padding: "24px 20px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "10px" }}>{s.icon}</div>
              <p style={{
                fontFamily: "var(--font-cinzel-decorative)",
                fontSize: "clamp(1.4rem, 4vw, 2rem)",
                color: "var(--accent)", lineHeight: 1,
              }}>
                {s.value}
              </p>
              <p style={{
                fontFamily: "var(--font-cinzel)", fontSize: "0.55rem",
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: "var(--text-muted)", marginTop: "6px",
              }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Referrals section ── */}
        <div style={{ marginBottom: "48px" }}>
          <p style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.62rem",
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "var(--accent)", marginBottom: "22px",
            paddingBottom: "12px", borderBottom: "1px solid var(--border-color)",
          }}>
            Tus referidos por concurso
          </p>

          {refCounts.length === 0 ? (
            <div style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px", padding: "48px 32px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔗</div>
              <p style={{
                fontFamily: "var(--font-cinzel-decorative)", fontSize: "1rem",
                color: "var(--accent)", marginBottom: "8px",
              }}>
                Aún no tienes referidos
              </p>
              <p style={{
                fontFamily: "var(--font-lato)", fontSize: "0.88rem",
                color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6,
              }}>
                Comparte tu link de un concurso para empezar a sumar puntos.
              </p>
              <Link href="/concursos" style={{
                fontFamily: "var(--font-cinzel)", fontSize: "0.65rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                background: "var(--accent)", color: "var(--bg-primary)",
                fontWeight: 700, padding: "12px 28px", borderRadius: "30px",
                textDecoration: "none",
              }}>
                Ver concursos
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {refCounts.map(({ concursoId, count }) => {
                const info = getConcursoName(concursoId);
                const isActive = CONCURSOS.some(c => c.id === concursoId);
                const refLink = `https://deseocomer.com/concursos/${concursoId}?ref=${user.id}`;

                return (
                  <div key={concursoId} style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "16px", padding: "22px 24px",
                  }}>
                    {/* Top row */}
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: "14px", marginBottom: "16px", flexWrap: "wrap",
                    }}>
                      <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>
                        {info?.imagen ?? "🎪"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <Link href={`/concursos/${concursoId}`} style={{
                            fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.95rem",
                            color: "var(--accent)", textDecoration: "none",
                          }}>
                            {info?.nombre ?? `Concurso #${concursoId}`}
                          </Link>
                          <span style={{
                            fontFamily: "var(--font-cinzel)", fontSize: "0.5rem",
                            letterSpacing: "0.15em", textTransform: "uppercase",
                            color: isActive ? "#3db89e" : "var(--text-muted)",
                            background: isActive ? "rgba(61,184,158,0.1)" : "rgba(0,0,0,0.2)",
                            border: `1px solid ${isActive ? "rgba(61,184,158,0.3)" : "var(--border-color)"}`,
                            borderRadius: "10px", padding: "3px 8px",
                          }}>
                            {isActive ? "Activo" : "Finalizado"}
                          </span>
                        </div>
                        {info && (
                          <p style={{
                            fontFamily: "var(--font-lato)", fontSize: "0.78rem",
                            color: "var(--text-muted)", marginTop: "3px",
                          }}>
                            {info.local}
                          </p>
                        )}
                      </div>
                      <div style={{
                        flexShrink: 0, textAlign: "center",
                        background: "color-mix(in srgb, var(--accent) 10%, var(--bg-primary))",
                        border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                        borderRadius: "12px", padding: "10px 18px",
                      }}>
                        <p style={{
                          fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem",
                          color: "var(--accent)", lineHeight: 1,
                        }}>
                          {count}
                        </p>
                        <p style={{
                          fontFamily: "var(--font-cinzel)", fontSize: "0.48rem",
                          letterSpacing: "0.15em", textTransform: "uppercase",
                          color: "var(--oasis-bright)", marginTop: "4px",
                        }}>
                          referido{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Link row */}
                    {isActive && (
                      <div style={{
                        display: "flex", gap: "10px", alignItems: "center",
                        background: "rgba(0,0,0,0.25)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "10px", padding: "10px 14px",
                      }}>
                        <p style={{
                          fontFamily: "var(--font-lato)", fontSize: "0.72rem",
                          color: "var(--text-muted)", flex: 1,
                          wordBreak: "break-all",
                        }}>
                          {refLink}
                        </p>
                        <button
                          onClick={() => copyLink(concursoId)}
                          style={{
                            flexShrink: 0,
                            background: copied === concursoId
                              ? "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))"
                              : "transparent",
                            border: "1px solid var(--accent)",
                            borderRadius: "8px",
                            fontFamily: "var(--font-cinzel)", fontSize: "0.58rem",
                            letterSpacing: "0.1em", textTransform: "uppercase",
                            color: copied === concursoId ? "var(--bg-primary)" : "var(--accent)",
                            padding: "8px 16px", cursor: "pointer",
                            fontWeight: 700, transition: "all 0.2s",
                            minHeight: "36px",
                          }}
                        >
                          {copied === concursoId ? "✓ Copiado" : "Copiar link"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Quick links ── */}
        <div style={{ textAlign: "center" }}>
          <Link href="/concursos" style={{
            fontFamily: "var(--font-cinzel)", fontSize: "0.75rem",
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--oasis-bright)", textDecoration: "none",
            borderBottom: "1px solid rgba(61,184,158,0.4)", paddingBottom: "3px",
          }}>
            ← Ir a concursos
          </Link>
        </div>
      </div>

      <Footer />

      <style>{`
        .dc-pf-wrap {
          max-width: 860px;
          margin: 0 auto;
          padding: 100px 60px 80px;
        }
        .dc-pf-header {
          display: flex;
          align-items: center;
          gap: 24px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 28px 32px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .dc-pf-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .dc-pf-stats > div { min-width: 160px; }

        @media (max-width: 767px) {
          .dc-pf-wrap    { padding: 80px 20px 60px; }
          .dc-pf-header  { padding: 20px; gap: 16px; }
          .dc-pf-stats   { gap: 12px; }
          .dc-pf-stats > div { flex: 1; min-width: 100px; padding: 18px 12px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-pf-wrap { padding: 100px 40px 60px; }
        }
      `}</style>
    </main>
  );
}
