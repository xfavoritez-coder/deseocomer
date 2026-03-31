import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const { activo } = await req.json();
    const concurso = await prisma.concurso.update({ where: { id }, data: { activo } });
    return NextResponse.json(concurso);
  } catch (error) {
    console.error("[Admin concursos PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
