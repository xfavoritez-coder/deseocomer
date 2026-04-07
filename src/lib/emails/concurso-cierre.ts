import { resend } from "@/lib/resend";

const FROM = () =>
  process.env.FROM_EMAIL
    ? `DeseoComer <${process.env.FROM_EMAIL}>`
    : "DeseoComer <onboarding@resend.dev>";

// ─── HTML email builder ─────────────────────────────────────────────────────

function wrap(content: string, accentBorder = "rgba(232,168,76,0.25)") {
  return `<html><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>
<div style="background-color:#2d1a08;border-radius:20px;border:1px solid ${accentBorder};padding:40px 32px">${content}</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`;
}

const h2 = (t: string, c = "#e8a84c") => `<h2 style="color:${c};font-size:22px;margin-top:0;margin-bottom:16px">${t}</h2>`;
const p = (t: string) => `<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">${t}</p>`;
const strong = (t: string) => `<p style="color:#f5d080;font-size:18px;font-weight:bold;margin-bottom:16px;text-align:center;letter-spacing:0.1em">${t}</p>`;
const divider = () => `<hr style="border:none;border-top:1px solid rgba(232,168,76,0.15);margin:20px 0"/>`;
const btn = (href: string, label: string, bg = "#e8a84c") => `<div style="text-align:center;margin-bottom:16px"><a href="${href}" style="background-color:${bg};color:${bg === "#e8a84c" ? "#1a0e05" : "#fff"};font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">${label}</a></div>`;
const section = (title: string, content: string) => `<p style="color:#c0a060;font-size:14px;line-height:1.7;margin:0 0 4px"><strong style="color:#e8a84c">${title}: </strong>${content}</p>`;
const sectionTitle = (t: string) => `<p style="color:#e8a84c;font-size:14px;font-weight:bold;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.1em">${t}</p>`;

// ─── Types ──────────────────────────────────────────────────────────────────

interface ConcursoEmailData {
  concursoId: string;
  titulo: string;
  premio: string;
  codigoEntrega: string;
  local: {
    nombre: string;
    direccion?: string | null;
    comuna?: string | null;
    telefono?: string | null;
  };
}

interface GanadorData {
  nombre: string;
  email: string;
  telefono?: string | null;
}

// ─── 1. Email al ganador ────────────────────────────────────────────────────

export async function emailGanador(
  data: ConcursoEmailData,
  ganador: GanadorData,
  confirmUrl: string,
  disputaUrl: string,
) {
  const fechaExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

  await resend.emails.send({
    from: FROM(),
    to: ganador.email,
    subject: `🏆 ¡Ganaste ${data.premio} en ${data.local.nombre}!`,
    html: wrap([
      h2("🏆 ¡Felicitaciones, ganaste!"),
      p(`Hola ${ganador.nombre},`),
      p(`¡Eres el ganador del concurso "${data.titulo}" organizado por <strong style="color:#f5d080">${data.local.nombre}</strong>!`),
      strong(`PREMIO: ${data.premio}`),
      p("El local te enviará un email con la fecha y hora para que retires tu premio. Guarda este correo."),
      strong(`TU CÓDIGO DE VERIFICACIÓN: ${data.codigoEntrega}`),
      divider(),
      `<div style="margin-bottom:16px">${sectionTitle("DATOS DEL LOCAL")}${section("Local", data.local.nombre)}${data.local.direccion ? section("Dirección", `${data.local.direccion}${data.local.comuna ? `, ${data.local.comuna}` : ""}`) : ""}${data.local.telefono ? section("Teléfono", data.local.telefono) : ""}</div>`,
      p("Si necesitas contactar al local directamente, puedes llamar al teléfono de arriba."),
      divider(),
      `<div style="margin-bottom:16px">${sectionTitle("IMPORTANTE")}${p(`• Tienes hasta el <strong style="color:#f5d080">${fechaExp}</strong> para reclamar tu premio`)}${p("• Si no lo reclamas en ese plazo, el premio pasará al siguiente en el ranking")}${p("• Presenta tu código de verificación al retirar el premio")}</div>`,
      divider(),
      p("Cuando recibas tu premio:"),
      btn(confirmUrl, "Sí, recibí mi premio", "#3db89e"),
      btn(disputaUrl, "Tuve un problema", "#ff6b6b"),
      p("El equipo de DeseoComer 🧞"),
    ].join("")),
  });
}

// ─── 2. Email al local ──────────────────────────────────────────────────────

export async function emailLocal(
  data: ConcursoEmailData & { coordinarUrl?: string },
  localEmail: string,
  ganador: GanadorData,
) {
  const coordinarUrl = data.coordinarUrl || "https://deseocomer.com/panel/concursos";
  await resend.emails.send({
    from: FROM(),
    to: localEmail,
    subject: `🏆 Tu concurso terminó — Coordina la entrega del premio`,
    html: wrap([
      h2("🏆 Tu concurso ha finalizado"),
      p(`Hola ${data.local.nombre},`),
      p(`Tu concurso <strong style="color:#f5d080">"${data.titulo}"</strong> ha finalizado. El ganador es <strong style="color:#e8a84c">${ganador.nombre}</strong>.`),
      divider(),
      `<div style="margin-bottom:16px">${sectionTitle("GANADOR")}${section("Nombre", ganador.nombre)}${section("Email", ganador.email)}${ganador.telefono ? section("Teléfono", ganador.telefono) : ""}</div>`,
      divider(),
      `<div style="margin-bottom:16px">${sectionTitle("PRÓXIMO PASO")}${p("Haz click en el botón de abajo para indicar cuándo puede el ganador retirar su premio. Le enviaremos la fecha directamente por email.")}</div>`,
      btn(coordinarUrl, "Coordinar entrega del premio"),
      divider(),
      strong(`CÓDIGO DE VERIFICACIÓN: ${data.codigoEntrega}`),
      p("Cuando el ganador se presente, pídele este código para verificar su identidad."),
      p("El equipo de DeseoComer 🧞"),
    ].join("")),
  });
}

// ─── 3. Email código de acreditación (48h sin contacto) ─────────────────────

export async function emailAcreditacion(
  data: ConcursoEmailData,
  ganador: GanadorData,
) {
  const fechaExp = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

  await resend.emails.send({
    from: FROM(),
    to: ganador.email,
    subject: `Recordatorio: tu premio en ${data.local.nombre} te espera`,
    html: wrap([
      h2("Tu premio te espera"),
      p(`Hola ${ganador.nombre},`),
      p(`Han pasado 48 horas desde que ganaste. Contacta al local para coordinar el retiro de tu premio.`),
      strong(`TU CÓDIGO: ${data.codigoEntrega}`),
      divider(),
      `<div style="margin-bottom:16px">${sectionTitle("CONTACTA AL LOCAL")}${section("Local", data.local.nombre)}${data.local.direccion ? section("Dirección", `${data.local.direccion}${data.local.comuna ? `, ${data.local.comuna}` : ""}`) : ""}${data.local.telefono ? section("Teléfono", data.local.telefono) : ""}</div>`,
      p(`Puedes llamar al local al teléfono indicado para coordinar la entrega.`),
      p(`Recuerda que tienes hasta el <strong style="color:#f5d080">${fechaExp}</strong> para reclamar tu premio.`),
      p("El equipo de DeseoComer 🧞"),
    ].join("")),
  });
}

// ─── 4. Email nuevo ganador (2° o 3° lugar) ────────────────────────────────

export async function emailNuevoGanador(
  data: ConcursoEmailData,
  ganador: GanadorData,
  orden: number,
  diasParaReclamar: number,
  confirmUrl: string,
  disputaUrl: string,
) {
  await resend.emails.send({
    from: FROM(),
    to: ganador.email,
    subject: `🎉 ¡El premio es tuyo! Quedaste en ${orden}° lugar`,
    html: wrap([
      h2("🎉 ¡El premio es tuyo!"),
      p(`Hola ${ganador.nombre},`),
      p("¡Buenas noticias! El ganador original no reclamó su premio y ahora el premio es tuyo."),
      p(`Quedaste en ${orden}° lugar del concurso "${data.titulo}".`),
      strong(`PREMIO: ${data.premio}`),
      p(`Tienes ${diasParaReclamar} días para reclamarlo.`),
      strong(`TU CÓDIGO: ${data.codigoEntrega}`),
      divider(),
      `<div style="margin-bottom:16px">${sectionTitle("DATOS DEL LOCAL")}${section("Nombre", data.local.nombre)}${data.local.direccion ? section("Dirección", data.local.direccion) : ""}${data.local.comuna ? section("Comuna", data.local.comuna) : ""}${data.local.telefono ? section("Teléfono", data.local.telefono) : ""}</div>`,
      divider(),
      p("¿Recibiste tu premio?"),
      btn(confirmUrl, "Sí, recibí mi premio", "#3db89e"),
      btn(disputaUrl, "No lo recibí", "#ff6b6b"),
      p("El equipo de DeseoComer 🧞"),
    ].join("")),
  });
}

// ─── 5. Email confirmación recibido ─────────────────────────────────────────

export async function emailConfirmacion(ganador: GanadorData) {
  await resend.emails.send({
    from: FROM(),
    to: ganador.email,
    subject: "¡Gracias por confirmar! Premio entregado en DeseoComer",
    html: wrap([
      h2("🎉 ¡Premio confirmado!"),
      p(`Hola ${ganador.nombre},`),
      p("Gracias por confirmar que recibiste tu premio. ¡Que lo disfrutes!"),
      p("Aparecerás en nuestra página de ganadores."),
      btn("https://deseocomer.com/concursos/ganadores", "Ver ganadores"),
      p("El equipo de DeseoComer 🧞"),
    ].join("")),
  });
}

// ─── 6. Email disputa ───────────────────────────────────────────────────────

export async function emailDisputa(ganador: GanadorData) {
  await resend.emails.send({
    from: FROM(),
    to: ganador.email,
    subject: "Abrimos una investigación por tu premio",
    html: wrap([
      h2("Investigación en curso"),
      p(`Hola ${ganador.nombre},`),
      p("Recibimos tu reporte. Investigaremos el caso con el local en las próximas 48 horas."),
      p("Te mantendremos informado."),
      p("El equipo de DeseoComer 🧞"),
    ].join(""), "rgba(255,80,80,0.25)"),
  });
}

// ─── 7. Email expiración ────────────────────────────────────────────────────

export async function emailExpiracion(
  ganador: GanadorData,
  premio: string,
) {
  await resend.emails.send({
    from: FROM(),
    to: ganador.email,
    subject: "Tu premio en DeseoComer expiró",
    html: wrap([
      h2("Premio expirado"),
      p(`Hola ${ganador.nombre},`),
      p(`Lamentablemente el plazo para reclamar tu premio "${premio}" expiró sin que lo confirmaras.`),
      p("Participa en nuestros próximos concursos:"),
      btn("https://deseocomer.com/concursos", "Ver concursos activos"),
      p("El equipo de DeseoComer 🧞"),
    ].join(""), "rgba(255,255,255,0.15)"),
  });
}

// ─── 8. Email disputa al admin ──────────────────────────────────────────────

export async function emailDisputaAdmin(
  data: ConcursoEmailData,
  ganador: GanadorData,
) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || "favoritez@gmail.com";
  await resend.emails.send({
    from: FROM(),
    to: adminEmail,
    subject: `⚠️ DISPUTA: ${ganador.nombre} reporta no recibir premio en ${data.local.nombre}`,
    html: wrap([
      h2("⚠️ Disputa de premio", "#ff6b6b"),
      p(`El ganador ${ganador.nombre} (${ganador.email}) reporta NO haber recibido su premio.`),
      section("Concurso", data.titulo),
      section("Premio", data.premio),
      section("Local", data.local.nombre),
      section("Código", data.codigoEntrega),
      btn("https://deseocomer.com/admin/concursos", "Ir al admin"),
    ].join(""), "rgba(255,80,80,0.4)"),
  });
}
