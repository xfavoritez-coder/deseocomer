"use client";
import { useState, useEffect } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = any;

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<U[]>([]);
  const [busq, setBusq] = useState("");

  useEffect(() => { fetch("/api/admin/usuarios").then(r => r.json()).then(d => setUsuarios(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const filtered = usuarios.filter(u => !busq || u.nombre.toLowerCase().includes(busq.toLowerCase()) || u.email.toLowerCase().includes(busq.toLowerCase()));

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c", marginBottom: "20px" }}>Usuarios ({usuarios.length})</h1>
      <input style={I} placeholder="Buscar por nombre o email..." value={busq} onChange={e => setBusq(e.target.value)} />
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
        <thead><tr>{["Nombre", "Email", "Ciudad", "Favs", "Reseñas", "Concursos", "Cumple", "Registro"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {filtered.map(u => (
            <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <td style={TD}>{u.nombre}</td>
              <td style={{ ...TD, fontSize: "0.75rem", color: "rgba(240,234,214,0.5)" }}>{u.email}</td>
              <td style={TD}>{u.ciudad ?? "—"}</td>
              <td style={{ ...TD, textAlign: "center" }}>{u._count?.favoritos ?? 0}</td>
              <td style={{ ...TD, textAlign: "center" }}>{u._count?.resenas ?? 0}</td>
              <td style={{ ...TD, textAlign: "center" }}>{u._count?.participaciones ?? 0}</td>
              <td style={{ ...TD, textAlign: "center" }}>{u.cumpleMes ? `🎂 ${u.cumpleDia}/${u.cumpleMes}` : "—"}</td>
              <td style={{ ...TD, fontSize: "0.75rem" }}>{new Date(u.createdAt).toLocaleDateString("es-CL")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const I: React.CSSProperties = { padding: "8px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.85rem", outline: "none", width: "300px" };
const TH: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", borderBottom: "1px solid rgba(232,168,76,0.15)", padding: "8px 10px", textAlign: "left" };
const TD: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.82rem", color: "#f0ead6", padding: "10px" };
