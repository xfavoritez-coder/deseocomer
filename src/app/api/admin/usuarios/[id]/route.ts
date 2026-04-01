import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";
import { resend } from "@/lib/resend";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const body = await req.json();
    const { accion } = body;

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (accion === "editar") {
      const updated = await prisma.usuario.update({
        where: { id },
        data: {
          ...(body.nombre !== undefined && { nombre: body.nombre }),
          ...(body.ciudad !== undefined && { ciudad: body.ciudad }),
          ...(body.cumpleDia !== undefined && { cumpleDia: body.cumpleDia ? Number(body.cumpleDia) : null }),
          ...(body.cumpleMes !== undefined && { cumpleMes: body.cumpleMes ? Number(body.cumpleMes) : null }),
        },
      });
      const { password: _, ...safe } = updated;
      return NextResponse.json({ ok: true, data: safe });
    }

    if (accion === "cambiar-password") {
      if (!body.nuevaPassword || body.nuevaPassword.length < 8) return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 });
      const hash = await bcrypt.hash(body.nuevaPassword, 10);
      await prisma.usuario.update({ where: { id }, data: { password: hash } });
      return NextResponse.json({ ok: true });
    }

    if (accion === "activar") {
      await prisma.usuario.update({ where: { id }, data: { emailVerificado: true, tokenVerificacion: null } });
      return NextResponse.json({ ok: true });
    }

    if (accion === "desactivar") {
      await prisma.usuario.update({ where: { id }, data: { emailVerificado: false } });
      return NextResponse.json({ ok: true });
    }

    if (accion === "reenviar-verificacion") {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.usuario.update({ where: { id }, data: { tokenVerificacion: token } });
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
      const url = `${baseUrl}/verificar-email?token=${token}`;
      await resend.emails.send({
        from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
        to: usuario.email,
        subject: "Activa tu cuenta en DeseoComer",
        html: `<div style="background:#1a0e05;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto"><div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px"><h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">Confirma tu email, ${usuario.nombre}</h2><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:32px">Activa tu cuenta para participar en concursos:</p><div style="text-align:center;margin-bottom:32px"><a href="${url}" style="background:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Activar mi cuenta →</a></div></div></div>`,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("[Admin usuarios PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    await prisma.participanteConcurso.deleteMany({ where: { usuarioId: id } });
    await prisma.favorito.deleteMany({ where: { usuarioId: id } });
    await prisma.resena.deleteMany({ where: { usuarioId: id } });
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin usuarios DELETE]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
