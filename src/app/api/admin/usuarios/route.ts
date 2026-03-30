import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, nombre: true, email: true, ciudad: true, tipo: true, cumpleDia: true, cumpleMes: true, cumpleAnio: true, createdAt: true, _count: { select: { favoritos: true, resenas: true, participaciones: true } } },
    });
    return NextResponse.json(usuarios);
  } catch { return NextResponse.json([]); }
}
