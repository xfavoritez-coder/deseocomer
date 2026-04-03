import { NextRequest, NextResponse } from "next/server";

// Legacy: esta lógica fue migrada a /api/cron/cerrar-concursos
// Este endpoint se mantiene por si hay invocaciones manuales pendientes
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://deseocomer.com";
  const url = `${base}/api/cron/cerrar-concursos${secret ? `?secret=${secret}` : ""}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json({ redirected: true, ...data });
  } catch {
    return NextResponse.json({ error: "Error redirigiendo al nuevo cron" }, { status: 500 });
  }
}
