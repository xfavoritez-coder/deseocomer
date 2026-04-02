import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { captadorId } = await req.json();
    if (!captadorId) return NextResponse.json({ error: "Falta captadorId" }, { status: 400 });

    const captador = await prisma.captador.findUnique({ where: { id: captadorId } });
    if (!captador) return NextResponse.json({ error: "Captador no encontrado" }, { status: 404 });

    const { nombre, email, codigo } = captador;
    const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;

    await resend.emails.send({
      from,
      to: email,
      subject: "¡Bienvenido al equipo DeseoComer! 🧞",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fff;border-radius:12px">
          <div style="text-align:center;padding:24px;background:linear-gradient(135deg,#e8a84c,#d4922a);border-radius:12px;margin-bottom:24px">
            <p style="font-size:32px;margin:0 0 8px">🧞</p>
            <h1 style="color:#fff;font-size:20px;margin:0">¡Bienvenido al equipo!</h1>
          </div>

          <p style="font-size:15px;color:#333;line-height:1.6">Hola <strong>${nombre}</strong>, bienvenido al equipo de captadores de DeseoComer.</p>
          <p style="font-size:15px;color:#333;line-height:1.6">Ya estás registrado en el programa. A partir de ahora puedes empezar a captar locales y ganar dinero.</p>

          <div style="background:#faf7f2;border:2px solid #e8a84c;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
            <p style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px">Tu código único</p>
            <p style="font-family:monospace;font-size:28px;font-weight:700;color:#c47f1a;margin:0;letter-spacing:0.1em">${codigo}</p>
            <p style="font-size:12px;color:#999;margin:8px 0 0">Este código es tu identificador — no lo compartas.</p>
          </div>

          <h2 style="font-size:14px;color:#c47f1a;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 12px">Cómo ingresar a tu panel</h2>
          <ol style="font-size:14px;color:#555;line-height:1.8;padding-left:20px">
            <li>Entra a <a href="https://deseocomer.com/captador" style="color:#c47f1a;font-weight:700">deseocomer.com/captador</a></li>
            <li>Escribe tu código único: <strong>${codigo}</strong></li>
            <li>Haz click en "Acceder"</li>
            <li>Listo — verás tus locales captados, tus ganancias y tu QR personal para mostrar.</li>
          </ol>

          <h2 style="font-size:14px;color:#c47f1a;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 12px">Así funciona</h2>
          <ol style="font-size:14px;color:#555;line-height:1.8;padding-left:20px">
            <li>Abre tu panel y toca "Mostrar QR a un local"</li>
            <li>Entra a un restaurante o local de comida</li>
            <li>Muéstrale el QR al dueño desde tu celular</li>
            <li>El dueño escanea y se registra con tu código</li>
            <li>Ganas $10.000 por cada local registrado</li>
            <li>Si el local publica un concurso, $5.000 más</li>
          </ol>

          <h2 style="font-size:14px;color:#c47f1a;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 12px">Lo que ganas</h2>
          <ul style="font-size:14px;color:#555;line-height:1.8;padding-left:20px">
            <li><strong>$10.000</strong> por cada local registrado</li>
            <li><strong>$5.000</strong> extra si el local publica un concurso</li>
            <li>Sin límite de locales — cuantos más, mejor</li>
            <li>Pagos quincenales via transferencia bancaria</li>
          </ul>

          <p style="text-align:center;margin:28px 0">
            <a href="https://deseocomer.com/captador" style="background:#e8a84c;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px">Entra a tu panel ahora →</a>
          </p>

          <p style="font-size:14px;color:#555;line-height:1.6">Cualquier duda escríbenos en <a href="https://deseocomer.com/contacto" style="color:#c47f1a">deseocomer.com/contacto</a></p>
          <p style="font-size:14px;color:#555">¡Mucho éxito!</p>

          <hr style="border:none;border-top:1px solid #eee;margin:20px 0" />
          <p style="font-size:13px;color:#aaa;text-align:center">El equipo de DeseoComer 🧞</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Email bienvenida-captador]", error);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
