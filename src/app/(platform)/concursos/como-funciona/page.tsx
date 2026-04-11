import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getGanadoresReales() {
  try {
    const concursos = await prisma.concurso.findMany({
      where: {
        OR: [
          { estado: "completado" },
          { activo: false, fechaFin: { lt: new Date() } },
        ],
        cancelado: false,
      },
      include: {
        local: { select: { nombre: true, logoUrl: true } },
        ganadorActual: { select: { nombre: true } },
        participantes: { orderBy: { puntos: "desc" }, take: 1, select: { puntos: true } },
      },
      orderBy: { fechaFin: "desc" },
      take: 4,
    });
    return concursos.map(c => {
      const ganadorNombre = c.ganadorActual?.nombre ?? null;
      const nombre = ganadorNombre
        ? (() => { const parts = ganadorNombre.trim().split(/\s+/); return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0]; })()
        : "Por confirmar";
      return {
        premio: c.premio,
        local: c.local.nombre,
        imagenUrl: c.imagenUrl,
        ganador: { nombre, referidos: c.participantes[0]?.puntos ?? 0 },
      };
    });
  } catch { return []; }
}

export default async function ComoFuncionaPage() {
  const ganadores = await getGanadoresReales();
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section style={{ padding: "clamp(100px,12vw,140px) clamp(20px,5vw,60px) clamp(40px,6vw,80px)", textAlign: "center", position: "relative", borderBottom: "1px solid rgba(236,72,153,0.08)" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, rgba(236,72,153,0.1) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", maxWidth: "620px", margin: "0 auto" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.65rem,1.5vw,0.8rem)", letterSpacing: "0.4em", textTransform: "uppercase", color: "#ec4899", marginBottom: "16px" }}>Concursos DeseoComer</p>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(2.2rem,6vw,3.8rem)", fontWeight: 900, color: "#f5d080", lineHeight: 1.15, marginBottom: "20px", textShadow: "0 0 60px rgba(236,72,153,0.25)" }}>
            Entra gratis.<br />Gana comida. 🎲
          </h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(1rem,2vw,1.15rem)", color: "rgba(240,234,214,0.65)", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto 36px" }}>
            Los restaurantes sortean premios reales. Solo entra, invita amigos y cada uno es un boleto extra en la bolsa.
          </p>
          <Link href="/concursos" style={{ display: "inline-block", background: "linear-gradient(135deg, #ec4899, #be185d)", color: "#fff", fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem,1.5vw,0.85rem)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 36px", borderRadius: "30px", textDecoration: "none" }}>
            Ver concursos activos →
          </Link>
        </div>
      </section>

      {/* Body */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(20px,5vw,60px)" }}>

        {/* ── SECCIÓN 1: Pasos ── */}
        <section style={{ marginBottom: "clamp(56px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>En 4 pasos</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "clamp(32px,5vw,56px)", lineHeight: 1.3 }}>¿Cómo funciona?</h2>

          <div className="cf-pasos">
            {[
              { num: "1", title: "Crea tu cuenta", desc: "Es gratis. Sin tarjeta, sin letra chica, sin compromiso." },
              { num: "2", title: "Elige un concurso", desc: "Cada restaurante ofrece un premio distinto. Entra al que quieras." },
              { num: "3", title: "Invita amigos", desc: "Comparte tu link por WhatsApp o redes. Cada amigo que entre te suma boletos." },
              { num: "🎲", title: "Se sortea el ganador", desc: "Al cierre, el sistema saca un boleto al azar. Mientras mas tengas, mas chances." },
            ].map((paso, i) => (
              <div key={i} className="cf-paso-item">
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: i === 3 ? "rgba(236,72,153,0.18)" : "rgba(236,72,153,0.06)", border: i === 3 ? "1px solid rgba(236,72,153,0.5)" : "1px solid rgba(236,72,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel)", fontSize: i === 3 ? "1.2rem" : "1rem", fontWeight: 700, color: i === 3 ? "#ec4899" : "#f5d080", margin: "0 auto 14px", flexShrink: 0 }}>
                  {paso.num}
                </div>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.85rem,1.5vw,0.95rem)", fontWeight: 700, color: "#f0ead6", marginBottom: "8px", textAlign: "center" }}>{paso.title}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", color: "rgba(240,234,214,0.5)", lineHeight: 1.65, textAlign: "center" }}>{paso.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECCIÓN 2: La bolsa de boletos (ejemplo visual) ── */}
        <section style={{ marginBottom: "clamp(56px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>Entendiendo el sorteo</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "12px", lineHeight: 1.3 }}>La bolsa de boletos</h2>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem,1.5vw,1rem)", color: "rgba(240,234,214,0.45)", textAlign: "center", marginBottom: "clamp(28px,4vw,48px)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto clamp(28px,4vw,48px)" }}>Imagina una bolsa con boletos de papel. Cada uno tiene el nombre de un participante. El sistema mete la mano y saca uno.</p>

          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ background: "rgba(236,72,153,0.04)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 20, padding: "clamp(20px,4vw,32px) clamp(16px,3vw,28px)" }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#ec4899", textAlign: "center", marginBottom: 20 }}>Ejemplo: sorteo con 3 participantes</p>

              {/* Participantes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
                {[
                  { nombre: "Ana", boletos: 10, detalle: "invito a 3 amigos nuevos", color: "#ec4899", emoji: "👩" },
                  { nombre: "Pedro", boletos: 4, detalle: "invito a 1 amigo", color: "#e8a84c", emoji: "👨" },
                  { nombre: "Luis", boletos: 1, detalle: "solo entro al sorteo", color: "#3db89e", emoji: "🧑" },
                ].map(p => (
                  <div key={p.nombre} style={{ background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{p.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.88rem", color: "#f0ead6" }}>{p.nombre}</span>
                        <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)", marginLeft: 8 }}>{p.detalle}</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.1rem", fontWeight: 900, color: p.color }}>{p.boletos}</span>
                      <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.35)" }}>boletos</span>
                    </div>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {Array.from({ length: p.boletos }).map((_, i) => (
                        <div key={i} style={{ width: 24, height: 15, borderRadius: 3, background: `color-mix(in srgb, ${p.color} 50%, transparent)`, border: `1px solid color-mix(in srgb, ${p.color} 70%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 8, opacity: 0.7 }}>🎟</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Flecha + bolsa */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.45)", marginBottom: 10 }}>Todos los boletos van a la misma bolsa</p>
                <div style={{ display: "inline-block", fontSize: 20, color: "rgba(236,72,153,0.4)", marginBottom: 8 }}>↓</div>
                <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 160, height: 110, borderRadius: "0 0 50% 50% / 0 0 40% 40%", background: "rgba(236,72,153,0.06)", border: "2px solid rgba(236,72,153,0.25)", borderTop: "2px dashed rgba(236,72,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, flexWrap: "wrap", padding: "16px 14px 10px", position: "relative", overflow: "hidden" }}>
                    {Array.from({ length: 6 }).map((_, i) => <div key={`a${i}`} style={{ width: 13, height: 9, borderRadius: 2, background: "rgba(236,72,153,0.45)", transform: `rotate(${-25 + i * 14}deg)` }} />)}
                    {Array.from({ length: 3 }).map((_, i) => <div key={`b${i}`} style={{ width: 13, height: 9, borderRadius: 2, background: "rgba(232,168,76,0.45)", transform: `rotate(${5 + i * 22}deg)` }} />)}
                    <div style={{ width: 13, height: 9, borderRadius: 2, background: "rgba(61,184,158,0.45)", transform: "rotate(8deg)" }} />
                  </div>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", color: "rgba(240,234,214,0.5)", marginTop: 10 }}>15 boletos en total</p>
                </div>
              </div>

              {/* Chances */}
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(240,234,214,0.35)", textAlign: "center", marginBottom: 12 }}>Probabilidad de ganar</p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
                {[
                  { nombre: "Ana", pct: "67%", emoji: "👩", color: "#ec4899" },
                  { nombre: "Pedro", pct: "27%", emoji: "👨", color: "#e8a84c" },
                  { nombre: "Luis", pct: "6%", emoji: "🧑", color: "#3db89e" },
                ].map(p => (
                  <div key={p.nombre} style={{ background: `color-mix(in srgb, ${p.color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${p.color} 30%, transparent)`, borderRadius: 12, padding: "14px 20px", textAlign: "center", flex: "1 1 0", minWidth: 90 }}>
                    <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{p.emoji}</span>
                    <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.5rem", fontWeight: 900, color: p.color, margin: "0 0 2px" }}>{p.pct}</p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.5)", margin: 0 }}>{p.nombre}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "14px 18px", textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: "rgba(240,234,214,0.6)", lineHeight: 1.7, margin: 0 }}>Ana tiene <strong style={{ color: "#ec4899" }}>10 de 15</strong> boletos: la mayor probabilidad. Pero Luis, con <strong style={{ color: "#3db89e" }}>solo 1 boleto</strong>, tambien puede ganar. Es menos probable, pero posible.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 3: Cómo sumar boletos ── */}
        <section style={{ marginBottom: "clamp(56px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>Tus boletos</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "12px", lineHeight: 1.3 }}>¿Cómo sumo boletos?</h2>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem,1.5vw,1rem)", color: "rgba(240,234,214,0.45)", textAlign: "center", marginBottom: "clamp(28px,4vw,48px)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto clamp(28px,4vw,48px)" }}>Cada boleto es una oportunidad mas en el sorteo. Asi los consigues:</p>

          <div className="cf-boletos">
            {[
              { icon: "🎟️", boletos: "1", color: "#3db89e", label: "Tu primer boleto", desc: "Al entrar al concurso recibes 1 boleto gratis" },
              { icon: "🆕", boletos: "+3", color: "#ec4899", label: "Amigo nuevo en DC", desc: "Invitas a alguien que no tiene cuenta y se registra por tu link" },
              { icon: "👥", boletos: "+2", color: "#e8a84c", label: "Amigo ya registrado", desc: "Invitas a alguien que ya tiene cuenta en DeseoComer" },
              { icon: "🔗", boletos: "+2", color: "#a78bfa", label: "Referido de nivel 2", desc: "Tu amigo invita a otro — tu tambien ganas boletos" },
            ].map((b, i) => (
              <div key={i} style={{ background: i === 1 ? "rgba(236,72,153,0.06)" : "rgba(255,255,255,0.03)", border: i === 1 ? "1px solid rgba(236,72,153,0.25)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "clamp(18px,3vw,28px) clamp(14px,2vw,20px)", textAlign: "center" }}>
                <div style={{ fontSize: "clamp(1.5rem,3vw,2rem)", marginBottom: 10 }}>{b.icon}</div>
                <div style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.8rem,3.5vw,2.4rem)", fontWeight: 900, color: b.color, marginBottom: 8, lineHeight: 1 }}>{b.boletos}</div>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", fontWeight: 700, color: "#f0ead6", marginBottom: 6 }}>{b.label}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(240,234,214,0.45)", lineHeight: 1.5 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECCIÓN 4: El poder de tu red ── */}
        <section style={{ marginBottom: "clamp(56px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>Nivel 2</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "12px", lineHeight: 1.3 }}>El poder de tu red</h2>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem,1.5vw,1rem)", color: "rgba(240,234,214,0.45)", textAlign: "center", marginBottom: "clamp(28px,4vw,48px)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto clamp(28px,4vw,48px)" }}>Cuando invitas a alguien y esa persona tambien invita a otros, tu ganas boletos por cada uno que traigan. Tu red trabaja para ti.</p>

          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            {/* Diagrama visual de red */}
            <div style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 20, padding: "clamp(20px,4vw,32px) clamp(16px,3vw,28px)", marginBottom: 20 }}>
              <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#a78bfa", textAlign: "center", marginBottom: 20 }}>Ejemplo: tu red de invitados</p>

              {/* Nivel 1: Tú */}
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: 12, padding: "10px 20px" }}>
                  <span style={{ fontSize: 22 }}>🫵</span>
                  <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "#ec4899", fontWeight: 700 }}>Tu</span>
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: 16, color: "rgba(167,139,250,0.4)", marginBottom: 6 }}>↓ invitas a</div>

              {/* Nivel 2: Tus invitados */}
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                {[
                  { nombre: "Maria", tipo: "nueva", pts: "+3" },
                  { nombre: "Pedro", tipo: "ya registrado", pts: "+2" },
                ].map(a => (
                  <div key={a.nombre} style={{ background: "rgba(232,168,76,0.08)", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "#e8a84c", margin: "0 0 2px" }}>{a.nombre}</p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "rgba(240,234,214,0.35)", margin: 0 }}>{a.tipo}</p>
                    <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.95rem", fontWeight: 900, color: "#3db89e", margin: "4px 0 0" }}>{a.pts} para ti</p>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", fontSize: 16, color: "rgba(167,139,250,0.4)", marginBottom: 6 }}>↓ Maria invita a</div>

              {/* Nivel 3: Referidos de referidos */}
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {["Juan", "Ana"].map(n => (
                  <div key={n} style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "#a78bfa", margin: "0 0 2px" }}>{n}</p>
                    <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.7rem", color: "rgba(240,234,214,0.35)", margin: 0 }}>nivel 2</p>
                    <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.95rem", fontWeight: 900, color: "#3db89e", margin: "4px 0 0" }}>+2 para ti</p>
                  </div>
                ))}
              </div>

              {/* Resumen */}
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "14px 18px" }}>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.6)", lineHeight: 1.8, margin: 0, textAlign: "center" }}>
                  Invitaste a Maria (nueva) → <strong style={{ color: "#3db89e" }}>+3 boletos</strong><br />
                  Invitaste a Pedro (registrado) → <strong style={{ color: "#3db89e" }}>+2 boletos</strong><br />
                  Maria invito a Juan → +3 para Maria, <strong style={{ color: "#a78bfa" }}>+2 para ti</strong><br />
                  Maria invito a Ana → +3 para Maria, <strong style={{ color: "#a78bfa" }}>+2 para ti</strong>
                </p>
                <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.3rem", fontWeight: 900, color: "#f5d080", textAlign: "center", margin: "12px 0 0" }}>= 10 boletos en total</p>
              </div>

              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "rgba(240,234,214,0.35)", textAlign: "center", marginTop: 12, fontStyle: "italic" }}>Maximo 20 boletos extra por referidos de nivel 2 en cada concurso.</p>
            </div>

            {/* Link vs Código */}
            <div style={{ background: "rgba(232,168,76,0.04)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: 16, padding: 24 }}>
              <h3 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "1.05rem", color: "#f5d080", marginBottom: 14, textAlign: "center" }}>Dos formas de invitar</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "16px" }}>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#ec4899", marginBottom: 8 }}>🔗 Tu link personal</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.55)", lineHeight: 1.6, marginBottom: 8 }}>Para personas <strong style={{ color: "#f0ead6" }}>sin cuenta</strong> en DeseoComer. Se registran por tu link y ganas <strong style={{ color: "#ec4899" }}>+3 boletos</strong>.</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", fontStyle: "italic" }}>Comparte por WhatsApp, Instagram o redes.</p>
                </div>
                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "16px" }}>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#e8a84c", marginBottom: 8 }}>🔑 Tu codigo</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.55)", lineHeight: 1.6, marginBottom: 8 }}>Para amigos que <strong style={{ color: "#f0ead6" }}>ya tienen cuenta</strong>. Lo ingresan al participar y ganas <strong style={{ color: "#e8a84c" }}>+2 boletos</strong>.</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.3)", fontStyle: "italic" }}>Pasales tu codigo por mensaje.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECCIÓN 5: Premios reales ── */}
        {ganadores.length > 0 ? (
        <section style={{ marginBottom: "clamp(56px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>Esto es real</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "clamp(28px,4vw,48px)", lineHeight: 1.3 }}>Ganadores recientes</h2>

          <div className="cf-premios">
            {ganadores.map((c, i) => (
              <div key={i} style={{ background: "rgba(232,168,76,0.05)", border: "1px solid rgba(232,168,76,0.15)", borderRadius: "16px", overflow: "hidden" }}>
                {c.imagenUrl ? (
                  <img src={c.imagenUrl} alt={c.premio} style={{ width: "100%", height: "120px", objectFit: "cover", display: "block", opacity: 0.75 }} />
                ) : (
                  <div style={{ height: "120px", background: "rgba(45,26,8,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>🏆</div>
                )}
                <div style={{ padding: "14px 16px" }}>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#3db89e", marginBottom: "4px" }}>{c.local}</p>
                  <p style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "0.88rem", color: "#f5d080", marginBottom: "8px", lineHeight: 1.3 }}>{c.premio}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-lato)", fontSize: "0.8rem", color: "rgba(240,234,214,0.35)" }}>
                    <span>Gano: {c.ganador.nombre}</span>
                    <span>{c.ganador.referidos} boletos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href="/concursos/ganadores" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(236,72,153,0.6)", textDecoration: "none", borderBottom: "1px solid rgba(236,72,153,0.2)", paddingBottom: "3px" }}>
              Ver todos los ganadores →
            </Link>
          </div>
        </section>
        ) : (
        <section style={{ marginBottom: "clamp(56px,8vw,96px)", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", marginBottom: "10px" }}>Esto es real</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", marginBottom: "16px", lineHeight: 1.3 }}>Ganadores recientes</h2>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.4)", lineHeight: 1.6 }}>Proximamente los primeros ganadores apareceran aqui</p>
        </section>
        )}

        {/* ── SECCIÓN 6: FAQ ── */}
        <section style={{ marginBottom: "clamp(56px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>Dudas</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "clamp(28px,4vw,48px)", lineHeight: 1.3 }}>Preguntas frecuentes</h2>

          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            {[
              { q: "¿Cuanto cuesta participar?", a: "Nada. Los concursos son 100% gratuitos. Los premios los financian los restaurantes como estrategia de marketing." },
              { q: "¿Como se que el concurso es real?", a: "Todos los locales en DeseoComer estan verificados. Puedes ver el historial completo de ganadores anteriores con nombre y fecha." },
              { q: "¿Puedo participar en mas de un concurso?", a: "Si, puedes participar en todos los concursos activos al mismo tiempo con la misma cuenta." },
              { q: "¿Que pasa si gano?", a: "Te contactamos por email dentro de las 24 horas siguientes al cierre del concurso para coordinar como retirar tu premio." },
              { q: "¿Alguien con 1 boleto puede ganar?", a: "Si. Tener mas boletos aumenta tus chances, pero no lo garantiza. Es un sorteo al azar — cualquier boleto puede salir." },
              { q: "¿Como funcionan los referidos de nivel 2?", a: "Cuando invitas a Maria y Maria invita a Juan, tu ganas +2 boletos por Juan. Tu red trabaja para ti. Maximo 20 boletos extra por esta via." },
              { q: "¿Los referidos deben ser cuentas nuevas?", a: "No necesariamente. Si traes a alguien nuevo ganas +3 boletos, y si invitas a un amigo que ya tiene cuenta ganas +2. En ambos casos deben usar tu link o codigo." },
              { q: "¿El premio es canjeable por dinero?", a: "No. El premio es el producto o servicio indicado en el concurso, no es canjeable por dinero." },
            ].map((faq, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(236,72,153,0.1)", borderRadius: "12px", padding: "18px 20px", marginBottom: "8px" }}>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", fontWeight: 700, color: "#f5d080", marginBottom: "8px" }}>{faq.q}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", color: "rgba(240,234,214,0.55)", lineHeight: 1.7 }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECCIÓN 7: Transparencia ── */}
        <section style={{ marginBottom: "clamp(56px,8vw,96px)" }}>
          <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(240,234,214,0.3)", textAlign: "center", marginBottom: "10px" }}>Confianza</p>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", textAlign: "center", marginBottom: "8px", lineHeight: 1.3 }}>Juego limpio</h2>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem,1.5vw,1rem)", color: "rgba(240,234,214,0.45)", textAlign: "center", marginBottom: "clamp(28px,4vw,48px)", lineHeight: 1.7 }}>Asi protegemos que todo sea justo</p>

          <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { icon: "✉️", title: "Verificacion obligatoria", desc: "Solo los usuarios que verifican su correo electronico cuentan como referidos validos. Esto evita cuentas falsas." },
              { icon: "🚫", title: "Correos desechables bloqueados", desc: "No permitimos correos temporales o de un solo uso. Debes usar un correo personal real." },
              { icon: "🔍", title: "Monitoreo automatico", desc: "Nuestro sistema detecta patrones sospechosos y los marca para revision antes de declarar un ganador." },
              { icon: "🏆", title: "Revision antes del premio", desc: "Ningun premio se entrega sin revision. El local y DeseoComer pueden descalificar participantes con actividad irregular." },
            ].map((item, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(236,72,153,0.1)", borderRadius: "12px", padding: "18px 20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.2rem", flexShrink: 0, marginTop: "2px" }}>{item.icon}</span>
                <div>
                  <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", fontWeight: 700, color: "#f5d080", marginBottom: "6px" }}>{item.title}</p>
                  <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.82rem,1.3vw,0.9rem)", color: "rgba(240,234,214,0.55)", lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Final ── */}
        <section style={{ background: "linear-gradient(160deg, rgba(236,72,153,0.06), #0a0812)", border: "1px solid rgba(236,72,153,0.15)", borderRadius: "24px", padding: "clamp(36px,6vw,64px) clamp(24px,5vw,60px)", textAlign: "center" }}>
          <div style={{ fontSize: "clamp(2rem,4vw,3rem)", marginBottom: "16px" }}>🎲</div>
          <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.5rem,3vw,2.2rem)", color: "#f5d080", marginBottom: "14px", lineHeight: 1.3 }}>¿Listo para probar<br />tu suerte?</h2>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "clamp(0.9rem,1.5vw,1rem)", color: "rgba(240,234,214,0.5)", marginBottom: "28px", lineHeight: 1.7 }}>Hay concursos activos ahora mismo. Entra gratis y tu primer boleto ya esta en la bolsa.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/concursos" style={{ background: "linear-gradient(135deg, #ec4899, #be185d)", color: "#fff", fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem,1.5vw,0.85rem)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 32px", borderRadius: "30px", textDecoration: "none" }}>Ver concursos activos →</Link>
            <Link href="/concursos/ganadores" style={{ background: "transparent", color: "rgba(240,234,214,0.5)", fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.75rem,1.5vw,0.85rem)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "14px 32px", borderRadius: "30px", border: "1px solid rgba(240,234,214,0.15)", textDecoration: "none" }}>Ver ganadores</Link>
          </div>
        </section>
      </div>

      <Footer />

      <style>{`
        .cf-pasos { display: flex; flex-direction: column; gap: 0; max-width: 560px; margin: 0 auto; }
        .cf-paso-item { display: flex; flex-direction: row; align-items: flex-start; gap: 16px; padding: 20px 0; border-bottom: 1px solid rgba(236,72,153,0.06); }
        .cf-paso-item > div:first-child { margin: 0; flex-shrink: 0; }
        .cf-paso-item p { text-align: left !important; }
        .cf-boletos { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(10px, 2vw, 16px); max-width: 600px; margin: 0 auto; }
        .cf-premios { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(10px, 2vw, 20px); }
        @media (min-width: 768px) {
          .cf-pasos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 100%; align-items: start; }
          .cf-paso-item { flex-direction: column; align-items: center; padding: 24px 8px; border-bottom: none; border-right: 1px solid rgba(236,72,153,0.06); gap: 12px; }
          .cf-paso-item:last-child { border-right: none; }
          .cf-paso-item > div:first-child { margin: 0 auto 4px; }
          .cf-paso-item p { text-align: center !important; }
          .cf-boletos { grid-template-columns: repeat(4, 1fr); }
          .cf-premios { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </main>
  );
}
