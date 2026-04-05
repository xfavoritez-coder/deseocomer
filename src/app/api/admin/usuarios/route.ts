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
    const filtro = searchParams.get("filtro") ?? "";
    const orden = searchParams.get("orden") ?? "reciente";
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [];
    if (busq) conditions.push({ OR: [{ nombre: { contains: busq, mode: "insensitive" as const } }, { email: { contains: busq, mode: "insensitive" as const } }] });
    if (filtro === "verificados") conditions.push({ emailVerificado: true });
    if (filtro === "no_verificados") conditions.push({ emailVerificado: false });

    const where = conditions.length > 0 ? { AND: conditions } : {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };
    if (orden === "actividad") orderBy = [{ favoritos: { _count: "desc" } }, { createdAt: "desc" }];
    if (orden === "concursos") orderBy = [{ participaciones: { _count: "desc" } }, { createdAt: "desc" }];

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true, nombre: true, email: true, tipo: true, telefono: true, fotoUrl: true,
          emailVerificado: true, emailVerificadoAt: true, ipRegistro: true,
          cumpleDia: true, cumpleMes: true, cumpleAnio: true, createdAt: true,
          estiloAlimentario: true, comidasFavoritas: true,
          _count: { select: { favoritos: true, resenas: true, participaciones: true } },
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
