import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarCodigoSMS } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    const { userId, telefono } = await req.json();
    if (!userId || !telefono) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    // Normalize phone: ensure +56 prefix for Chilean numbers
    let phone = telefono.replace(/\s/g, "").replace(/-/g, "");
    if (phone.startsWith("09") || phone.startsWith("9")) {
      phone = phone.startsWith("09") ? "+56" + phone.slice(1) : "+56" + phone;
    }
    if (!phone.startsWith("+")) phone = "+" + phone;

    // Validate format
    if (phone.length < 10) return NextResponse.json({ error: "Número inválido" }, { status: 400 });

    // Check if phone is already used by another verified account
    const existing = await prisma.usuario.findFirst({
      where: { telefono: phone, telefonoVerificado: true, id: { not: userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Este número ya está registrado en otra cuenta" }, { status: 409 });
    }

    // Rate limit: max 3 SMS per user per hour
    const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { codigoSMSExpira: true } });
    if (user?.codigoSMSExpira && new Date(user.codigoSMSExpira) > new Date()) {
      const secsLeft = Math.ceil((new Date(user.codigoSMSExpira).getTime() - Date.now()) / 1000);
      if (secsLeft > 240) {
        return NextResponse.json({ error: "Ya enviamos un código. Espera un momento antes de reenviar." }, { status: 429 });
      }
    }

    // Send via Twilio Verify
    await enviarCodigoSMS(phone);

    // Save phone and expiration (5 minutes)
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        telefono: phone,
        codigoSMSExpira: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.json({ ok: true, telefono: phone });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[SMS enviar]", msg, error);
    return NextResponse.json({ error: `Error al enviar SMS: ${msg}` }, { status: 500 });
  }
}
