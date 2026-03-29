"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  PROMOCIONES,
  TIPO_ICONS,
  TIPO_LABELS,
  CATEGORIA_LABELS,
  DIAS_FULL,
  DIAS_SHORT,
  isPromocionActivaAhora,
  type Promocion,
  type TipoPromocion,
  type CategoriaPromocion,
} from "@/lib/mockPromociones";

// Mock: las promociones de este local (Pizza Napoli)
const LOCAL_ID = "pizza-napoli";

type FormState = {
  tipo: TipoPromocion;
  titulo: string;
  descripcion: string;
  precioOriginal: string;
  precioDescuento: string;
  codigoCupon: string;
  usarCodigoAuto: boolean;
  diasSemana: number[];
  horaInicio: string;
  horaFin: string;
  fechaInicio: string;
  fechaVencimiento: string;
  limiteUsos: string;
  categoria: CategoriaPromocion;
};

const FORM_INICIAL: FormState = {
  tipo: "descuento",
  titulo: "",
  descripcion: "",
  precioOriginal: "",
  precioDescuento: "",
  codigoCupon: "",
  usarCodigoAuto: false,
  diasSemana: [1, 2, 3, 4, 5],
  horaInicio: "12:00",
  horaFin: "15:00",
  fechaInicio: new Date().toISOString().split("T")[0],
  fechaVencimiento: "",
  limiteUsos: "",
  categoria: "almuerzo",
};

function generarCodigo(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function PanelPromocionesPage() {
  const [misPromociones, setMisPromociones] = useState<Promocion[]>(
    PROMOCIONES.filter((p) => p.localId === LOCAL_ID)
  );
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [guardado, setGuardado] = useState(false);
  const [pausadas, setPausadas] = useState<Set<number>>(new Set());

  const toggleDia = (dia: number) => {
    setForm((prev) => ({
      ...prev,
      diasSemana: prev.diasSemana.includes(dia)
        ? prev.diasSemana.filter((d) => d !== dia)
        : [...prev.diasSemana, dia].sort(),
    }));
  };

  const handlePublicar = () => {
    if (!form.titulo || !form.descripcion || form.diasSemana.length === 0) return;

    const nueva: Promocion = {
      id: Date.now(),
      localId: LOCAL_ID,
      local: "Pizza Napoli",
      comuna: "Providencia",
      tipo: form.tipo,
      categoria: form.categoria,
      imagen: "🍕",
      titulo: form.titulo,
      descripcion: form.descripcion,
      precioOriginal: form.precioOriginal ? Number(form.precioOriginal) : undefined,
      precioDescuento: form.precioDescuento ? Number(form.precioDescuento) : undefined,
      porcentajeDescuento:
        form.precioOriginal && form.precioDescuento
          ? Math.round((1 - Number(form.precioDescuento) / Number(form.precioOriginal)) * 100)
          : undefined,
      codigoCupon: form.tipo === "cupon"
        ? (form.usarCodigoAuto ? generarCodigo() : form.codigoCupon || generarCodigo())
        : undefined,
      diasSemana: form.diasSemana,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      fechaVencimiento: form.fechaVencimiento || "2026-06-30",
      limiteUsos: form.limiteUsos ? Number(form.limiteUsos) : undefined,
      usosActuales: 0,
      activa: true,
    };

    setMisPromociones((prev) => [nueva, ...prev]);
    setForm(FORM_INICIAL);
    setMostrarForm(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  const togglePausar = (id: number) => {
    setPausadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const eliminar = (id: number) => {
    setMisPromociones((prev) => prev.filter((p) => p.id !== id));
  };

  const tiposOptions: Array<{ key: TipoPromocion; label: string; icon: string }> = [
    { key: "descuento",      label: "Descuento %",     icon: "🏷️" },
    { key: "2x1",            label: "2 por 1",         icon: "🔁" },
    { key: "cupon",          label: "Cupón",           icon: "🎟️" },
    { key: "precio_especial", label: "Precio Especial", icon: "⭐" },
    { key: "happy_hour",     label: "Happy Hour",      icon: "⚡" },
  ];

  const categoriasOptions: Array<{ key: CategoriaPromocion; label: string }> = [
    { key: "almuerzo", label: "🥗 Almuerzo" },
    { key: "cena",     label: "🌙 Cena" },
    { key: "desayuno", label: "🌅 Desayuno" },
    { key: "bebidas",  label: "🍺 Bebidas" },
    { key: "postres",  label: "🍰 Postres" },
  ];

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      <section className="dc-panel-promo-section">
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "48px",
            flexWrap: "wrap",
            gap: "20px",
          }}>
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "8px",
              }}>
                <Link href="/panel/dashboard" style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  textDecoration: "none",
                }}>
                  Panel
                </Link>
                <span style={{ color: "var(--border-color)" }}>›</span>
                <span style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.6rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                }}>
                  Promociones
                </span>
              </div>
              <h1 style={{
                fontFamily: "var(--font-cinzel-decorative)",
                fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
                color: "var(--accent)",
                textShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)",
              }}>
                Mis Promociones 🏷️
              </h1>
              <p style={{
                fontFamily: "var(--font-lato)",
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                marginTop: "8px",
              }}>
                {misPromociones.length} promociones · Pizza Napoli
              </p>
            </div>

            <button
              onClick={() => setMostrarForm((v) => !v)}
              style={{
                fontFamily: "var(--font-cinzel)",
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "14px 28px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
                color: "var(--bg-primary)",
                fontWeight: 700,
                cursor: "pointer",
                minHeight: "52px",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              {mostrarForm ? "✕ Cancelar" : "+ Crear promoción"}
            </button>
          </div>

          {/* Toast guardado */}
          {guardado && (
            <div style={{
              position: "fixed",
              bottom: "32px",
              right: "32px",
              background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
              color: "var(--bg-primary)",
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "16px 24px",
              borderRadius: "12px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              zIndex: 200,
              fontWeight: 700,
            }}>
              ✓ Promoción publicada exitosamente
            </div>
          )}

          {/* ── Formulario crear ─────────────────────────────────────── */}
          {mostrarForm && (
            <div style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "20px",
              padding: "40px",
              marginBottom: "48px",
            }}>
              <h2 style={{
                fontFamily: "var(--font-cinzel-decorative)",
                fontSize: "1.3rem",
                color: "var(--accent)",
                marginBottom: "32px",
              }}>
                Nueva Promoción
              </h2>

              <div className="dc-panel-form-grid">

                {/* Tipo de promoción */}
                <div className="dc-panel-field dc-panel-field--full">
                  <label className="dc-panel-label">Tipo de promoción</label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {tiposOptions.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, tipo: t.key }))}
                        style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.65rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "10px 18px",
                          borderRadius: "30px",
                          border: form.tipo === t.key
                            ? t.key === "happy_hour" ? "1px solid #d4a017" : "1px solid var(--accent)"
                            : "1px solid var(--border-color)",
                          background: form.tipo === t.key
                            ? t.key === "happy_hour"
                              ? "rgba(212,160,23,0.15)"
                              : "color-mix(in srgb, var(--accent) 15%, transparent)"
                            : "transparent",
                          color: form.tipo === t.key
                            ? t.key === "happy_hour" ? "#d4a017" : "var(--accent)"
                            : "var(--text-muted)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categoría */}
                <div className="dc-panel-field dc-panel-field--full">
                  <label className="dc-panel-label">Categoría</label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {categoriasOptions.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, categoria: c.key }))}
                        style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.65rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "10px 18px",
                          borderRadius: "30px",
                          border: form.categoria === c.key ? "1px solid var(--accent)" : "1px solid var(--border-color)",
                          background: form.categoria === c.key ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "transparent",
                          color: form.categoria === c.key ? "var(--accent)" : "var(--text-muted)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Título */}
                <div className="dc-panel-field dc-panel-field--full">
                  <label className="dc-panel-label">Título de la promoción *</label>
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ej: Happy Hour: 30% en cervezas artesanales"
                    className="dc-panel-input"
                  />
                </div>

                {/* Descripción */}
                <div className="dc-panel-field dc-panel-field--full">
                  <label className="dc-panel-label">Descripción detallada *</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Describe tu promoción con todos los detalles relevantes..."
                    rows={3}
                    className="dc-panel-input dc-panel-textarea"
                  />
                </div>

                {/* Precios */}
                <div className="dc-panel-field">
                  <label className="dc-panel-label">Precio original ($)</label>
                  <input
                    type="number"
                    value={form.precioOriginal}
                    onChange={(e) => setForm((prev) => ({ ...prev, precioOriginal: e.target.value }))}
                    placeholder="Ej: 5900"
                    className="dc-panel-input"
                  />
                </div>
                <div className="dc-panel-field">
                  <label className="dc-panel-label">Precio con descuento ($)</label>
                  <input
                    type="number"
                    value={form.precioDescuento}
                    onChange={(e) => setForm((prev) => ({ ...prev, precioDescuento: e.target.value }))}
                    placeholder="Ej: 3990"
                    className="dc-panel-input"
                  />
                </div>

                {/* Cupón (solo si tipo = cupon) */}
                {form.tipo === "cupon" && (
                  <div className="dc-panel-field dc-panel-field--full">
                    <label className="dc-panel-label">Código de cupón</label>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        value={form.usarCodigoAuto ? "(Generado automáticamente)" : form.codigoCupon}
                        onChange={(e) => setForm((prev) => ({ ...prev, codigoCupon: e.target.value.toUpperCase() }))}
                        disabled={form.usarCodigoAuto}
                        placeholder="Ej: DESCUENTO20"
                        className="dc-panel-input"
                        style={{ flex: 1, opacity: form.usarCodigoAuto ? 0.5 : 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, usarCodigoAuto: !prev.usarCodigoAuto }))}
                        style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.6rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "10px 16px",
                          borderRadius: "30px",
                          border: form.usarCodigoAuto ? "1px solid var(--oasis-bright)" : "1px solid var(--border-color)",
                          background: form.usarCodigoAuto ? "rgba(61,184,158,0.15)" : "transparent",
                          color: form.usarCodigoAuto ? "var(--oasis-bright)" : "var(--text-muted)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "all 0.2s",
                        }}
                      >
                        {form.usarCodigoAuto ? "✓ Auto" : "Generar auto"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Días de la semana */}
                <div className="dc-panel-field dc-panel-field--full">
                  <label className="dc-panel-label">Días que aplica *</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {DIAS_FULL.map((dia, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDia(idx)}
                        style={{
                          fontFamily: "var(--font-cinzel)",
                          fontSize: "0.6rem",
                          letterSpacing: "0.05em",
                          width: "40px", height: "40px",
                          borderRadius: "50%",
                          border: form.diasSemana.includes(idx)
                            ? "1px solid var(--accent)"
                            : "1px solid var(--border-color)",
                          background: form.diasSemana.includes(idx)
                            ? "color-mix(in srgb, var(--accent) 20%, transparent)"
                            : "transparent",
                          color: form.diasSemana.includes(idx) ? "var(--accent)" : "var(--text-muted)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          fontWeight: form.diasSemana.includes(idx) ? 700 : 400,
                        }}
                      >
                        {DIAS_SHORT[idx]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horario */}
                <div className="dc-panel-field">
                  <label className="dc-panel-label">Hora de inicio</label>
                  <input
                    type="time"
                    value={form.horaInicio}
                    onChange={(e) => setForm((prev) => ({ ...prev, horaInicio: e.target.value }))}
                    className="dc-panel-input"
                  />
                </div>
                <div className="dc-panel-field">
                  <label className="dc-panel-label">Hora de fin</label>
                  <input
                    type="time"
                    value={form.horaFin}
                    onChange={(e) => setForm((prev) => ({ ...prev, horaFin: e.target.value }))}
                    className="dc-panel-input"
                  />
                </div>

                {/* Fechas */}
                <div className="dc-panel-field">
                  <label className="dc-panel-label">Fecha de inicio</label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => setForm((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                    className="dc-panel-input"
                  />
                </div>
                <div className="dc-panel-field">
                  <label className="dc-panel-label">Fecha de vencimiento</label>
                  <input
                    type="date"
                    value={form.fechaVencimiento}
                    onChange={(e) => setForm((prev) => ({ ...prev, fechaVencimiento: e.target.value }))}
                    className="dc-panel-input"
                  />
                </div>

                {/* Límite de usos */}
                <div className="dc-panel-field">
                  <label className="dc-panel-label">Límite de usos (opcional)</label>
                  <input
                    type="number"
                    value={form.limiteUsos}
                    onChange={(e) => setForm((prev) => ({ ...prev, limiteUsos: e.target.value }))}
                    placeholder="Sin límite"
                    className="dc-panel-input"
                  />
                </div>

                {/* Foto placeholder */}
                <div className="dc-panel-field">
                  <label className="dc-panel-label">Foto del plato (opcional)</label>
                  <div style={{
                    border: "2px dashed var(--border-color)",
                    borderRadius: "12px",
                    padding: "24px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-color)"; }}
                  >
                    <p style={{ fontSize: "2rem", marginBottom: "8px" }}>📷</p>
                    <p style={{
                      fontFamily: "var(--font-cinzel)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                    }}>
                      Subir imagen
                    </p>
                  </div>
                </div>

                {/* Preview del descuento */}
                {form.precioOriginal && form.precioDescuento && (
                  <div className="dc-panel-field" style={{
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "8px",
                  }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                      Vista previa del precio
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: "1rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                        ${Number(form.precioOriginal).toLocaleString("es-CL")}
                      </span>
                      <span style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "var(--accent)" }}>
                        ${Number(form.precioDescuento).toLocaleString("es-CL")}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", fontWeight: 700,
                        padding: "4px 10px", borderRadius: "20px",
                        background: "rgba(255,100,50,0.15)", color: "#ff8860",
                        border: "1px solid rgba(255,100,50,0.3)",
                      }}>
                        -{Math.round((1 - Number(form.precioDescuento) / Number(form.precioOriginal)) * 100)}%
                      </span>
                    </div>
                  </div>
                )}

              </div>

              {/* Botón publicar */}
              <div style={{ marginTop: "32px", display: "flex", gap: "16px" }}>
                <button
                  onClick={handlePublicar}
                  disabled={!form.titulo || !form.descripcion || form.diasSemana.length === 0}
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "16px 36px",
                    borderRadius: "12px",
                    border: "none",
                    background: !form.titulo || !form.descripcion || form.diasSemana.length === 0
                      ? "rgba(255,255,255,0.1)"
                      : "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))",
                    color: !form.titulo || !form.descripcion || form.diasSemana.length === 0
                      ? "var(--text-muted)"
                      : "var(--bg-primary)",
                    fontWeight: 700,
                    cursor: !form.titulo || !form.descripcion || form.diasSemana.length === 0 ? "not-allowed" : "pointer",
                    minHeight: "56px",
                    transition: "opacity 0.2s",
                  }}
                >
                  Publicar promoción →
                </button>
                <button
                  onClick={() => { setForm(FORM_INICIAL); setMostrarForm(false); }}
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "16px 24px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    minHeight: "56px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-color)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* ── Lista de promociones ─────────────────────────────────── */}
          <div>
            <h2 style={{
              fontFamily: "var(--font-cinzel)",
              fontSize: "0.65rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "24px",
            }}>
              Promociones activas — {misPromociones.length}
            </h2>

            {misPromociones.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "60px 20px",
                border: "2px dashed var(--border-color)",
                borderRadius: "20px",
              }}>
                <p style={{ fontSize: "3rem", marginBottom: "16px" }}>🏷️</p>
                <p style={{
                  fontFamily: "var(--font-cinzel)",
                  fontSize: "0.9rem",
                  letterSpacing: "0.1em",
                  color: "var(--text-muted)",
                }}>
                  Aún no tienes promociones
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {misPromociones.map((promo) => {
                  const isPausada = pausadas.has(promo.id);
                  const isActivaAhora = isPromocionActivaAhora(promo) && !isPausada;
                  const isHH = promo.tipo === "happy_hour";

                  return (
                    <div
                      key={promo.id}
                      style={{
                        background: "var(--bg-secondary)",
                        border: isPausada
                          ? "1px solid rgba(255,255,255,0.08)"
                          : isHH ? "1px solid rgba(212,160,23,0.3)" : "1px solid var(--border-color)",
                        borderRadius: "16px",
                        padding: "24px",
                        opacity: isPausada ? 0.55 : 1,
                        transition: "opacity 0.3s ease",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}>
                        {/* Info */}
                        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1, minWidth: "200px" }}>
                          <span style={{ fontSize: "2.2rem", flexShrink: 0 }}>{promo.imagen}</span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                              <span style={{
                                fontFamily: "var(--font-cinzel)",
                                fontSize: "0.55rem",
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                padding: "4px 10px",
                                borderRadius: "20px",
                                border: isHH ? "1px solid rgba(212,160,23,0.5)" : "1px solid var(--border-color)",
                                color: isHH ? "#d4a017" : "var(--accent)",
                              }}>
                                {TIPO_ICONS[promo.tipo]} {TIPO_LABELS[promo.tipo]}
                              </span>
                              {isActivaAhora && (
                                <span style={{
                                  fontFamily: "var(--font-cinzel)",
                                  fontSize: "0.5rem",
                                  letterSpacing: "0.12em",
                                  textTransform: "uppercase",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  background: "rgba(61,184,158,0.15)",
                                  border: "1px solid rgba(61,184,158,0.4)",
                                  color: "var(--oasis-bright)",
                                }}>
                                  ● Activa ahora
                                </span>
                              )}
                              {isPausada && (
                                <span style={{
                                  fontFamily: "var(--font-cinzel)",
                                  fontSize: "0.5rem",
                                  letterSpacing: "0.12em",
                                  textTransform: "uppercase",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  border: "1px solid rgba(255,255,255,0.15)",
                                  color: "var(--text-muted)",
                                }}>
                                  ⏸ Pausada
                                </span>
                              )}
                            </div>
                            <p style={{
                              fontFamily: "var(--font-cinzel)",
                              fontSize: "0.9rem",
                              color: "var(--text-primary)",
                              marginBottom: "4px",
                            }}>
                              {promo.titulo}
                            </p>
                            <p style={{
                              fontFamily: "var(--font-lato)",
                              fontSize: "0.78rem",
                              color: "var(--text-muted)",
                            }}>
                              {promo.horaInicio} – {promo.horaFin} · {CATEGORIA_LABELS[promo.categoria]}
                              {" · "}{promo.diasSemana.map(d => ["D","L","M","M","J","V","S"][d]).join(" ")}
                            </p>
                          </div>
                        </div>

                        {/* Precio */}
                        {promo.precioDescuento && (
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            {promo.precioOriginal && (
                              <p style={{
                                fontFamily: "var(--font-lato)",
                                fontSize: "0.8rem",
                                color: "var(--text-muted)",
                                textDecoration: "line-through",
                              }}>
                                ${promo.precioOriginal.toLocaleString("es-CL")}
                              </p>
                            )}
                            <p style={{
                              fontFamily: "var(--font-cinzel-decorative)",
                              fontSize: "1.2rem",
                              color: isHH ? "#d4a017" : "var(--accent)",
                            }}>
                              ${promo.precioDescuento.toLocaleString("es-CL")}
                            </p>
                          </div>
                        )}

                        {/* Acciones */}
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          <button
                            onClick={() => togglePausar(promo.id)}
                            style={{
                              fontFamily: "var(--font-cinzel)",
                              fontSize: "0.6rem",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              padding: "8px 16px",
                              borderRadius: "20px",
                              border: "1px solid var(--border-color)",
                              background: "transparent",
                              color: isPausada ? "var(--oasis-bright)" : "var(--text-muted)",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isPausada ? "▶ Activar" : "⏸ Pausar"}
                          </button>
                          <button
                            style={{
                              fontFamily: "var(--font-cinzel)",
                              fontSize: "0.6rem",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              padding: "8px 16px",
                              borderRadius: "20px",
                              border: "1px solid var(--border-color)",
                              background: "transparent",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            ✏ Editar
                          </button>
                          <button
                            onClick={() => eliminar(promo.id)}
                            style={{
                              fontFamily: "var(--font-cinzel)",
                              fontSize: "0.6rem",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              padding: "8px 16px",
                              borderRadius: "20px",
                              border: "1px solid rgba(255,80,80,0.3)",
                              background: "transparent",
                              color: "#ff8080",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            🗑 Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .dc-panel-promo-section { padding: 120px 60px 120px; }
        .dc-panel-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .dc-panel-field { display: flex; flex-direction: column; gap: 8px; }
        .dc-panel-field--full { grid-column: 1 / -1; }
        .dc-panel-label {
          font-family: var(--font-cinzel);
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .dc-panel-input {
          font-family: var(--font-lato);
          font-size: 0.9rem;
          color: var(--text-primary);
          background: rgba(0,0,0,0.25);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 12px 16px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .dc-panel-input:focus { border-color: var(--accent); }
        .dc-panel-textarea { resize: vertical; min-height: 80px; }
        .dc-panel-input::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
        }

        @media (max-width: 767px) {
          .dc-panel-promo-section { padding: 100px 20px 80px; }
          .dc-panel-form-grid { grid-template-columns: 1fr; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-panel-promo-section { padding: 110px 40px 100px; }
        }
      `}</style>
    </main>
  );
}
