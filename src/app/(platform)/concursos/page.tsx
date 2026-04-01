"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SelloGratis from "@/components/SelloGratis";

import {
  CONCURSOS,
  getTimeLeft,
  isSoonEnding,
  pad2,
  type Concurso,
} from "@/lib/mockConcursos";

type Filter = "todos" | "activos" | "por_terminar" | "ganadores";
interface TimeLeft { dias: number; horas: number; minutos: number; segundos: number; ended: boolean }

export default function ConcursosPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("todos");
  const [timers, setTimers] = useState<Record<string, TimeLeft>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [concursos, setConcursos] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/concursos").then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setConcursos(data.map((c: any) => ({
          id: c.id, slug: c.slug ?? c.id, local: c.local?.nombre ?? "Local",
          localId: c.local?.id ?? "", localLogoUrl: c.local?.logoUrl ?? null,
          imagenUrl: c.imagenUrl ?? "", premio: c.premio ?? "",
          descripcionPremio: c.descripcion ?? "",
          participantes: c._count?.participantes ?? 0,
          endsAt: new Date(c.fechaFin).getTime(),
          ranking: (c.participantes ?? []).slice(0, 3).map((p: { usuario?: { nombre?: string }; puntos?: number }) => ({ nombre: p.usuario?.nombre ?? "Participante", refs: p.puntos ?? 0 })),
        })));
      }
    }).catch(() => {});
  }, []);

  const updateTimers = useCallback(() => {
    const next: Record<string, TimeLeft> = {};
    for (const c of concursos) next[c.id] = getTimeLeft(c.endsAt);
    setTimers(next);
  }, [concursos]);

  useEffect(() => {
    updateTimers();
    const id = setInterval(updateTimers, 1000);
    return () => clearInterval(id);
  }, [updateTimers]);

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "activos", label: "Activos" },
    { key: "por_terminar", label: "Por terminar" },
    { key: "ganadores", label: "Ganadores 🏆" },
  ];

  const sorted = [...concursos].filter(c => {
    const ended = getTimeLeft(c.endsAt).ended;
    const soon = isSoonEnding(c.endsAt);
    if (filter === "activos") return !ended && !soon;
    if (filter === "por_terminar") return !ended && soon;
    if (filter === "ganadores") return false;
    return !ended; // todos
  }).sort((a, b) => {
    const sA = isSoonEnding(a.endsAt), sB = isSoonEnding(b.endsAt);
    if (sA && !sB) return -1; if (!sA && sB) return 1;
    return a.endsAt - b.endsAt;
  });

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Header */}
      <section className="dc-cp-hero">
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 65%)" }} />
        <div style={{ position: "relative", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem, 2vw, 0.85rem)", letterSpacing: "0.45em", textTransform: "uppercase", color: "var(--oasis-bright)", marginBottom: 16 }}>Concursos</p>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.8rem, 5vw, 3.5rem)", fontWeight: 800, letterSpacing: "0.02em", color: "var(--accent)", textShadow: "0 0 60px color-mix(in srgb, var(--accent) 50%, transparent)", marginBottom: 20, lineHeight: 1.1 }}>
            Gana Comida Gratis
          </h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(1rem, 2.5vw, 1.15rem)", color: "var(--text-primary)", fontWeight: 400, maxWidth: 520, margin: "0 auto", lineHeight: 1.8 }}>
            Participa gratis, sube en el ranking y gana comida de los mejores restaurantes.
          </p>
          <div style={{ marginTop: 12 }}>
            <Link href="/concursos/como-funciona" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.1em", color: "rgba(240,234,214,0.35)", textDecoration: "none", borderBottom: "1px solid rgba(240,234,214,0.15)", paddingBottom: 2 }}>
              ¿No sabes cómo funciona? Aprende aquí →
            </Link>
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="dc-cp-content">
        <div className="dc-cp-filters">
          {filters.map(({ key, label }) => (
            <button key={key} onClick={() => { if (key === "ganadores") { router.push("/concursos/ganadores"); return; } setFilter(key); }} className={`dc-cp-fbtn${filter === key ? " dc-cp-fbtn--on" : ""}`}>
              {label}
              {key === "por_terminar" && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#ff4444", marginLeft: 7, verticalAlign: "middle", boxShadow: "0 0 6px #ff4444" }} />}
            </button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontSize: "3rem", marginBottom: 16 }}>🧞</p>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.95rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 6 }}>No hay concursos activos en este momento.</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.35)" }}>Vuelve pronto 🧞</p>
          </div>
        ) : (
          <div className="dc-cp-grid">
            {sorted.map(c => {
              const t = timers[c.id];
              const soon = isSoonEnding(c.endsAt);
              const urg = "#e05555";
              const localInitial = c.local?.[0] ?? "L";

              return (
                <div key={c.id} onClick={() => router.push(`/concursos/${c.slug}`)} style={{
                  background: "rgba(15,10,28,0.98)", border: `1px solid ${soon ? "rgba(224,85,85,0.45)" : "rgba(232,168,76,0.2)"}`,
                  borderRadius: 20, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
                >
                  {/* Image */}
                  <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
                    {c.imagenUrl ? <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
                      : <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #1a0f2e, #2d1a08)" }} />}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(10,8,18,0) 30%, rgba(10,8,18,0.75) 100%)" }} />

                    <div style={{ position: "absolute", top: 0, right: 0, zIndex: 3, lineHeight: 0 }}><SelloGratis size="sm" /></div>

                    {/* Badge urgente */}
                    {soon && (
                      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3, background: "rgba(224,85,85,0.15)", border: "1px solid rgba(224,85,85,0.5)", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: urg, animation: "dc-pd 0.8s ease-in-out infinite" }} />
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700, color: urg }}>¡Termina pronto!</span>
                      </div>
                    )}

                  </div>

                  {/* Body */}
                  <div style={{ padding: "14px 16px 16px" }}>
                    {/* Local */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      {c.localLogoUrl ? <img src={c.localLogoUrl} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(232,168,76,0.4)" }} />
                        : <div style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid rgba(232,168,76,0.4)", background: "#0a0812", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700, color: "#e8a84c" }}>{localInitial}</div>}
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(240,234,214,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.local}</span>
                    </div>
                    {/* Título */}
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: 17, color: "#f5d080", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em", lineHeight: 1.2, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 16 }}>🏆</span>{c.premio}</p>
                    {c.descripcionPremio && <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "rgba(240,234,214,0.38)", fontStyle: "italic", lineHeight: 1.35, marginBottom: 12 }}>{c.descripcionPremio}</p>}

                    {/* Countdown */}
                    {t && !t.ended && (
                      <div style={{ background: "rgba(10,8,18,0.7)", border: `1px solid ${soon ? "rgba(224,85,85,0.3)" : "rgba(232,168,76,0.15)"}`, borderRadius: 10, padding: "10px 8px", display: "flex", justifyContent: "center", gap: 2, marginBottom: 12 }}>
                        {[
                          ...(t.dias > 0 ? [{ v: t.dias, l: "días" }] : []),
                          { v: t.horas, l: "hrs" }, { v: t.minutos, l: "min" }, { v: t.segundos, l: "seg" },
                        ].map(({ v, l }, i, arr) => (
                          <div key={l} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <div style={{ textAlign: "center" }}>
                              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 24, fontWeight: 700, color: soon ? urg : "rgba(240,234,214,0.9)", lineHeight: 1, minWidth: 32 }}>{pad2(v)}</div>
                              <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 10, color: "rgba(240,234,214,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 1 }}>{l}</div>
                            </div>
                            {i < arr.length - 1 && <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 18, color: soon ? "rgba(224,85,85,0.3)" : "rgba(240,234,214,0.2)", marginBottom: 10 }}>:</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Participantes */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.3)" }}>Participantes</span>
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.5)", fontWeight: 600 }}>{c.participantes}</span>
                    </div>

                    {/* Top 3 */}
                    {c.ranking.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        {c.ranking.map((r: { nombre: string; refs: number }, i: number) => {
                          const posC = [
                            { bg: "rgba(232,168,76,0.2)", c: "#e8a84c", bd: "rgba(232,168,76,0.35)" },
                            { bg: "rgba(180,180,180,0.08)", c: "rgba(200,200,200,0.55)", bd: "rgba(180,180,180,0.12)" },
                            { bg: "rgba(180,100,50,0.12)", c: "rgba(200,140,80,0.65)", bd: "rgba(180,100,50,0.15)" },
                          ][i] ?? { bg: "rgba(255,255,255,0.03)", c: "rgba(240,234,214,0.3)", bd: "rgba(255,255,255,0.06)" };
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: i < c.ranking.length - 1 ? "1px solid rgba(232,168,76,0.05)" : "none" }}>
                              <div style={{ width: 18, height: 18, borderRadius: "50%", background: posC.bg, border: `1px solid ${posC.bd}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 700, color: posC.c, flexShrink: 0 }}>{i + 1}</div>
                              <span style={{ flex: 1, fontFamily: "var(--font-lato)", fontSize: 14, color: "rgba(240,234,214,0.6)" }}>{r.nombre}</span>
                              <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.28)", letterSpacing: "0.04em" }}>{r.refs} refs</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* CTA */}
                    <button onClick={e => { e.stopPropagation(); router.push(`/concursos/${c.slug}`); }} style={{
                      width: "100%", padding: 13, borderRadius: 10, cursor: "pointer",
                      fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      background: soon ? urg : "#e8a84c", border: "none", color: soon ? "#fff" : "#0a0812",
                    }}>
                      {soon ? "¡Participar ya! →" : "Participar →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />

      <style>{`
        .dc-cp-hero { position: relative; overflow: hidden; padding: 140px 60px 80px; text-align: center; }
        .dc-cp-content { padding: 0 60px 60px; max-width: 900px; margin: 0 auto; }
        .dc-cp-filters { display: flex; gap: 10px; flex-wrap: nowrap; justify-content: center; margin-bottom: 40px; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
        .dc-cp-filters::-webkit-scrollbar { display: none; }
        .dc-cp-fbtn { font-family: var(--font-cinzel); font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 10px 20px; border-radius: 30px; cursor: pointer; border: 1px solid var(--border-color); background: transparent; color: var(--text-muted); transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; min-height: 44px; flex-shrink: 0; }
        .dc-cp-fbtn:hover { border-color: var(--accent); color: var(--accent); }
        .dc-cp-fbtn--on { background: color-mix(in srgb, var(--accent) 15%, transparent); border-color: var(--accent); color: var(--accent); }
        .dc-cp-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @keyframes dc-pd { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @media (max-width: 767px) {
          .dc-cp-hero { padding: 100px 20px 50px; }
          .dc-cp-content { padding: 0 14px 60px; }
          .dc-cp-filters { justify-content: flex-start; }
        }
        @media (min-width: 1024px) {
          .dc-cp-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
        }
      `}</style>
    </main>
  );
}
