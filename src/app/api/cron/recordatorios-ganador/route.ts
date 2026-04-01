import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import * as React from "react";

export async function GET(req: NextRequest) {
  // Optional: verify cron secret
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const now = new Date();
    const hace48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const hace7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find finished contests with participants, prize not delivered
    const concursos = await prisma.concurso.findMany({
      where: {
        activo: true,
        cancelado: false,
        premioEntregado: false,
        fechaFin: { lt: now },
      },
      include: {
        local: { select: { email: true, nombre: true, nombreDueno: true } },
        participantes: { orderBy: { puntos: "desc" }, take: 1, include: { usuario: { select: { nombre: true } } } },
        _count: { select: { participantes: true } },
      },
    });

    let enviados = 0;

    for (const c of concursos) {
      if (c._count.participantes === 0) continue;
      const ganador = c.participantes[0]?.usuario?.nombre ?? "el participante";
      const horasDesde = (now.getTime() - new Date(c.fechaFin).getTime()) / (1000 * 60 * 60);
      const nombreLocal = c.local.nombreDueno || c.local.nombre;

      // 48h reminder
      if (!c.recordatorio48h && new Date(c.fechaFin) <= hace48h) {
        await enviarRecordatorio(c.local.email, nombreLocal, c.premio, ganador, "48h");
        await prisma.concurso.update({ where: { id: c.id }, data: { recordatorio48h: true } });
        enviados++;
      }

      // 7d reminder
      if (!c.recordatorio7d && new Date(c.fechaFin) <= hace7d) {
        await enviarRecordatorio(c.local.email, nombreLocal, c.premio, ganador, "7d");
        await prisma.concurso.update({ where: { id: c.id }, data: { recordatorio7d: true } });
        enviados++;
      }
    }

    return NextResponse.json({ ok: true, concursosRevisados: concursos.length, emailsEnviados: enviados });
  } catch (error) {
    console.error("[Cron recordatorios]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

async function enviarRecordatorio(email: string, nombreLocal: string, premio: string, ganador: string, tipo: "48h" | "7d") {
  const esUrgente = tipo === "7d";
  const asunto = esUrgente
    ? `⚠️ Último recordatorio: entrega del premio "${premio}"`
    : `Recordatorio: tu concurso "${premio}" tiene un ganador`;

  const mensaje = esUrgente
    ? `Han pasado 7 días desde que finalizó tu concurso. ${ganador} ganó "${premio}" y aún no has confirmado la entrega. Por favor, coordina la entrega lo antes posible.`
    : `Tu concurso "${premio}" finalizó hace 48 horas. ${ganador} es el ganador. Ingresa a tu panel para confirmar la entrega del premio.`;

  await resend.emails.send({
    from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
    to: email,
    subject: asunto,
    react: React.createElement("html", null,
      React.createElement("body", { style: { backgroundColor: "#1a0e05", fontFamily: "Georgia, serif", margin: 0, padding: 0 } },
        React.createElement("div", { style: { maxWidth: "560px", margin: "0 auto", padding: "40px 24px" } },
          React.createElement("div", { style: { textAlign: "center", marginBottom: "32px" } },
            React.createElement("p", { style: { fontSize: "28px", margin: "0 0 8px" } }, "🧞"),
            React.createElement("h1", { style: { color: "#e8a84c", fontSize: "20px", letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 } }, "DeseoComer"),
          ),
          React.createElement("div", { style: { backgroundColor: "#2d1a08", borderRadius: "20px", border: `1px solid ${esUrgente ? "rgba(255,80,80,0.4)" : "rgba(232,168,76,0.25)"}`, padding: "40px 32px" } },
            React.createElement("h2", { style: { color: esUrgente ? "#ff6b6b" : "#e8a84c", fontSize: "22px", marginTop: 0, marginBottom: "16px" } }, esUrgente ? "⚠️ Último recordatorio" : "🏆 Tu concurso tiene un ganador"),
            React.createElement("p", { style: { color: "#c0a060", fontSize: "16px", lineHeight: "1.7", marginBottom: "24px" } }, `Hola ${nombreLocal}, ${mensaje}`),
            React.createElement("div", { style: { textAlign: "center", marginBottom: "24px" } },
              React.createElement("a", { href: "https://deseocomer.com/panel/concursos", style: { backgroundColor: "#e8a84c", color: "#1a0e05", fontSize: "14px", fontWeight: "bold", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none", padding: "16px 40px", borderRadius: "12px", display: "inline-block" } }, "Ir al panel →"),
            ),
          ),
          React.createElement("div", { style: { textAlign: "center", marginTop: "32px" } },
            React.createElement("p", { style: { color: "#5a4028", fontSize: "12px" } }, "Hecho con ❤️ y mucha hambre · DeseoComer.com"),
          ),
        ),
      ),
    ),
  });
}
