import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function diasDesde(fecha: Date): number {
  return Math.floor((Date.now() - fecha.getTime()) / 86400000);
}

function perfilIncompleto(local: { logoUrl?: string | null; portadaUrl?: string | null; horarios?: unknown }): string[] {
  const falta: string[] = [];
  if (!local.logoUrl) falta.push("logo");
  if (!local.portadaUrl) falta.push("foto de portada");
  if (!local.horarios || !Array.isArray(local.horarios) || !(local.horarios as { activo: boolean }[]).some(h => h.activo)) falta.push("horarios");
  return falta;
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;
  const results = { dia2: 0, dia5: 0, dia10: 0, errors: 0 };

  try {
    const locales = await prisma.local.findMany({
      where: { activo: true, activadoAt: { not: null } },
      select: {
        id: true, nombre: true, email: true, nombreEncargado: true, nombreDueno: true,
        logoUrl: true, portadaUrl: true, horarios: true, activadoAt: true,
        recordatorio2d: true, recordatorio5d: true, recordatorio10d: true,
        _count: { select: { concursos: true, promociones: true } },
      },
    });

    for (const local of locales) {
      if (!local.activadoAt) continue;
      const dias = diasDesde(local.activadoAt);
      const nombre = local.nombreEncargado || local.nombreDueno || local.nombre;

      try {
        // DÍA 2 — Tu local ya está visible
        if (dias >= 2 && !local.recordatorio2d) {
          const falta = perfilIncompleto(local);
          const faltaTexto = falta.length > 0
            ? `<p style="font-size:15px;color:#555;line-height:1.6;margin-bottom:16px">Para que tu local se vea mejor, te recomendamos completar: <strong>${falta.join(", ")}</strong>.</p>`
            : `<p style="font-size:15px;color:#555;line-height:1.6;margin-bottom:16px">Tu perfil está completo. El siguiente paso es publicar tu primera promoción o concurso para atraer clientes.</p>`;

          await resend.emails.send({
            from, to: local.email,
            subject: `🏮 ${local.nombre}, tu local ya está visible en DeseoComer`,
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff;border-radius:12px">
              <div style="text-align:center;padding:24px;background:linear-gradient(135deg,#e8a84c,#d4922a);border-radius:12px;margin-bottom:24px">
                <p style="font-size:28px;margin:0 0 8px">🏮</p>
                <h1 style="color:#fff;font-size:18px;margin:0">Tu local ya está en DeseoComer</h1>
              </div>
              <p style="font-size:15px;color:#333;line-height:1.6">Hola <strong>${nombre}</strong>,</p>
              <p style="font-size:15px;color:#555;line-height:1.6">Tu local <strong>${local.nombre}</strong> ya está activo y visible en la plataforma. Las personas que busquen dónde comer en tu zona pueden encontrarte.</p>
              ${faltaTexto}
              <p style="text-align:center;margin:24px 0"><a href="https://deseocomer.com/login-local" style="background:#e8a84c;color:#0a0812;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px">Entrar a mi panel →</a></p>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
              <p style="font-size:12px;color:#aaa;text-align:center">El equipo de DeseoComer 🧞</p>
            </div>`,
          });
          await prisma.local.update({ where: { id: local.id }, data: { recordatorio2d: true } });
          results.dia2++;
        }

        // DÍA 5 — Publica tu primer concurso
        if (dias >= 5 && !local.recordatorio5d) {
          await resend.emails.send({
            from, to: local.email,
            subject: `🏆 ${nombre}, publica tu primer concurso y atrae clientes nuevos`,
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff;border-radius:12px">
              <div style="text-align:center;padding:24px;background:linear-gradient(135deg,#e8a84c,#d4922a);border-radius:12px;margin-bottom:24px">
                <p style="font-size:28px;margin:0 0 8px">🏆</p>
                <h1 style="color:#fff;font-size:18px;margin:0">Atrae clientes nuevos gratis</h1>
              </div>
              <p style="font-size:15px;color:#333;line-height:1.6">Hola <strong>${nombre}</strong>,</p>
              <p style="font-size:15px;color:#555;line-height:1.6">¿Sabías que puedes publicar un concurso en menos de 3 minutos? Así funciona:</p>
              <div style="background:#faf7f2;border:1px solid rgba(180,130,40,0.2);border-radius:10px;padding:16px;margin:16px 0">
                <p style="font-size:14px;color:#555;margin:6px 0"><strong>1.</strong> Elige un premio — puede ser una porción, un menú, lo que quieras.</p>
                <p style="font-size:14px;color:#555;margin:6px 0"><strong>2.</strong> Define la duración — entre 3 y 7 días funciona mejor.</p>
                <p style="font-size:14px;color:#555;margin:6px 0"><strong>3.</strong> Publica — los participantes invitan amigos y tu local gana visibilidad.</p>
              </div>
              <div style="background:#f0faf5;border:1px solid rgba(61,184,158,0.3);border-radius:10px;padding:14px;margin:16px 0">
                <p style="font-size:13px;color:#555;font-style:italic;margin:0;line-height:1.5">"Publicamos un concurso el lunes y el miércoles ya teníamos 200 personas nuevas." — <strong>María José R., Café Bellavista</strong></p>
              </div>
              <p style="text-align:center;margin:24px 0"><a href="https://deseocomer.com/login-local" style="background:#e8a84c;color:#0a0812;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px">Crear mi primer concurso →</a></p>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
              <p style="font-size:12px;color:#aaa;text-align:center">El equipo de DeseoComer 🧞</p>
            </div>`,
          });
          await prisma.local.update({ where: { id: local.id }, data: { recordatorio5d: true } });
          results.dia5++;
        }

        // DÍA 10 — Solo si NO ha publicado nada
        if (dias >= 10 && !local.recordatorio10d && local._count.concursos === 0 && local._count.promociones === 0) {
          await resend.emails.send({
            from, to: local.email,
            subject: `${local.nombre}, tu local lleva 10 días sin actividad`,
            html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff;border-radius:12px">
              <div style="text-align:center;padding:24px;background:linear-gradient(135deg,#e8a84c,#d4922a);border-radius:12px;margin-bottom:24px">
                <p style="font-size:28px;margin:0 0 8px">🧞</p>
                <h1 style="color:#fff;font-size:18px;margin:0">Te echamos de menos</h1>
              </div>
              <p style="font-size:15px;color:#333;line-height:1.6">Hola <strong>${nombre}</strong>,</p>
              <p style="font-size:15px;color:#555;line-height:1.6">Tu local <strong>${local.nombre}</strong> lleva 10 días en DeseoComer pero aún no has publicado ningún concurso ni promoción.</p>
              <p style="font-size:15px;color:#555;line-height:1.6">Los locales que publican en sus primeros días consiguen mucha más visibilidad porque los usuarios activos descubren los locales nuevos primero.</p>
              <p style="font-size:15px;color:#555;line-height:1.6">Publicar toma menos de 3 minutos. Si necesitas ayuda, escríbenos y te guiamos paso a paso.</p>
              <div style="display:flex;gap:8px;justify-content:center;margin:24px 0">
                <a href="https://deseocomer.com/login-local" style="background:#e8a84c;color:#0a0812;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px">Entrar al panel →</a>
                <a href="https://deseocomer.com/contacto" style="background:#fff;color:#c47f1a;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px;border:1px solid #e8a84c">Pedir ayuda</a>
              </div>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
              <p style="font-size:12px;color:#aaa;text-align:center">El equipo de DeseoComer 🧞</p>
            </div>`,
          });
          await prisma.local.update({ where: { id: local.id }, data: { recordatorio10d: true } });
          results.dia10++;
        }
      } catch (e) {
        console.error(`[Cron recordatorio] Error local ${local.id}:`, e);
        results.errors++;
      }
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    console.error("[Cron recordatorios-locales]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
