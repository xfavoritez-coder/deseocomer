"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SelloGratis from "@/components/SelloGratis";
import { useAuth } from "@/contexts/AuthContext";
import { boostScore } from "@/lib/personalizacion";

import {
  CONCURSOS,
  getTimeLeft,
  isSoonEnding,
  pad2,
  type Concurso,
} from "@/lib/mockConcursos";

type Filter = "todos" | "activos" | "por_terminar" | "finalizados";
interface TimeLeft { dias: number; horas: number; minutos: number; segundos: number; ended: boolean }

export default function ConcursosPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<Filter>("todos");
  const [timers, setTimers] = useState<Record<string, TimeLeft>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [concursos, setConcursos] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [finalizados, setFinalizados] = useState<any[]>([]);
  const [finalizadosLoading, setFinalizadosLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [misConcursos, setMisConcursos] = useState<Set<string>>(new Set());

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
          createdAt: c.createdAt ?? c.fechaInicio ?? null,
          localCategoria: c.local?.categoria ?? "",
          localComuna: c.local?.comuna ?? "",
          estado: c.estado ?? "activo",
          modalidadConcurso: c.modalidadConcurso ?? "meritos",
          fechaActivacion: c.fechaActivacion ?? null,
          listaEsperaCount: c._count?.listaEspera ?? 0,
          ranking: (c.participantes ?? []).slice(0, 3).map((p: { usuario?: { nombre?: string }; puntos?: number }) => ({ nombre: p.usuario?.nombre ?? "Participante", refs: p.puntos ?? 0 })),
        })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    fetch(`/api/usuarios/${user.id}/participaciones`)
      .then(r => r.ok ? r.json() : [])
      .then(ids => { if (Array.isArray(ids)) setMisConcursos(new Set(ids)); })
      .catch(() => {});
  }, [isAuthenticated, user?.id]);

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
    { key: "finalizados", label: "Finalizados" },
  ];

  function scoreConcurso(c: typeof concursos[0]): number {
    const ahora = Date.now();
    const horasRestantes = (c.endsAt - ahora) / 3600000;
    const createdAt = (c as unknown as Record<string, unknown>).createdAt;
    const horasDesdeCreacion = createdAt ? (ahora - new Date(createdAt as string).getTime()) / 3600000 : 999;
    let score = 0;
    if (horasRestantes <= 24) score += 10000;
    else if (horasRestantes <= 72) score += 5000;
    if (horasDesdeCreacion <= 24) score += 2000;
    const participantesRecientes = ((c as unknown as Record<string, unknown>).participantesRecientes as number) ?? 0;
    score += participantesRecientes * 100;
    score += Math.min(c.participantes, 50) * 2;
    const diasTotales = (c.endsAt - new Date((createdAt as string) ?? Date.now()).getTime()) / 86400000;
    if (diasTotales > 5 && participantesRecientes === 0) score -= 500;
    // Personalization boost
    const cat = (c as any).localCategoria;
    const com = (c as any).localComuna;
    score += boostScore(cat, com) * 50;
    return score;
  }

  const sorted = [...concursos].filter(c => {
    const ended = getTimeLeft(c.endsAt).ended;
    const sa = c.fechaActivacion ? new Date(c.fechaActivacion).getTime() : null;
    const soon = isSoonEnding(c.endsAt, sa);
    if (filter === "activos") return !ended && !soon && c.estado !== "programado";
    if (filter === "por_terminar") return !ended && soon && c.estado !== "programado";
    if (filter === "finalizados") return false;
    return true;
  }).sort((a, b) => {
    const endedA = getTimeLeft(a.endsAt).ended;
    const endedB = getTimeLeft(b.endsAt).ended;
    // Programados siempre al final (después de activos, antes de finalizados)
    if (a.estado === "programado" && b.estado !== "programado") return 1;
    if (b.estado === "programado" && a.estado !== "programado") return -1;
    // Finalizados siempre al final
    if (endedA && !endedB) return 1;
    if (!endedA && endedB) return -1;
    if (endedA && endedB) return b.endsAt - a.endsAt;
    return scoreConcurso(b) - scoreConcurso(a);
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
            <button key={key} onClick={() => { if (key === "finalizados" && finalizados.length === 0 && !finalizadosLoading) { setFinalizadosLoading(true); fetch("/api/concursos/finalizados").then(r => r.json()).then(data => { if (Array.isArray(data)) setFinalizados(data); }).catch(() => {}).finally(() => setFinalizadosLoading(false)); } setFilter(key); }} className={`dc-cp-fbtn${filter === key ? " dc-cp-fbtn--on" : ""}`}>
              {label}
              {key === "por_terminar" && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#ff4444", marginLeft: 7, verticalAlign: "middle", boxShadow: "0 0 6px #ff4444" }} />}
            </button>
          ))}
        </div>

        {filter === "finalizados" ? (
          finalizadosLoading ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>Cargando concursos finalizados...</p>
            </div>
          ) : finalizados.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <p style={{ fontSize: "3rem", marginBottom: 16 }}>🏆</p>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.95rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 6 }}>Aún no hay concursos finalizados</p>
            </div>
          ) : (
            <div className="dc-cp-grid">
              {finalizados.map((c) => {
                const estado = c.estado ?? "finalizado";
                const estadoConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
                  finalizado: { label: "Esperando entrega", color: "#e8a84c", bg: "rgba(232,168,76,0.08)", border: "rgba(232,168,76,0.25)" },
                  en_revision: { label: "En revisión", color: "#e8a84c", bg: "rgba(232,168,76,0.08)", border: "rgba(232,168,76,0.25)" },
                  completado: { label: "Premio entregado", color: "#3db89e", bg: "rgba(61,184,158,0.08)", border: "rgba(61,184,158,0.25)" },
                  expirado: { label: "Expirado", color: "rgba(240,234,214,0.4)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.1)" },
                };
                const est = estadoConfig[estado] ?? estadoConfig.finalizado;
                const _fn = (n: string) => { const p = n.trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length-1][0]}.` : p[0]; };
                const ganadorNombre = c.ganadorActual?.nombre ? _fn(c.ganadorActual.nombre) : null;
                const localInitial = c.local?.nombre?.[0] ?? "L";

                return (
                  <div key={c.id} className="dc-cp-card" onClick={() => router.push(`/concursos/${c.slug || c.id}`)} style={{
                    background: "rgba(15,10,28,0.98)", border: `1px solid ${est.border}`,
                    borderRadius: 20, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s",
                  }}>
                    {/* Image */}
                    <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                      {c.imagenUrl ? <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
                        : <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #1a0f2e, #2d1a08)" }} />}
                      {/* Badge estado */}
                      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3, background: "rgba(10,8,18,0.8)", border: `1px solid ${est.border}`, borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: est.color }} />
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", color: est.color, textTransform: "uppercase" }}>{est.label}</span>
                      </div>
                    </div>
                    {/* Body */}
                    <div style={{ padding: "14px 16px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        {c.local?.logoUrl ? <img src={c.local.logoUrl} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(232,168,76,0.4)" }} />
                          : <div style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid rgba(232,168,76,0.4)", background: "#0a0812", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700, color: "#e8a84c" }}>{localInitial}</div>}
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(240,234,214,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.local?.nombre}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 17, color: "#f5d080", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em", lineHeight: 1.2, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>🏆 {c.premio}</div>

                      {/* Estado box */}
                      <div style={{ background: est.bg, border: `1px solid ${est.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 12, textAlign: "center" }}>
                        {ganadorNombre && estado === "completado" && (
                          <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: est.color, marginBottom: 2 }}>Ganador: <strong>{ganadorNombre}</strong></p>
                        )}
                        {ganadorNombre && estado === "finalizado" && (
                          <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "rgba(240,234,214,0.5)", marginBottom: 2 }}>Ganador: {ganadorNombre}</p>
                        )}
                        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", color: est.color, letterSpacing: "0.06em" }}>{est.label}</p>
                        {c.premioConfirmadoAt && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.3)", marginTop: 2 }}>{new Date(c.premioConfirmadoAt).toLocaleDateString("es-CL")}</p>}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                          👥 {c._count?.participantes ?? 0} participante{(c._count?.participantes ?? 0) !== 1 ? "s" : ""}
                        </span>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", color: "rgba(240,234,214,0.3)" }}>
                          {new Date(c.fechaFin).toLocaleDateString("es-CL")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : loading ? (
          <div className="dc-cp-grid">
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "rgba(15,10,28,0.98)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 20, overflow: "hidden" }}>
                <div style={{ height: 200, background: "linear-gradient(160deg, rgba(30,15,50,0.5), rgba(45,26,8,0.3))", animation: "dc-sk-pulse 1.5s ease-in-out infinite" }} />
                <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(232,168,76,0.1)", animation: "dc-sk-pulse 1.5s ease-in-out infinite" }} />
                    <div style={{ height: 10, width: 80, borderRadius: 4, background: "rgba(232,168,76,0.08)", animation: "dc-sk-pulse 1.5s ease-in-out infinite" }} />
                  </div>
                  <div style={{ height: 18, width: "75%", borderRadius: 4, background: "rgba(232,168,76,0.1)", animation: "dc-sk-pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 12, width: "90%", borderRadius: 4, background: "rgba(232,168,76,0.06)", animation: "dc-sk-pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ height: 48, borderRadius: 10, background: "rgba(232,168,76,0.06)", animation: "dc-sk-pulse 1.5s ease-in-out infinite", marginTop: 4 }} />
                  <div style={{ height: 44, borderRadius: 10, background: "rgba(232,168,76,0.08)", animation: "dc-sk-pulse 1.5s ease-in-out infinite" }} />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <p style={{ fontSize: "3rem", marginBottom: 16 }}>🧞</p>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.95rem", color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: 6 }}>No hay concursos activos en este momento.</p>
            <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.35)" }}>Vuelve pronto 🧞</p>
          </div>
        ) : (
          <div className="dc-cp-grid">
            {sorted.map(c => {
              const t = timers[c.id];
              const ended = t?.ended ?? (c.endsAt <= Date.now());
              const soon = !ended && isSoonEnding(c.endsAt, c.fechaActivacion ? new Date(c.fechaActivacion).getTime() : null);
              const urg = "#e05555";
              const localInitial = c.local?.[0] ?? "L";
              const horasRestantes = (c.endsAt - Date.now()) / 3600000;
              const createdAt = (c as unknown as Record<string, unknown>).createdAt;
              const horasDesdeCreacion = createdAt ? (Date.now() - new Date(createdAt as string).getTime()) / 3600000 : 999;
              const saCard = c.fechaActivacion ? new Date(c.fechaActivacion).getTime() : null;
              const esTerminaHoy = !ended && isSoonEnding(c.endsAt, saCard);
              const esNuevo = !ended && !esTerminaHoy && horasDesdeCreacion <= 24;

              return (
                <div key={c.id} className="dc-cp-card" onClick={() => router.push(`/concursos/${c.slug}`)} style={{
                  background: "rgba(15,10,28,0.98)", border: `1px solid ${soon ? "rgba(224,85,85,0.45)" : "rgba(232,168,76,0.2)"}`,
                  borderRadius: 20, overflow: "hidden", cursor: "pointer", transition: "transform 0.2s, border-color 0.2s",
                }}
                >
                  {/* Image */}
                  <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                    {c.imagenUrl ? <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
                      : <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #1a0f2e, #2d1a08)" }} />}

                    <div style={{ position: "absolute", top: 0, right: 0, zIndex: 3, lineHeight: 0 }}><SelloGratis size="sm" /></div>

                    {/* Badge */}
                    {esTerminaHoy && (
                      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3, background: "rgba(10,8,18,0.75)", border: "1px solid rgba(224,85,85,0.5)", borderRadius: 20, padding: "4px 10px 4px 6px", display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#e05555", animation: "dc-pd 0.8s ease-in-out infinite" }} />
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", color: "#e05555", textTransform: "uppercase" }}>¡Termina hoy!</span>
                      </div>
                    )}
                    {esNuevo && (
                      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3, background: "rgba(10,8,18,0.75)", border: "1px solid rgba(61,184,158,0.5)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", color: "#3db89e", textTransform: "uppercase" }}>Nuevo</span>
                      </div>
                    )}
                    {ended && c.estado !== "programado" && (
                      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3, background: "rgba(10,8,18,0.75)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.08em", color: "rgba(240,234,214,0.4)", textTransform: "uppercase" }}>Finalizado</span>
                      </div>
                    )}
                    {c.estado === "programado" && (
                      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3, background: "rgba(167,139,250,0.9)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "#0a0812", textTransform: "uppercase" }}>🔮 Próximamente</span>
                      </div>
                    )}
                    {c.modalidadConcurso === "sorteo" && (
                      <div style={{ position: "absolute", bottom: 12, left: 12, zIndex: 3, background: "rgba(236,72,153,0.9)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", color: "#fff", textTransform: "uppercase" }}>🎲 Sorteo</span>
                      </div>
                    )}

                  </div>

                  {/* Body */}
                  <div style={{ padding: "16px 20px 18px" }}>
                    {/* Local */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      {c.localLogoUrl ? <img src={c.localLogoUrl} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(232,168,76,0.4)" }} />
                        : <div style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px solid rgba(232,168,76,0.4)", background: "#0a0812", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 11, fontWeight: 700, color: "#e8a84c" }}>{localInitial}</div>}
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "rgba(240,234,214,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{c.local}</span>
                    </div>
                    {/* Título */}
                    <div style={{ fontFamily: "var(--font-cinzel)", fontSize: 17, color: "#f5d080", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em", lineHeight: 1.2, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}><span style={{ fontSize: 16 }}>🏆 </span>{c.premio}</div>
                    {c.descripcionPremio && <p style={{ fontFamily: "var(--font-lato)", fontSize: 14, color: "rgba(240,234,214,0.38)", fontStyle: "italic", lineHeight: 1.35, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{c.descripcionPremio}</p>}

                    {c.estado !== "programado" && c.participantes < 10 && (
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: 10, color: "#e8a84c", background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 20, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10 }}>⚡ +2 pts bonus primeros 10</span>
                    )}

                    {/* Programado info */}
                    {c.estado === "programado" && (() => {
                      const actMs = c.fechaActivacion ? new Date(c.fechaActivacion).getTime() - Date.now() : 0;
                      const actDias = Math.floor(actMs / 86400000);
                      const actHoras = Math.floor((actMs % 86400000) / 3600000);
                      const actTexto = actDias > 0 ? `${actDias} día${actDias > 1 ? "s" : ""} ${actHoras}h` : `${actHoras}h`;
                      const wc = c.listaEsperaCount ?? 0;
                      return (
                        <div style={{ marginBottom: 10 }}>
                          <p style={{ fontFamily: "var(--font-lato)", fontSize: 12, color: "#a78bfa", marginBottom: 4 }}>Se activa en {actTexto}</p>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 20, padding: "3px 10px", fontFamily: "var(--font-cinzel)", fontSize: "10px", fontWeight: 700, color: "#e8a84c", marginBottom: 4, whiteSpace: "nowrap" as const }}>⚡ Bonus +2 pts · primeros 10</span>
                        </div>
                      );
                    })()}

                    {/* Countdown */}
                    {t && !t.ended && c.estado !== "programado" && (
                      <div style={{ background: "rgba(10,8,18,0.7)", border: `1px solid ${soon ? "rgba(224,85,85,0.3)" : "rgba(232,168,76,0.15)"}`, borderRadius: 10, padding: "10px 8px", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, justifyContent: "center" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: soon ? urg : "#e8a84c", animation: `dc-pd ${soon ? "0.8s" : "1.8s"} ease-in-out infinite` }} />
                          <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: soon ? urg : "#e8a84c" }}>Termina en</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 2 }}>
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
                      </div>
                    )}

                    {/* Ended box */}
                    {ended && (
                      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px", textAlign: "center", marginBottom: 12 }}>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)", letterSpacing: "0.08em" }}>Concurso finalizado</span>
                      </div>
                    )}

                    {/* Participantes / En espera */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: "rgba(240,234,214,0.3)" }}>{c.estado === "programado" ? "En espera" : c.modalidadConcurso === "sorteo" ? "Boletos en juego" : "Participantes"}</span>
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: c.estado === "programado" ? "#a78bfa" : c.modalidadConcurso === "sorteo" ? "#ec4899" : "rgba(240,234,214,0.5)", fontWeight: 600 }}>{c.estado === "programado" ? `🔔 ${c.listaEsperaCount ?? 0} personas` : `${c.participantes}${c.modalidadConcurso === "sorteo" ? " 🎟️" : ""}`}</span>
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
                              <span style={{ flex: 1, fontFamily: "var(--font-lato)", fontSize: 14, color: "rgba(240,234,214,0.6)", textTransform: "capitalize" }}>{(() => { const parts = (r.nombre as string).trim().split(/\s+/); return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]; })()}</span>
                              <span style={{ fontFamily: "var(--font-lato)", fontSize: 13, color: c.modalidadConcurso === "sorteo" ? "rgba(236,72,153,0.5)" : "rgba(240,234,214,0.28)", letterSpacing: "0.04em" }}>{r.refs} {c.modalidadConcurso === "sorteo" ? "🎟️" : "refs"}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* CTA */}
                    {c.estado === "programado" ? (
                    <button onClick={e => { e.stopPropagation(); router.push(`/concursos/${c.slug}`); }} style={{
                      width: "100%", padding: 13, borderRadius: 10, cursor: "pointer",
                      fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center",
                      background: "transparent", border: "1px solid rgba(167,139,250,0.4)", color: "#a78bfa",
                    }}>
                      🔔 Avisarme →
                    </button>
                    ) : !ended ? (
                    <button onClick={e => { e.stopPropagation(); router.push(`/concursos/${c.slug}`); }} style={{
                      width: "100%", padding: 13, borderRadius: 10, cursor: "pointer",
                      fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      background: misConcursos.has(c.id) ? "rgba(61,184,158,0.15)" : soon ? urg : c.modalidadConcurso === "sorteo" ? "#ec4899" : "#e8a84c",
                      border: misConcursos.has(c.id) ? "1px solid rgba(61,184,158,0.4)" : "none",
                      color: misConcursos.has(c.id) ? "#3db89e" : soon ? "#fff" : "#0a0812",
                    }}>
                      {misConcursos.has(c.id) ? "Ver concurso" : "Participar"}
                    </button>
                    ) : (
                    <button onClick={e => { e.stopPropagation(); router.push(`/concursos/${c.slug}`); }} style={{
                      width: "100%", padding: 13, borderRadius: 10, cursor: "pointer",
                      fontFamily: "var(--font-cinzel)", fontSize: 14, fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.05em", display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,234,214,0.4)",
                    }}>
                      Ver resultado
                    </button>
                    )}
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
        .dc-cp-content { padding: 0 60px 60px; max-width: 1200px; margin: 0 auto; }
        .dc-cp-filters { display: flex; gap: 10px; flex-wrap: nowrap; justify-content: center; margin-bottom: 40px; overflow-x: auto; scrollbar-width: none; padding-bottom: 4px; }
        .dc-cp-filters::-webkit-scrollbar { display: none; }
        .dc-cp-fbtn { font-family: var(--font-cinzel); font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 10px 20px; border-radius: 30px; cursor: pointer; border: 1px solid var(--border-color); background: transparent; color: var(--text-muted); transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; min-height: 44px; flex-shrink: 0; }
        .dc-cp-fbtn:hover { border-color: var(--accent); color: var(--accent); }
        .dc-cp-fbtn--on { background: color-mix(in srgb, var(--accent) 15%, transparent); border-color: var(--accent); color: var(--accent); }
        .dc-cp-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .dc-cp-card:hover { border-color: var(--accent) !important; }
        @keyframes dc-pd { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes dc-sk-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.15} }
        @media (max-width: 767px) {
          .dc-cp-hero { padding: 100px 20px 50px; }
          .dc-cp-content { padding: 0 14px 60px; }
          .dc-cp-filters { justify-content: flex-start; }
        }
        @media (min-width: 640px) {
          .dc-cp-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
        }
        @media (min-width: 1024px) {
          .dc-cp-grid { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
        }
      `}</style>
    </main>
  );
}
