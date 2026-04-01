import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import * as React from "react";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, action, codigo, passNueva } = await req.json();
    if (!email) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    if (action === "enviar") {
      const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, nombre: true, email: true } });
      if (!usuario) return NextResponse.json({ error: "No encontramos una cuenta con ese email" }, { status: 404 });

      const code = crypto.randomInt(100000, 999999).toString();
      const expira = new Date(Date.now() + 600000); // 10 min

      await prisma.usuario.update({ where: { id: usuario.id }, data: { resetToken: code, resetTokenExpira: expira } });

      const nombre = usuario.nombre.split(" ")[0];
      await resend.emails.send({
        from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
        to: usuario.email,
        subject: "Código de verificación · DeseoComer",
        react: React.createElement("html", null,
          React.createElement("body", { style: { backgroundColor: "#1a0e05", fontFamily: "Georgia, serif", margin: 0, padding: 0 } },
            React.createElement("div", { style: { maxWidth: "560px", margin: "0 auto", padding: "40px 24px" } },
              React.createElement("div", { style: { textAlign: "center", marginBottom: "32px" } },
                React.createElement("p", { style: { fontSize: "28px", margin: "0 0 8px" } }, "🧞"),
                React.createElement("h1", { style: { color: "#e8a84c", fontSize: "20px", letterSpacing: "0.3em", textTransform: "uppercase", margin: 0 } }, "DeseoComer"),
              ),
              React.createElement("div", { style: { backgroundColor: "#2d1a08", borderRadius: "20px", border: "1px solid rgba(232,168,76,0.25)", padding: "40px 32px" } },
                React.createElement("h2", { style: { color: "#e8a84c", fontSize: "22px", marginTop: 0, marginBottom: "16px" } }, "Código de verificación"),
                React.createElement("p", { style: { color: "#c0a060", fontSize: "16px", lineHeight: "1.7", marginBottom: "24px" } }, `Hola ${nombre}, tu código para cambiar la contraseña es:`),
                React.createElement("div", { style: { textAlign: "center", marginBottom: "24px" } },
                  React.createElement("span", { style: { backgroundColor: "rgba(232,168,76,0.15)", color: "#e8a84c", fontSize: "32px", fontWeight: "bold", letterSpacing: "0.3em", padding: "16px 32px", borderRadius: "12px", display: "inline-block" } }, code),
                ),
                React.createElement("p", { style: { color: "#5a4028", fontSize: "13px", lineHeight: "1.6", marginBottom: 0 } }, "Este código expira en 10 minutos."),
              ),
            ),
          ),
        ),
      });

      const parts = usuario.email.split("@");
      const masked = parts[0].slice(0, 2) + "***@" + parts[1];
      return NextResponse.json({ ok: true, emailMasked: masked });
    }

    if (action === "verificar") {
      if (!codigo || !passNueva) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
      if (passNueva.length < 8) return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 });

      const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, resetToken: true, resetTokenExpira: true } });
      if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      if (!usuario.resetToken || !usuario.resetTokenExpira || usuario.resetToken !== codigo) {
        return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
      }
      if (new Date() > usuario.resetTokenExpira) {
        return NextResponse.json({ error: "El código ha expirado" }, { status: 401 });
      }

      const hash = await bcrypt.hash(passNueva, 10);
      await prisma.usuario.update({ where: { id: usuario.id }, data: { password: hash, resetToken: null, resetTokenExpira: null } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("[Recuperar password usuario]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
