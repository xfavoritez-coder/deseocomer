export function primerParticipanteHtml({ nombreLocal, premioConcurso, nombreParticipante }: { nombreLocal: string; premioConcurso: string; nombreParticipante: string }) {
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
      <p style="font-size:40px;margin:0 0 12px">🎉</p>
      <h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:8px;line-height:1.3">¡Tu concurso tiene su primer participante!</h2>
      <p style="color:#8a7040;font-size:14px;margin:0;font-style:italic">La magia ha comenzado</p>
    </div>

    <div style="background-color:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.15);border-radius:12px;padding:20px;margin-bottom:24px">
      <p style="color:#c0a060;font-size:15px;line-height:1.7;margin:0 0 12px">
        <strong style="color:#e8a84c">${nombreLocal}</strong>, alguien acaba de unirse a tu concurso
        <strong style="color:#f5d080">&ldquo;${premioConcurso}&rdquo;</strong>.
      </p>
      <p style="color:#8a7040;font-size:14px;margin:0">
        Primer participante: <strong style="color:#c0a060">${nombreParticipante}</strong>
      </p>
    </div>

    <p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">
      Esto es solo el comienzo. A medida que los participantes compartan su link,
      tu concurso llegará a más personas y tu local ganará visibilidad en toda la plataforma.
    </p>

    <p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:28px">
      Cada participante es un nuevo cliente potencial que conoce tu local.
      El Genio ya está trabajando para ti.
    </p>

    <div style="text-align:center;margin-bottom:8px">
      <a href="https://deseocomer.com/panel/concursos" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver mi concurso →</a>
    </div>
  </div>

  <div style="background-color:rgba(61,184,158,0.08);border:1px solid rgba(61,184,158,0.15);border-radius:12px;padding:16px 20px;margin-top:16px">
    <p style="color:#3db89e;font-size:13px;line-height:1.6;margin:0;text-align:center">
      💡 <strong>Tip:</strong> Comparte el concurso en tus redes sociales para atraer más participantes y hacer crecer tu comunidad.
    </p>
  </div>

  <div style="text-align:center;margin-top:32px">
    <p style="color:#5a4028;font-size:12px;line-height:1.6">Hecho con ❤️ y mucha hambre · DeseoComer.com<br/>Santiago de Chile</p>
  </div>

</div>
</body></html>`;
}
