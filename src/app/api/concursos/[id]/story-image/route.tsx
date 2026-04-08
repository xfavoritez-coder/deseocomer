import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id } = await params;

  const concurso = await prisma.concurso.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { local: { select: { nombre: true, logoUrl: true } } },
  });

  if (!concurso) {
    return new Response("Not found", { status: 404 });
  }

  // Load fonts dynamically via Google Fonts CSS API (always returns valid URLs)
  async function fetchFont(family: string, weight: number): Promise<ArrayBuffer> {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
    const css = await fetch(cssUrl, { headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10)" } }).then(r => r.text());
    const match = css.match(/url\(([^)]+\.ttf)\)/);
    if (!match) throw new Error(`No TTF URL found for ${family}`);
    const res = await fetch(match[1]);
    if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
    return res.arrayBuffer();
  }

  let cinzelBold: ArrayBuffer;
  let latoBold: ArrayBuffer;
  try {
    [cinzelBold, latoBold] = await Promise.all([
      fetchFont("Cinzel", 700),
      fetchFont("Lato", 700),
    ]);
  } catch (fontErr) {
    console.error("[story-image] Font load error:", fontErr);
    return new Response(`Font load failed: ${fontErr}`, { status: 500 });
  }

  const fonts = [
    { name: "Cinzel", data: cinzelBold, weight: 700 as const },
    { name: "Lato", data: latoBold, weight: 700 as const },
  ];

  const tituloLen = concurso.premio.length;
  const titleSize = tituloLen <= 20 ? 112 : tituloLen <= 35 ? 88 : tituloLen <= 50 ? 72 : 58;

  // Determine contest type
  const esSorteo = concurso.modalidadConcurso === "sorteo";
  const esProximamente = concurso.estado === "programado";

  // Check if ends today
  const now = new Date();
  const fechaFin = new Date(concurso.fechaFin);
  const terminaHoy = !esProximamente && concurso.activo &&
    fechaFin.getFullYear() === now.getFullYear() &&
    fechaFin.getMonth() === now.getMonth() &&
    fechaFin.getDate() === now.getDate();

  // Format closing hour
  const horaCierre = terminaHoy
    ? `${String(fechaFin.getHours()).padStart(2, "0")}:${String(fechaFin.getMinutes()).padStart(2, "0")} hrs`
    : "";

  // Theme per type
  const theme = terminaHoy
    ? {
        badgeColor: "#e05555",
        badgeText: "\u00daLTIMA OPORTUNIDAD",
        overlayColor: "rgba(10,8,18,0.6)",
        gradientTop: "rgba(40,8,8,0.8)",
        accentColor: "#ff8080",
        titleColor: "#ffd4d4",
        emoji: "\u23F0",           // ⏰
        headerText: "Este concurso termina HOY",
        subtitulo: "\u00daltimas horas para participar gratis",
        cta: "Entra antes de que cierre",
        ctaIcon: "\u{1F6A8}",     // 🚨
        ctaBg: "rgba(224,85,85,0.15)",
        ctaBorder: "rgba(224,85,85,0.5)",
        ctaIconBg: "rgba(224,85,85,0.15)",
        ctaIconBorder: "rgba(224,85,85,0.4)",
        dividerColor: "rgba(224,85,85,0.3)",
      }
    : esProximamente
    ? {
        badgeColor: "#a78bfa",
        badgeText: "PR\u00d3XIMAMENTE",
        overlayColor: "rgba(10,8,18,0.65)",
        gradientTop: "rgba(30,15,60,0.8)",
        accentColor: "#c4b5fd",
        titleColor: "#ddd6fe",
        emoji: "\u{1F52E}",
        headerText: "Nuevo concurso",
        subtitulo: "S\u00e9 de los primeros y gana ventaja",
        cta: "Avisame gratis",
        ctaIcon: "\u{1F514}",
        ctaBg: "rgba(167,139,250,0.15)",
        ctaBorder: "rgba(167,139,250,0.4)",
        ctaIconBg: "rgba(167,139,250,0.15)",
        ctaIconBorder: "rgba(167,139,250,0.3)",
        dividerColor: "rgba(167,139,250,0.25)",
      }
    : esSorteo
    ? {
        badgeColor: "#ec4899",
        badgeText: "SORTEO",
        overlayColor: "rgba(10,8,18,0.5)",
        gradientTop: "rgba(10,8,18,0.8)",
        accentColor: "#e8a84c",
        titleColor: "#f5d080",
        emoji: "\u{1F3B2}",
        headerText: "Sorteo de premio",
        subtitulo: "Cada punto es un boleto",
        subtitulo2: "M\u00e1s boletos, m\u00e1s chances de ganar",
        cta: "Entra al sorteo",
        ctaIcon: "\u{1F3B0}",
        ctaBg: "rgba(236,72,153,0.15)",
        ctaBorder: "rgba(236,72,153,0.4)",
        ctaIconBg: "rgba(236,72,153,0.15)",
        ctaIconBorder: "rgba(236,72,153,0.3)",
        dividerColor: "rgba(236,72,153,0.25)",
        ctaSubtext: "Cualquiera dentro puede ganar",
      }
    : {
        badgeColor: "#3db89e",
        badgeText: "CONCURSO",
        overlayColor: "rgba(10,8,18,0.45)",
        gradientTop: "rgba(10,8,18,0.7)",
        accentColor: "#e8a84c",
        titleColor: "#f5d080",
        emoji: "\u{1F3C6}",
        headerText: "Gana gratis este premio",
        subtitulo: "Invita amigos, suma puntos y gana",
        cta: "Participa gratis",
        ctaIcon: "\u{1F517}",
        ctaBg: "rgba(232,168,76,0.15)",
        ctaBorder: "rgba(232,168,76,0.3)",
        ctaIconBg: "rgba(232,168,76,0.15)",
        ctaIconBorder: "rgba(232,168,76,0.3)",
        dividerColor: "rgba(232,168,76,0.25)",
      };

  return new ImageResponse(
    (
      <div style={{ width: "1080px", height: "1920px", display: "flex", position: "relative", backgroundColor: "#1a0e05", overflow: "hidden" }}>
        {concurso.imagenUrl && (
          <img src={concurso.imagenUrl} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {/* Overlay */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: theme.overlayColor, display: "flex" }} />
        {/* Top gradient */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "520px", background: `linear-gradient(to bottom, ${theme.gradientTop}, transparent)`, display: "flex" }} />
        {/* Bottom gradient */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "520px", background: `linear-gradient(to top, ${theme.gradientTop}, transparent)`, display: "flex" }} />
        {/* Badge ribbon */}
        <div style={{ position: "absolute", top: "88px", right: "-112px", width: terminaHoy ? "620px" : "560px", backgroundColor: theme.badgeColor, padding: "24px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", transform: "rotate(45deg)" }}>
          <span style={{ fontSize: "32px" }}>{theme.emoji}</span>
          <span style={{ fontFamily: "Cinzel", fontSize: terminaHoy ? "30px" : "36px", fontWeight: 700, color: esSorteo ? "#ffffff" : "#0a0812", letterSpacing: "0.1em" }}>{theme.badgeText}</span>
        </div>
        {/* Content */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "240px 96px", gap: "40px" }}>
          {/* Local name with logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "center" }}>
            {concurso.local.logoUrl && (
              <img src={concurso.local.logoUrl} style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(232,168,76,0.4)" }} />
            )}
            <span style={{ fontFamily: "Lato", fontSize: "44px", color: "rgba(240,234,214,0.8)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{concurso.local.nombre}</span>
          </div>
          {/* Header text */}
          <span style={{ fontFamily: "Lato", fontSize: "36px", fontWeight: 800, color: theme.accentColor, letterSpacing: "0.16em", textTransform: "uppercase", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
            {theme.headerText}
          </span>
          {/* Prize title */}
          <span style={{ fontFamily: "Cinzel", fontSize: `${titleSize}px`, fontWeight: 700, color: theme.titleColor, textTransform: "uppercase", textAlign: "center", lineHeight: "1.15", letterSpacing: "0.02em", textShadow: "0 3px 12px rgba(0,0,0,0.85), 0 1px 4px rgba(0,0,0,0.9)" }}>{concurso.premio}</span>
          {/* Divider */}
          <div style={{ height: "2px", width: "70%", background: theme.dividerColor, display: "flex" }} />
          {/* Description text */}
          {"subtitulo2" in theme ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "Lato", fontSize: "48px", fontWeight: 700, color: "rgba(240,234,214,0.9)", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{theme.subtitulo}</span>
              <span style={{ fontFamily: "Lato", fontSize: "42px", color: "rgba(240,234,214,0.6)", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{(theme as {subtitulo2: string}).subtitulo2}</span>
            </div>
          ) : (
            <span style={{ fontFamily: "Lato", fontSize: "38px", color: "rgba(240,234,214,0.8)", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{theme.subtitulo}</span>
          )}
          {/* CTA button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "32px", background: theme.ctaBg, border: `2px solid ${theme.ctaBorder}`, borderRadius: "56px", padding: "36px 56px" }}>
              <div style={{ width: "112px", height: "112px", borderRadius: "50%", background: theme.ctaIconBg, border: `2px solid ${theme.ctaIconBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "52px" }}>{theme.ctaIcon}</div>
              <span style={{ fontFamily: "Lato", fontSize: "52px", fontWeight: 700, color: "rgba(240,234,214,0.9)" }}>{theme.cta}</span>
            </div>
            {"ctaSubtext" in theme && (
              <span style={{ fontFamily: "Lato", fontSize: "32px", color: "rgba(240,234,214,0.4)", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{(theme as {ctaSubtext: string}).ctaSubtext}</span>
            )}
          </div>
          {/* Closing time for termina hoy */}
          {terminaHoy && (
            <span style={{ fontFamily: "Lato", fontSize: "40px", fontWeight: 700, color: "#e05555", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>Cierra a las {horaCierre}</span>
          )}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      fonts,
    }
  );
 } catch (err) {
  console.error("[story-image] Error:", err);
  return new Response(`Story image error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
 }
}
