import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { nombre, email } = await req.json();
    await resend.emails.send({
      from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
      to: email,
      subject: "¡Bienvenido/a a DeseoComer! 🧞",
      html: `<html><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>
<div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">¡Bienvenido/a, ${nombre}!</h2>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">Tu cuenta en DeseoComer ha sido creada. Ya puedes explorar los mejores restaurantes, participar en concursos y aprovechar promociones exclusivas.</p>
<div style="text-align:center;margin-bottom:24px"><a href="https://deseocomer.com" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Explorar DeseoComer →</a></div>
</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Email bienvenida]", error);
    return NextResponse.json({ error: "Error enviando email" }, { status: 500 });
  }
}
