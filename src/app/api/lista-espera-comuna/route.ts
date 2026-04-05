import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, nombre, comuna, categoria, usuarioId } = await req.json();
    if (!email || !comuna) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const comunaKey = categoria ? `${comuna}` : comuna;
    const existe = await prisma.listaEsperaComuna.findFirst({ where: { email, comuna: comunaKey } });
    if (existe) return NextResponse.json({ ok: true, existe: true });

    const nombreConCat = categoria ? `${nombre || ""}||${categoria}` : nombre;
    const entrada = await prisma.listaEsperaComuna.create({ data: { email, nombre: nombreConCat, comuna: comunaKey, usuarioId } });
    return NextResponse.json(entrada, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const lista = await prisma.listaEsperaComuna.findMany({ orderBy: { createdAt: "desc" } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const porComuna: Record<string, { total: number; emails: any[] }> = {};
    for (const item of lista) {
      if (!porComuna[item.comuna]) porComuna[item.comuna] = { total: 0, emails: [] };
      porComuna[item.comuna].total++;
      const [nombreReal, categoriaItem] = (item.nombre || "").split("||");
      porComuna[item.comuna].emails.push({ email: item.email, nombre: nombreReal || null, categoria: categoriaItem || null, fecha: item.createdAt, notificado: item.notificado });
    }
    const ranking = Object.entries(porComuna).map(([comuna, data]) => ({ comuna, total: data.total, emails: data.emails })).sort((a, b) => b.total - a.total);
    return NextResponse.json({ lista, ranking });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
