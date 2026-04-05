import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
  let enviados = 0;

  try {
    // Get all active concursos
    const concursos = await prisma.concurso.findMany({
      where: { activo: true, cancelado: false, fechaFin: { gt: new Date() } },
      select: { id: true, slug: true, premio: true },
    });

    for (const c of concursos) {
      // Get current top 5 by points
      const top = await prisma.participanteConcurso.findMany({
        where: { concursoId: c.id, estado: { not: "descalificado" } },
        orderBy: { puntos: "desc" },
        take: 5,
        select: { usuarioId: true, puntos: true, usuario: { select: { nombre: true, email: true } } },
      });

      if (top.length < 4) continue; // Not enough participants to matter

      const top3Ids = top.slice(0, 3).map(t => t.usuarioId);

      // Check who was in top 3 before and now isn't
      // We use a simple approach: check notifications sent in last 24h to avoid duplicates
      for (let i = 3; i < top.length; i++) {
        const participant = top[i];
        const pos = i + 1;

        // Only alert if they have significant points (not just base 1)
        if (participant.puntos < 3) continue;

        // Check if we already sent this alert in the last 24h
        const alreadySent = await prisma.notificacion.findFirst({
          where: {
            usuarioId: participant.usuarioId,
            tipo: "alerta_ranking",
            createdAt: { gte: new Date(Date.now() - 24 * 3600000) },
          },
        });
        if (alreadySent) continue;

        // Check if this user was previously in top 3 by looking at their points vs #3
        const tercero = top[2];
        if (!tercero) continue;

        // Only alert if they're close to top 3 (within 5 points)
        if (participant.puntos < tercero.puntos - 5) continue;

        const nombre = participant.usuario.nombre.split(" ")[0];
        const premioCorto = c.premio.length > 30 ? c.premio.substring(0, 30) + "..." : c.premio;

        // Create notification
        await prisma.notificacion.create({
          data: {
            usuarioId: participant.usuarioId,
            tipo: "alerta_ranking",
            mensaje: `Estás en la posición #${pos} en "${premioCorto}". ¡Comparte tu link para subir al podio! 🏆`,
            datos: { concursoSlug: c.slug || c.id },
          },
        });

        // Send email
        try {
          await resend.emails.send({
            from,
            to: participant.usuario.email,
            subject: `⚠️ Estás cerca del podio en "${premioCorto}"`,
            html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px"><h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">¡${nombre}, estás cerca del podio!</h2><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Estás en la <strong style="color:#f5d080">posición #${pos}</strong> en el concurso <strong style="color:#f5d080">${c.premio}</strong>.</p><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">El top 3 está a solo unos puntos. Comparte tu link — cada amigo que entre te da <strong style="color:#f5d080">+3 puntos</strong> y a él también.</p><div style="text-align:center;margin-bottom:24px"><a href="${base}/concursos/${c.slug || c.id}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver mi concurso →</a></div><p style="color:#5a4028;font-size:13px;line-height:1.6">No te quedes fuera del podio. ¡Invita amigos y sube en el ranking!</p></div><div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 · DeseoComer.com</p></div></div></body></html>`,
          });
          enviados++;
        } catch (err) {
          console.error(`[Alerta ranking] Error email ${participant.usuario.email}:`, err);
        }
      }
    }

    return NextResponse.json({ ok: true, enviados });
  } catch (error) {
    console.error("[Cron alerta-ranking]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
