import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, tipo } = await req.json();
    if (!userId || !tipo) return NextResponse.json({ ok: true });
    if (tipo !== "whatsapp" && tipo !== "instagram") return NextResponse.json({ ok: true });

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!concurso) return NextResponse.json({ ok: true });

    const field = tipo === "whatsapp" ? "clicksWhatsapp" : "clicksInstagram";

    await prisma.participanteConcurso.updateMany({
      where: { concursoId: concurso.id, usuarioId: userId },
      data: { [field]: { increment: 1 } },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
