import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";
import disposableDomains from "disposable-email-domains";

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, telefono, ciudad, cumpleDia, cumpleMes, cumpleAnio } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Blacklist de dominios desechables
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      return NextResponse.json(
        { error: "Este tipo de correo no está permitido. Por favor usa un correo personal como Gmail u Outlook." },
        { status: 400 }
      );
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    // Límite de cuentas por IP (máx 2 en 24h)
    if (ip !== "unknown") {
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const cuentasDesdeIP = await prisma.usuario.count({
        where: { ipRegistro: ip, createdAt: { gte: hace24h } },
      });
      if (cuentasDesdeIP >= 2) {
        return NextResponse.json(
          { error: "Has creado demasiadas cuentas recientemente. Intenta más tarde." },
          { status: 429 }
        );
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const tokenVerificacion = crypto.randomBytes(32).toString("hex");

    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: hash, telefono, ciudad, cumpleDia, cumpleMes, cumpleAnio, emailVerificado: false, tokenVerificacion, ipRegistro: ip },
    });

    const { password: _, ...usuarioSinPassword } = usuario;

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/verificar-email?token=${tokenVerificacion}`;

    resend.emails.send({
      from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
      to: email,
      subject: "Activa tu cuenta en DeseoComer",
      html: buildVerificationHtml(nombre, verificationUrl),
    }).catch(err => console.error("[Registro] Error enviando email:", err));

    // Link to lista espera comunas if exists
    try { await prisma.listaEsperaComuna.updateMany({ where: { email }, data: { usuarioId: usuario.id } }); } catch {}

    return NextResponse.json(usuarioSinPassword, { status: 201 });
  } catch (error) {
    console.error("[API /usuarios] Error:", error);
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error interno", detalle: msg }, { status: 500 });
  }
}

function buildVerificationHtml(nombre: string, url: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0"><div style="max-width:560px;margin:0 auto;padding:40px 24px"><div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px"><h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">Confirma tu email, ${nombre}</h2><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:32px">Para activar tu cuenta y participar en concursos, confirma tu dirección de email:</p><div style="text-align:center;margin-bottom:32px"><a href="${url}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Activar mi cuenta →</a></div><p style="color:#5a4028;font-size:13px;line-height:1.6">El link expira en 24 horas. Si no creaste esta cuenta, ignora este email.</p></div><div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 · DeseoComer.com</p></div></div></body></html>`;
}
