export function ultimoRecordatorioHtml({
  nombre,
  concursosActivos,
  referidorNombre,
  tokenVerificacion,
}: {
  nombre: string;
  concursosActivos: number;
  referidorNombre: string | null;
  tokenVerificacion: string;
}) {
  const primerNombre = nombre.split(/\s+/)[0];
  const BASE_URL = "https://deseocomer.com";
  const activarUrl = `${BASE_URL}/verificar-email?token=${tokenVerificacion}`;

  const mensajeReferido = referidorNombre
    ? `<p style="color:#c0a060;font-size:15px;line-height:1.7;margin-bottom:20px">
        <strong style="color:#e8a84c">${referidorNombre}</strong> todavía espera que actives tu cuenta para recibir sus puntos. No lo dejes esperando.
      </p>`
    : "";

  const concursosTexto = concursosActivos > 0
    ? `<p style="color:#c0a060;font-size:15px;line-height:1.7;margin-bottom:24px">
        Hay <strong style="color:#e8a84c">${concursosActivos} concurso${concursosActivos > 1 ? "s" : ""}</strong> con premios de comida gratis que se cierran pronto. Sin tu cuenta activa, no puedes participar en ninguno.
      </p>`
    : `<p style="color:#c0a060;font-size:15px;line-height:1.7;margin-bottom:24px">
        Pronto lanzaremos nuevos concursos con premios de comida gratis. Activa tu cuenta para estar listo.
      </p>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">

  <div style="text-align:center;margin-bottom:32px">
    <p style="font-size:28px;margin:0 0 8px">🧞</p>
    <h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1>
  </div>

  <div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
    <div style="text-align:center;margin-bottom:24px">
      <p style="font-size:40px;margin:0 0 12px">😢</p>
      <h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:8px;line-height:1.3">${primerNombre}, este es nuestro último recordatorio</h2>
      <p style="color:#8a7040;font-size:14px;margin:0;font-style:italic">No te enviaremos más emails sobre esto</p>
    </div>

    <p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:20px">
      Tu cuenta en DeseoComer lleva una semana sin activar. Sabemos que la vida es ocupada, pero no queremos que te pierdas lo que hay para ti.
    </p>

    ${mensajeReferido}

    ${concursosTexto}

    <div style="background-color:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.15);border-radius:12px;padding:18px 20px;margin-bottom:24px">
      <p style="color:#c0a060;font-size:14px;line-height:1.6;margin:0;text-align:center">
        Activar toma <strong style="color:#e8a84c">literalmente 1 clic</strong>. Después de eso, puedes participar en cualquier concurso, guardar locales favoritos y recibir promociones.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:16px">
      <a href="${activarUrl}" style="background-color:#e8a84c;color:#1a0e05;font-size:15px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:18px 48px;border-radius:12px;display:inline-block">Activar mi cuenta →</a>
    </div>

    <p style="color:#5a4028;font-size:13px;line-height:1.6;text-align:center;margin-bottom:0">
      Si el link no funciona, al hacer clic te enviaremos uno nuevo.
    </p>
  </div>

  <div style="text-align:center;margin-top:32px">
    <p style="color:#5a4028;font-size:12px;line-height:1.6">Si no creaste esta cuenta, ignora este mensaje.<br/>Hecho con 💛 y mucha hambre · DeseoComer.com</p>
  </div>

</div>
</body></html>`;
}
