import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const busq = searchParams.get("busq") ?? "";
    const skip = (page - 1) * limit;

    const where = busq
      ? { OR: [{ nombre: { contains: busq, mode: "insensitive" as const } }, { email: { contains: busq, mode: "insensitive" as const } }] }
      : {};

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true, nombre: true, email: true, tipo: true, telefono: true, fotoUrl: true,
          emailVerificado: true, emailVerificadoAt: true, ipRegistro: true,
          cumpleDia: true, cumpleMes: true, cumpleAnio: true, createdAt: true,
          estiloAlimentario: true, comidasFavoritas: true,
          _count: { select: { favoritos: true, resenas: true, participaciones: true } },
          participaciones: {
            select: {
              id: true, puntos: true, estado: true, createdAt: true,
              concurso: { select: { id: true, slug: true, premio: true, fechaFin: true, estado: true, local: { select: { nombre: true } } } },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      }),
      prisma.usuario.count({ where }),
    ]);
    return NextResponse.json({ usuarios, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[Admin usuarios]", error);
    return NextResponse.json({ usuarios: [], total: 0, page: 1, limit: 20, totalPages: 0 }, { status: 500 });
  }
}
