import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  try {
    const { localId, localNombre, email, asunto, mensaje } = await req.json();
    if (!localNombre || !email || !mensaje) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    let destino = "favoritez@gmail.com";
    try {
      const config = await prisma.configSite.findUnique({ where: { clave: "email_contacto_locales" } });
      if (config?.valor) destino = config.valor;
    } catch {}

    await resend.emails.send({
      from: `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`,
      to: [destino],
      replyTo: email,
      subject: `[Panel Local] ${escapeHtml(asunto || "Consulta")} — ${escapeHtml(localNombre)}`,
      html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a0e05;padding:32px;border-radius:16px"><h2 style="color:#e8a84c;margin:0 0 16px">Mensaje desde Panel de Local</h2><p style="color:#c0a060"><strong>Local:</strong> ${escapeHtml(localNombre)}</p><p style="color:#c0a060"><strong>Email:</strong> ${escapeHtml(email)}</p><p style="color:#c0a060"><strong>Asunto:</strong> ${escapeHtml(asunto || "Consulta general")}</p>${localId ? `<p style="color:#7a5a30;font-size:13px">ID: ${escapeHtml(localId)}</p>` : ""}<hr style="border:none;border-top:1px solid rgba(232,168,76,0.2);margin:16px 0"/><p style="color:#f0ead6;line-height:1.7">${escapeHtml(mensaje).replace(/\n/g, "<br/>")}</p></div>`,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
