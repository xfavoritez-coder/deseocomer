"use client";
import { useState, useEffect, useMemo } from "react";
import { adminFetch } from "@/lib/adminFetch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = any;

function loadSessionState<T>(key: string, fallback: T): T {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<U[]>(() => loadSessionState("admin_usuarios_list", []));
  const [busq, setBusq] = useState("");
  const [sel, setSel] = useState<U | null>(() => loadSessionState("admin_usuarios_sel", null));
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [passMode, setPassMode] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [soloIPsDuplicadas, setSoloIPsDuplicadas] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [ordenUsuarios, setOrdenUsuarios] = useState("reciente");
  const [descalificarConfirm, setDescalificarConfirm] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [redReferidos, setRedReferidos] = useState<any[]>([]);
  const [loadingRed, setLoadingRed] = useState(false);
  const [ajustarPuntos, setAjustarPuntos] = useState<{ concursoId: string; premio: string; puntosActuales: number } | null>(null);
  const [ajustarNuevosPuntos, setAjustarNuevosPuntos] = useState("");
  const [ajustarMotivo, setAjustarMotivo] = useState("");
  const [ajustarEnviarCorreo, setAjustarEnviarCorreo] = useState(true);
  const [ajustarLoading, setAjustarLoading] = useState(false);
  const [userHistory, setUserHistory] = useState<U[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [busqDebounced, setBusqDebounced] = useState("");

  const fetchUsuarios = (p: number, q: string, filtro?: string, orden?: string) => {
    setLoadingList(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (q) params.set("busq", q);
    if (filtro || filtroEstado) params.set("filtro", filtro ?? filtroEstado);
    if (orden || ordenUsuarios !== "reciente") params.set("orden", orden ?? ordenUsuarios);
    adminFetch(`/api/admin/usuarios?${params}`).then(r => r.json()).then(d => {
      setUsuarios(d.usuarios ?? []);
      setTotalPages(d.totalPages ?? 1);
      setTotalUsuarios(d.total ?? 0);
      setPage(d.page ?? 1);
    }).catch(() => {}).finally(() => setLoadingList(false));
  };

  useEffect(() => { if (usuarios.length === 0) fetchUsuarios(1, ""); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(() => { setBusqDebounced(busq); }, 400); return () => clearTimeout(t); }, [busq]);
  useEffect(() => { fetchUsuarios(1, busqDebounced); }, [busqDebounced, filtroEstado, ordenUsuarios]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persistir estado para no perderlo al navegar a actividad
  useEffect(() => { try { sessionStorage.setItem("admin_usuarios_sel", JSON.stringify(sel)); } catch {} }, [sel]);
  useEffect(() => { try { sessionStorage.setItem("admin_usuarios_list", JSON.stringify(usuarios)); } catch {} }, [usuarios]);

  const show = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const action = async (accion: string, extra?: Record<string, unknown>) => {
    if (!sel) return false;
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/usuarios/${sel.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion, ...extra }) });
      if (!res.ok) { const d = await res.json(); show(d.error ?? "Error"); setLoading(false); return false; }
      setLoading(false); return true;
    } catch { show("Error de conexión"); setLoading(false); return false; }
  };

  // IP duplicadas
  const ipCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const u of usuarios) {
      const ip = u.ipRegistro || "";
      if (ip && ip !== "unknown") map[ip] = (map[ip] || 0) + 1;
    }
    return map;
  }, [usuarios]);

  const isIPDuplicada = (ip: string) => ip && ip !== "unknown" && (ipCounts[ip] || 0) > 1;

  const filtered = usuarios.filter(u => {
    if (busq && !u.nombre?.toLowerCase().includes(busq.toLowerCase()) && !u.email?.toLowerCase().includes(busq.toLowerCase())) return false;
    if (soloIPsDuplicadas && !isIPDuplicada(u.ipRegistro)) return false;
    return true;
  });

  const resetModes = () => { setEditMode(false); setPassMode(false); setDeleteConfirm(false); setDescalificarConfirm(false); };

  const handleDescalificar = async () => {
    if (!sel) return;
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/usuarios/${sel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "descalificar" }),
      });
      if (res.ok) {
        show("✓ Usuario descalificado de todos los concursos activos");
        setDescalificarConfirm(false);
      } else {
        const d = await res.json();
        show(d.error ?? "Error al descalificar");
      }
    } catch { show("Error de conexión"); }
    setLoading(false);
  };

  // Load referral network when user is selected
  useEffect(() => {
    if (!sel) { setRedReferidos([]); return; }
    setLoadingRed(true);
    adminFetch(`/api/admin/usuarios/${sel.id}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setRedReferidos(d);
      else setRedReferidos([]);
    }).catch(() => setRedReferidos([])).finally(() => setLoadingRed(false));
  }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── DETAIL VIEW ──
  if (sel) return (
    <div>
      {toast && <div style={toastS}>{toast}</div>}
      <button onClick={() => { if (userHistory.length > 0) { const prev = userHistory[userHistory.length - 1]; setUserHistory(h => h.slice(0, -1)); setSel(prev); resetModes(); } else { setSel(null); resetModes(); setUserHistory([]); } }} style={backS}>← {userHistory.length > 0 ? `Volver a ${userHistory[userHistory.length - 1].nombre}` : "Usuarios"}</button>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        {sel.fotoUrl ? (
          <img src={sel.fotoUrl} alt="" style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(232,168,76,0.3)" }} />
        ) : (
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", fontWeight: 700, color: "#1a0e05", flexShrink: 0 }}>{sel.nombre?.charAt(0).toUpperCase()}</div>
        )}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: "Georgia", color: "#f5d080", fontSize: "1.3rem", margin: 0 }}>{sel.nombre}</h2>
          <p style={{ fontFamily: "Georgia", color: "rgba(240,234,214,0.55)", fontSize: "0.95rem", margin: "3px 0 0", wordBreak: "break-all" }}>{sel.email}</p>
          {sel.tipo && sel.tipo !== "usuario" && <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "#8040d0", background: "rgba(128,64,208,0.1)", border: "1px solid rgba(128,64,208,0.3)", borderRadius: "10px", padding: "3px 10px", marginTop: "4px", display: "inline-block" }}>{sel.tipo}</span>}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.92rem", fontWeight: 700, color: sel.emailVerificado ? "#3db89e" : "#ff8080", background: sel.emailVerificado ? "rgba(61,184,158,0.1)" : "rgba(255,100,100,0.1)", border: `1px solid ${sel.emailVerificado ? "rgba(61,184,158,0.3)" : "rgba(255,100,100,0.3)"}`, borderRadius: "20px", padding: "6px 16px" }}>{sel.emailVerificado ? "✓ Verificado" : "⏳ Sin verificar"}</span>
        {isIPDuplicada(sel.ipRegistro) && <span style={ipBadgeS}>⚠️ IP compartida</span>}
      </div>

      <div style={cardS}>
        <p style={cardTitleS}>Información</p>
        {[["Nombre", sel.nombre], ["Email", sel.email], ["Teléfono", sel.telefono || "—"], ["Tipo", sel.tipo || "usuario"], ["Foto", sel.fotoUrl ? "Sí" : "Sin foto"], ["IP Registro", sel.ipRegistro || "—"], ["Cumpleaños", sel.cumpleDia ? `${sel.cumpleDia}/${sel.cumpleMes}${sel.cumpleAnio ? `/${sel.cumpleAnio}` : ""}` : "No registrado"], ["Registro", new Date(sel.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })], ["Cuenta activada", sel.emailVerificadoAt ? new Date(sel.emailVerificadoAt).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : (sel.emailVerificado ? "Sí (fecha no registrada)" : "No")]].map(([l, v]) => <Row key={l} label={l} value={v ?? "—"} />)}
        {sel.estiloAlimentario && (
          <div style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "Georgia", fontSize: "0.92rem", color: "rgba(240,234,214,0.55)" }}>Estilo</span>
            <span style={{ fontFamily: "Georgia", fontSize: "0.92rem", color: "#e8a84c" }}>
              {sel.estiloAlimentario === "carnivoro" ? "🥩 Carnívoro" : sel.estiloAlimentario === "vegetariano" ? "🌱 Vegetariano" : sel.estiloAlimentario === "vegano" ? "🌿 Vegano" : "🍽️ Como de todo"}
            </span>
          </div>
        )}
        {sel.comidasFavoritas?.length > 0 && (
          <div style={{ padding: "8px 0" }}>
            <span style={{ fontFamily: "Georgia", fontSize: "0.92rem", color: "rgba(240,234,214,0.55)", display: "block", marginBottom: "6px" }}>Comidas favoritas</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {sel.comidasFavoritas.map((c: string) => (
                <span key={c} style={{ fontFamily: "Georgia", fontSize: "0.82rem", padding: "3px 10px", borderRadius: "10px", background: "rgba(232,168,76,0.1)", color: "#e8a84c" }}>{c}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botón actividad detallada */}
      <a href={`/admin/usuarios/${sel.id}/actividad`} style={{ display: "block", textAlign: "center", padding: "12px", background: "rgba(128,64,208,0.1)", border: "1px solid rgba(128,64,208,0.25)", borderRadius: "12px", fontFamily: "Georgia", fontSize: "0.88rem", color: "#a070e0", textDecoration: "none", marginBottom: "16px", letterSpacing: "0.04em" }}>🧞 Ver actividad completa del usuario →</a>

      {/* Perfil del Genio */}
      {sel.geniePerfil && (() => {
        const gp = sel.geniePerfil as { gustos?: { categorias?: Record<string, number>; comunas?: Record<string, number>; ocasiones?: Record<string, number>; horario?: Record<string, number>; precioPreferido?: string | null }; comportamiento?: { localesVisitados?: { nombre: string; categoria: string; comuna: string }[]; promocionesAbiertas?: string[]; concursosVistos?: string[]; filtrosUsados?: string[] }; respuestasGenio?: { pregunta: string; respuesta: string }[] };
        const gustos = gp.gustos ?? {};
        const comp = gp.comportamiento ?? {};
        const topCats = Object.entries(gustos.categorias ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topComunas = Object.entries(gustos.comunas ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const topHorarios = Object.entries(gustos.horario ?? {}).sort((a, b) => b[1] - a[1]);
        const visitados = comp.localesVisitados ?? [];
        const respuestas = gp.respuestasGenio ?? [];
        return (
          <div style={cardS}>
            <p style={cardTitleS}>🧞 Perfil del Genio</p>
            {topCats.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.45)", marginBottom: "6px" }}>Categorías favoritas</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {topCats.map(([cat, score]) => (
                    <span key={cat} style={{ fontFamily: "Georgia", fontSize: "0.85rem", padding: "4px 12px", borderRadius: "16px", background: "rgba(232,168,76,0.1)", border: "1px solid rgba(232,168,76,0.25)", color: "#e8a84c" }}>{cat} ({score})</span>
                  ))}
                </div>
              </div>
            )}
            {topComunas.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.45)", marginBottom: "6px" }}>Comunas preferidas</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {topComunas.map(([com, score]) => (
                    <span key={com} style={{ fontFamily: "Georgia", fontSize: "0.85rem", padding: "4px 12px", borderRadius: "16px", background: "rgba(61,184,158,0.1)", border: "1px solid rgba(61,184,158,0.25)", color: "#3db89e" }}>{com} ({score})</span>
                  ))}
                </div>
              </div>
            )}
            {topHorarios.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.45)", marginBottom: "6px" }}>Horarios de uso</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {topHorarios.map(([h, score]) => (
                    <span key={h} style={{ fontFamily: "Georgia", fontSize: "0.85rem", padding: "4px 12px", borderRadius: "16px", background: "rgba(128,64,208,0.1)", border: "1px solid rgba(128,64,208,0.25)", color: "#a070e0" }}>{h} ({score})</span>
                  ))}
                </div>
              </div>
            )}
            {gustos.precioPreferido && <Row label="Precio preferido" value={gustos.precioPreferido} />}
            {visitados.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.45)", marginBottom: "6px" }}>Últimos locales visitados ({visitados.length})</p>
                {visitados.slice(-5).reverse().map((v, i) => (
                  <p key={i} style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "#f0ead6", margin: "2px 0", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{v.nombre} <span style={{ color: "rgba(240,234,214,0.4)" }}>· {v.categoria} · {v.comuna}</span></p>
                ))}
              </div>
            )}
            {(comp.filtrosUsados?.length ?? 0) > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.45)", marginBottom: "6px" }}>Filtros usados</p>
                <p style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "rgba(240,234,214,0.6)" }}>{[...new Set(comp.filtrosUsados)].join(", ")}</p>
              </div>
            )}
            {respuestas.length > 0 && (
              <div>
                <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.45)", marginBottom: "6px" }}>Respuestas al Genio ({respuestas.length})</p>
                {respuestas.slice(-3).reverse().map((r, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", margin: 0 }}>{r.pregunta}</p>
                    <p style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "#f0ead6", margin: "2px 0 0" }}>{r.respuesta}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <div style={cardS}>
        <p style={cardTitleS}>Actividad</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {[["💛", sel._count?.favoritos ?? 0, "Favs"], ["⭐", sel._count?.resenas ?? 0, "Reseñas"], ["🏆", sel._count?.participaciones ?? 0, "Concursos"]].map(([icon, val, label]) => (
            <div key={String(label)} style={{ textAlign: "center", padding: "14px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
              <p style={{ fontSize: "1.3rem", margin: "0 0 4px" }}>{icon}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "1.3rem", color: "#e8a84c", margin: 0 }}>{val}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.45)", margin: "4px 0 0" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Concursos del usuario (from referral network data) */}
      {redReferidos.length > 0 && (
        <div style={cardS}>
          <p style={cardTitleS}>Concursos ({redReferidos.length})</p>
          {redReferidos.map((r: any) => {
            const ended = new Date(r.fechaFin) <= new Date();
            const estadoColor: Record<string, string> = { activo: "#3db89e", finalizado: "#e8a84c", completado: "#3db89e", expirado: "rgba(240,234,214,0.4)", en_revision: "#e8a84c", en_disputa: "#ff6b6b", cancelado: "#ff6b6b" };
            const color = estadoColor[r.estadoConcurso] ?? (ended ? "#e8a84c" : "#3db89e");
            const estadoLabel = r.estadoConcurso === "activo" && ended ? "Terminado" : (r.estadoConcurso ?? "").replace("_", " ");
            return (
              <div key={r.concursoId} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a href={`/concursos/${r.slug || r.concursoId}`} target="_blank" rel="noopener" style={{ fontFamily: "Georgia", fontSize: "0.92rem", color: "#f5d080", textDecoration: "none" }}>{r.premio}</a>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", margin: "2px 0 0" }}>{r.localNombre} · <span style={{ color }}>{estadoLabel}</span></p>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <p style={{ fontFamily: "Georgia", fontSize: "1.1rem", color: "#e8a84c", margin: 0 }}>{r.puntos}</p>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.35)", margin: 0 }}>pts</p>
                </div>
                {r.estado !== "activo" && <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: r.estado === "descalificado" ? "#ff6b6b" : "#e8a84c", background: r.estado === "descalificado" ? "rgba(255,80,80,0.1)" : "rgba(232,168,76,0.1)", border: `1px solid ${r.estado === "descalificado" ? "rgba(255,80,80,0.3)" : "rgba(232,168,76,0.3)"}`, borderRadius: "6px", padding: "2px 8px", flexShrink: 0 }}>{r.estado}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Red de referidos */}
      {redReferidos.length > 0 && (
        <div style={cardS}>
          <p style={cardTitleS}>Red de referidos</p>
          {redReferidos.map((r: { concursoId: string; premio: string; localNombre: string; slug: string; puntos: number; puntosNivel2: number; puntosNivel2Pendientes: number; referidoPorId: string | null; referidoPorNombre: string | null; referidosDirectos: { id: string; nombre: string; email: string; verificado: boolean; puntos: number; estado: string; ipRegistro?: string }[]; referidosNivel2: { id: string; nombre: string; email: string; verificado: boolean; ipRegistro?: string }[] }) => (
            <div key={r.concursoId} style={{ marginBottom: "16px", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px" }}>
              <p style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "#f5d080", marginBottom: "4px" }}>{r.premio}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.4)", marginBottom: "10px" }}>{r.localNombre}</p>

              {/* Desglose puntos + ajustar */}
              {(() => {
                const directosVerificados = r.referidosDirectos.filter((x: { verificado: boolean }) => x.verificado).length;
                const ptsRegistro = 1;
                const ptsDirectos = directosVerificados * 2;
                const ptsNivel2 = r.puntosNivel2;
                const ptsApoyos = Math.max(0, r.puntos - ptsRegistro - ptsDirectos - ptsNivel2);
                return (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", padding: "3px 10px", borderRadius: "10px", background: "rgba(232,168,76,0.1)", color: "#e8a84c", fontWeight: 700 }}>{r.puntos} pts total</span>
                      <button onClick={() => { setAjustarPuntos({ concursoId: r.concursoId, premio: r.premio, puntosActuales: r.puntos }); setAjustarNuevosPuntos(String(r.puntos)); setAjustarMotivo(""); setAjustarEnviarCorreo(true); }} style={{ fontFamily: "Georgia", fontSize: "0.72rem", padding: "3px 10px", borderRadius: "8px", background: "rgba(128,64,208,0.1)", border: "1px solid rgba(128,64,208,0.3)", color: "#a070e0", cursor: "pointer", marginLeft: "auto" }}>Ajustar puntos</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.4)" }}>1 (registro)</span>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.4)" }}>{directosVerificados} referidos directos verificados x 2 = {ptsDirectos}</span>
                      {ptsNivel2 > 0 && <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "#3db89e" }}>{ptsNivel2} pts nivel 2</span>}
                      {r.puntosNivel2Pendientes > 0 && <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "#ff8c00", fontStyle: "italic" }}>{r.puntosNivel2Pendientes} pts nivel 2 pendientes</span>}
                      {ptsApoyos > 0 && <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "#e05090" }}>{ptsApoyos} apoyos recibidos</span>}
                    </div>
                  </div>
                );
              })()}

              {/* Formulario ajustar puntos */}
              {ajustarPuntos?.concursoId === r.concursoId && (
                <div style={{ background: "rgba(128,64,208,0.06)", border: "1px solid rgba(128,64,208,0.2)", borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "#a070e0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Ajustar puntos — {r.premio}</p>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)" }}>{ajustarPuntos.puntosActuales} pts →</span>
                    <input type="number" value={ajustarNuevosPuntos} onChange={e => setAjustarNuevosPuntos(e.target.value)} style={{ width: "70px", padding: "6px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(128,64,208,0.3)", borderRadius: "6px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.9rem", outline: "none", textAlign: "center" }} />
                    <span style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)" }}>pts</span>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <textarea value={ajustarMotivo} onChange={e => setAjustarMotivo(e.target.value)} placeholder="Motivo del ajuste (se incluye en el correo al usuario)" style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.82rem", outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: "50px" }} />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", cursor: "pointer" }}>
                    <input type="checkbox" checked={ajustarEnviarCorreo} onChange={e => setAjustarEnviarCorreo(e.target.checked)} style={{ accentColor: "#a070e0", width: "16px", height: "16px" }} />
                    <span style={{ fontFamily: "Georgia", fontSize: "0.78rem", color: "rgba(240,234,214,0.5)" }}>Enviar correo al usuario explicando el ajuste</span>
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setAjustarPuntos(null)} style={{ flex: 1, padding: "8px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.78rem", cursor: "pointer" }}>Cancelar</button>
                    <button disabled={ajustarLoading || !ajustarNuevosPuntos} onClick={async () => {
                      setAjustarLoading(true);
                      try {
                        const res = await adminFetch(`/api/admin/usuarios/${sel.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "ajustar-puntos", concursoId: ajustarPuntos.concursoId, nuevosPuntos: parseInt(ajustarNuevosPuntos), motivo: ajustarMotivo, enviarCorreo: ajustarEnviarCorreo }) });
                        if (res.ok) { show("✓ Puntos ajustados"); setAjustarPuntos(null); setRedReferidos(prev => prev.map(x => x.concursoId === ajustarPuntos.concursoId ? { ...x, puntos: parseInt(ajustarNuevosPuntos) } : x)); } else { const d = await res.json(); show(d.error ?? "Error"); }
                      } catch { show("Error de conexión"); }
                      setAjustarLoading(false);
                    }} style={{ flex: 2, padding: "8px", background: "#a070e0", border: "none", borderRadius: "6px", color: "#fff", fontFamily: "Georgia", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", opacity: ajustarNuevosPuntos ? 1 : 0.5 }}>{ajustarLoading ? "..." : "Aplicar ajuste"}</button>
                  </div>
                </div>
              )}

              {/* Referido por */}
              {r.referidoPorNombre && (
                <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)", marginBottom: "8px" }}>
                  Referido por: <button onClick={() => { const u = usuarios.find(x => x.id === r.referidoPorId); if (u) { setUserHistory(prev => [...prev, sel]); setSel(u); resetModes(); } }} style={{ background: "none", border: "none", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.82rem", cursor: "pointer", padding: 0, textDecoration: "underline" }}>{r.referidoPorNombre}</button>
                </p>
              )}

              {/* Referidos directos */}
              {r.referidosDirectos.length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Referidos directos ({r.referidosDirectos.length}) — {r.referidosDirectos.filter((x: { verificado: boolean }) => x.verificado).length} verificados</p>
                  {r.referidosDirectos.map((ref) => (
                    <div key={ref.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", flexWrap: "wrap" }}>
                      <button onClick={() => { const u = usuarios.find(x => x.id === ref.id); if (u) { setUserHistory(prev => [...prev, sel]); setSel(u); resetModes(); } }} style={{ background: "none", border: "none", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.82rem", cursor: "pointer", padding: 0, textAlign: "left", flex: 1, minWidth: "100px" }}>{ref.nombre}</button>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.25)" }}>{ref.email}</span>
                      {ref.ipRegistro && <span style={{ fontFamily: "Georgia", fontSize: "0.65rem", color: "rgba(240,234,214,0.2)" }}>{ref.ipRegistro}</span>}
                      <span style={{ fontFamily: "Georgia", fontSize: "0.68rem", padding: "2px 8px", borderRadius: "8px", background: ref.verificado ? "rgba(61,184,158,0.1)" : "rgba(255,80,80,0.1)", border: `1px solid ${ref.verificado ? "rgba(61,184,158,0.3)" : "rgba(255,80,80,0.3)"}`, color: ref.verificado ? "#3db89e" : "#ff8080", flexShrink: 0 }}>{ref.verificado ? "✓ Verificado" : "Sin verificar"}</span>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", padding: "2px 8px", borderRadius: "8px", background: ref.verificado ? "rgba(232,168,76,0.1)" : "rgba(255,255,255,0.03)", color: ref.verificado ? "#e8a84c" : "rgba(240,234,214,0.25)", flexShrink: 0 }}>{ref.verificado ? "+2 pts" : "+2 pendiente"}</span>
                      {ref.estado === "descalificado" && <span style={{ fontFamily: "Georgia", fontSize: "0.68rem", padding: "2px 8px", borderRadius: "8px", background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", color: "#ff6b6b", flexShrink: 0 }}>Descalificado</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Referidos nivel 2 */}
              {r.referidosNivel2.length > 0 && (
                <div>
                  <p style={{ fontFamily: "Georgia", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Red nivel 2 ({r.referidosNivel2.length}) — {r.referidosNivel2.filter((x: { verificado: boolean }) => x.verificado).length} verificados</p>
                  {r.referidosNivel2.map((ref) => (
                    <div key={ref.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", flexWrap: "wrap" }}>
                      <button onClick={() => { const u = usuarios.find(x => x.id === ref.id); if (u) { setUserHistory(prev => [...prev, sel]); setSel(u); resetModes(); } }} style={{ background: "none", border: "none", color: "#f0ead6", fontFamily: "Georgia", fontSize: "0.82rem", cursor: "pointer", padding: 0, textAlign: "left", flex: 1, minWidth: "100px" }}>{ref.nombre}</button>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", color: "rgba(240,234,214,0.25)" }}>{ref.email}</span>
                      {ref.ipRegistro && <span style={{ fontFamily: "Georgia", fontSize: "0.65rem", color: "rgba(240,234,214,0.2)" }}>{ref.ipRegistro}</span>}
                      <span style={{ fontFamily: "Georgia", fontSize: "0.68rem", padding: "2px 8px", borderRadius: "8px", background: ref.verificado ? "rgba(61,184,158,0.1)" : "rgba(255,80,80,0.1)", border: `1px solid ${ref.verificado ? "rgba(61,184,158,0.3)" : "rgba(255,80,80,0.3)"}`, color: ref.verificado ? "#3db89e" : "#ff8080", flexShrink: 0 }}>{ref.verificado ? "✓ Verificado" : "Sin verificar"}</span>
                      <span style={{ fontFamily: "Georgia", fontSize: "0.72rem", padding: "2px 8px", borderRadius: "8px", background: ref.verificado ? "rgba(61,184,158,0.08)" : "rgba(255,255,255,0.03)", color: ref.verificado ? "#3db89e" : "rgba(240,234,214,0.25)", flexShrink: 0 }}>{ref.verificado ? "+1 pt" : "+1 pendiente"}</span>
                    </div>
                  ))}
                </div>
              )}

              {r.referidosDirectos.length === 0 && !r.referidoPorNombre && (
                <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.3)", fontStyle: "italic" }}>Sin referidos en este concurso</p>
              )}
            </div>
          ))}
        </div>
      )}
      {loadingRed && <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", textAlign: "center" }}>Cargando red...</p>}

      {editMode && (
        <div style={cardS}>
          <p style={cardTitleS}>Editar datos</p>
          {[["nombre", "Nombre"], ["email", "Email"], ["telefono", "Teléfono"], ["tipo", "Tipo (usuario/admin)"], ["fotoUrl", "URL foto de perfil"], ["cumpleDia", "Día cumpleaños"], ["cumpleMes", "Mes cumpleaños"], ["cumpleAnio", "Año cumpleaños"]].map(([key, label]) => (
            <div key={key} style={{ marginBottom: "10px" }}>
              <label style={labelS}>{label}</label>
              <input style={inputS} value={editData[key] ?? ""} onChange={e => setEditData(d => ({ ...d, [key]: e.target.value }))} />
            </div>
          ))}
          <div key="estiloAlimentario" style={{ marginBottom: "10px" }}>
            <label style={labelS}>Estilo alimentario</label>
            <select style={inputS} value={editData.estiloAlimentario ?? ""} onChange={e => setEditData(d => ({ ...d, estiloAlimentario: e.target.value }))}>
              <option value="">Sin definir</option>
              <option value="carnivoro">Carnívoro</option>
              <option value="vegetariano">Vegetariano</option>
              <option value="vegano">Vegano</option>
              <option value="omnivoro">Como de todo</option>
            </select>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={labelS}>Comidas favoritas (máx. 3)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {["Pizza", "Sushi", "Hamburguesa", "Mexicano", "Vegano", "Vegetariano", "Saludable", "Pastas", "Pollo", "Mariscos", "Carnes / Parrilla", "Árabe", "Peruano", "India", "Coreano", "Mediterráneo", "Thai", "Ramen", "Fusión", "Sin gluten", "Café", "Postres", "Brunch"].map(c => {
                const comidas: string[] = Array.isArray(editData.comidasFavoritas) ? editData.comidasFavoritas : [];
                const sel = comidas.includes(c);
                const maxed = comidas.length >= 3 && !sel;
                return <button key={c} type="button" disabled={maxed} onClick={() => {
                  const cur: string[] = Array.isArray(editData.comidasFavoritas) ? editData.comidasFavoritas : [];
                  setEditData(d => ({ ...d, comidasFavoritas: sel ? cur.filter(x => x !== c) : [...cur, c] }));
                }} style={{ padding: "4px 10px", borderRadius: "10px", border: sel ? "1px solid #e8a84c" : "1px solid rgba(232,168,76,0.15)", background: sel ? "rgba(232,168,76,0.15)" : "transparent", color: sel ? "#e8a84c" : maxed ? "rgba(240,234,214,0.2)" : "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.78rem", cursor: maxed ? "default" : "pointer" }}>{c}</button>;
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { if (await action("editar", editData)) { setSel({ ...sel, ...editData }); setUsuarios(p => p.map(u => u.id === sel.id ? { ...u, ...editData } : u)); setEditMode(false); show("✓ Datos actualizados"); } }} disabled={loading} style={btnPrimaryS}>{loading ? "..." : "Guardar"}</button>
            <button onClick={() => setEditMode(false)} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

      {passMode && (
        <div style={cardS}>
          <p style={cardTitleS}>Cambiar contraseña</p>
          <input style={{ ...inputS, marginBottom: "10px" }} type="password" placeholder="Nueva contraseña (mín. 8)" value={newPass} onChange={e => setNewPass(e.target.value)} />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { if (newPass.length < 8) { show("Mínimo 8 caracteres"); return; } if (await action("cambiar-password", { nuevaPassword: newPass })) { setPassMode(false); setNewPass(""); show("✓ Contraseña cambiada"); } }} disabled={loading} style={btnPrimaryS}>{loading ? "..." : "Cambiar"}</button>
            <button onClick={() => { setPassMode(false); setNewPass(""); }} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={{ ...cardS, borderColor: "rgba(255,80,80,0.3)", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#ff6b6b", fontWeight: 700, marginBottom: "6px" }}>¿Eliminar {sel.nombre}?</p>
          <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)", marginBottom: "14px" }}>Se borran todos sus datos. No se puede deshacer.</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={async () => { setLoading(true); try { const r = await adminFetch(`/api/admin/usuarios/${sel.id}`, { method: "DELETE" }); if (r.ok) { setUsuarios(p => p.filter(u => u.id !== sel.id)); setSel(null); show("Eliminado"); } } catch {} setLoading(false); }} disabled={loading} style={{ ...btnPrimaryS, background: "#ff6b6b" }}>{loading ? "..." : "Eliminar"}</button>
            <button onClick={() => setDeleteConfirm(false)} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

      {descalificarConfirm && (
        <div style={{ ...cardS, borderColor: "rgba(255,80,80,0.3)", textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "#ff6b6b", fontWeight: 700, marginBottom: "6px" }}>¿Descalificar a {sel.nombre}?</p>
          <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)", marginBottom: "14px" }}>Se le quitarán los puntos en todos los concursos activos donde participa.</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleDescalificar} disabled={loading} style={{ ...btnPrimaryS, background: "#e05555" }}>{loading ? "..." : "Descalificar"}</button>
            <button onClick={() => setDescalificarConfirm(false)} style={btnSecS}>Cancelar</button>
          </div>
        </div>
      )}

      {!editMode && !passMode && !deleteConfirm && !descalificarConfirm && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
          <button onClick={() => { resetModes(); setEditMode(true); setEditData({ nombre: sel.nombre ?? "", email: sel.email ?? "", telefono: sel.telefono ?? "", tipo: sel.tipo ?? "usuario", fotoUrl: sel.fotoUrl ?? "", cumpleDia: String(sel.cumpleDia ?? ""), cumpleMes: String(sel.cumpleMes ?? ""), cumpleAnio: String(sel.cumpleAnio ?? ""), estiloAlimentario: sel.estiloAlimentario ?? "", comidasFavoritas: sel.comidasFavoritas ?? [] }); }} style={btnOutlineS}>✏️ Editar datos</button>
          <button onClick={() => { resetModes(); setPassMode(true); }} style={btnOutlineS}>🔑 Cambiar contraseña</button>
          {sel.fotoUrl && <button onClick={async () => { if (await action("resetear-foto")) { setSel({ ...sel, fotoUrl: "" }); setUsuarios(p => p.map(u => u.id === sel.id ? { ...u, fotoUrl: "" } : u)); show("✓ Foto de perfil eliminada"); } }} disabled={loading} style={btnOutlineS}>🖼️ Resetear foto de perfil</button>}
          {!sel.emailVerificado && (
            <>
              <button onClick={async () => { if (await action("activar")) { setSel({ ...sel, emailVerificado: true }); setUsuarios(p => p.map(u => u.id === sel.id ? { ...u, emailVerificado: true } : u)); show("✓ Usuario activado"); } }} disabled={loading} style={{ ...btnOutlineS, color: "#3db89e", borderColor: "rgba(61,184,158,0.4)" }}>✓ Activar cuenta</button>
              <button onClick={async () => { if (await action("reenviar-verificacion")) show("✓ Email de verificación enviado"); }} disabled={loading} style={btnOutlineS}>📧 Reenviar email de verificación</button>
            </>
          )}
          {sel.emailVerificado && (
            <button onClick={async () => { if (await action("desactivar")) { setSel({ ...sel, emailVerificado: false }); setUsuarios(p => p.map(u => u.id === sel.id ? { ...u, emailVerificado: false } : u)); show("Usuario desactivado"); } }} disabled={loading} style={{ ...btnOutlineS, color: "#ff8080", borderColor: "rgba(255,80,80,0.3)" }}>✗ Desactivar cuenta</button>
          )}
          <button onClick={() => { resetModes(); setDescalificarConfirm(true); }} style={{ ...btnOutlineS, color: "#ff8c00", borderColor: "rgba(255,140,0,0.4)" }}>🚫 Descalificar de concursos</button>
          <button onClick={() => { resetModes(); setDeleteConfirm(true); }} style={{ ...btnOutlineS, color: "#ff8080", borderColor: "rgba(255,80,80,0.3)" }}>🗑️ Eliminar usuario</button>
        </div>
      )}
    </div>
  );

  // ── LIST VIEW ──
  return (
    <div>
      {toast && <div style={toastS}>{toast}</div>}
      <h1 style={{ fontFamily: "Georgia", fontSize: "1.6rem", color: "#e8a84c", marginBottom: "16px" }}>Usuarios ({totalUsuarios})</h1>
      <input style={{ ...inputS, marginBottom: "14px", maxWidth: "500px" }} placeholder="Buscar por nombre o email..." value={busq} onChange={e => setBusq(e.target.value)} />

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
        {[
          { key: "", label: "Todos" },
          { key: "verificados", label: "✓ Verificados" },
          { key: "no_verificados", label: "⏳ Sin verificar" },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltroEstado(f.key)} style={{ padding: "6px 14px", borderRadius: "20px", border: filtroEstado === f.key ? "1px solid #e8a84c" : "1px solid rgba(255,255,255,0.1)", background: filtroEstado === f.key ? "rgba(232,168,76,0.12)" : "transparent", color: filtroEstado === f.key ? "#e8a84c" : "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.82rem", cursor: "pointer" }}>{f.label}</button>
        ))}
        <span style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
        <select value={ordenUsuarios} onChange={e => setOrdenUsuarios(e.target.value)} style={{ padding: "6px 28px 6px 12px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(240,234,214,0.6)", fontFamily: "Georgia", fontSize: "0.82rem", cursor: "pointer", outline: "none", appearance: "none" as const, WebkitAppearance: "none" as const, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23e8a84c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
          <option value="reciente" style={{ background: "#0a0812" }}>Más recientes</option>
          <option value="actividad" style={{ background: "#0a0812" }}>Más actividad</option>
          <option value="concursos" style={{ background: "#0a0812" }}>Más concursos</option>
        </select>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", cursor: "pointer" }}>
        <input type="checkbox" checked={soloIPsDuplicadas} onChange={e => setSoloIPsDuplicadas(e.target.checked)} style={{ accentColor: "#ff8c00", width: "18px", height: "18px" }} />
        <span style={{ fontFamily: "Georgia", fontSize: "0.95rem", color: "rgba(240,234,214,0.55)" }}>Mostrar solo IPs duplicadas</span>
      </label>

      {loadingList ? (
        <p style={{ fontFamily: "Georgia", fontSize: "0.9rem", color: "rgba(240,234,214,0.4)", textAlign: "center", padding: "40px" }}>Cargando...</p>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map(u => (
          <div key={u.id} onClick={() => { setSel(u); resetModes(); }} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", cursor: "pointer" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #c4853a, #e8a84c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, color: "#1a0e05", flexShrink: 0 }}>{u.nombre?.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "Georgia", fontSize: "1rem", color: "#f0ead6", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.nombre}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "0.88rem", color: "rgba(240,234,214,0.45)", margin: "3px 0 0" }}>{u.email}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", color: u.emailVerificado ? "#3db89e" : "#ff8080" }}>{u.emailVerificado ? "✓" : "⏳"}</span>
                {isIPDuplicada(u.ipRegistro) && <span style={ipBadgeS}>⚠️ IP</span>}
              </div>
              {(u._count?.participaciones > 0 || u._count?.favoritos > 0) && (
                <div style={{ display: "flex", gap: "6px", fontSize: "0.75rem", color: "rgba(240,234,214,0.4)" }}>
                  {u._count.participaciones > 0 && <span>🏆{u._count.participaciones}</span>}
                  {u._count.favoritos > 0 && <span>💛{u._count.favoritos}</span>}
                  {u._count.resenas > 0 && <span>⭐{u._count.resenas}</span>}
                </div>
              )}
              <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.6)", margin: 0 }}>{u.ipRegistro && u.ipRegistro !== "unknown" ? u.ipRegistro : ""}</p>
              <p style={{ fontFamily: "Georgia", fontSize: "0.82rem", color: "rgba(240,234,214,0.5)", margin: 0 }}>{new Date(u.createdAt).toLocaleDateString("es-CL")}</p>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "20px" }}>
          <button disabled={page <= 1} onClick={() => fetchUsuarios(page - 1, busqDebounced)} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(232,168,76,0.2)", background: page <= 1 ? "transparent" : "rgba(232,168,76,0.1)", color: page <= 1 ? "rgba(240,234,214,0.2)" : "#e8a84c", fontFamily: "Georgia", fontSize: "0.82rem", cursor: page <= 1 ? "default" : "pointer" }}>← Anterior</button>
          <span style={{ fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.5)" }}>Página {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => fetchUsuarios(page + 1, busqDebounced)} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(232,168,76,0.2)", background: page >= totalPages ? "transparent" : "rgba(232,168,76,0.1)", color: page >= totalPages ? "rgba(240,234,214,0.2)" : "#e8a84c", fontFamily: "Georgia", fontSize: "0.82rem", cursor: page >= totalPages ? "default" : "pointer" }}>Siguiente →</button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}><span style={{ fontFamily: "Georgia", fontSize: "0.92rem", color: "rgba(240,234,214,0.55)" }}>{label}</span><span style={{ fontFamily: "Georgia", fontSize: "0.92rem", color: "#f0ead6", textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>{value}</span></div>;
}

const toastS: React.CSSProperties = { position: "fixed", top: "16px", right: "16px", background: "rgba(13,7,3,0.97)", border: "1px solid rgba(232,168,76,0.4)", borderRadius: "12px", padding: "14px 22px", fontFamily: "Georgia", fontSize: "0.95rem", color: "#e8a84c", zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" };
const backS: React.CSSProperties = { background: "none", border: "none", color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "1rem", cursor: "pointer", padding: 0, marginBottom: "16px" };
const cardS: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "18px", marginBottom: "14px" };
const cardTitleS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.85rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(240,234,214,0.45)", margin: "0 0 12px" };
const inputS: React.CSSProperties = { width: "100%", padding: "12px 14px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0ead6", fontFamily: "Georgia", fontSize: "1rem", outline: "none", boxSizing: "border-box" };
const labelS: React.CSSProperties = { fontFamily: "Georgia", fontSize: "0.85rem", color: "rgba(240,234,214,0.45)", display: "block", marginBottom: "6px" };
const btnPrimaryS: React.CSSProperties = { flex: 1, padding: "14px", background: "#e8a84c", border: "none", borderRadius: "10px", color: "#0a0812", fontFamily: "Georgia", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" };
const btnSecS: React.CSSProperties = { flex: 1, padding: "14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "rgba(240,234,214,0.5)", fontFamily: "Georgia", fontSize: "0.95rem", cursor: "pointer" };
const btnOutlineS: React.CSSProperties = { display: "block", width: "100%", padding: "14px", background: "none", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "10px", color: "#e8a84c", fontFamily: "Georgia", fontSize: "0.95rem", cursor: "pointer", textAlign: "left" };
const ipBadgeS: React.CSSProperties = { background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.4)", color: "#ff8c00", borderRadius: "6px", padding: "3px 10px", fontSize: "0.78rem", fontWeight: 700, whiteSpace: "nowrap" };
