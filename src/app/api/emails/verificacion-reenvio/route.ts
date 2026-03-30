import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { VerificacionEmail } from "@/emails/VerificacionEmail";
import * as crypto from "crypto";
import * as React from "react";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || usuario.emailVerificado) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.usuario.update({ where: { email }, data: { tokenVerificacion: token } });

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verificar-email?token=${token}`;
    const fromEmail = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>";
    console.log("[Reenvio] Enviando a:", email, "desde:", fromEmail, "API key exists:", !!process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Activa tu cuenta en DeseoComer 📧",
      react: React.createElement(VerificacionEmail, { nombre: usuario.nombre, verificationUrl }),
    });
    console.log("[Reenvio] Resultado:", JSON.stringify(result));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Reenvio] Error:", error);
    return NextResponse.json({ error: "Error al enviar email", detalle: error instanceof Error ? error.message : "desconocido" }, { status: 500 });
  }
}
