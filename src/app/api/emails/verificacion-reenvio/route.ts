import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import * as crypto from "crypto";

function buildVerificationHtml(nombre: string, url: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px"><h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">Confirma tu email, ${nombre}</h2><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:32px">Para activar tu cuenta y participar en concursos, confirma tu dirección de email:</p><div style="text-align:center;margin-bottom:32px"><a href="${url}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Activar mi cuenta →</a></div><p style="color:#5a4028;font-size:13px;line-height:1.6">El link expira en 24 horas. Si no creaste esta cuenta, ignora este email.</p></div><div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 · DeseoComer.com</p></div></div></body></html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || usuario.emailVerificado) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.usuario.update({ where: { email }, data: { tokenVerificacion: token } });

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com"}/verificar-email?token=${token}`;
    const from = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>";

    await resend.emails.send({
      from,
      to: email,
      subject: "Activa tu cuenta en DeseoComer",
      html: buildVerificationHtml(usuario.nombre, verificationUrl),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Reenvio] Error:", error);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
