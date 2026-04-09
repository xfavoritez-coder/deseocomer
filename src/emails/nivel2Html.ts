export function nivel2Html({
  nombre,
  referidoDirectoNombre,
  premioConcurso,
  concursoSlug,
}: {
  nombre: string;
  referidoDirectoNombre: string;
  premioConcurso: string;
  concursoSlug: string;
}) {
  const primerNombre = nombre.split(/\s+/)[0];
  const concursoUrl = `https://deseocomer.com/concursos/${concursoSlug}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">

  <div style="text-align:center;margin-bottom:32px">
    <p style="font-size:28px;margin:0 0 8px">🧞</p>
    <h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1>
  </div>

  <div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">

    <h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px;text-align:center">¡Tu red está creciendo, ${primerNombre}!</h2>

    <p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:20px;text-align:center">
      <strong style="color:#f5d080">${referidoDirectoNombre}</strong> (a quien tú invitaste) trajo a alguien nuevo al concurso <strong style="color:#f5d080">"${premioConcurso}"</strong> — y eso te sumó <strong style="color:#e8a84c">+2 puntos</strong> automáticamente.
    </p>

    <div style="background-color:rgba(232,168,76,0.06);border:1px solid rgba(232,168,76,0.15);border-radius:14px;padding:20px 16px;margin-bottom:24px">
      <p style="color:#c0a060;font-size:13px;text-transform:uppercase;letter-spacing:0.12em;text-align:center;margin:0 0 14px;font-weight:bold">Así funciona tu red</p>
      <table style="width:100%;border-collapse:collapse" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align:center;padding:8px 4px">
            <div style="width:44px;height:44px;border-radius:50%;background:rgba(232,168,76,0.12);border:1px solid rgba(232,168,76,0.3);margin:0 auto 6px;line-height:44px;font-size:18px">👤</div>
            <p style="color:#f5d080;font-size:12px;margin:0;font-weight:bold">Tú</p>
          </td>
          <td style="text-align:center;color:rgba(232,168,76,0.4);font-size:18px;padding-bottom:16px">→</td>
          <td style="text-align:center;padding:8px 4px">
            <div style="width:44px;height:44px;border-radius:50%;background:rgba(61,184,158,0.1);border:1px solid rgba(61,184,158,0.25);margin:0 auto 6px;line-height:44px;font-size:18px">👤</div>
            <p style="color:#3db89e;font-size:12px;margin:0;font-weight:bold">${referidoDirectoNombre}</p>
          </td>
          <td style="text-align:center;color:rgba(232,168,76,0.4);font-size:18px;padding-bottom:16px">→</td>
          <td style="text-align:center;padding:8px 4px">
            <div style="width:44px;height:44px;border-radius:50%;background:rgba(128,64,208,0.1);border:1px solid rgba(128,64,208,0.2);margin:0 auto 6px;line-height:44px;font-size:18px">👤</div>
            <p style="color:#a070e0;font-size:12px;margin:0;font-weight:bold">Nuevo</p>
          </td>
        </tr>
      </table>
      <p style="color:#e8a84c;font-size:14px;text-align:center;margin:12px 0 0;font-weight:bold">= +2 puntos para ti 🎉</p>
    </div>

    <p style="color:#c0a060;font-size:15px;line-height:1.7;margin-bottom:24px;text-align:center">
      Cada persona que traigan tus referidos te da <strong style="color:#e8a84c">+2 puntos extra</strong> (máximo 20). Tu red trabaja para ti sin que hagas nada.
    </p>

    <div style="text-align:center;margin-bottom:24px">
      <a href="${concursoUrl}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver mi posición →</a>
    </div>

    <p style="color:#5a4028;font-size:13px;line-height:1.6;text-align:center">Mientras más amigos invites, más grande tu red y más chances de ganar.</p>

  </div>

  <div style="text-align:center;margin-top:32px">
    <p style="color:#5a4028;font-size:12px">Hecho con 💛 · DeseoComer.com</p>
  </div>

</div>
</body>
</html>`;
}
