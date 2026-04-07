import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://deseocomer.com";

// GET: return contest info for coordination page (validated by token)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Token requerido" }, { status: 400 });

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        local: { select: { nombre: true } },
        ganadorActual: { select: { nombre: true } },
      },
    });

    if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });
    if (concurso.confirmacionToken !== token) return NextResponse.json({ error: "Token inválido" }, { status: 403 });
    if (concurso.estado === "completado") return NextResponse.json({ error: "El premio ya fue entregado" }, { status: 400 });

    const ganadorNombre = concurso.ganadorActual?.nombre ?? "Ganador";
    const parts = ganadorNombre.trim().split(/\s+/);
    const nombre = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];

    return NextResponse.json({
      premio: concurso.premio,
      local: concurso.local.nombre,
      ganador: nombre,
      codigo: concurso.codigoEntrega,
    });
  } catch (error) {
    console.error("[Coordinar info GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: local sends proposed date to winner
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { token, fecha } = await req.json();
    if (!token || !fecha) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        local: { select: { nombre: true, direccion: true, comuna: true, telefono: true } },
        ganadorActual: { select: { nombre: true, email: true } },
      },
    });

    if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });
    if (concurso.confirmacionToken !== token) return NextResponse.json({ error: "Token inválido" }, { status: 403 });
    if (!concurso.ganadorActual) return NextResponse.json({ error: "Sin ganador" }, { status: 400 });

    const from = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>";
    const ganadorNombre = concurso.ganadorActual.nombre.split(" ")[0];

    await resend.emails.send({
      from,
      to: concurso.ganadorActual.email,
      subject: `📅 ${concurso.local.nombre} te espera — Retira tu premio`,
      html: `<html><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>
<div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">📅 Tu premio te espera</h2>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Hola ${ganadorNombre},</p>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px"><strong style="color:#f5d080">${concurso.local.nombre}</strong> te invita a retirar tu premio <strong style="color:#f5d080">"${concurso.premio}"</strong>:</p>
<div style="background-color:rgba(232,168,76,0.1);border:1px solid rgba(232,168,76,0.25);border-radius:12px;padding:20px;margin-bottom:20px;text-align:center">
<p style="color:#e8a84c;font-size:20px;font-weight:bold;margin:0">${fecha}</p>
</div>
<div style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:20px">
<p style="color:#e8a84c;font-size:14px;font-weight:bold;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em">Dónde ir</p>
<p style="color:#c0a060;font-size:14px;line-height:1.7;margin:0 0 4px"><strong style="color:#e8a84c">Local:</strong> ${concurso.local.nombre}</p>
${concurso.local.direccion ? `<p style="color:#c0a060;font-size:14px;line-height:1.7;margin:0 0 4px"><strong style="color:#e8a84c">Dirección:</strong> ${concurso.local.direccion}${concurso.local.comuna ? `, ${concurso.local.comuna}` : ""}</p>` : ""}
${concurso.local.telefono ? `<p style="color:#c0a060;font-size:14px;line-height:1.7;margin:0"><strong style="color:#e8a84c">Teléfono:</strong> ${concurso.local.telefono}</p>` : ""}
</div>
<p style="color:#c0a060;font-size:14px;line-height:1.7;margin-bottom:16px">Presenta tu código de verificación al llegar: <strong style="color:#f5d080;letter-spacing:0.1em">${concurso.codigoEntrega}</strong></p>
<p style="color:#c0a060;font-size:14px;line-height:1.7;margin-bottom:0">Si la fecha no te acomoda, contacta al local${concurso.local.telefono ? ` al <strong style="color:#e8a84c">${concurso.local.telefono}</strong>` : ""} para coordinar otra fecha.</p>
</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Coordinar info POST]", error);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
