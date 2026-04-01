"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

export default function AdminListaEspera() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>({ lista: [], porCiudad: {} });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listaComunas, setListaComunas] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rankingComunas, setRankingComunas] = useState<any[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/lista-espera").then(r => r.json()).then(setData).catch(() => {});
    fetch("/api/lista-espera-comuna").then(r => r.json()).then(d => { setListaComunas(d.lista || []); setRankingComunas(d.ranking || []); }).catch(() => {});
  }, []);

  const exportCSV = () => {
    const csv = "email,ciudad,fecha\n" + data.lista.map((i: { email: string; ciudad: string; createdAt: string }) => `${i.email},${i.ciudad},${new Date(i.createdAt).toLocaleDateString("es-CL")}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "lista-espera.csv"; a.click();
  };

  const exportComunasCSV = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const csv = "Email,Nombre,Comuna,Fecha\n" + listaComunas.map((e: any) => `${e.email},${e.nombre || ""},${e.comuna},${new Date(e.createdAt).toLocaleDateString("es-CL")}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "lista-espera-comunas.csv"; a.click();
  };

  const ciudades = Object.entries(data.porCiudad) as [string, string[]][];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontFamily: "Georgia", fontSize: "1.5rem", color: "#e8a84c" }}>Lista de Espera ({data.lista.length})</h1>
        {data.lista.length > 0 && <button onClick={exportCSV} style={{ background: "#e8a84c", color: "#0a0812", border: "none", borderRadius: "8px", padding: "8px 16px", fontFamily: "Georgia", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>📥 Exportar CSV</button>}
      </div>
      {ciudades.length === 0 ? (
        <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)", textAlign: "center", padding: "40px" }}>No hay registros en la lista de espera</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {ciudades.map(([ciudad, emails]) => (
            <div key={ciudad} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#e8a84c", fontWeight: 700, textTransform: "capitalize" }}>📍 {ciudad}</span>
                <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)" }}>{emails.length} email{emails.length !== 1 ? "s" : ""}</span>
              </div>
              {emails.map((email: string, i: number) => (
                <p key={i} style={{ fontFamily: "Georgia", fontSize: "0.8rem", color: "#f0ead6", padding: "4px 0" }}>{email}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Separador */}
      <div style={{ height: "1px", background: "rgba(232,168,76,0.1)", margin: "40px 0" }} />

      {/* Lista espera por comuna */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontFamily: "Georgia", fontSize: "1.2rem", color: "#e8a84c" }}>Lista de Espera por Comuna ({listaComunas.length})</h2>
        {listaComunas.length > 0 && <button onClick={exportComunasCSV} style={{ background: "rgba(232,168,76,0.12)", border: "1px solid rgba(232,168,76,0.3)", borderRadius: "8px", padding: "8px 16px", fontFamily: "Georgia", fontSize: "0.78rem", color: "#e8a84c", cursor: "pointer" }}>📥 CSV comunas</button>}
      </div>

      {rankingComunas.length === 0 ? (
        <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)" }}>No hay registros aún</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {rankingComunas.map((item: any) => (
            <div key={item.comuna} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: "12px", padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#f5d080", fontWeight: 700 }}>📍 {item.comuna}</span>
                <span style={{ fontFamily: "Georgia", fontSize: "1.2rem", color: "#e8a84c" }}>{item.total}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {item.emails.slice(0, 5).map((e: any, i: number) => (
                  <span key={i} style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)", background: "rgba(255,255,255,0.04)", padding: "3px 10px", borderRadius: "20px" }}>
                    {e.nombre ? `${e.nombre} (${e.email})` : e.email}
                  </span>
                ))}
                {item.emails.length > 5 && <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.3)", padding: "3px 10px" }}>+{item.emails.length - 5} más</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
