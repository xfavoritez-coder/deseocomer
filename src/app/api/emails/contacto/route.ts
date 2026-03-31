import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, motivo, mensaje } = await req.json();
    if (!nombre || !email || !mensaje) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    await resend.emails.send({
      from: `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`,
      to: ["favoritez@gmail.com"],
      replyTo: email,
      subject: `[Contacto] ${motivo} — ${nombre}`,
      html: `<h2>Nuevo mensaje de contacto</h2><p><strong>Nombre:</strong> ${nombre}</p><p><strong>Email:</strong> ${email}</p><p><strong>Motivo:</strong> ${motivo}</p><hr/><p><strong>Mensaje:</strong></p><p>${mensaje.replace(/\n/g, "<br/>")}</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
