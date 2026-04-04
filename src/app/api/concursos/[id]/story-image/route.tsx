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
    include: { local: { select: { nombre: true } } },
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

  return new ImageResponse(
    (
      <div style={{ width: "1080px", height: "1920px", display: "flex", position: "relative", backgroundColor: "#1a0e05", overflow: "hidden" }}>
        {concurso.imagenUrl && (
          <img src={concurso.imagenUrl} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10,8,18,0.45)", display: "flex" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "520px", background: "linear-gradient(to bottom, rgba(10,8,18,0.7), transparent)", display: "flex" }} />
        <div style={{ position: "absolute", top: "88px", right: "-112px", width: "480px", backgroundColor: "#3db89e", padding: "24px 0", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(45deg)" }}>
          <span style={{ fontFamily: "Cinzel", fontSize: "36px", fontWeight: 700, color: "#0a0812", letterSpacing: "0.1em", textTransform: "uppercase" }}>CONCURSO</span>
        </div>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "240px 96px", gap: "40px" }}>
          <span style={{ fontFamily: "Lato", fontSize: "44px", color: "rgba(240,234,214,0.8)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>{concurso.local.nombre}</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
            <span style={{ fontSize: "52px" }}>&#x1F3C6;</span>
            <span style={{ fontFamily: "Lato", fontSize: "36px", fontWeight: 800, color: "#e8a84c", letterSpacing: "0.16em", textTransform: "uppercase" }}>Gana gratis este premio</span>
          </div>
          <span style={{ fontFamily: "Cinzel", fontSize: "96px", fontWeight: 700, color: "#f5d080", textTransform: "uppercase", textAlign: "center", lineHeight: "1.15", letterSpacing: "0.02em" }}>{concurso.premio}</span>
          <div style={{ height: "2px", width: "70%", background: "rgba(232,168,76,0.25)", display: "flex" }} />
          <span style={{ fontFamily: "Lato", fontSize: "48px", color: "rgba(240,234,214,0.8)", textAlign: "center", lineHeight: "1.4" }}>Participa gratis e invita amigos para ganar</span>
          <div style={{ display: "flex", alignItems: "center", gap: "32px", background: "rgba(10,10,18,0.88)", border: "2px solid rgba(255,255,255,0.18)", borderRadius: "56px", padding: "36px 56px" }}>
            <div style={{ width: "112px", height: "112px", borderRadius: "50%", background: "rgba(232,168,76,0.15)", border: "2px solid rgba(232,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "52px" }}>&#x1F517;</div>
            <span style={{ fontFamily: "Lato", fontSize: "52px", fontWeight: 700, color: "rgba(240,234,214,0.9)" }}>Participar gratis</span>
          </div>
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
