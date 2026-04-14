import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://deseocomer.com";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // 1. Cerrar concursos (+ audiencia, recordatorios, activar programados)
  try {
    const res = await fetch(`${BASE_URL}/api/cron/cerrar-concursos?secret=${process.env.CRON_SECRET}`);
    results.cerrarConcursos = await res.json();
  } catch (e) {
    results.cerrarConcursos = { error: String(e) };
  }

  // 2. Contar comunas
  try {
    const res = await fetch(`${BASE_URL}/api/cron/contar-comunas`);
    results.contarComunas = await res.json();
  } catch (e) {
    results.contarComunas = { error: String(e) };
  }

  // 3. Calcular stats admin
  try {
    const res = await fetch(`${BASE_URL}/api/cron/calcular-stats-admin`, {
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    results.statsAdmin = await res.json();
  } catch (e) {
    results.statsAdmin = { error: String(e) };
  }

  console.log("[Cron diario]", JSON.stringify(results));
  return NextResponse.json({ ok: true, ...results });
}
