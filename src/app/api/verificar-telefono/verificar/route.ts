import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificarCodigoSMS } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  try {
    const { userId, codigo } = await req.json();
    if (!userId || !codigo) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { telefono: true, codigoSMSExpira: true, telefonoVerificado: true },
    });

    if (!user || !user.telefono) {
      return NextResponse.json({ error: "No hay número pendiente de verificar" }, { status: 400 });
    }

    if (user.telefonoVerificado) {
      return NextResponse.json({ ok: true, yaVerificado: true });
    }

    // Check expiration
    if (user.codigoSMSExpira && new Date(user.codigoSMSExpira) < new Date()) {
      return NextResponse.json({ error: "El código expiró. Solicita uno nuevo." }, { status: 410 });
    }

    // Verify with Twilio
    const valid = await verificarCodigoSMS(user.telefono, codigo);
    if (!valid) {
      return NextResponse.json({ error: "Código incorrecto" }, { status: 400 });
    }

    // Mark as verified
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        telefonoVerificado: true,
        telefonoVerificadoAt: new Date(),
        codigoSMS: null,
        codigoSMSExpira: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[SMS verificar]", error);
    return NextResponse.json({ error: "Error al verificar. Intenta de nuevo." }, { status: 500 });
  }
}
