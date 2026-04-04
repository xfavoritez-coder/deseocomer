export function buildEmailHtml({ nombre, cuposRestantes, trackClickUrl, trackOpenUrl, email }: {
  nombre?: string | null;
  cuposRestantes: number;
  trackClickUrl: string;
  trackOpenUrl: string;
  email: string;
}): string {
  const saludo = nombre ? `Hola ${nombre.split(" ")[0]},` : "Hola,";
  const desuscribirUrl = `https://deseocomer.com/desuscribir?email=${encodeURIComponent(email)}`;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="background:#f0ece4;font-family:Georgia,serif;margin:0;padding:24px 16px">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">

<div style="background:linear-gradient(135deg,#1a0e05,#2d1a08);padding:36px 32px;text-align:center">
  <p style="font-size:40px;margin:0 0 10px">🧞</p>
  <p style="font-size:13px;font-weight:700;color:#e8a84c;letter-spacing:0.25em;text-transform:uppercase;margin:0 0 20px">DeseoComer</p>
  <h1 style="font-size:26px;font-weight:700;color:#f5d080;line-height:1.3;margin:0 0 8px">Tu local podría estar<br>ganando visibilidad gratis</h1>
  <p style="font-size:14px;color:rgba(240,220,160,0.6);margin:0 0 16px">La nueva plataforma gastronómica de Santiago</p>
  ${cuposRestantes > 0 ? `<div style="background:rgba(232,168,76,0.15);border:1px solid rgba(232,168,76,0.4);border-radius:20px;padding:6px 16px;display:inline-block"><span style="font-size:12px;font-weight:700;color:#e8a84c;letter-spacing:0.06em;text-transform:uppercase">⚡ Solo quedan ${cuposRestantes} cupos de fundador</span></div>` : ""}
</div>

<div style="padding:36px">
  <p style="font-size:16px;color:#2a1a00;line-height:1.6;margin:0 0 24px">${saludo}<br><br>Lanzamos <strong>DeseoComer</strong>, la nueva plataforma gastronómica de Santiago. Queremos que tu local sea parte desde el primer día.</p>

  <div style="margin-bottom:24px">
    <div style="display:flex;gap:14px;padding:16px;background:#faf6ee;border-radius:12px;border-left:3px solid #e8a84c;margin-bottom:12px">
      <span style="font-size:22px;flex-shrink:0">🏆</span>
      <div><p style="font-size:14px;font-weight:700;color:#2a1a00;margin:0 0 4px">Concursos virales gratis</p><p style="font-size:13px;color:#8a6030;line-height:1.5;margin:0">Publica un concurso y tus clientes invitan a sus amigos a ganar un premio. Tu local se hace conocido sin pagar publicidad.</p></div>
    </div>
    <div style="display:flex;gap:14px;padding:16px;background:#faf6ee;border-radius:12px;border-left:3px solid #e8a84c;margin-bottom:12px">
      <span style="font-size:22px;flex-shrink:0">⚡</span>
      <div><p style="font-size:14px;font-weight:700;color:#2a1a00;margin:0 0 4px">Promociones visibles</p><p style="font-size:13px;color:#8a6030;line-height:1.5;margin:0">Publica tus ofertas y descuentos. Aparecen cuando alguien busca dónde comer en tu comuna.</p></div>
    </div>
    <div style="display:flex;gap:14px;padding:16px;background:#faf6ee;border-radius:12px;border-left:3px solid #e8a84c">
      <span style="font-size:22px;flex-shrink:0">🗺️</span>
      <div><p style="font-size:14px;font-weight:700;color:#2a1a00;margin:0 0 4px">Apareces en búsquedas</p><p style="font-size:13px;color:#8a6030;line-height:1.5;margin:0">Cuando alguien busca qué comer cerca, tu local aparece con tu categoría, horarios y lo que ofreces.</p></div>
    </div>
  </div>

  ${cuposRestantes > 0 ? `<div style="background:linear-gradient(135deg,#1a0e05,#2d1a08);border-radius:14px;padding:24px;margin-bottom:24px;text-align:center;border:1px solid rgba(232,168,76,0.3)">
    <p style="font-size:10px;font-weight:700;color:#3db89e;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 10px">🎖️ Oferta de fundadores</p>
    <h2 style="font-size:20px;font-weight:700;color:#f5d080;margin:0 0 12px;line-height:1.3">1 año gratis para<br>los primeros 50 locales</h2>
    <p style="font-size:13px;color:rgba(240,220,160,0.6);line-height:1.6;margin:0 0 16px">Estamos en lanzamiento. Los primeros 50 locales acceden a <strong style="color:#f5d080">todas las funciones gratis durante 1 año</strong>. Avisaremos con anticipación antes de cobrar. Registrarse y aparecer siempre será gratis.</p>
    <div style="background:rgba(232,168,76,0.1);border:1px solid rgba(232,168,76,0.25);border-radius:20px;padding:8px 20px;display:inline-block">
      <span style="font-size:18px;font-weight:700;color:#e8a84c">${cuposRestantes}</span>
      <span style="font-size:12px;color:rgba(240,220,160,0.5);margin-left:6px">cupos restantes de 50</span>
    </div>
  </div>` : ""}

  <div style="margin-bottom:28px">
    ${["Registro gratis sin tarjeta de crédito", "Apareces en la plataforma de inmediato", "Concursos y promociones sin costo durante 1 año", "Mientras más temprano entres, mejor posicionado quedas"].map(t => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f0e8"><span style="color:#3db89e;font-weight:700;font-size:14px;flex-shrink:0">✓</span><span style="font-size:13px;color:#5a4010">${t}</span></div>`).join("")}
  </div>

  <div style="text-align:center;margin-bottom:24px">
    <a href="${trackClickUrl}" style="display:inline-block;padding:16px 40px;background:#e8a84c;border-radius:12px;font-size:15px;font-weight:700;color:#0a0812;text-decoration:none;letter-spacing:0.06em;text-transform:uppercase">Registrar mi local gratis →</a>
    ${cuposRestantes > 0 ? `<p style="font-size:12px;color:#a08040;margin-top:10px;line-height:1.5">Solo quedan ${cuposRestantes} cupos con acceso gratuito por 1 año. Sin compromisos.</p>` : ""}
  </div>
</div>

<div style="background:#faf6ee;padding:20px 36px;border-top:1px solid #f0e8d0;text-align:center">
  <p style="font-size:13px;font-weight:700;color:#c47f1a;margin:0 0 6px">🧞 El equipo de DeseoComer</p>
  <p style="font-size:11px;color:#a08040;line-height:1.6;margin:0">deseocomer.com · Santiago, Chile<br><a href="${desuscribirUrl}" style="color:#c47f1a">Desuscribirse</a></p>
</div>

<img src="${trackOpenUrl}" width="1" height="1" style="display:none;visibility:hidden" />
</div></body></html>`;
}
