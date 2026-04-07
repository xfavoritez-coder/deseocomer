"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

interface StatsData {
  busquedas: Record<string, number>;
  comunas: Record<string, number>;
  categorias: Record<string, number>;
  paginas: Record<string, number>;
  promocionesVistas: Record<string, number>;
  totalBusquedas: number;
  totalFiltrosComunas: number;
  totalFiltrosCategorias: number;
  totalPromocionesVistas: number;
  updatedAt: string;
}

const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.7rem", color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "left", padding: "8px 12px", borderBottom: "1px solid rgba(232,168,76,0.15)" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.7)", padding: "8px 12px", borderBottom: "1px solid rgba(232,168,76,0.06)" };
const TDN: React.CSSProperties = { ...TD, color: "#e8a84c", fontWeight: 700, textAlign: "right", width: "60px" };

function TopTable({ title, data, total }: { title: string; data: Record<string, number>; total: number }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 20);
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(232,168,76,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#e8a84c", margin: 0 }}>{title}</h3>
        <span style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)" }}>{total} total</span>
      </div>
      {sorted.length === 0 ? (
        <p style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "rgba(240,234,214,0.3)", padding: "20px", textAlign: "center" }}>Sin datos aún</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={TH}>#</th><th style={TH}>Valor</th><th style={{ ...TH, textAlign: "right" }}>Veces</th></tr></thead>
          <tbody>
            {sorted.map(([key, count], i) => (
              <tr key={key} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <td style={{ ...TD, width: "30px", color: "rgba(240,234,214,0.3)" }}>{i + 1}</td>
                <td style={TD}>{key}</td>
                <td style={TDN}>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

interface UserStatsData {
  totalPerfiles: number;
  categorias: Record<string, number>;
  comunas: Record<string, number>;
  horarios: Record<string, number>;
  ocasiones: Record<string, number>;
  localesTop: Record<string, number>;
  estilos: Record<string, number>;
}

function BarChart({ data, color = "#e8a84c", max = 15 }: { data: Record<string, number>; color?: string; max?: number }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, max);
  const topVal = sorted[0]?.[1] ?? 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {sorted.map(([key, val]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.6)", width: 120, flexShrink: 0, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</span>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 4, height: 18, overflow: "hidden" }}>
            <div style={{ width: `${(val / topVal) * 100}%`, height: "100%", background: color, borderRadius: 4, minWidth: 2 }} />
          </div>
          <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color, fontWeight: 700, width: 40, textAlign: "right" }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [userStats, setUserStats] = useState<UserStatsData | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"busquedas" | "usuarios">("busquedas");

  useEffect(() => {
    adminFetch("/api/stats").then(r => r.json()).then(setStats).catch(() => setError(true));
    adminFetch("/api/admin/stats-usuarios").then(r => r.json()).then(d => { if (!d.error) setUserStats(d); }).catch(() => {});
  }, []);

  if (error) return <div style={{ textAlign: "center", padding: "60px 20px" }}><p style={{ color: "#ff6b6b", fontFamily: "Georgia" }}>Error al cargar estadísticas</p></div>;
  if (!stats) return <p style={{ color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", padding: "40px", textAlign: "center" }}>Cargando...</p>;

  const tabS = (active: boolean): React.CSSProperties => ({ fontFamily: "Georgia", fontSize: "0.88rem", background: "none", border: "none", borderBottom: active ? "2px solid #e8a84c" : "2px solid transparent", color: active ? "#e8a84c" : "rgba(240,234,214,0.4)", padding: "10px 20px", cursor: "pointer", letterSpacing: "0.06em" });
  const sectionS: React.CSSProperties = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,168,76,0.12)", borderRadius: 12, padding: "18px 20px", marginBottom: 16 };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "Georgia", fontSize: "1.2rem", color: "#e8a84c", marginBottom: 8 }}>Estadísticas</h2>

      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(232,168,76,0.15)", marginBottom: 24 }}>
        <button onClick={() => setTab("busquedas")} style={tabS(tab === "busquedas")}>Búsquedas</button>
        <button onClick={() => setTab("usuarios")} style={tabS(tab === "usuarios")}>Gustos de usuarios</button>
      </div>

      {tab === "busquedas" && stats && (
        <>
          <p style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", marginBottom: 24 }}>
            Datos de la sección /locales — actualizado {stats.updatedAt ? new Date(stats.updatedAt).toLocaleString("es-CL") : "nunca"}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Búsquedas", value: stats.totalBusquedas, icon: "🔍" },
              { label: "Filtros comuna", value: stats.totalFiltrosComunas, icon: "📍" },
              { label: "Filtros categoría", value: stats.totalFiltrosCategorias, icon: "🍽️" },
              { label: "Promos vistas", value: stats.totalPromocionesVistas ?? 0, icon: "⚡" },
            ].map(c => (
              <div key={c.label} style={{ background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{c.icon}</div>
                <div style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", fontWeight: 700 }}>{c.value}</div>
                <div style={{ fontFamily: "Georgia", fontSize: "0.7rem", color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {stats.paginas && Object.keys(stats.paginas).length > 0 && (
            <div style={{ background: "rgba(232,168,76,0.04)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontFamily: "Georgia", fontSize: "0.7rem", color: "rgba(240,234,214,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", alignSelf: "center" }}>Visitas:</span>
              {Object.entries(stats.paginas).sort((a, b) => b[1] - a[1]).map(([page, count]) => (
                <span key={page} style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "rgba(240,234,214,0.6)" }}>/{page}: <strong style={{ color: "#e8a84c" }}>{count}</strong></span>
              ))}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <TopTable title="Top búsquedas" data={stats.busquedas} total={stats.totalBusquedas} />
            <TopTable title="Top comunas" data={stats.comunas} total={stats.totalFiltrosComunas} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <TopTable title="Top categorías" data={stats.categorias} total={stats.totalFiltrosCategorias} />
            <TopTable title="Promociones más vistas" data={stats.promocionesVistas ?? {}} total={stats.totalPromocionesVistas ?? 0} />
          </div>
        </>
      )}

      {tab === "usuarios" && (
        <>
          {!userStats ? (
            <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)", textAlign: "center", padding: 40 }}>Cargando datos de usuarios...</p>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {[
                  { label: "Perfiles con datos", value: userStats.totalPerfiles, icon: "🧞" },
                  { label: "Categorías trackeadas", value: Object.keys(userStats.categorias).length, icon: "🍽️" },
                  { label: "Comunas trackeadas", value: Object.keys(userStats.comunas).length, icon: "📍" },
                ].map(c => (
                  <div key={c.label} style={{ background: "rgba(128,64,208,0.06)", border: "1px solid rgba(128,64,208,0.15)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{c.icon}</div>
                    <div style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#a070e0", fontWeight: 700 }}>{c.value}</div>
                    <div style={{ fontFamily: "Georgia", fontSize: "0.7rem", color: "rgba(240,234,214,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{c.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={sectionS}>
                  <h3 style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#e8a84c", marginBottom: 14 }}>Comida que más gusta</h3>
                  <BarChart data={userStats.categorias} color="#e8a84c" />
                </div>
                <div style={sectionS}>
                  <h3 style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#3db89e", marginBottom: 14 }}>Comunas preferidas</h3>
                  <BarChart data={userStats.comunas} color="#3db89e" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={sectionS}>
                  <h3 style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#a070e0", marginBottom: 14 }}>Momento del día</h3>
                  <BarChart data={userStats.horarios} color="#a070e0" />
                </div>
                <div style={sectionS}>
                  <h3 style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#e05090", marginBottom: 14 }}>Ocasiones</h3>
                  <BarChart data={userStats.ocasiones} color="#e05090" max={10} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={sectionS}>
                  <h3 style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#e8a84c", marginBottom: 14 }}>Locales más visitados</h3>
                  <BarChart data={userStats.localesTop} color="#e8a84c" />
                </div>
                <div style={sectionS}>
                  <h3 style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#3db89e", marginBottom: 14 }}>Estilos alimentarios</h3>
                  <BarChart data={userStats.estilos} color="#3db89e" max={10} />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
