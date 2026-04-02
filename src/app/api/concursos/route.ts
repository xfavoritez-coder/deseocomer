import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeConcursoSlug } from "@/lib/slugify";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const concursos = await prisma.concurso.findMany({
      where: {
        activo: true,
        local: {
          activo: true,
          direccion: { not: "" },
          categoria: { not: null },
        },
      },
      include: {
        local: { select: { id: true, nombre: true, slug: true, logoUrl: true, comuna: true } },
        _count: { select: { participantes: true } },
      },
      orderBy: { fechaFin: "asc" },
      take: limit,
      skip: offset,
    });

    // Count recent participants for each concurso
    const enriched = await Promise.all(concursos.map(async (c) => {
      const recientes = await prisma.participanteConcurso.count({
        where: { concursoId: c.id, createdAt: { gte: hace24h } },
      });
      return { ...c, participantesRecientes: recientes };
    }));

    return NextResponse.json(enriched);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { localId, premio, descripcion, condiciones, imagenUrl, fechaFin } = await req.json();
    if (!localId || !premio || !fechaFin) return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });

    // Get local name for slug
    const local = await prisma.local.findUnique({ where: { id: localId }, select: { nombre: true } });
    const slug = makeConcursoSlug(premio, local?.nombre ?? "local");

    const concurso = await prisma.concurso.create({
      data: { localId, slug, premio, descripcion, ...(condiciones && { condiciones }), imagenUrl, fechaFin: new Date(fechaFin) },
    });

    // Notify captador on first contest (bonus email)
    try {
      const localFull = await prisma.local.findUnique({
        where: { id: localId },
        select: { nombre: true, captadorId: true, captador: { select: { id: true, nombre: true, email: true, codigo: true } } },
      });
      if (localFull?.captadorId && localFull.captador) {
        const totalConcursos = await prisma.concurso.count({ where: { localId } });
        if (totalConcursos === 1) {
          const base = req.nextUrl.origin;
          const { resend } = await import("@/lib/resend");
          const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;
          await resend.emails.send({
            from, to: localFull.captador.email,
            subject: "🏆 ¡Bonus desbloqueado! +$5.000",
            html: `
              <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff;border-radius:12px">
                <div style="text-align:center;padding:20px;background:linear-gradient(135deg,#e8a84c,#d4922a);border-radius:12px;margin-bottom:24px">
                  <p style="font-size:28px;margin:0 0 8px">🏆</p>
                  <h1 style="color:#fff;font-size:18px;margin:0">¡Bonus desbloqueado!</h1>
                </div>
                <p style="font-size:15px;color:#333;line-height:1.6">Hola <strong>${localFull.captador.nombre}</strong>,</p>
                <p style="font-size:15px;color:#333;line-height:1.6">¡Excelente noticia! El local <strong>"${localFull.nombre}"</strong> acaba de publicar su primer concurso en DeseoComer.</p>
                <p style="font-size:15px;color:#333;line-height:1.6">Has desbloqueado el bonus de <strong style="color:#c47f1a">$5.000</strong>.</p>
                <div style="background:#faf7f2;border:1px solid rgba(180,130,40,0.2);border-radius:10px;padding:16px;margin:16px 0">
                  <p style="font-size:14px;color:#555;margin:4px 0"><strong>Resumen de este local:</strong></p>
                  <p style="font-size:14px;color:#555;margin:4px 0">• Registro: $10.000 ✓</p>
                  <p style="font-size:14px;color:#555;margin:4px 0">• Primer concurso: $5.000 ✓</p>
                  <p style="font-size:14px;color:#c47f1a;margin:4px 0;font-weight:700">• Total por este local: $15.000</p>
                </div>
                <p style="text-align:center;margin:24px 0">
                  <a href="https://deseocomer.com/captador" style="background:#e8a84c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">Revisa tu panel →</a>
                </p>
                <p style="font-size:14px;color:#555">¡Sigue captando!</p>
                <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
                <p style="font-size:13px;color:#aaa;text-align:center">El equipo de DeseoComer 🧞</p>
              </div>
            `,
          });
        }
      }
    } catch (e) { console.error("[Email bonus captador]", e); }

    return NextResponse.json(concurso, { status: 201 });
  } catch (error) {
    console.error("[API /concursos POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
