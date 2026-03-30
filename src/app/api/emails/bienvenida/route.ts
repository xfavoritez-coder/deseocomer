import { NextRequest, NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { BienvenidaEmail } from "@/emails/BienvenidaEmail";
import * as React from "react";

export async function POST(req: NextRequest) {
  try {
    const { nombre, email } = await req.json();
    await resend.emails.send({
      from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
      to: email,
      subject: "¡Bienvenido/a a DeseoComer! 🧞",
      react: React.createElement(BienvenidaEmail, { nombre }),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Email bienvenida]", error);
    return NextResponse.json({ error: "Error enviando email" }, { status: 500 });
  }
}
