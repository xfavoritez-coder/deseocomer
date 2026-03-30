import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  if (!to) return NextResponse.json({ error: "Falta ?to=email" }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY no configurada" }, { status: 500 });
  if (!fromEmail) return NextResponse.json({ error: "FROM_EMAIL no configurado" }, { status: 500 });

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: `DeseoComer <${fromEmail}>`,
      to,
      subject: "Test DeseoComer - Si lees esto, funciona!",
      text: `Hola! Este es un email de prueba de DeseoComer.\n\nSi lo recibes, el sistema de emails funciona correctamente.\n\nEnviado: ${new Date().toISOString()}`,
    });

    return NextResponse.json({
      ok: true,
      to,
      from: fromEmail,
      resendId: result.data?.id ?? null,
      resendError: result.error ?? null,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
