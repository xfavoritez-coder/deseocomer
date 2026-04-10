import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const wrap = (content: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">${content}</div><div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div></div></body></html>`;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
  let enviados = 0;
  const log: string[] = [];

  try {
    const en72h = new Date(Date.now() + 72 * 3600000);

    // Only active contests ending within the next 72 hours (but more than 2h left)
    const concursos = await prisma.concurso.findMany({
      where: {
        activo: true,
        cancelado: false,
        fechaFin: {
          gt: new Date(Date.now() + 2 * 3600000),
          lte: en72h,
        },
      },
      select: { id: true, slug: true, premio: true, fechaFin: true },
    });

    // Pre-fetch all ranking alerts for these contests (max 1 per user per contest)
    const concursoSlugs = concursos.map(c => c.slug || c.id);
    const alertasPrevias = concursoSlugs.length > 0
      ? await prisma.notificacion.findMany({
          where: {
            tipo: "alerta_ranking",
            OR: concursoSlugs.map(s => ({
              datos: { path: ["concursoSlug"], equals: s },
            })),
          },
          select: { usuarioId: true, datos: true },
        })
      : [];

    // Build set of "usuarioId:concursoSlug" to check if already alerted for this contest
    const alertadosSet = new Set<string>();
    for (const a of alertasPrevias) {
      const slug = (a.datos as Record<string, string>)?.concursoSlug;
      if (slug) alertadosSet.add(`${a.usuarioId}:${slug}`);
    }

    for (const c of concursos) {
      const cSlug = c.slug || c.id;

      const top = await prisma.participanteConcurso.findMany({
        where: { concursoId: c.id, estado: { not: "descalificado" } },
        orderBy: { puntos: "desc" },
        take: 3,
        select: { usuarioId: true, puntos: true, usuario: { select: { nombre: true, email: true } } },
      });

      if (top.length < 2) continue;

      const primero = top[0];
      const segundo = top[1];
      const diff = primero.puntos - segundo.puntos;
      const premioCorto = c.premio.length > 30 ? c.premio.substring(0, 30) + "..." : c.premio;
      const concursoUrl = `${base}/concursos/${cSlug}`;

      // Skip if difference is too large (>15 pts = 5 referidos, hard to catch up)
      if (diff > 15) continue;

      // ── Alert to 2nd place: "El 1° te lleva X puntos" (max 1 per contest) ──
      const key2 = `${segundo.usuarioId}:${cSlug}`;
      if (!alertadosSet.has(key2) && segundo.puntos >= 3) {
        const nombre2 = segundo.usuario.nombre.split(" ")[0];
        const nombre1 = primero.usuario.nombre.split(" ")[0];
        const amigosNecesarios = Math.ceil(diff / 3);

        await prisma.notificacion.create({
          data: { usuarioId: segundo.usuarioId, tipo: "alerta_ranking", mensaje: `${nombre1} te lleva ${diff} puntos en "${premioCorto}". ¡Comparte tu link para alcanzarlo! ⚡`, datos: { concursoSlug: cSlug } },
        });

        try {
          await resend.emails.send({
            from,
            to: segundo.usuario.email,
            subject: `⚡ ${nombre1} te superó en "${premioCorto}" — ¡aún puedes alcanzarlo!`,
            html: wrap([
              `<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">${nombre2}, ¡la competencia está reñida!</h2>`,
              `<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:20px"><strong style="color:#f5d080">${nombre1}</strong> te lleva ventaja en el concurso <strong style="color:#f5d080">"${c.premio}"</strong>. Estás en el <strong style="color:#e8a84c">2° lugar</strong>.</p>`,
              `<div style="background:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">`,
              `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="color:#f5d080;font-size:15px;font-weight:bold">🥇 ${nombre1}</span><span style="color:#e8a84c;font-size:18px;font-weight:bold">${primero.puntos} pts</span></div>`,
              `<div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#c0a060;font-size:15px;font-weight:bold">🥈 Tú (${nombre2})</span><span style="color:#c0a060;font-size:18px;font-weight:bold">${segundo.puntos} pts</span></div>`,
              amigosNecesarios <= 5 ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(232,168,76,0.15)"><p style="color:#3db89e;font-size:14px;margin:0;text-align:center">Solo <strong>${amigosNecesarios} ${amigosNecesarios === 1 ? "amigo" : "amigos"}</strong> te separan del primer lugar</p></div>` : "",
              `</div>`,
              `<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">Cada amigo que entre por tu link te da <strong style="color:#f5d080">+3 puntos</strong> — y a él también. Comparte tu link y recupera el primer lugar.</p>`,
              `<div style="text-align:center;margin-bottom:16px"><a href="${concursoUrl}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver mi concurso →</a></div>`,
            ].join("")),
          });
          enviados++;
          alertadosSet.add(key2);
          log.push(`[2do] ${nombre2} en "${premioCorto}" (diff: ${diff})`);
        } catch (err) {
          log.push(`[ERROR] email 2do ${segundo.usuario.email}: ${err}`);
        }
      }

      // ── Alert to 1st place: "El 2° se está acercando" (only if diff <= 6 pts, max 1 per contest) ──
      const key1 = `${primero.usuarioId}:${cSlug}`;
      if (diff <= 6 && primero.puntos >= 3 && !alertadosSet.has(key1)) {
        const nombre1 = primero.usuario.nombre.split(" ")[0];
        const nombre2 = segundo.usuario.nombre.split(" ")[0];

        await prisma.notificacion.create({
          data: { usuarioId: primero.usuarioId, tipo: "alerta_ranking", mensaje: `${nombre2} se está acercando en "${premioCorto}". ¡Asegura tu primer lugar compartiendo tu link! 🏆`, datos: { concursoSlug: cSlug } },
        });

        try {
          await resend.emails.send({
            from,
            to: primero.usuario.email,
            subject: `🏆 ${nombre2} se acerca a tu primer lugar en "${premioCorto}"`,
            html: wrap([
              `<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">${nombre1}, ¡cuidado con tu primer lugar!</h2>`,
              `<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:20px"><strong style="color:#f5d080">${nombre2}</strong> se está acercando en el concurso <strong style="color:#f5d080">"${c.premio}"</strong>. Solo te lleva <strong style="color:#e8a84c">${diff} puntos</strong> de ventaja.</p>`,
              `<div style="background:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">`,
              `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="color:#f5d080;font-size:15px;font-weight:bold">🥇 Tú (${nombre1})</span><span style="color:#e8a84c;font-size:18px;font-weight:bold">${primero.puntos} pts</span></div>`,
              `<div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#c0a060;font-size:15px;font-weight:bold">🥈 ${nombre2}</span><span style="color:#c0a060;font-size:18px;font-weight:bold">${segundo.puntos} pts</span></div>`,
              `</div>`,
              `<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">No dejes que te alcance. Comparte tu link — cada amigo que entre te da <strong style="color:#f5d080">+3 puntos</strong> y asegura tu premio.</p>`,
              `<div style="text-align:center;margin-bottom:16px"><a href="${concursoUrl}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver mi concurso →</a></div>`,
            ].join("")),
          });
          enviados++;
          alertadosSet.add(key1);
          log.push(`[1ro] ${nombre1} en "${premioCorto}" (diff: ${diff})`);
        } catch (err) {
          log.push(`[ERROR] email 1ro ${primero.usuario.email}: ${err}`);
        }
      }
    }

    return NextResponse.json({ ok: true, enviados, log });
  } catch (error) {
    console.error("[Cron alerta-ranking]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
