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
    const link = `deseocomer.com/unete?ref=${codigo}`;

    await resend.emails.send({
      from,
      to: email,
      subject: "¡Bienvenido al equipo DeseoComer! 🧞",
      html: `
<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#e8a84c,#d4922a);padding:32px;text-align:center">
    <p style="font-size:36px;margin:0 0 10px">🧞</p>
    <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 4px">¡Bienvenido al equipo!</h1>
    <p style="color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin:0">Programa de Captadores · DeseoComer</p>
  </div>

  <!-- BODY -->
  <div style="padding:32px">

    <p style="font-size:15px;color:#333;line-height:1.6;margin:0 0 12px">Hola <strong>${nombre}</strong>, bienvenida/o al equipo de captadores de DeseoComer.</p>
    <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px">Ya estás registrado en el programa. A partir de ahora puedes empezar a captar locales y ganar dinero.</p>

    <!-- CAJA CÓDIGO -->
    <div style="background:#faf6ee;border:1.5px solid #e8a84c;border-radius:12px;padding:20px;margin:0 0 16px;text-align:center">
      <p style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;font-weight:700">Tu código único</p>
      <p style="font-family:monospace;font-size:32px;font-weight:700;color:#c47f1a;margin:0 0 8px;letter-spacing:0.12em">${codigo}</p>
      <p style="font-size:13px;color:#777;margin:0 0 8px">Úsalo para acceder a tu panel personal en DeseoComer.</p>
      <p style="font-size:12px;color:#999;margin:0">🔐 Solo para acceder a tu panel — no lo necesitan los locales</p>
    </div>

    <!-- CAJA LINK -->
    <div style="background:#f0faf6;border:1.5px solid #3db89e;border-radius:12px;padding:20px;margin:0 0 28px;text-align:center">
      <p style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;font-weight:700">Tu link para locales</p>
      <p style="font-family:monospace;font-size:15px;font-weight:700;color:#2a7a6f;margin:0 0 8px;word-break:break-all">${link}</p>
      <p style="font-size:13px;color:#777;margin:0 0 8px">Este es el link que los locales usan para registrarse contigo. Está integrado en tu QR personal.</p>
      <p style="font-size:12px;color:#999;margin:0">📱 Ábrelo desde tu panel cuando visites un local</p>
    </div>

    <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px" />

    <!-- CÓMO ACCEDER -->
    <h2 style="font-size:13px;color:#c47f1a;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;font-weight:700">Cómo acceder a tu panel</h2>
    <table style="font-size:14px;color:#555;line-height:1.7;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 12px 6px 0;vertical-align:top;color:#c47f1a;font-weight:700;width:24px">1.</td><td style="padding:6px 0">Entra a <a href="https://deseocomer.com/captador" style="color:#c47f1a;font-weight:700;text-decoration:none">deseocomer.com/captador</a></td></tr>
      <tr><td style="padding:6px 12px 6px 0;vertical-align:top;color:#c47f1a;font-weight:700">2.</td><td style="padding:6px 0">Escribe tu código: <strong style="color:#333">${codigo}</strong></td></tr>
      <tr><td style="padding:6px 12px 6px 0;vertical-align:top;color:#c47f1a;font-weight:700">3.</td><td style="padding:6px 0">Haz click en "Acceder" — verás tus locales, ganancias y tu QR personal</td></tr>
      <tr><td style="padding:6px 12px 6px 0;vertical-align:top;color:#c47f1a;font-weight:700">4.</td><td style="padding:6px 0">Cuando visites un local, toca "Mostrar QR" y que el dueño lo escanee</td></tr>
    </table>

    <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />

    <!-- QUÉ DECIRLE -->
    <h2 style="font-size:13px;color:#c47f1a;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;font-weight:700">Qué decirle al local</h2>
    <div style="border-left:3px solid #e8a84c;padding:14px 16px;background:#faf7f2;border-radius:0 10px 10px 0;margin:0 0 24px">
      <p style="font-size:14px;color:#444;line-height:1.7;font-style:italic;margin:0">"Hola, soy de DeseoComer, una plataforma gastronómica nueva en Santiago donde la gente busca dónde comer. Registrar tu local es gratis y apareces en la plataforma de inmediato. Lo más potente es que puedes publicar concursos — tus clientes y personas nuevas invitan a sus amigos a ganar un premio, y tú consigues visibilidad con el nombre de tu local siendo visto por muchas personas nuevas sin pagar publicidad. Es gratis, toma 5 minutos, y mientras más temprano te registres mejor posicionado quedas porque recién estamos creciendo."</p>
    </div>

    <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px" />

    <!-- OBJECIONES -->
    <h2 style="font-size:13px;color:#c47f1a;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;font-weight:700">Si te ponen objeciones</h2>
    <table style="font-size:14px;color:#555;line-height:1.6;border-collapse:collapse;width:100%;margin:0 0 24px">
      <tr><td style="padding:6px 0 2px" colspan="2"><strong>Si te dicen "¿Cuánto cuesta?":</strong></td></tr>
      <tr><td style="padding:0 8px 10px 0;vertical-align:top;color:#c47f1a;width:16px">→</td><td style="padding:0 0 10px">"Es completamente gratis."</td></tr>
      <tr><td style="padding:6px 0 2px" colspan="2"><strong>Si te dicen "¿Para qué me sirve?":</strong></td></tr>
      <tr><td style="padding:0 8px 10px 0;vertical-align:top;color:#c47f1a">→</td><td style="padding:0 0 10px">"Para que más gente te encuentre cuando busca dónde comer en tu comuna."</td></tr>
      <tr><td style="padding:6px 0 2px" colspan="2"><strong>Si te dicen "No tengo tiempo":</strong></td></tr>
      <tr><td style="padding:0 8px 10px 0;vertical-align:top;color:#c47f1a">→</td><td style="padding:0 0 10px">"Te registro yo mismo ahora, solo necesito tu nombre, correo y teléfono. En 5 minutos listo."</td></tr>
      <tr><td style="padding:6px 0 2px" colspan="2"><strong>Si te dicen "Ya tengo Instagram":</strong></td></tr>
      <tr><td style="padding:0 8px 10px 0;vertical-align:top;color:#c47f1a">→</td><td style="padding:0 0 10px">"DeseoComer es diferente — acá la gente está buscando activamente dónde comer, no scrolleando. Es más directo para conseguir clientes nuevos."</td></tr>
      <tr><td style="padding:6px 0 2px" colspan="2"><strong>Si te dicen "¿Qué es un concurso?":</strong></td></tr>
      <tr><td style="padding:0 8px 0 0;vertical-align:top;color:#c47f1a">→</td><td style="padding:0">"Tú decides el premio — una porción, un menú, lo que quieras. La gente participa e invita amigos. Te genera visibilidad gratis sin invertir nada."</td></tr>
    </table>

    <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px" />

    <!-- LO QUE GANAS -->
    <h2 style="font-size:13px;color:#c47f1a;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;font-weight:700">Lo que ganas</h2>
    <table style="font-size:14px;color:#555;line-height:1.7;border-collapse:collapse;width:100%">
      <tr><td style="padding:6px 8px 6px 0;vertical-align:top;width:24px">💰</td><td style="padding:6px 0"><strong>$10.000</strong> por cada local registrado y activado</td></tr>
      <tr><td style="padding:6px 8px 6px 0;vertical-align:top">🏆</td><td style="padding:6px 0"><strong>$5.000</strong> extra si el local publica su primer concurso</td></tr>
      <tr><td style="padding:6px 8px 6px 0;vertical-align:top">📅</td><td style="padding:6px 0">Pagos quincenales via transferencia bancaria</td></tr>
    </table>

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0 16px">
      <a href="https://deseocomer.com/captador" style="background:#e8a84c;color:#0a0812;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;font-size:14px;letter-spacing:0.04em">Acceder a mi panel →</a>
    </div>

    <p style="font-size:13px;color:#888;text-align:center;line-height:1.5;margin:0 0 8px">Cualquier duda escríbenos en <a href="https://deseocomer.com/contacto" style="color:#c47f1a;text-decoration:none">deseocomer.com/contacto</a></p>
  </div>

  <!-- FOOTER -->
  <div style="background:#f9f7f4;border-top:1px solid #eee;padding:20px 32px;text-align:center">
    <p style="font-size:11px;color:#bbb;margin:0 0 6px">Recibiste este correo porque fuiste registrado como captador de DeseoComer.</p>
    <p style="font-size:12px;color:#aaa;margin:0">🧞 El equipo de DeseoComer</p>
  </div>

</div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Email bienvenida-captador]", error);
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
