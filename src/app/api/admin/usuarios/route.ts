import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, nombre: true, email: true, ciudad: true, tipo: true, emailVerificado: true, cumpleDia: true, cumpleMes: true, cumpleAnio: true, createdAt: true, _count: { select: { favoritos: true, resenas: true, participaciones: true } } },
    });
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("[Admin usuarios]", error);
    return NextResponse.json([], { status: 500 });
  }
}
