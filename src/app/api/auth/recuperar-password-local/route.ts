import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import * as React from "react";
import * as crypto from "crypto";
import bcrypt from "bcryptjs";

// Step 1: Send 6-digit code to local's email
export async function POST(req: NextRequest) {
  try {
    const { localId, action, codigo, passNueva } = await req.json();
    if (!localId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    // --- ENVIAR CÓDIGO ---
    if (action === "enviar") {
      const local = await prisma.local.findUnique({ where: { id: localId }, select: { email: true, nombreDueno: true, nombre: true } });
      if (!local) return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });

      const code = crypto.randomInt(100000, 999999).toString();
      const expira = new Date(Date.now() + 600000); // 10 min

      await prisma.local.update({ where: { id: localId }, data: { resetToken: code, resetTokenExpira: expira } });

      const nombre = local.nombreDueno || local.nombre;
      await resend.emails.send({
        from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
        to: local.email,
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
                React.createElement("p", { style: { color: "#5a4028", fontSize: "13px", lineHeight: "1.6", marginBottom: 0 } }, "Este código expira en 10 minutos. Si no solicitaste este cambio, ignora este email."),
              ),
              React.createElement("div", { style: { textAlign: "center", marginTop: "32px" } },
                React.createElement("p", { style: { color: "#5a4028", fontSize: "12px" } }, "Hecho con ❤️ y mucha hambre · DeseoComer.com"),
              ),
            ),
          ),
        ),
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

      const local = await prisma.local.findUnique({ where: { id: localId }, select: { resetToken: true, resetTokenExpira: true } });
      if (!local) return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
      if (!local.resetToken || !local.resetTokenExpira || local.resetToken !== codigo) {
        return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
      }
      if (new Date() > local.resetTokenExpira) {
        return NextResponse.json({ error: "El código ha expirado" }, { status: 401 });
      }

      const hash = await bcrypt.hash(passNueva, 10);
      await prisma.local.update({ where: { id: localId }, data: { password: hash, resetToken: null, resetTokenExpira: null } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("[Recuperar password local]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
