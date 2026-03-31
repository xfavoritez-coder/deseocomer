import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { participanteId, localId, localNombre } = await req.json();
    if (!participanteId || !localId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const participante = await prisma.participanteConcurso.findUnique({
      where: { id: participanteId },
      include: {
        usuario: { select: { nombre: true, email: true } },
        concurso: { select: { premio: true, localId: true } },
      },
    });
    if (!participante) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 });
    if (participante.concurso.localId !== localId) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    // Marcar como sospechoso
    await prisma.participanteConcurso.update({
      where: { id: participanteId },
      data: { estado: "sospechoso" },
    });

    // Enviar email al admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const now = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" });
      resend.emails.send({
        from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
        to: adminEmail,
        subject: `⚠️ Reporte de participante sospechoso — ${participante.concurso.premio}`,
        html: `<div style="font-family:Georgia,serif;color:#333;max-width:560px">
          <h2 style="color:#e8a84c">⚠️ Reporte de participante sospechoso</h2>
          <p><strong>Concurso:</strong> ${participante.concurso.premio}</p>
          <p><strong>Participante reportado:</strong> ${participante.usuario?.nombre ?? "—"} (${participante.usuario?.email ?? "—"})</p>
          <p><strong>Reportado por:</strong> ${localNombre ?? "Local"}</p>
          <p><strong>Fecha y hora:</strong> ${now}</p>
          <p style="color:#888;font-size:13px">Revisa este participante en el panel de administración antes del cierre del concurso.</p>
        </div>`,
      }).catch(err => console.error("[Reportar] Error email:", err));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API reportar]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
