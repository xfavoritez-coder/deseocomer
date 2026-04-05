import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code || code.length < 4) return NextResponse.json({ error: "Código inválido" }, { status: 400 });

    const upper = code.toUpperCase();

    // First: search by codigoRef (the real referral code)
    const byCode = await prisma.usuario.findFirst({
      where: { codigoRef: upper },
      select: { id: true, nombre: true },
    });
    if (byCode) return NextResponse.json({ id: byCode.id, nombre: byCode.nombre.split(" ")[0] });

    // Second: search by ID (in case someone passed the full userId)
    const byId = await prisma.usuario.findUnique({
      where: { id: code },
      select: { id: true, nombre: true },
    });
    if (byId) return NextResponse.json({ id: byId.id, nombre: byId.nombre.split(" ")[0] });

    // Third: legacy fallback - search by last 6 chars of ID (old getRefCode format)
    const byLegacy = await prisma.usuario.findFirst({
      where: { id: { endsWith: code.toLowerCase() } },
      select: { id: true, nombre: true },
    });
    if (byLegacy) return NextResponse.json({ id: byLegacy.id, nombre: byLegacy.nombre.split(" ")[0] });

    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
