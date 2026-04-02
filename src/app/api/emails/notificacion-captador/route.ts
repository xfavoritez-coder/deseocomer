import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { captadorId, nombreLocal } = await req.json();
    if (!captadorId || !nombreLocal) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const captador = await prisma.captador.findUnique({ where: { id: captadorId } });
    if (!captador) return NextResponse.json({ error: "Captador no encontrado" }, { status: 404 });

    const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;

    await resend.emails.send({
      from,
      to: captador.email,
      subject: "🏪 Nuevo local registrado con tu código",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff;border-radius:12px">
          <div style="text-align:center;padding:20px;background:linear-gradient(135deg,#e8a84c,#d4922a);border-radius:12px;margin-bottom:24px">
            <p style="font-size:28px;margin:0 0 8px">🏪</p>
            <h1 style="color:#fff;font-size:18px;margin:0">¡Nuevo local registrado!</h1>
          </div>

          <p style="font-size:15px;color:#333;line-height:1.6">Hola <strong>${captador.nombre}</strong>,</p>
          <p style="font-size:15px;color:#333;line-height:1.6">¡Buenas noticias! El local <strong>"${nombreLocal}"</strong> acaba de registrarse en DeseoComer con tu código <strong>${captador.codigo}</strong>.</p>

          <div style="background:#f0faf5;border:1px solid #3db89e;border-radius:10px;padding:16px;margin:16px 0;text-align:center">
            <p style="font-size:14px;color:#333;margin:0">Ya tienes <strong style="color:#c47f1a;font-size:18px">$10.000</strong> a favor en tu cuenta.</p>
          </div>

          <p style="font-size:14px;color:#555;line-height:1.6">Si este local publica su primer concurso, ganarás <strong>$5.000 adicionales</strong> — para un total de <strong>$15.000</strong> por este local.</p>

          <p style="text-align:center;margin:24px 0">
            <a href="https://deseocomer.com/captador" style="background:#e8a84c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">Revisa tu panel →</a>
          </p>

          <p style="font-size:14px;color:#555">¡Sigue así!</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
          <p style="font-size:13px;color:#aaa;text-align:center">El equipo de DeseoComer 🧞</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Email notificacion-captador]", error);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
