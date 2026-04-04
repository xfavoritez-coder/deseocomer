"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D = any;

export default function ActividadUsuario() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<D>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch(`/api/admin/usuarios/${id}/actividad`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Error de conexión"))
      .finally(() => setLoading(false));
  }, [id]);

  const cardS: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: "14px", padding: "18px", marginBottom: "16px" };
  const titleS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.9rem", color: "#e8a84c", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" };
  const labelS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.45)" };
  const valS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.88rem", color: "#f0ead6" };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><p style={{ color: "#e8a84c", fontFamily: "Georgia" }}>Cargando actividad... 🧞</p></div>;
  if (error) return <div style={{ padding: 40, textAlign: "center" }}><p style={{ color: "#ff8080", fontFamily: "Georgia" }}>{error}</p></div>;
  if (!data) return null;

  const gp = data.geniePerfil as D;
  const gustos = gp?.gustos ?? {};
  const comp = gp?.comportamiento ?? {};
  const respuestas: { pregunta: string; respuesta: string; timestamp?: string }[] = gp?.respuestasGenio ?? [];
  const allCats = Object.entries(gustos.categorias ?? {} as Record<string, number>).sort((a, b) => (b[1] as number) - (a[1] as number));
  const allComunas = Object.entries(gustos.comunas ?? {} as Record<string, number>).sort((a, b) => (b[1] as number) - (a[1] as number));
  const allHorarios = Object.entries(gustos.horario ?? {} as Record<string, number>).sort((a, b) => (b[1] as number) - (a[1] as number));
  const allOcasiones = Object.entries(gustos.ocasiones ?? {} as Record<string, number>).sort((a, b) => (b[1] as number) - (a[1] as number));
  const visitados: { nombre: string; categoria: string; comuna: string }[] = comp.localesVisitados ?? [];
  const filtros: string[] = comp.filtrosUsados ?? [];
  const promos: string[] = comp.promocionesAbiertas ?? [];
  const concursosVistos: string[] = comp.concursosVistos ?? [];
  const maxCatScore = allCats.length > 0 ? (allCats[0][1] as number) : 1;
  const maxComScore = allComunas.length > 0 ? (allComunas[0][1] as number) : 1;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      <a href="/admin/usuarios" style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "rgba(240,234,214,0.4)", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>← Volver a usuarios</a>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, color: "#1a0e05" }}>{data.usuario.nombre?.charAt(0).toUpperCase()}</div>
        <div>
          <h1 style={{ fontFamily: "Georgia", fontSize: "1.3rem", color: "#f5d080", margin: 0 }}>{data.usuario.nombre}</h1>
          <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.45)", margin: 0 }}>{data.usuario.email}</p>
        </div>
      </div>

      {/* Perfil del Genio */}
      {gp && (
        <div style={cardS}>
          <p style={titleS}>🧞 Perfil del Genio</p>

          {allCats.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={labelS}>Categorías favoritas ({allCats.length})</p>
              {allCats.map(([cat, score]) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", width: 110, flexShrink: 0 }}>{cat}</span>
                  <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${((score as number) / maxCatScore) * 100}%`, height: "100%", background: "linear-gradient(to right, #e8a84c, #f5d080)", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)", width: 30, textAlign: "right" }}>{score as number}</span>
                </div>
              ))}
            </div>
          )}

          {allComunas.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={labelS}>Comunas preferidas ({allComunas.length})</p>
              {allComunas.map(([com, score]) => (
                <div key={com} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                  <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", width: 110, flexShrink: 0 }}>{com}</span>
                  <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${((score as number) / maxComScore) * 100}%`, height: "100%", background: "linear-gradient(to right, #3db89e, #5fd4b8)", borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)", width: 30, textAlign: "right" }}>{score as number}</span>
                </div>
              ))}
            </div>
          )}

          {allHorarios.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={labelS}>Horarios de uso</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {allHorarios.map(([h, score]) => (
                  <span key={h} style={{ fontFamily: "Georgia", fontSize: "0.82rem", padding: "4px 12px", borderRadius: 16, background: "rgba(128,64,208,0.1)", border: "1px solid rgba(128,64,208,0.25)", color: "#a070e0" }}>{h} ({score as number})</span>
                ))}
              </div>
            </div>
          )}

          {allOcasiones.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={labelS}>Ocasiones</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                {allOcasiones.map(([o, score]) => (
                  <span key={o} style={{ fontFamily: "Georgia", fontSize: "0.82rem", padding: "4px 12px", borderRadius: 16, background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", color: "#e8a84c" }}>{o} ({score as number})</span>
                ))}
              </div>
            </div>
          )}

          {gustos.precioPreferido && <p style={valS}>Precio preferido: <strong style={{ color: "#e8a84c" }}>{gustos.precioPreferido}</strong></p>}
        </div>
      )}

      {/* Historial de comportamiento */}
      <div style={cardS}>
        <p style={titleS}>📋 Comportamiento</p>

        {visitados.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={labelS}>Locales visitados ({visitados.length})</p>
            {visitados.slice().reverse().map((v, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between" }}>
                <span style={valS}>{v.nombre}</span>
                <span style={labelS}>{v.categoria} · {v.comuna}</span>
              </div>
            ))}
          </div>
        )}

        {promos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={labelS}>Promociones abiertas ({promos.length})</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {[...new Set(promos)].map((p, i) => (
                <span key={i} style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(61,184,158,0.08)", color: "#3db89e" }}>{p}</span>
              ))}
            </div>
          </div>
        )}

        {concursosVistos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={labelS}>Concursos vistos ({concursosVistos.length})</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {[...new Set(concursosVistos)].map((c, i) => (
                <span key={i} style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(128,64,208,0.08)", color: "#a070e0" }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {filtros.length > 0 && (
          <div>
            <p style={labelS}>Filtros usados</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {[...new Set(filtros)].map((f, i) => (
                <span key={i} style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", color: "rgba(240,234,214,0.5)" }}>{f}</span>
              ))}
            </div>
          </div>
        )}

        {visitados.length === 0 && promos.length === 0 && filtros.length === 0 && (
          <p style={{ ...labelS, textAlign: "center", padding: 20 }}>Sin actividad de navegación registrada</p>
        )}
      </div>

      {/* Respuestas al Genio */}
      {respuestas.length > 0 && (
        <div style={cardS}>
          <p style={titleS}>💬 Respuestas al Genio ({respuestas.length})</p>
          {respuestas.slice().reverse().map((r, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <p style={{ ...labelS, marginBottom: 2 }}>{r.pregunta}</p>
              <p style={{ ...valS, margin: 0 }}>{r.respuesta}</p>
              {r.timestamp && <p style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.25)", margin: "2px 0 0" }}>{new Date(r.timestamp).toLocaleString("es-CL")}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Concursos con desglose */}
      <div style={cardS}>
        <p style={titleS}>🏆 Concursos ({data.concursos.length})</p>
        {data.concursos.length === 0 && <p style={{ ...labelS, textAlign: "center", padding: 20 }}>No ha participado en concursos</p>}
        {data.concursos.map((c: D, i: number) => {
          const ended = new Date(c.fechaFin) <= new Date();
          return (
            <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <span style={valS}>{c.concurso}</span>
                  <span style={{ ...labelS, marginLeft: 8 }}>{c.local}</span>
                </div>
                <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: c.activo && !ended ? "#3db89e" : "rgba(240,234,214,0.4)", background: c.activo && !ended ? "rgba(61,184,158,0.1)" : "rgba(255,255,255,0.04)", padding: "2px 10px", borderRadius: 10 }}>{c.activo && !ended ? "Activo" : "Finalizado"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(232,168,76,0.1)", color: "#e8a84c" }}>Total: {c.puntos} pts</span>
                {c.puntosPendientes > 0 && <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(255,100,100,0.1)", color: "#ff8080" }}>Pendientes: {c.puntosPendientes}</span>}
                {c.puntosReferidosNuevos > 0 && <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(61,184,158,0.1)", color: "#3db89e" }}>Ref nuevos: +{c.puntosReferidosNuevos}</span>}
                {c.puntosReferidosExistentes > 0 && <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(61,184,158,0.08)", color: "#3db89e" }}>Ref existentes: +{c.puntosReferidosExistentes}</span>}
                {c.puntosNivel2 > 0 && <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(128,64,208,0.1)", color: "#a070e0" }}>Nivel 2: +{c.puntosNivel2}</span>}
                {c.puntosNivel2Pendientes > 0 && <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(255,100,100,0.08)", color: "#ff8080" }}>N2 pendientes: {c.puntosNivel2Pendientes}</span>}
                {c.esMadrugador && <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: 10, background: "rgba(232,168,76,0.08)", color: "#e8a84c" }}>⚡ Madrugador +{c.puntosMadrugador}</span>}
              </div>
              <p style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.25)", marginTop: 4 }}>Participó: {new Date(c.createdAt).toLocaleString("es-CL")}</p>
            </div>
          );
        })}
      </div>

      {/* Referidos */}
      <div style={cardS}>
        <p style={titleS}>👥 Personas que refirió ({data.referidos.length})</p>
        {data.referidos.length === 0 && <p style={{ ...labelS, textAlign: "center", padding: 20 }}>No ha referido a nadie</p>}
        {data.referidos.map((r: D, i: number) => (
          <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={valS}>{r.nombre}</span>
              <span style={{ ...labelS, marginLeft: 8 }}>{r.concurso}</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: r.emailVerificado ? "#3db89e" : "#ff8080" }}>{r.emailVerificado ? "✓" : "⏳"}</span>
              <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.3)" }}>{new Date(r.fecha).toLocaleDateString("es-CL")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
