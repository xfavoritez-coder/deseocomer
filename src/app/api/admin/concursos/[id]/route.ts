import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { activo } = await req.json();
    const concurso = await prisma.concurso.update({ where: { id }, data: { activo } });
    return NextResponse.json(concurso);
  } catch { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}
