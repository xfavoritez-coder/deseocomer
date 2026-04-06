import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { email, nombre, usuarioId } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const concurso = await prisma.concurso.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!concurso || concurso.estado !== "programado") {
      return NextResponse.json({ error: "Concurso no disponible" }, { status: 404 });
    }

    const concursoRealId = concurso.id;

    const existing = await prisma.listaEsperaConcurso.findUnique({
      where: { concursoId_email: { concursoId: concursoRealId, email: email.toLowerCase().trim() } },
    });
    if (existing) {
      return NextResponse.json({ ok: true, yaRegistrado: true });
    }

    await prisma.listaEsperaConcurso.create({
      data: {
        concursoId: concursoRealId,
        email: email.toLowerCase().trim(),
        nombre: nombre?.trim() || null,
        usuarioId: usuarioId || null,
      },
    });

    const total = await prisma.listaEsperaConcurso.count({ where: { concursoId: concursoRealId } });
    return NextResponse.json({ ok: true, total });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ ok: true, yaRegistrado: true });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const concurso = await prisma.concurso.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    const concursoRealId = concurso?.id ?? id;
    const total = await prisma.listaEsperaConcurso.count({ where: { concursoId: concursoRealId } });
    return NextResponse.json({ total });
  } catch {
    return NextResponse.json({ total: 0 });
  }
}
