import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const lista = await prisma.listaEsperaLocal.findMany({ orderBy: { createdAt: "desc" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const porCiudad = lista.reduce((acc: any, item) => { if (!acc[item.ciudad]) acc[item.ciudad] = []; acc[item.ciudad].push(item.email); return acc; }, {});
    return NextResponse.json({ lista, porCiudad });
  } catch { return NextResponse.json({ lista: [], porCiudad: {} }); }
}
