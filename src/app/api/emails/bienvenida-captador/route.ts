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

          <h2 style="font-size:14px;color:#c47f1a;text-transform:uppercase;letter-spacing:0.08em;margin:24px 0 12px">Cómo convencer a un local</h2>
          <p style="font-size:14px;color:#555;line-height:1.6;margin-bottom:8px">Cuando entres a un local, di esto:</p>
          <div style="background:#faf7f2;border:1px solid rgba(180,130,40,0.2);border-radius:10px;padding:16px;margin:8px 0 16px;font-style:italic;font-size:14px;color:#444;line-height:1.7">
            "Hola, soy de DeseoComer, una plataforma gastronómica nueva en Santiago donde la gente busca dónde comer. Registrar tu local es gratis y apareces en la plataforma de inmediato. Lo más potente es que puedes publicar concursos — tus clientes y personas nuevas invitan a sus amigos a ganar un premio, y tú consigues visibilidad con el nombre de tu local siendo visto por muchas personas nuevas sin pagar publicidad. Es gratis, toma 5 minutos, y mientras más temprano te registres mejor posicionado quedas porque recién estamos creciendo."
          </div>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:4px"><strong>Si te dicen "¿Cuánto cuesta?":</strong></p>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:8px">→ "Es completamente gratis. Siempre."</p>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:4px"><strong>Si te dicen "¿Para qué me sirve?":</strong></p>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:8px">→ "Para que más gente te encuentre cuando busca dónde comer en tu comuna."</p>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:4px"><strong>Si te dicen "No tengo tiempo":</strong></p>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:8px">→ "Te registro yo mismo ahora, solo necesito tu nombre, correo y teléfono. En 5 minutos listo."</p>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:4px"><strong>Si te dicen "Ya tengo Instagram":</strong></p>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:8px">→ "DeseoComer es diferente — acá la gente está buscando activamente dónde comer, no scrolleando. Es más directo para conseguir clientes nuevos."</p>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:4px"><strong>Si te dicen "¿Qué es un concurso?":</strong></p>
          <p style="font-size:13px;color:#555;line-height:1.6;margin-bottom:16px">→ "Tú decides el premio — una porción, un menú, lo que quieras. La gente participa e invita amigos. Te genera visibilidad gratis sin invertir nada."</p>

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
            <li>Sin límite de locales — cuantos más, mejor</li>
            <li>Pagos quincenales via transferencia bancaria</li>
          </ol>

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
