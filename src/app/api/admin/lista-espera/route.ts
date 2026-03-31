import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const lista = await prisma.listaEsperaLocal.findMany({ orderBy: { createdAt: "desc" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const porCiudad = lista.reduce((acc: any, item) => { if (!acc[item.ciudad]) acc[item.ciudad] = []; acc[item.ciudad].push(item.email); return acc; }, {});
    return NextResponse.json({ lista, porCiudad });
  } catch (error) {
    console.error("[Admin lista-espera]", error);
    return NextResponse.json({ lista: [], porCiudad: {} }, { status: 500 });
  }
}
