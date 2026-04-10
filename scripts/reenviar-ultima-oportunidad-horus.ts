import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});
const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.FROM_EMAIL
  ? `DeseoComer <${process.env.FROM_EMAIL}>`
  : "DeseoComer <onboarding@resend.dev>";
const BASE_URL = "https://deseocomer.com";

// Emails que YA recibieron el correo (no reenviar)
const YA_ENVIADOS = new Set([
  "enzoo.sb@gmail.com",
  "softcaat666@gmail.com",
  "k.torresf@live.com",
  "narki.ayun.newen@gmail.com",
  "daniela.varaslobe@gmail.com",
]);

async function main() {
  const concurso = await prisma.concurso.findFirst({
    where: { slug: "cena-para-4-personas-horus-vegan" },
    include: {
      local: { select: { nombre: true } },
      participantes: {
        where: { estado: { not: "descalificado" } },
        include: { usuario: { select: { id: true, nombre: true, email: true } } },
        orderBy: { puntos: "desc" },
      },
    },
  });

  if (!concurso) {
    console.log("Concurso no encontrado");
    return;
  }

  console.log(`Concurso: "${concurso.premio}" — ${concurso.participantes.length} participantes`);
  console.log(`Modalidad: ${concurso.modalidadConcurso}`);

  const faltantes = concurso.participantes.filter(
    (p) => !YA_ENVIADOS.has(p.usuario.email.toLowerCase())
  );

  console.log(`Ya enviados: ${YA_ENVIADOS.size}`);
  console.log(`Faltantes: ${faltantes.length}`);

  if (faltantes.length === 0) {
    console.log("No hay faltantes");
    return;
  }

  // Calcular total de boletos para el sorteo
  const totalBoletos = concurso.participantes.reduce(
    (acc, p) => acc + Math.max(1, p.puntos),
    0
  );

  const concursoUrl = `${BASE_URL}/concursos/${concurso.slug || concurso.id}`;

  const emails = faltantes.map((p) => {
    const boletos = Math.max(1, p.puntos);
    const pct = Math.round((boletos / totalBoletos) * 100);
    return {
      from: FROM,
      to: p.usuario.email,
      subject: `🎲 ¡Último día! El sorteo de "${concurso.premio}" cierra hoy`,
      html: `<html><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>
<div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">🎲 ¡El sorteo cierra hoy!</h2>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Hola ${p.usuario.nombre.split(" ")[0]},</p>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">El sorteo de <strong style="color:#f5d080">"${concurso.premio}"</strong> de <strong style="color:#e8a84c">${concurso.local.nombre}</strong> cierra en pocas horas.</p>
<div style="background-color:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.15);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
<p style="color:rgba(240,234,214,0.5);font-size:14px;margin:0 0 4px">Tus boletos actuales</p>
<p style="color:#e8a84c;font-size:28px;font-weight:bold;margin:0">${boletos} 🎟️</p>
<p style="color:rgba(240,234,214,0.5);font-size:14px;margin:4px 0 0">de ${totalBoletos} boletos en juego</p>
<p style="color:#3db89e;font-size:14px;font-weight:bold;margin:8px 0 0">${pct}% de chances de ganar</p>
</div>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:24px">¿Quieres más chances? Cada amigo que entre por tu link te da <strong style="color:#f5d080">+3 boletos</strong> extra — y a él también. Con solo 1 amigo pasas de ${boletos} a ${boletos + 3} boletos.</p>
<div style="text-align:center"><a href="${concursoUrl}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver sorteo →</a></div>
<p style="color:#5a4028;font-size:13px;line-height:1.6;text-align:center;margin-top:16px;margin-bottom:0">El ganador se elige al azar entre todos los boletos.<br/>Más boletos = más probabilidad de ganar.</p>
</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`,
    };
  });

  console.log("\nDestinatarios:");
  emails.forEach((e) => console.log(`  → ${e.to}`));

  // Enviar via batch API
  console.log(`\nEnviando ${emails.length} emails via batch...`);
  try {
    const result = await resend.batch.send(emails);
    console.log(`✅ Enviados: ${result.data?.data?.length ?? emails.length}`);
  } catch (err) {
    console.error("❌ Error:", err);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
