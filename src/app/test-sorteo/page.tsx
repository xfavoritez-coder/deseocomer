"use client";

import { useState } from "react";
import AnimacionSorteo from "@/components/concursos/AnimacionSorteo";

const PARTICIPANTES_FICTICIOS = [
  { nombre: "María González", boletos: 10 },
  { nombre: "Carlos Ruiz", boletos: 7 },
  { nombre: "Ana Martínez", boletos: 4 },
  { nombre: "Pedro López", boletos: 3 },
  { nombre: "Lucía Fernández", boletos: 1 },
  { nombre: "Diego Herrera", boletos: 1 },
];

export default function TestSorteoPage() {
  const [mostrar, setMostrar] = useState(false);
  const [ganador, setGanador] = useState(PARTICIPANTES_FICTICIOS[0].nombre);
  const [totalBoletos, setTotalBoletos] = useState(
    PARTICIPANTES_FICTICIOS.reduce((s, p) => s + p.boletos, 0)
  );

  return (
    <main
      style={{
        background: "var(--bg-primary, #0a0812)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-lato)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: 22,
          color: "#f5d080",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        🎲 Test — Animación Sorteo
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "rgba(240,234,214,0.4)",
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        Configura y lanza la animación para previsualizarla
      </p>

      {/* Config */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(232,168,76,0.15)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: 12,
            color: "rgba(240,234,214,0.5)",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Ganador
        </label>
        <select
          value={ganador}
          onChange={(e) => setGanador(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(232,168,76,0.2)",
            background: "rgba(0,0,0,0.3)",
            color: "#f0ead6",
            fontSize: 14,
            marginBottom: 16,
            fontFamily: "var(--font-lato)",
          }}
        >
          {PARTICIPANTES_FICTICIOS.map((p) => (
            <option key={p.nombre} value={p.nombre}>
              {p.nombre} — {p.boletos} boletos
            </option>
          ))}
        </select>

        <label
          style={{
            display: "block",
            fontSize: 12,
            color: "rgba(240,234,214,0.5)",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Total boletos en juego
        </label>
        <input
          type="number"
          value={totalBoletos}
          onChange={(e) => setTotalBoletos(Number(e.target.value) || 1)}
          min={1}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid rgba(232,168,76,0.2)",
            background: "rgba(0,0,0,0.3)",
            color: "#f0ead6",
            fontSize: 14,
            marginBottom: 16,
            fontFamily: "var(--font-lato)",
          }}
        />

        {/* Participantes */}
        <p
          style={{
            fontSize: 11,
            color: "rgba(240,234,214,0.3)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          Participantes
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            marginBottom: 20,
          }}
        >
          {PARTICIPANTES_FICTICIOS.map((p) => (
            <div
              key={p.nombre}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: 8,
                background:
                  p.nombre === ganador
                    ? "rgba(236,72,153,0.12)"
                    : "transparent",
                border:
                  p.nombre === ganador
                    ? "1px solid rgba(236,72,153,0.3)"
                    : "1px solid transparent",
              }}
            >
              <span style={{ fontSize: 13, color: "#f0ead6" }}>
                {p.nombre === ganador ? "🏆 " : ""}
                {p.nombre}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(236,72,153,0.7)",
                }}
              >
                🎟️ {p.boletos}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setMostrar(true)}
          style={{
            width: "100%",
            padding: "14px 24px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #ec4899, #be185d)",
            color: "#fff",
            fontFamily: "var(--font-cinzel)",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          🎲 Lanzar Sorteo
        </button>
      </div>

      {mostrar && (
        <AnimacionSorteo
          ganadorNombre={ganador}
          totalBoletos={totalBoletos}
          onClose={() => setMostrar(false)}
        />
      )}
    </main>
  );
}
