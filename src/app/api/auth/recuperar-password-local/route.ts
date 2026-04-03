import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

import * as crypto from "crypto";
import bcrypt from "bcryptjs";

// Step 1: Send 6-digit code to local's email
export async function POST(req: NextRequest) {
  try {
    const { localId, action, codigo, passNueva } = await req.json();
    if (!localId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    // --- ENVIAR CÓDIGO ---
    if (action === "enviar") {
      // Support lookup by id or email
      const isEmail = localId.includes("@");
      const local = await prisma.local.findFirst({
        where: isEmail ? { email: localId } : { id: localId },
        select: { id: true, email: true, nombreDueno: true, nombre: true },
      });
      if (!local) return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });

      const code = crypto.randomInt(100000, 999999).toString();
      const expira = new Date(Date.now() + 600000); // 10 min

      await prisma.local.update({ where: { id: local.id }, data: { resetToken: code, resetTokenExpira: expira } });

      const nombre = local.nombreDueno || local.nombre;
      await resend.emails.send({
        from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
        to: local.email,
        subject: "Código de verificación · DeseoComer",
        html: `<html><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>
<div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">Código de verificación</h2>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">Hola ${nombre}, tu código para cambiar la contraseña es:</p>
<div style="text-align:center;margin-bottom:24px"><span style="background-color:rgba(232,168,76,0.15);color:#e8a84c;font-size:32px;font-weight:bold;letter-spacing:0.3em;padding:16px 32px;border-radius:12px;display:inline-block">${code}</span></div>
<p style="color:#5a4028;font-size:13px;line-height:1.6;margin-bottom:0">Este código expira en 10 minutos. Si no solicitaste este cambio, ignora este email.</p>
</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`,
      });

      // Mask email for UI
      const parts = local.email.split("@");
      const masked = parts[0].slice(0, 2) + "***@" + parts[1];
      return NextResponse.json({ ok: true, emailMasked: masked });
    }

    // --- VERIFICAR CÓDIGO Y CAMBIAR CONTRASEÑA ---
    if (action === "verificar") {
      if (!codigo || !passNueva) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
      if (passNueva.length < 8) return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 });

      const isEmail = localId.includes("@");
      const local = await prisma.local.findFirst({
        where: isEmail ? { email: localId } : { id: localId },
        select: { id: true, resetToken: true, resetTokenExpira: true },
      });
      if (!local) return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
      if (!local.resetToken || !local.resetTokenExpira || local.resetToken !== codigo) {
        return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
      }
      if (new Date() > local.resetTokenExpira) {
        return NextResponse.json({ error: "El código ha expirado" }, { status: 401 });
      }

      const hash = await bcrypt.hash(passNueva, 10);
      await prisma.local.update({ where: { id: local.id }, data: { password: hash, resetToken: null, resetTokenExpira: null } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("[Recuperar password local]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
