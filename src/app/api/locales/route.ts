import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { makeLocalSlug } from "@/lib/slugify";

export async function GET() {
  try {
    const locales = await prisma.local.findMany({
      where: {
        activo: true,
      },
      include: {
        _count: { select: { favoritos: true, resenas: true, concursos: true, promociones: true } },
        promociones: { where: { activa: true }, select: { id: true, titulo: true, descripcion: true, horaInicio: true, horaFin: true }, take: 3 },
        concursos: { where: { activo: true, cancelado: false, fechaFin: { gt: new Date() } }, select: { id: true, slug: true, premio: true, fechaFin: true }, take: 3 },
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const safe = locales.map(({ password: _, ...rest }) => rest);
    return NextResponse.json(safe);
  } catch (error) {
    console.error("[API /locales GET] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, nombreDueno, nombreEncargado, email, password, telefono, ciudad, registroRapido, passwordPlain, captadorCodigo } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const existe = await prisma.local.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const slug = makeLocalSlug(nombre, ciudad);

    // Resolve captador if code provided
    let captadorData: { captadorId: string; captadorCodigo: string } | undefined;
    if (captadorCodigo) {
      try {
        const captador = await prisma.captador.findUnique({ where: { codigo: captadorCodigo } });
        if (captador) captadorData = { captadorId: captador.id, captadorCodigo: captador.codigo };
      } catch { /* ignore */ }
    }

    const local = await prisma.local.create({
      data: {
        nombre, slug, nombreDueno: nombreDueno || nombreEncargado, celularDueno: telefono,
        email, password: hash, ciudad, activo: false,
        ...(nombreEncargado && { nombreEncargado }),
        ...(registroRapido && { registroRapido: true }),
        ...(captadorData && captadorData),
      },
    });

    // Send welcome email for quick registration
    if (registroRapido && passwordPlain) {
      try {
        const { resend } = await import("@/lib/resend");
        const fromEmail = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>";
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: "¡Bienvenido a DeseoComer! Aquí están tus datos",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#fff;border-radius:12px">
              <div style="text-align:center;padding:20px;background:linear-gradient(135deg,#e8a84c,#d4922a);border-radius:12px;margin-bottom:24px">
                <p style="font-size:28px;margin:0 0 8px">🧞</p>
                <h1 style="color:#fff;font-size:20px;margin:0">¡Bienvenido a DeseoComer!</h1>
              </div>
              <p>Hola <strong>${nombreEncargado || nombreDueno || ""}!</strong></p>
              <p>Tu local <strong>${nombre}</strong> ha sido registrado exitosamente.</p>
              <p>Aquí están tus datos de acceso al panel:</p>
              <div style="background:#faf7f2;border:1px solid rgba(180,130,40,0.2);border-radius:10px;padding:16px;margin:16px 0">
                <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
                <p style="margin:4px 0"><strong>Contraseña:</strong> ${passwordPlain}</p>
              </div>
              <p style="text-align:center;margin:24px 0">
                <a href="https://deseocomer.com/login-local" style="background:#e8a84c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">Entrar al panel →</a>
              </p>
              <p style="font-size:13px;color:#888">Para aparecer en DeseoComer, completa tu perfil: sube tu logo, foto de portada, dirección, horarios y categoría.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
              <p style="font-size:12px;color:#aaa;text-align:center">DeseoComer — La plataforma gastronómica de Chile</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("[Email registro rápido]", emailErr);
      }
    }

    const { password: _, ...localSinPassword } = local;
    return NextResponse.json(localSinPassword, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
