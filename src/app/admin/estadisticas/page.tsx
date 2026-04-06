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

export default function EstadisticasPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminFetch("/api/stats").then(r => r.json()).then(setStats).catch(() => setError(true));
  }, []);

  if (error) return <div style={{ textAlign: "center", padding: "60px 20px" }}><p style={{ color: "#ff6b6b", fontFamily: "Georgia" }}>Error al cargar estadísticas</p></div>;
  if (!stats) return <p style={{ color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", padding: "40px", textAlign: "center" }}>Cargando...</p>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "Georgia", fontSize: "1.2rem", color: "#e8a84c", marginBottom: 8 }}>Estadísticas de búsqueda</h2>
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

      {/* Visitas a páginas */}
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
    </div>
  );
}
