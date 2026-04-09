import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";
import { resend } from "@/lib/resend";

// POST: preview (count) or send emails
export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { action, filtros, plantilla, concursoId, asuntoCustom, tituloCustom, cuerpoCustom, ctaTexto, ctaUrl, emailPrueba } = body;

    // Test mode — send single email to a test address
    if (action === "test") {
      if (!emailPrueba) return NextResponse.json({ error: "Falta email de prueba" }, { status: 400 });
      const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;
      let asunto = "";
      let htmlBody = "";

      if (plantilla === "nuevo_concurso" && concursoId) {
        const concurso = await prisma.concurso.findFirst({ where: { OR: [{ id: concursoId }, { slug: concursoId }] }, include: { local: { select: { nombre: true, logoUrl: true } } } });
        if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });
        const esSorteo = concurso.modalidadConcurso === "sorteo";
        asunto = `[PRUEBA] ${esSorteo ? "🎲 ¡Sorteo: " + concurso.premio + " gratis!" : "🏆 Nuevo concurso: gana " + concurso.premio}`;
        htmlBody = buildNuevoConcursoHtml({ premio: concurso.premio, local: concurso.local.nombre, logoUrl: concurso.local.logoUrl, esSorteo, slug: concurso.slug || concurso.id, descripcion: concurso.descripcion });
      } else if (plantilla === "concurso_por_terminar" && concursoId) {
        const concurso = await prisma.concurso.findFirst({ where: { OR: [{ id: concursoId }, { slug: concursoId }] }, include: { local: { select: { nombre: true } }, _count: { select: { participantes: true } } } });
        if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });
        const esSorteo = concurso.modalidadConcurso === "sorteo";
        asunto = `[PRUEBA] ⏰ ¡Último día para ${esSorteo ? "entrar al sorteo" : "ganar"}: ${concurso.premio}!`;
        htmlBody = buildPorTerminarHtml({ premio: concurso.premio, local: concurso.local.nombre, participantes: concurso._count.participantes, esSorteo, slug: concurso.slug || concurso.id });
      } else if (plantilla === "personalizado") {
        asunto = `[PRUEBA] ${asuntoCustom || "Novedades de DeseoComer"}`;
        htmlBody = buildPersonalizadoHtml({ titulo: tituloCustom || "", cuerpo: cuerpoCustom || "", ctaTexto: ctaTexto || "", ctaUrl: ctaUrl || "https://deseocomer.com" });
      } else {
        return NextResponse.json({ error: "Selecciona una plantilla y concurso" }, { status: 400 });
      }

      try {
        await resend.emails.send({ from, to: emailPrueba, subject: asunto, html: htmlBody.replace(/\{\{nombre\}\}/g, "Prueba") });
        return NextResponse.json({ ok: true });
      } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Error al enviar" }, { status: 500 });
      }
    }

    // Build where clause from filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { emailVerificado: true };

    if (filtros?.emailVerificado === false) where.emailVerificado = false;
    if (filtros?.telefonoVerificado === true) where.telefonoVerificado = true;
    if (filtros?.telefonoVerificado === false) where.telefonoVerificado = false;
    if (filtros?.estiloAlimentario && filtros.estiloAlimentario !== "todos") {
      if (filtros.estiloAlimentario === "como_de_todo") {
        where.estiloAlimentario = "";
      } else {
        where.estiloAlimentario = filtros.estiloAlimentario;
      }
    }
    if (filtros?.haParticipado === true) {
      where.participaciones = { some: {} };
    }
    if (filtros?.haParticipado === false) {
      where.participaciones = { none: {} };
    }

    // Get base users
    let usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true, nombre: true, email: true,
        geniePerfil: true,
        estiloAlimentario: true,
        comidasFavoritas: true,
      },
    });

    // Filter by categoria favorita (from geniePerfil OR comidasFavoritas)
    if (filtros?.categoriaFavorita) {
      const cat = filtros.categoriaFavorita.toLowerCase();
      usuarios = usuarios.filter(u => {
        // Check geniePerfil.gustos.categorias
        const gp = u.geniePerfil as { gustos?: { categorias?: Record<string, number> } } | null;
        const cats = gp?.gustos?.categorias;
        if (cats && Object.keys(cats).some(k => k.toLowerCase().includes(cat))) return true;
        // Check comidasFavoritas (set during registration)
        if (u.comidasFavoritas?.some((c: string) => c.toLowerCase().includes(cat))) return true;
        return false;
      });
    }

    // Preview mode — just return count
    if (action === "preview") {
      return NextResponse.json({ total: usuarios.length });
    }

    // Send mode
    if (action !== "send") {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    // Build email content based on template
    let asunto = "";
    let htmlBody = "";
    const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;

    if (plantilla === "nuevo_concurso" && concursoId) {
      const concurso = await prisma.concurso.findFirst({
        where: { OR: [{ id: concursoId }, { slug: concursoId }] },
        include: { local: { select: { nombre: true, logoUrl: true } } },
      });
      if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });

      const esSorteo = concurso.modalidadConcurso === "sorteo";
      const slug = concurso.slug || concurso.id;

      asunto = esSorteo
        ? `🎲 ¡Sorteo: ${concurso.premio} gratis!`
        : `🏆 Nuevo concurso: gana ${concurso.premio}`;

      htmlBody = buildNuevoConcursoHtml({
        premio: concurso.premio,
        local: concurso.local.nombre,
        logoUrl: concurso.local.logoUrl,
        esSorteo,
        slug,
        descripcion: concurso.descripcion,
      });
    } else if (plantilla === "concurso_por_terminar" && concursoId) {
      const concurso = await prisma.concurso.findFirst({
        where: { OR: [{ id: concursoId }, { slug: concursoId }] },
        include: { local: { select: { nombre: true } }, _count: { select: { participantes: true } } },
      });
      if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });

      const slug = concurso.slug || concurso.id;
      const esSorteo = concurso.modalidadConcurso === "sorteo";
      asunto = `⏰ ¡Último día para ${esSorteo ? "entrar al sorteo" : "ganar"}: ${concurso.premio}!`;

      htmlBody = buildPorTerminarHtml({
        premio: concurso.premio,
        local: concurso.local.nombre,
        participantes: concurso._count.participantes,
        esSorteo,
        slug,
      });
    } else if (plantilla === "personalizado") {
      asunto = asuntoCustom || "Novedades de DeseoComer";
      htmlBody = buildPersonalizadoHtml({
        titulo: tituloCustom || "",
        cuerpo: cuerpoCustom || "",
        ctaTexto: ctaTexto || "",
        ctaUrl: ctaUrl || "https://deseocomer.com",
      });
    } else {
      return NextResponse.json({ error: "Plantilla no válida" }, { status: 400 });
    }

    // Send in batches
    let enviados = 0;
    let errores = 0;
    const log: string[] = [];
    const BATCH = 10;

    for (let i = 0; i < usuarios.length; i += BATCH) {
      const batch = usuarios.slice(i, i + BATCH);
      const promises = batch.map(async u => {
        try {
          const personalHtml = htmlBody.replace(/\{\{nombre\}\}/g, u.nombre.split(/\s+/)[0]);
          await resend.emails.send({ from, to: u.email, subject: asunto, html: personalHtml });
          enviados++;
          log.push(`✅ ${u.email}`);
        } catch (e) {
          errores++;
          log.push(`❌ ${u.email}: ${e instanceof Error ? e.message : "error"}`);
        }
      });
      await Promise.all(promises);
      // Small pause between batches
      if (i + BATCH < usuarios.length) await new Promise(r => setTimeout(r, 300));
    }

    return NextResponse.json({ ok: true, enviados, errores, total: usuarios.length, log });
  } catch (e) {
    console.error("[Admin email-usuarios]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// GET: list concursos for dropdown
export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  const concursos = await prisma.concurso.findMany({
    where: { OR: [{ estado: "activo" }, { estado: "programado" }] },
    select: { id: true, slug: true, premio: true, modalidadConcurso: true, estado: true, local: { select: { nombre: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ concursos });
}

function wrapEmail(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <div style="text-align:center;margin-bottom:32px">
    <p style="font-size:28px;margin:0 0 8px">🧞</p>
    <h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1>
  </div>
  <div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
    ${content}
  </div>
  <div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 · DeseoComer.com</p></div>
</div></body></html>`;
}

function buildNuevoConcursoHtml({ premio, local, logoUrl, esSorteo, slug, descripcion }: { premio: string; local: string; logoUrl: string | null; esSorteo: boolean; slug: string; descripcion: string | null }) {
  const url = `https://deseocomer.com/concursos/${slug}`;
  const modalidadBadge = esSorteo
    ? `<span style="display:inline-block;background:#ec4899;color:#fff;font-size:12px;font-weight:bold;padding:4px 14px;border-radius:20px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px">🎲 SORTEO</span>`
    : `<span style="display:inline-block;background:#3db89e;color:#fff;font-size:12px;font-weight:bold;padding:4px 14px;border-radius:20px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px">🏆 MÉRITO</span>`;

  const modalidadMsg = esSorteo
    ? `<p style="color:#f5d080;font-size:16px;line-height:1.7;margin-bottom:20px;text-align:center">Es modalidad <strong>sorteo</strong> — solo entra y ya estás participando. <strong style="color:#e8a84c">Cualquiera dentro puede ganar</strong>. Es gratis.</p>`
    : `<p style="color:#f5d080;font-size:16px;line-height:1.7;margin-bottom:20px;text-align:center">Invita amigos, suma puntos y <strong style="color:#e8a84c">gana el premio</strong>. Cada amigo que entre por tu link te da +3 puntos.</p>`;

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${local}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid rgba(232,168,76,0.3);margin-right:12px;vertical-align:middle" />`
    : "";

  const desc = descripcion ? `<p style="color:#c0a060;font-size:14px;line-height:1.6;margin-bottom:20px;text-align:center;font-style:italic">${descripcion.length > 150 ? descripcion.substring(0, 150) + "..." : descripcion}</p>` : "";

  return wrapEmail(`
    <div style="text-align:center;margin-bottom:20px">
      ${modalidadBadge}
    </div>
    <h2 style="color:#e8a84c;font-size:24px;margin-top:0;margin-bottom:8px;text-align:center">{{nombre}}, ¡nuevo concurso!</h2>
    <div style="text-align:center;margin-bottom:16px">
      ${logoHtml}<span style="color:#f0ead6;font-size:16px;font-weight:bold;vertical-align:middle">${local}</span>
    </div>
    <div style="background:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.2);border-radius:14px;padding:20px;margin-bottom:20px;text-align:center">
      <p style="font-size:14px;color:rgba(240,234,214,0.5);margin:0 0 6px;text-transform:uppercase;letter-spacing:0.1em">Premio</p>
      <p style="font-size:22px;color:#f5d080;font-weight:bold;margin:0">🏆 ${premio}</p>
    </div>
    ${desc}
    ${modalidadMsg}
    <div style="text-align:center;margin-bottom:20px">
      <a href="${url}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">${esSorteo ? "Entrar al sorteo →" : "Participar ahora →"}</a>
    </div>
    <p style="color:#5a4028;font-size:13px;line-height:1.6;text-align:center">${esSorteo ? "Solo necesitas entrar — cualquiera dentro puede ganar." : "El que más puntos tenga al cierre, gana."}</p>
  `);
}

function buildPorTerminarHtml({ premio, local, participantes, esSorteo, slug }: { premio: string; local: string; participantes: number; esSorteo: boolean; slug: string }) {
  const url = `https://deseocomer.com/concursos/${slug}`;
  return wrapEmail(`
    <h2 style="color:#e05555;font-size:22px;margin-top:0;margin-bottom:16px;text-align:center">⏰ ¡Última oportunidad, {{nombre}}!</h2>
    <p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px;text-align:center">El concurso <strong style="color:#f5d080">"${premio}"</strong> de <strong style="color:#f5d080">${local}</strong> está por terminar.</p>
    <div style="background:rgba(224,85,85,0.08);border:1px solid rgba(224,85,85,0.2);border-radius:12px;padding:16px;margin-bottom:20px;text-align:center">
      <p style="color:#e05555;font-size:15px;margin:0"><strong>${participantes} personas</strong> ya están participando</p>
    </div>
    <p style="color:#f5d080;font-size:15px;line-height:1.7;margin-bottom:24px;text-align:center">${esSorteo ? "Es un sorteo — solo entra y ya estás participando. ¡Cualquiera puede ganar!" : "Aún puedes entrar e invitar amigos para subir en el ranking."}</p>
    <div style="text-align:center;margin-bottom:20px">
      <a href="${url}" style="background-color:#e05555;color:#fff;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">No te lo pierdas →</a>
    </div>
  `);
}

function buildPersonalizadoHtml({ titulo, cuerpo, ctaTexto, ctaUrl }: { titulo: string; cuerpo: string; ctaTexto: string; ctaUrl: string }) {
  const ctaHtml = ctaTexto ? `<div style="text-align:center;margin:24px 0"><a href="${ctaUrl}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">${ctaTexto}</a></div>` : "";
  return wrapEmail(`
    ${titulo ? `<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px;text-align:center">${titulo}</h2>` : ""}
    <p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:20px;white-space:pre-wrap">${cuerpo}</p>
    ${ctaHtml}
  `);
}
