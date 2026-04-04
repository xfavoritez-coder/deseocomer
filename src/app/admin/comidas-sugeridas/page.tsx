"use client";
import { useState, useEffect } from "react";
import { adminFetch } from "@/lib/adminFetch";

interface GrupoCustom {
  texto: string;
  variantes: string[];
  count: number;
  usuarios: { id: string; nombre: string }[];
  ids: string[];
  ultimaVez: string;
}

interface CatDB {
  id: string;
  nombre: string;
  slug: string;
  emoji: string;
  tipo: string;
  orden: number;
}

export default function ComidasSugeridas() {
  const [grupos, setGrupos] = useState<GrupoCustom[]>([]);
  const [categorias, setCategorias] = useState<CatDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [promoverModal, setPromoverModal] = useState<string | null>(null);
  const [vincularModal, setVincularModal] = useState<string | null>(null);
  const [nuevaCat, setNuevaCat] = useState({ nombre: "", emoji: "", tipo: "tag" as "tag" | "principal" });
  const [seeded, setSeeded] = useState(false);

  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/comidas-custom").then(r => r.json()),
      fetch("/api/categorias").then(r => r.json()),
    ]).then(([g, c]) => {
      if (Array.isArray(g)) setGrupos(g);
      if (Array.isArray(c)) setCategorias(c);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSeed = async () => {
    const res = await fetch("/api/admin/seed-categorias", { method: "POST" });
    const data = await res.json();
    if (data.ok) { show(`✓ ${data.creadas} categorías creadas, ${data.existentes} ya existían`); setSeeded(true); fetchData(); }
    else show("Error: " + (data.error || "desconocido"));
  };

  const handleIgnorar = async (texto: string) => {
    await fetch("/api/comidas-custom", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "ignorar", texto }),
    });
    show("Ignorada ✓");
    fetchData();
  };

  const handleVincular = async (texto: string, categoriaId: string) => {
    const res = await fetch("/api/comidas-custom", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "vincular", texto, categoriaId }),
    });
    const data = await res.json();
    if (data.ok) { show(`Vinculada a "${data.categoria}" ✓`); setVincularModal(null); fetchData(); }
    else show("Error: " + (data.error || "desconocido"));
  };

  const handlePromover = async (texto: string) => {
    if (!nuevaCat.nombre.trim()) return;
    const res = await fetch("/api/comidas-custom", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "promover",
        texto,
        nuevaCategoria: { nombre: nuevaCat.nombre.trim(), emoji: nuevaCat.emoji, tipo: nuevaCat.tipo },
      }),
    });
    const data = await res.json();
    if (data.ok) { show(`"${data.categoria}" creada y vinculada ✓`); setPromoverModal(null); setNuevaCat({ nombre: "", emoji: "", tipo: "tag" }); fetchData(); }
    else show("Error: " + (data.error || "desconocido"));
  };

  const S = {
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: "14px", padding: "20px" } as React.CSSProperties,
    btn: { padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontFamily: "var(--font-lato)", fontSize: "0.78rem", fontWeight: 600, border: "none" } as React.CSSProperties,
    input: { padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "8px", color: "var(--text-primary)", fontFamily: "var(--font-lato)", fontSize: "0.85rem", outline: "none" } as React.CSSProperties,
  };

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative, Georgia)", fontSize: "1.3rem", color: "var(--accent, #e8a84c)", marginBottom: "4px" }}>🍽️ Comidas sugeridas</h1>
          <p style={{ fontFamily: "var(--font-lato, sans-serif)", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)" }}>Comidas escritas por usuarios que no están en la lista oficial</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {categorias.length === 0 && !seeded && (
            <button onClick={handleSeed} style={{ ...S.btn, background: "#3db89e", color: "#0a0812" }}>Seed categorías iniciales</button>
          )}
          <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.3)", alignSelf: "center" }}>{categorias.length} categorías oficiales</span>
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", top: 20, right: 20, background: "rgba(61,184,158,0.95)", color: "#0a0812", padding: "10px 20px", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.85rem", fontWeight: 600, zIndex: 999 }}>{toast}</div>}

      {/* Categorías actuales */}
      <div style={{ ...S.card, marginBottom: "20px" }}>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", marginBottom: "10px" }}>Categorías oficiales</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {categorias.map(c => (
            <span key={c.id} style={{
              padding: "4px 10px", borderRadius: "10px", fontFamily: "var(--font-lato)", fontSize: "0.75rem",
              background: c.tipo === "principal" ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.04)",
              border: c.tipo === "principal" ? "1px solid rgba(232,168,76,0.3)" : "1px solid rgba(255,255,255,0.08)",
              color: c.tipo === "principal" ? "var(--accent)" : "rgba(240,234,214,0.5)",
            }}>{c.emoji} {c.nombre}</span>
          ))}
        </div>
      </div>

      {/* Lista de sugerencias */}
      {loading ? (
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)", textAlign: "center", padding: "40px 0" }}>Cargando...</p>
      ) : grupos.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "40px" }}>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.4)" }}>No hay comidas sugeridas pendientes</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {grupos.map(g => (
            <div key={g.texto} style={S.card}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "var(--text-primary, #f0ead6)" }}>&quot;{g.variantes[0]}&quot;</span>
                    <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", fontWeight: 700, color: "var(--accent)", background: "rgba(232,168,76,0.1)", padding: "2px 10px", borderRadius: "8px" }}>×{g.count}</span>
                  </div>
                  {g.variantes.length > 1 && (
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", marginBottom: "4px" }}>
                      Variantes: {g.variantes.join(", ")}
                    </p>
                  )}
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.25)" }}>
                    Última vez: {new Date(g.ultimaVez).toLocaleDateString("es-CL")}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button onClick={() => { setPromoverModal(g.texto); setNuevaCat({ nombre: g.variantes[0].charAt(0).toUpperCase() + g.variantes[0].slice(1), emoji: "", tipo: "tag" }); }} style={{ ...S.btn, background: "#3db89e", color: "#0a0812" }}>+ Nueva categoría</button>
                  <button onClick={() => setVincularModal(g.texto)} style={{ ...S.btn, background: "rgba(232,168,76,0.15)", color: "var(--accent)" }}>Vincular a ▾</button>
                  <button onClick={() => handleIgnorar(g.texto)} style={{ ...S.btn, background: "rgba(255,80,80,0.1)", color: "#ff8080" }}>Ignorar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Promover como nueva categoría */}
      {promoverModal && (
        <>
          <div onClick={() => setPromoverModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "16px", padding: "28px", width: "90%", maxWidth: "400px", zIndex: 999 }}>
            <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: "16px" }}>Nueva categoría</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              <input placeholder="Nombre (ej: Empanadas)" value={nuevaCat.nombre} onChange={e => setNuevaCat(p => ({ ...p, nombre: e.target.value }))} style={S.input} />
              <input placeholder="Emoji (ej: 🥟)" value={nuevaCat.emoji} onChange={e => setNuevaCat(p => ({ ...p, emoji: e.target.value }))} style={{ ...S.input, maxWidth: "100px" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setNuevaCat(p => ({ ...p, tipo: "principal" }))} style={{ ...S.btn, background: nuevaCat.tipo === "principal" ? "rgba(232,168,76,0.2)" : "transparent", border: "1px solid rgba(232,168,76,0.2)", color: nuevaCat.tipo === "principal" ? "var(--accent)" : "rgba(240,234,214,0.4)" }}>Principal</button>
                <button onClick={() => setNuevaCat(p => ({ ...p, tipo: "tag" }))} style={{ ...S.btn, background: nuevaCat.tipo === "tag" ? "rgba(232,168,76,0.2)" : "transparent", border: "1px solid rgba(232,168,76,0.2)", color: nuevaCat.tipo === "tag" ? "var(--accent)" : "rgba(240,234,214,0.4)" }}>Solo tag</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={() => setPromoverModal(null)} style={{ ...S.btn, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,234,214,0.5)" }}>Cancelar</button>
              <button onClick={() => handlePromover(promoverModal)} style={{ ...S.btn, background: "#3db89e", color: "#0a0812" }}>Crear y vincular</button>
            </div>
          </div>
        </>
      )}

      {/* Modal: Vincular a categoría existente */}
      {vincularModal && (
        <>
          <div onClick={() => setVincularModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 998 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#1a1008", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "16px", padding: "28px", width: "90%", maxWidth: "400px", zIndex: 999, maxHeight: "80vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "var(--accent)", marginBottom: "16px" }}>Vincular a categoría existente</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {categorias.map(c => (
                <button key={c.id} onClick={() => handleVincular(vincularModal, c.id)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: "10px", cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <span style={{ fontSize: "1.1rem" }}>{c.emoji}</span>
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-primary)" }}>{c.nombre}</span>
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "rgba(240,234,214,0.3)", marginLeft: "auto" }}>{c.tipo}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setVincularModal(null)} style={{ ...S.btn, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(240,234,214,0.5)", marginTop: "12px", width: "100%" }}>Cancelar</button>
          </div>
        </>
      )}
    </div>
  );
}
