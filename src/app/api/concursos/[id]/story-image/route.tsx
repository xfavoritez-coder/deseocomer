import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const concurso = await prisma.concurso.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
      estado: { not: "cancelado" },
    },
    include: { local: true },
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
      <div
        style={{
          width: "1080px",
          height: "1920px",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#1a0e05",
          overflow: "hidden",
        }}
      >
        {/* Imagen de fondo */}
        {concurso.imagenUrl && (
          <img
            src={concurso.imagenUrl}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Overlay superior */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "520px",
            background:
              "linear-gradient(to bottom, rgba(10,8,18,0.7), transparent)",
            display: "flex",
          }}
        />

        {/* Overlay inferior */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1300px",
            background:
              "linear-gradient(to top, rgba(10,8,18,0.98) 0%, rgba(10,8,18,0.8) 50%, transparent 100%)",
            display: "flex",
          }}
        />

        {/* Cinta CONCURSO diagonal */}
        <div
          style={{
            position: "absolute",
            top: "88px",
            left: "-112px",
            width: "480px",
            backgroundColor: "#3db89e",
            padding: "24px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(-45deg)",
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontFamily: "Cinzel",
              fontSize: "36px",
              fontWeight: 700,
              color: "#0a0812",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            CONCURSO
          </span>
        </div>

        {/* Logo DeseoComer arriba derecha */}
        <div
          style={{
            position: "absolute",
            top: "72px",
            right: "72px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            backgroundColor: "rgba(10,8,18,0.55)",
            border: "2px solid rgba(232,168,76,0.2)",
            borderRadius: "80px",
            padding: "20px 40px",
          }}
        >
          <span style={{ fontSize: "52px" }}>&#x1F9DE;</span>
          <span
            style={{
              fontFamily: "Cinzel",
              fontSize: "40px",
              fontWeight: 700,
              color: "rgba(232,168,76,0.9)",
              letterSpacing: "0.06em",
            }}
          >
            DeseoComer
          </span>
        </div>

        {/* Contenido inferior */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0 80px 200px",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}
        >
          {/* Nombre del local */}
          <span
            style={{
              fontFamily: "Lato",
              fontSize: "44px",
              color: "rgba(240,234,214,0.45)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {concurso.local.nombre}
          </span>

          {/* Label PREMIO */}
          <span
            style={{
              fontFamily: "Cinzel",
              fontSize: "36px",
              fontWeight: 700,
              color: "#e8a84c",
              letterSpacing: "0.18em",
            }}
          >
            PREMIO
          </span>

          {/* Titulo del premio */}
          <span
            style={{
              fontFamily: "Cinzel",
              fontSize: "88px",
              fontWeight: 700,
              color: "#f5d080",
              textTransform: "uppercase",
              lineHeight: "1.15",
              letterSpacing: "0.02em",
            }}
          >
            {concurso.premio}
          </span>

          {/* Divider */}
          <div
            style={{
              height: "2px",
              backgroundColor: "rgba(232,168,76,0.15)",
              display: "flex",
            }}
          />

          {/* Frase */}
          <span
            style={{
              fontFamily: "Lato",
              fontSize: "48px",
              color: "rgba(240,234,214,0.45)",
              lineHeight: "1.4",
            }}
          >
            Participa gratis e invita amigos para ganar
          </span>

          {/* Boton sticker */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              backgroundColor: "rgba(20,20,28,0.85)",
              border: "2px solid rgba(255,255,255,0.15)",
              borderRadius: "48px",
              padding: "40px 56px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                width: "112px",
                height: "112px",
                borderRadius: "50%",
                backgroundColor: "rgba(232,168,76,0.15)",
                border: "2px solid rgba(232,168,76,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "52px",
              }}
            >
              &#x1F517;
            </div>
            <span
              style={{
                fontFamily: "Lato",
                fontSize: "52px",
                fontWeight: 700,
                color: "rgba(240,234,214,0.85)",
                flex: 1,
              }}
            >
              Participar gratis
            </span>
            <span
              style={{
                fontSize: "52px",
                color: "rgba(240,234,214,0.3)",
              }}
            >
              &#x2192;
            </span>
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
}
