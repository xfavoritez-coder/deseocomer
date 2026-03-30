import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { ResetPasswordEmail } from "@/emails/ResetPasswordEmail";
import { prisma } from "@/lib/prisma";
import * as crypto from "crypto";
import * as React from "react";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    // Always respond ok (security — don't reveal if email exists)
    if (!usuario) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expira = new Date(Date.now() + 3600000); // 1 hour

    await prisma.usuario.update({
      where: { email },
      data: { resetToken: token, resetTokenExpira: expira },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
      to: email,
      subject: "Restablecer contraseña · DeseoComer",
      react: React.createElement(ResetPasswordEmail, { nombre: usuario.nombre, resetUrl }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Email reset]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
