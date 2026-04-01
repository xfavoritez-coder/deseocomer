import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const body = await req.json();
    const { accion, motivoRechazo } = body;

    const local = await prisma.local.findUnique({ where: { id }, select: { nombre: true, email: true, activo: true, id: true } });
    if (!local) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (accion === "reenviar-activacion") {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
      await resend.emails.send({
        from: `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`,
        to: [local.email],
        subject: "Activa tu local en DeseoComer",
        html: `<div style="background:#1a0e05;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto"><div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px"><h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">¡Tu local fue activado!</h2><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">Hola ${local.nombre}, tu local ya está visible en DeseoComer. Ingresa a tu panel para completar tu perfil y empezar a publicar.</p><div style="text-align:center"><a href="${appUrl}/login-local" style="background:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ir a mi panel →</a></div></div></div>`,
      }).catch(err => console.error("[Email reenviar-activacion]", err));
      return NextResponse.json({ ok: true });
    }

    if (accion === "aprobar") {
      await prisma.local.update({ where: { id }, data: { activo: true } });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
      await resend.emails.send({
        from: `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`,
        to: [local.email],
        subject: "¡Tu local fue aprobado en DeseoComer!",
        html: `<div style="background:#1a0e05;color:#f0ead6;font-family:Georgia,serif;padding:40px;max-width:600px;margin:0 auto"><div style="text-align:center;margin-bottom:24px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:32px"><h2 style="color:#e8a84c;font-size:22px;margin:0 0 16px">¡Bienvenido, ${local.nombre}! 🎉</h2><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">Tu local fue revisado y aprobado. Ya apareces en DeseoComer y miles de personas pueden encontrarte.</p><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">Accede a tu panel para completar tu perfil, subir fotos, crear tu primer concurso y publicar promociones.</p><div style="text-align:center"><a href="${appUrl}/login-local" style="background:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ir a mi panel →</a></div></div><div style="text-align:center;margin-top:24px"><p style="color:#5a4028;font-size:12px">DeseoComer · Santiago de Chile</p></div></div>`,
      }).catch(err => console.error("[Email aprobar]", err));
      return NextResponse.json({ ok: true, accion: "aprobado" });
    }

    if (accion === "rechazar") {
      await prisma.local.update({ where: { id }, data: { activo: false } });
      const motivoHtml = motivoRechazo ? `<div style="background:rgba(255,255,255,0.05);border-left:3px solid #e8a84c;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:20px"><p style="font-size:14px;color:#c0a060;margin:0;line-height:1.6"><strong style="color:#f5d080">Motivo:</strong> ${motivoRechazo}</p></div>` : "";
      await resend.emails.send({
        from: `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`,
        to: [local.email],
        subject: "Actualización sobre tu solicitud en DeseoComer",
        html: `<div style="background:#1a0e05;color:#f0ead6;font-family:Georgia,serif;padding:40px;max-width:600px;margin:0 auto"><div style="text-align:center;margin-bottom:24px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:32px"><h2 style="color:#e8a84c;font-size:20px;margin:0 0 16px">Sobre tu solicitud</h2><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Hola <strong style="color:#f5d080">${local.nombre}</strong>, revisamos tu solicitud y por el momento no pudimos aprobarla.</p>${motivoHtml}<p style="color:#7a5a30;font-size:14px;line-height:1.7">Si tienes dudas puedes escribirnos a <a href="mailto:hola@deseocomer.com" style="color:#3db89e">hola@deseocomer.com</a></p></div></div>`,
      }).catch(err => console.error("[Email rechazar]", err));
      return NextResponse.json({ ok: true, accion: "rechazado" });
    }

    if (accion === "cambiar-password") {
      const bcrypt = await import("bcryptjs");
      if (!body.nuevaPassword || body.nuevaPassword.length < 8) return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 });
      const hash = await bcrypt.hash(body.nuevaPassword, 10);
      await prisma.local.update({ where: { id }, data: { password: hash } });
      return NextResponse.json({ ok: true, accion: "password-cambiada" });
    }

    if (accion === "editar") {
      const updated = await prisma.local.update({
        where: { id },
        data: {
          ...(body.nombre !== undefined && { nombre: body.nombre }),
          ...(body.nombreDueno !== undefined && { nombreDueno: body.nombreDueno }),
          ...(body.celularDueno !== undefined && { celularDueno: body.celularDueno }),
          ...(body.categoria !== undefined && { categoria: body.categoria }),
          ...(body.ciudad !== undefined && { ciudad: body.ciudad }),
          ...(body.comuna !== undefined && { comuna: body.comuna }),
          ...(body.direccion !== undefined && { direccion: body.direccion }),
          ...(body.telefono !== undefined && { telefono: body.telefono }),
        },
      });
      const { password: _, ...safe } = updated;
      return NextResponse.json({ ok: true, data: safe });
    }

    // Fallback: update genérico (toggle activo/verificado)
    const { activo, verificado } = body;
    const updated = await prisma.local.update({ where: { id }, data: { ...(activo !== undefined && { activo }), ...(verificado !== undefined && { verificado }) } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin locales PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    // Delete related records first
    await prisma.participanteConcurso.deleteMany({ where: { concurso: { localId: id } } });
    await prisma.concurso.deleteMany({ where: { localId: id } });
    await prisma.promocion.deleteMany({ where: { localId: id } });
    await prisma.favorito.deleteMany({ where: { localId: id } });
    await prisma.resena.deleteMany({ where: { localId: id } });
    await prisma.menuItem.deleteMany({ where: { localId: id } });
    await prisma.local.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin locales DELETE]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
