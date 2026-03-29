"use client";
import { useState, useEffect, useRef } from "react";

const CITIES = [
  "Santiago",
  "Valparaíso",
  "Viña del Mar",
  "Concepción",
  "La Serena",
  "Antofagasta",
  "Temuco",
  "Puerto Montt",
];

function selectCity(city: string) {
  localStorage.setItem("ciudad_seleccionada", city);
  window.dispatchEvent(new CustomEvent("ciudadCambiada", { detail: city }));
}

function requestLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    () => {
      // In a real app we'd reverse-geocode; for now default to Santiago
      selectCity("Santiago");
    },
    () => {
      selectCity("Santiago");
    }
  );
}

export default function CitySelector({ mobile = false }: { mobile?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState("Santiago");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ciudad_seleccionada");
    if (saved) setCity(saved);
    const handler = (e: Event) => setCity((e as CustomEvent<string>).detail);
    window.addEventListener("ciudadCambiada", handler);
    return () => window.removeEventListener("ciudadCambiada", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleSelect = (c: string) => {
    selectCity(c);
    setCity(c);
    setOpen(false);
  };

  if (!mounted) return null;

  if (mobile) {
    return (
      <div style={{ padding: "12px 4px", borderBottom: "1px solid var(--border-color)" }}>
        <label style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: "0.65rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "8px",
          display: "block",
        }}>Tu ciudad:</label>
        <select
          value={city}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "__location__") {
              requestLocation();
            } else {
              handleSelect(val);
            }
          }}
          style={{
            width: "100%",
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.85rem",
            letterSpacing: "0.05em",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--accent)",
            background: "var(--bg-secondary)",
            color: "var(--accent)",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e8a84c' d='M2 4l4 4 4-4'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: "32px",
          }}
        >
          {CITIES.map(c => (
            <option key={c} value={c} style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>{c}</option>
          ))}
          <option value="__location__" style={{ background: "var(--bg-primary)", color: "var(--oasis-bright)" }}>📡 Usar mi ubicación</option>
        </select>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: "var(--font-cinzel)",
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          color: "var(--sand-light, var(--text-primary))",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 10px",
          whiteSpace: "nowrap",
        }}
      >
        📍 {city} ▾
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          background: "rgba(13,7,3,0.97)",
          border: "1px solid var(--accent)",
          borderRadius: "12px",
          padding: "8px 0",
          zIndex: 200,
          minWidth: "200px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>
          {CITIES.map(c => (
            <button key={c} onClick={() => handleSelect(c)} style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              padding: "10px 20px",
              background: c === city ? "color-mix(in srgb, var(--accent) 12%, transparent)" : "transparent",
              color: c === city ? "var(--accent)" : "var(--text-primary)",
              border: "none",
              cursor: "pointer",
            }}>{c}</button>
          ))}
          <div style={{ borderTop: "1px solid var(--border-color)", margin: "4px 0" }} />
          <button onClick={() => { requestLocation(); setOpen(false); }} style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            fontFamily: "var(--font-cinzel)",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
            padding: "10px 20px",
            background: "transparent",
            color: "var(--oasis-bright)",
            border: "none",
            cursor: "pointer",
          }}>📡 Usar mi ubicación</button>
        </div>
      )}
    </div>
  );
}
