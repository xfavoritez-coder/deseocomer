import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, tipo } = await req.json();
    if (!userId || !tipo) {
      console.warn("[track-share] Missing userId or tipo", { userId, tipo, concursoParam: id });
      return NextResponse.json({ ok: false, reason: "missing_params" });
    }
    if (tipo !== "whatsapp" && tipo !== "instagram") {
      return NextResponse.json({ ok: false, reason: "invalid_tipo" });
    }

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    });
    if (!concurso) {
      console.warn("[track-share] Concurso not found:", id);
      return NextResponse.json({ ok: false, reason: "concurso_not_found" });
    }

    const field = tipo === "whatsapp" ? "clicksWhatsapp" : "clicksInstagram";

    const result = await prisma.participanteConcurso.updateMany({
      where: { concursoId: concurso.id, usuarioId: userId },
      data: { [field]: { increment: 1 } },
    });

    if (result.count === 0) {
      console.warn("[track-share] No participant record found", { concursoId: concurso.id, userId, tipo });
      return NextResponse.json({ ok: false, reason: "not_participant" });
    }

    return NextResponse.json({ ok: true, updated: result.count });
  } catch (err) {
    console.error("[track-share] Error:", err);
    return NextResponse.json({ ok: false, reason: "error" });
  }
}
