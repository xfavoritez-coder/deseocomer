"use client";
import { useState, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = any;

export default function AdminConcursos() {
  const [concursos, setConcursos] = useState<C[]>([]);

  useEffect(() => { fetch("/api/concursos").then(r => r.json()).then(d => setConcursos(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const cerrar = async (id: string) => {
    await fetch(`/api/admin/concursos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo: false }) });
    setConcursos(prev => prev.map(c => c.id === id ? { ...c, activo: false } : c));
  };

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", marginBottom: "20px" }}>Concursos ({concursos.length})</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["Premio", "Local", "Participantes", "Inicio", "Fin", "Estado", "Acción"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {concursos.map(c => {
            const ended = new Date(c.fechaFin) <= new Date();
            const status = !c.activo ? "Desactivado" : ended ? "Terminado" : "Activo";
            const color = !c.activo ? "#ff6b6b" : ended ? "#e8a84c" : "#3db89e";
            return (
              <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={TD}>{c.premio}</td>
                <td style={TD}>{c.local?.nombre ?? "—"}</td>
                <td style={{ ...TD, textAlign: "center" }}>{c._count?.participantes ?? 0}</td>
                <td style={{ ...TD, fontSize: "0.75rem" }}>{new Date(c.fechaInicio ?? c.createdAt).toLocaleDateString("es-CL")}</td>
                <td style={{ ...TD, fontSize: "0.75rem" }}>{new Date(c.fechaFin).toLocaleDateString("es-CL")}</td>
                <td style={TD}><span style={{ color, fontSize: "0.75rem", fontWeight: 700 }}>{status}</span></td>
                <td style={TD}>{c.activo && !ended && <button onClick={() => cerrar(c.id)} style={{ background: "none", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "6px", color: "#ff6b6b", fontFamily: "Georgia", fontSize: "0.65rem", padding: "4px 10px", cursor: "pointer" }}>Cerrar</button>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "8px 10px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", padding: "10px" };
