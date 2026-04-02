"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

const CONFIGS = [
  { clave: "email_contacto_usuarios", label: "Email contacto usuarios", desc: "Donde llegan los mensajes del formulario de contacto de usuarios" },
  { clave: "email_contacto_locales", label: "Email contacto locales", desc: "Donde llegan los mensajes del formulario de contacto del panel de locales" },
  { clave: "email_alertas", label: "Email alertas del sistema", desc: "Donde llegan alertas de nuevos registros, reportes, etc." },
];

export default function AdminAjustes() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/config").then(r => r.json()).then(data => {
      setValues(data ?? {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/config", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) { setToast("Guardado"); setTimeout(() => setToast(""), 3000); }
    } catch {}
    setSaving(false);
  };

  if (loading) return <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.5)" }}>Cargando...</p>;

  return (
    <div>
      {toast && <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 2000, background: "rgba(61,184,158,0.95)", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.9rem", padding: "14px 28px", borderRadius: "30px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>{toast}</div>}

      <h1 style={{ fontFamily: "Georgia", fontSize: "1.6rem", color: "#e8a84c", marginBottom: "24px" }}>Ajustes</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "500px" }}>
        {CONFIGS.map(c => (
          <div key={c.clave} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "18px" }}>
            <label style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "#e8a84c", display: "block", marginBottom: "4px" }}>{c.label}</label>
            <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", marginBottom: "10px" }}>{c.desc}</p>
            <input
              style={{ width: "100%", padding: "12px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
              value={values[c.clave] ?? ""}
              onChange={e => setValues(v => ({ ...v, [c.clave]: e.target.value }))}
              placeholder="ejemplo@gmail.com"
            />
          </div>
        ))}

        <button onClick={save} disabled={saving} style={{ padding: "14px", background: "#e8a84c", border: "none", borderRadius: "10px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.5 : 1 }}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
