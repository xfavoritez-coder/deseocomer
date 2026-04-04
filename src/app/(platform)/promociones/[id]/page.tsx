"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  PROMOCIONES,
  TIPO_LABELS,
  DIAS_SHORT,
  pad2,
  isPromocionActivaAhora,
  terminaEnMenos2Horas,
  getTimerHastaFin,
  normalizeTipo,
  type Promocion,
} from "@/lib/mockPromociones";
import { useGenie } from "@/contexts/GenieContext";

function getSello(promo: Promocion): { text: string; color: string } | null {
  const t = promo.tipo?.toLowerCase() ?? "";
  if (t === "happy_hour" || t === "happy hour") return { text: "HAPPY HOUR", color: "#d4a017" };
  if (t === "cumpleanos" || t === "cumpleaños") return { text: "CUMPLEAÑOS", color: "#e05090" };
  if (t === "2x1") return { text: "2×1", color: "#3db89e" };
  if (t === "descuento" || t === "descuento %") return { text: promo.porcentajeDescuento ? `-${promo.porcentajeDescuento}%` : "DESCUENTO", color: "#ff6644" };
  if (t === "cupon" || t === "cupón") return { text: "COMBO", color: "#e8a84c" };
  if (t === "precio_especial" || t === "especial") return { text: "COMBO", color: "#e8a84c" };
  if (t === "combo" || t === "promo") return { text: "COMBO", color: "#e8a84c" };
  if (t === "regalo") return { text: "REGALO", color: "#e8a84c" };
  return { text: promo.tipo?.toUpperCase() ?? "PROMO", color: "#e8a84c" };
}

export default function PromocionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const mockPromo = PROMOCIONES.find((p) => String(p.id) === rawId);
  const relacionadas = PROMOCIONES.filter(
    (p) => String(p.id) !== rawId && p.activa && !p.esCumpleanos
  ).slice(0, 6);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbPromo, setDbPromo] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(!mockPromo);

  useEffect(() => {
    if (mockPromo) { setDbLoading(false); return; }
    fetch(`/api/promociones/${rawId}`).then(r => r.ok ? r.json() : null).then(data => { if (data) setDbPromo(data); setDbLoading(false); }).catch(() => setDbLoading(false));
  }, [rawId, mockPromo]);

  // Unify: map dbPromo to Promocion shape if needed
  const promo: Promocion | null = mockPromo ?? (dbPromo ? {
    id: dbPromo.id,
    localId: dbPromo.localId,
    local: dbPromo.local?.nombre ?? "Local",
    comuna: dbPromo.local?.comuna ?? "",
    tipo: normalizeTipo(dbPromo.tipo ?? ""),
    categoria: "cena" as const,
    categoriaLocal: dbPromo.local?.categoria ?? "",
    imagen: "⚡",
    imagenUrl: dbPromo.imagenUrl ?? "",
    titulo: dbPromo.titulo ?? "",
    descripcion: dbPromo.descripcion ?? "",
    porcentajeDescuento: dbPromo.porcentajeDescuento || undefined,
    precioOriginal: dbPromo.precioOriginal ?? undefined,
    precioDescuento: dbPromo.precioDescuento ?? undefined,
    diasSemana: Array.isArray(dbPromo.diasSemana) ? dbPromo.diasSemana.map((v: boolean, i: number) => v ? i : -1).filter((n: number) => n >= 0) : [],
    horaInicio: dbPromo.horaInicio ?? "12:00",
    horaFin: dbPromo.horaFin ?? "22:00",
    fechaVencimiento: dbPromo.fechaVencimiento ? new Date(dbPromo.fechaVencimiento).toLocaleDateString("es-CL") : null,
    activa: dbPromo.activa ?? true,
    esCumpleanos: dbPromo.esCumpleanos ?? false,
    condiciones: dbPromo.condiciones ?? undefined,
    // Extra fields from API
    direccion: dbPromo.local?.direccion,
    telefono: dbPromo.local?.telefono ?? null,
    logoUrl: dbPromo.local?.logoUrl,
    instagram: dbPromo.local?.instagram,
    linkPedido: dbPromo.local?.linkPedido,
    localSlug: dbPromo.local?.slug,
  } : null) as Promocion | null;

  const { addInteraccion } = useGenie();

  useEffect(() => {
    if (promo) {
      addInteraccion("promocion_vista", { id: String(promo.id || ""), categoria: (promo as any).categoriaLocal || "", comuna: promo.comuna || "" });
    }
  }, [promo?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [mounted, setMounted] = useState(false);
  const [isActiva, setIsActiva] = useState(false);
  const [isUltimas, setIsUltimas] = useState(false);
  const [timer, setTimer] = useState({ horas: 0, minutos: 0, segundos: 0 });
  const [copiado, setCopiado] = useState(false);

  const promoRef = useRef(promo);
  promoRef.current = promo;

  useEffect(() => {
    setMounted(true);
    const tick = () => {
      const p = promoRef.current;
      if (!p) return;
      setIsActiva(isPromocionActivaAhora(p));
      setIsUltimas(terminaEnMenos2Horas(p));
      setTimer(getTimerHastaFin(p));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const copiarCodigo = () => {
    if (!promo?.codigoCupon) return;
    navigator.clipboard.writeText(promo.codigoCupon).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    });
  };

  if (dbLoading) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div className="dc-sk dc-sk-hero" />
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="dc-sk" style={{ height: 24, width: "50%", margin: "0 auto" }} />
          <div className="dc-sk" style={{ height: 100, borderRadius: 12 }} />
          <div className="dc-sk" style={{ height: 60, borderRadius: 12 }} />
        </div>
        <style>{`
          .dc-sk { background: linear-gradient(90deg, rgba(232,168,76,0.06) 25%, rgba(232,168,76,0.12) 50%, rgba(232,168,76,0.06) 75%); background-size: 200% 100%; animation: dcShimmer 1.5s ease-in-out infinite; border-radius: 8px; }
          .dc-sk-hero { height: 240px; border-radius: 0; }
          @keyframes dcShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        `}</style>
        <Footer />
      </main>
    );
  }

  if (!promo) {
    return (
      <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: "20px", padding: "80px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "4rem" }}>🔍</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", color: "var(--accent)" }}>Promoción no encontrada</h2>
          <p style={{ fontFamily: "var(--font-lato)", color: "var(--text-muted)" }}>Esta promoción no existe o ya no está disponible.</p>
          <Link href="/promociones" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", letterSpacing: "0.15em", textTransform: "uppercase", background: "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))", color: "var(--bg-primary)", padding: "12px 28px", borderRadius: "30px", textDecoration: "none", fontWeight: 700 }}>
            Ver todas las promociones
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const sello = getSello(promo);

  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── Hero: full-width image header ── */}
      <section className="dc-pd-hero" style={{ pointerEvents: "none" }}>
        {promo.imagenUrl ? (
          <>
            <img src={promo.imagenUrl} alt={promo.titulo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.75, pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,13,24,0.2) 0%, rgba(8,13,24,0.7) 60%, var(--bg-primary) 100%)", pointerEvents: "none" }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 30%, rgba(232,168,76,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        )}

        {/* Back link */}
        <Link href="/promociones" style={{ position: "absolute", top: "20px", left: "clamp(16px, 4vw, 32px)", zIndex: 5, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "20px", padding: "6px 14px", fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(240,234,214,0.75)", textDecoration: "none", pointerEvents: "auto" }}>← Promociones</Link>

        {/* Hero content overlay */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 700, margin: "0 auto", pointerEvents: "auto" }}>
          {/* 1. Logo + nombre local + categoría local */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(promo as any).logoUrl ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <img src={(promo as any).logoUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(232,168,76,0.4)", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,168,76,0.2)", border: "1.5px solid rgba(232,168,76,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: 12, fontWeight: 700, color: "#e8a84c", flexShrink: 0 }}>
                {promo.local.charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.88rem", color: "rgba(240,234,214,0.85)", fontWeight: 600 }}>{promo.local}</span>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((promo as any).categoriaLocal || promo.comuna) && (<>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(240,234,214,0.3)" }} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", color: "rgba(240,234,214,0.5)", letterSpacing: "0.05em" }}>{(promo as any).categoriaLocal || promo.comuna}</span>
            </>)}
          </div>

          {/* 2. Título de la promoción */}
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem, 4vw, 2.8rem)", color: "#f5d080", textShadow: "0 2px 20px rgba(0,0,0,0.6)", marginBottom: "14px", lineHeight: 1.25 }}>
            {promo.titulo}
          </h1>

          {/* 3. Etiqueta + Activa ahora */}
          {(sello || (mounted && isActiva)) && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {sello && (
                <div style={{ display: "inline-flex", alignItems: "center", padding: "6px 16px", borderRadius: "20px", background: "rgba(13,7,3,0.7)", border: `1px solid ${sello.color}`, backdropFilter: "blur(4px)" }}>
                  <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", fontWeight: 700, color: sello.color, letterSpacing: "0.5px" }}>{sello.text}</span>
                </div>
              )}
              {mounted && isActiva && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 16px", borderRadius: "20px", background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.4)", backdropFilter: "blur(4px)" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--oasis-bright)", display: "inline-block", animation: "dc-pd-blink 1.5s infinite" }} />
                  <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.15em", color: "var(--oasis-bright)", textTransform: "uppercase" }}>Activa ahora</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Two-column content ── */}
      <section className="dc-pd-content">
        <div className="dc-pd-layout">

          {/* ── Left: info ── */}
          <div className="dc-pd-main">

            {/* Descripción */}
            <div className="dc-pd-card">
              <h2 className="dc-pd-card-title">Sobre esta promoción</h2>
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "1rem", color: "var(--text-primary)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {promo.descripcion}
              </p>

              {/* Precios */}
              {(promo.precioOriginal || promo.precioDescuento || promo.porcentajeDescuento) && (
                <div style={{ marginTop: "24px", background: "rgba(232,168,76,0.06)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
                  {promo.precioOriginal && (
                    <div style={{ marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>antes</span>
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: "1.1rem", color: "rgba(240,234,214,0.3)", textDecoration: "line-through" }}>${promo.precioOriginal.toLocaleString("es-CL")}</span>
                    </div>
                  )}
                  {promo.precioDescuento && (
                    <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "2.4rem", fontWeight: 900, color: "#e8a84c", lineHeight: 1, marginBottom: "8px" }}>
                      ${promo.precioDescuento.toLocaleString("es-CL")}
                    </div>
                  )}
                  {!!promo.porcentajeDescuento && (
                    <div style={{ display: "inline-block", background: "rgba(61,184,158,0.12)", border: "1px solid rgba(61,184,158,0.3)", borderRadius: "20px", padding: "4px 14px", fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", fontWeight: 700, color: "#3db89e", letterSpacing: "0.5px" }}>
                      {promo.precioOriginal && promo.precioDescuento ? `Ahorras $${(promo.precioOriginal - promo.precioDescuento).toLocaleString("es-CL")}` : `-${promo.porcentajeDescuento}% de descuento`}
                    </div>
                  )}
                  {promo.tipo === "2x1" && !promo.precioDescuento && (
                    <>
                      <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "3rem", fontWeight: 900, color: "#e8a84c", lineHeight: 1, marginBottom: "8px" }}>2{"\u00d7"}1</div>
                      <div style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.6)" }}>Llevas 2, pagas 1</div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Horario — mobile only */}
            <div className="dc-pd-card dc-pd-horario-mobile">
              <h2 className="dc-pd-card-title">Horario de la promoción</h2>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.6rem", color: "#f5d080" }}>{promo.horaInicio} – {promo.horaFin}</p>
              </div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>Días válidos</p>
              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                {DIAS_SHORT.map((dia, idx) => {
                  const active = promo.diasSemana.includes(idx);
                  return <div key={idx} style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: active ? "1.5px solid var(--accent)" : "1px solid rgba(232,168,76,0.15)", background: active ? "rgba(232,168,76,0.12)" : "transparent", color: active ? "#f5d080" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", fontWeight: active ? 700 : 400 }}>{dia}</div>;
                })}
              </div>
            </div>

            {/* Condiciones */}
            <div className="dc-pd-card">
              <h2 className="dc-pd-card-title">{"\ud83d\udccb"} Condiciones</h2>
              <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {promo.condiciones ? promo.condiciones.split(".").filter(c => c.trim()).map((condicion, i) => (
                  <li key={i} style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.7)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{condicion.trim()}</li>
                )) : (
                  <li style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.7)", lineHeight: 1.6 }}>Sujeto a disponibilidad</li>
                )}
                {promo.fechaVencimiento && (
                  <li style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.7)", lineHeight: 1.6 }}>Válido hasta {promo.fechaVencimiento}</li>
                )}
              </ul>
            </div>

            {/* Código de cupón */}
            {promo.codigoCupon && (
              <div className="dc-pd-card" style={{ border: "1px solid rgba(95,240,208,0.25)", background: "rgba(61,184,158,0.04)" }}>
                <h2 className="dc-pd-card-title" style={{ color: "var(--oasis-bright)" }}>Código de cupón</h2>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Presenta este código al momento de pagar:
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", letterSpacing: "0.15em", color: "var(--oasis-bright)", padding: "14px 24px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", border: "2px dashed rgba(95,240,208,0.35)", textShadow: "0 0 20px rgba(95,240,208,0.3)", flex: 1, textAlign: "center", minWidth: "180px" }}>
                    {promo.codigoCupon}
                  </div>
                  <button onClick={copiarCodigo} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 24px", borderRadius: "12px", border: "none", background: copiado ? "linear-gradient(135deg, #2a7a6f, #3db89e)" : "linear-gradient(135deg, var(--oasis-teal), var(--oasis-bright))", color: "var(--bg-primary)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" }}>
                    {copiado ? "\u2713 Copiado" : "Copiar"}
                  </button>
                </div>
                {promo.limiteUsos && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                      <span>{promo.usosActuales ?? 0} usados</span>
                      <span>{promo.limiteUsos} máximo</span>
                    </div>
                    <div style={{ height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, ((promo.usosActuales ?? 0) / promo.limiteUsos) * 100)}%`, background: "linear-gradient(90deg, var(--oasis-teal), var(--oasis-bright))", borderRadius: "4px" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timer countdown */}
            {mounted && isUltimas && (
              <div className="dc-pd-card" style={{ background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.3)", animation: "dc-pd-glow 2s ease-in-out infinite" }}>
                <h2 className="dc-pd-card-title" style={{ color: "#d4a017" }}>{"\u26a1"} Termina en:</h2>
                <div style={{ display: "flex", gap: "16px", justifyContent: "center", paddingTop: "4px" }}>
                  {[
                    { val: timer.horas, lbl: "hrs" },
                    { val: timer.minutos, lbl: "min" },
                    { val: timer.segundos, lbl: "seg" },
                  ].map(({ val, lbl }, idx) => (
                    <div key={lbl} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "2.4rem", lineHeight: 1, color: "#d4a017", textShadow: "0 0 24px rgba(212,160,23,0.5)", minWidth: "56px", padding: "12px 16px", background: "rgba(0,0,0,0.3)", borderRadius: "10px", border: "1px solid rgba(212,160,23,0.2)" }}>
                          {pad2(val)}
                        </div>
                        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.45rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "6px" }}>{lbl}</p>
                      </div>
                      {idx < 2 && <span style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.8rem", color: "#d4a017", opacity: 0.5, marginBottom: "18px" }}>:</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ficha del local */}
            {(promo.descripcionLocal || promo.localId) && (
              <div className="dc-pd-card">
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "14px" }}>Publicado por</p>
                <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "14px" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(promo as any).logoUrl ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <img src={(promo as any).logoUrl} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(232,168,76,0.3)", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #2a7a6f, #3db89e)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: "1rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {promo.local.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.95rem", fontWeight: 700, color: "#e8a84c", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{promo.local}</p>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.45)" }}>{(promo as any).categoriaLocal || promo.comuna}{(promo as any).categoriaLocal && promo.comuna ? ` · ${promo.comuna}` : ""}</p>
                  </div>
                </div>
                {promo.descripcionLocal && (
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "rgba(240,234,214,0.7)", lineHeight: 1.7, marginBottom: "14px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{promo.descripcionLocal}</p>
                )}

                {/* Local info details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(promo as any).direccion && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{"\ud83d\udccd"}</span>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((promo as any).direccion + (promo.comuna ? ", " + promo.comuna : ""))}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "rgba(240,234,214,0.7)", textDecoration: "underline", textDecorationColor: "rgba(240,234,214,0.2)" }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(promo as any).direccion}{promo.comuna ? `, ${promo.comuna}` : ""}
                      </a>
                    </div>
                  )}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(promo as any).telefono && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{"\ud83d\udcde"}</span>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <a href={`tel:${(promo as any).telefono}`} style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "rgba(240,234,214,0.7)", textDecoration: "none" }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(promo as any).telefono}
                      </a>
                    </div>
                  )}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(promo as any).instagram && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>{"\ud83d\udcf7"}</span>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <a href={`https://instagram.com/${(promo as any).instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "rgba(240,234,214,0.7)", textDecoration: "none" }}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        @{(promo as any).instagram.replace(/^@/, "")}
                      </a>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(promo as any).linkPedido && (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    <a href={(promo as any).linkPedido} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff", padding: "10px 20px", borderRadius: "24px", textDecoration: "none", fontWeight: 700 }}>
                      Pedir / WhatsApp
                    </a>
                  )}
                </div>

                <Link href={`/locales/${(promo as any).localSlug || promo.localId}`} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--oasis-bright)", textDecoration: "none" }}>
                  Ver perfil completo {"\u2192"}
                </Link>
              </div>
            )}
          </div>

          {/* ── Right: sidebar — horario only ── */}
          <div className="dc-pd-sidebar">
            <div className="dc-pd-card dc-pd-horario-desktop">
              <h2 className="dc-pd-card-title">Horario de la promoción</h2>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.6rem", color: "#f5d080" }}>{promo.horaInicio} – {promo.horaFin}</p>
              </div>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>Días válidos</p>
              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                {DIAS_SHORT.map((dia, idx) => {
                  const active = promo.diasSemana.includes(idx);
                  return <div key={idx} style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: active ? "1.5px solid var(--accent)" : "1px solid rgba(232,168,76,0.15)", background: active ? "rgba(232,168,76,0.12)" : "transparent", color: active ? "#f5d080" : "var(--text-muted)", fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", fontWeight: active ? 700 : 400 }}>{dia}</div>;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Related promotions horizontal scroll ── */}
        {relacionadas.length > 0 && (
          <div style={{ marginTop: "60px", maxWidth: "1000px", margin: "60px auto 0" }}>
            <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.5)", marginBottom: "8px" }}>
              También te puede interesar
            </p>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.4rem", color: "#f5d080", marginBottom: "24px" }}>
              Promociones Relacionadas
            </h2>
            <div className="dc-pd-related-scroll">
              {relacionadas.map((rel) => {
                const relSello = getSello(rel);
                const relActiva = isPromocionActivaAhora(rel);
                return (
                  <Link key={rel.id} href={`/promociones/${(rel as any).slug || rel.id}`} className="dc-pd-related-card" style={{ textDecoration: "none", display: "block" }}>
                    {rel.imagenUrl && (
                      <div style={{ position: "relative", height: "120px", overflow: "hidden", borderRadius: "14px 14px 0 0" }}>
                        <img src={rel.imagenUrl} alt={rel.titulo} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        {relSello && (
                          <div style={{ position: "absolute", top: "8px", right: "8px", pointerEvents: "none", background: "rgba(13,7,3,0.88)", border: `1px solid ${relSello.color}`, borderRadius: "16px", padding: "3px 10px" }}>
                            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.68rem", fontWeight: 700, color: relSello.color, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{relSello.text}</span>
                          </div>
                        )}
                        {relActiva && (
                          <div style={{ position: "absolute", bottom: "8px", left: "8px", display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "12px", background: "rgba(61,184,158,0.15)", border: "1px solid rgba(61,184,158,0.35)", backdropFilter: "blur(4px)" }}>
                            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--oasis-bright)", display: "inline-block" }} />
                            <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.45rem", letterSpacing: "0.1em", color: "var(--oasis-bright)", textTransform: "uppercase" }}>Activa</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ padding: "14px" }}>
                      <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.82rem", color: "#f5d080", marginBottom: "4px", lineHeight: 1.3 }}>{rel.titulo}</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(240,234,214,0.55)" }}>{rel.local} · {rel.comuna}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <Footer />

      <style>{`
        .dc-pd-hero {
          position: relative;
          padding: 160px 24px 60px;
          text-align: center;
          overflow: hidden;
          min-height: 380px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .dc-pd-horario-mobile { display: none; }
        .dc-pd-content {
          position: relative;
          padding: 40px clamp(20px, 5vw, 60px) 100px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .dc-pd-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 28px;
          align-items: start;
        }
        .dc-pd-main {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .dc-pd-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 100px;
        }
        .dc-pd-card {
          background: rgba(8,13,24,0.85);
          border: 1px solid rgba(232,168,76,0.12);
          border-radius: 16px;
          padding: 24px;
        }
        .dc-pd-card-title {
          font-family: var(--font-cinzel-decorative);
          font-size: 1rem;
          color: #f5d080;
          margin-bottom: 14px;
        }
        .dc-pd-related-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .dc-pd-related-scroll::-webkit-scrollbar { display: none; }
        .dc-pd-related-card {
          flex-shrink: 0;
          width: 260px;
          background: rgba(8,13,24,0.85);
          border: 1px solid rgba(232,168,76,0.12);
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.2s, border-color 0.2s;
          color: inherit;
        }
        .dc-pd-related-card:hover {
          transform: translateY(-4px);
          border-color: rgba(232,168,76,0.35);
        }

        @keyframes dc-pd-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes dc-pd-glow {
          0%, 100% { box-shadow: 0 0 12px rgba(212,160,23,0.15); }
          50% { box-shadow: 0 0 24px rgba(212,160,23,0.35); }
        }

        @media (max-width: 767px) {
          .dc-pd-hero { padding: 120px 20px 40px; min-height: 280px; }
          .dc-pd-content { padding: 24px 16px 80px; }
          .dc-pd-horario-mobile { display: block; }
          .dc-pd-horario-desktop { display: none; }
          .dc-pd-layout { grid-template-columns: 1fr; }
          .dc-pd-sidebar { position: static; }
          .dc-pd-related-card { width: 240px; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .dc-pd-hero { padding: 140px 24px 50px; }
          .dc-pd-layout { grid-template-columns: 1fr 280px; }
        }
        @media (min-width: 1024px) {
          .dc-pd-hero { min-height: 440px; }
        }
      `}</style>
    </main>
  );
}
