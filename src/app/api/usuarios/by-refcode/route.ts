import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    if (!code || code.length < 4) return NextResponse.json({ error: "Código inválido" }, { status: 400 });

    const upper = code.toUpperCase();

    // Search all users (not just verified) - the referrer may not have verified yet
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true },
    });

    const found = usuarios.find(u => u.id.slice(-6).toUpperCase() === upper);
    if (!found) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    return NextResponse.json({ id: found.id, nombre: found.nombre.split(" ")[0] });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
