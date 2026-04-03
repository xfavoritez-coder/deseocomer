"use client";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const H2: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "16px", color: "#e8a84c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px", paddingTop: "28px", borderTop: "1px solid rgba(232,168,76,0.08)" };
const P: React.CSSProperties = { fontFamily: "var(--font-lato)", fontSize: "15px", color: "rgba(240,234,214,0.7)", lineHeight: 1.75, marginBottom: "16px" };
const SUB: React.CSSProperties = { ...P };

export default function TerminosPage() {
  return (
    <main style={{ background: "#0a0812", minHeight: "100vh" }}>
      <Navbar />
      <section style={{ maxWidth: "800px", margin: "0 auto", padding: "120px 20px 80px" }}>
        {/* Breadcrumb */}
        <Link href="/" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.12em", color: "rgba(240,234,214,0.35)", textDecoration: "none", display: "inline-block", marginBottom: "32px" }}>← Volver</Link>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: "28px", color: "#f5d080", marginBottom: "12px" }}>Términos y Condiciones</h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "14px", color: "rgba(240,234,214,0.4)" }}>Última actualización: abril 2026</p>
        </div>

        {/* Contenido */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.15)", borderRadius: "20px", padding: "clamp(24px,5vw,40px)" }}>

          <h2 style={{ ...H2, paddingTop: 0, borderTop: "none" }}>1. Aceptación de los términos</h2>
          <p style={P}>Al acceder y utilizar DeseoComer.com, aceptas quedar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestra plataforma.</p>

          <h2 style={H2}>2. Descripción del servicio</h2>
          <p style={P}>DeseoComer es una plataforma gastronómica que conecta a usuarios con locales de comida en Santiago de Chile. Facilitamos el descubrimiento de restaurantes, la participación en concursos y el acceso a promociones exclusivas. DeseoComer actúa como intermediario entre usuarios y locales, sin ser responsable de los productos o servicios ofrecidos por estos últimos.</p>

          <h2 style={H2}>3. Registro y cuentas de usuario</h2>
          <p style={P}>Para acceder a ciertas funcionalidades debes crear una cuenta. Eres responsable de mantener la confidencialidad de tus credenciales. Debes proporcionar información veraz y actualizada. Nos reservamos el derecho de suspender cuentas que infrinjan estos términos.</p>

          <h2 style={H2}>4. Locales y negocios</h2>
          <p style={P}>Los locales registrados en DeseoComer son responsables de la veracidad de la información publicada, la calidad de sus productos y servicios, el cumplimiento de las promociones y concursos que publiquen, y el cumplimiento de la normativa vigente aplicable a su actividad.</p>

          <h2 style={H2}>5. Concursos y sistema de referidos</h2>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>5.1 Elegibilidad:</strong> Para participar en concursos el usuario debe contar con una cuenta registrada y verificada. No se admitirán participaciones de cuentas no verificadas.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>5.2 Prohibiciones:</strong> Queda estrictamente prohibido el uso de correos temporales o desechables; la creación de múltiples cuentas para acumular puntos; el uso de métodos automatizados para manipular el sistema de referidos; y cualquier conducta que busque obtener ventaja de manera deshonesta.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>5.3 Descalificación:</strong> DeseoComer y el local organizador se reservan el derecho de descalificar a cualquier participante con patrones sospechosos, sin previo aviso ni justificación. La descalificación implica la pérdida de todos los puntos acumulados.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>5.4 Entrega del premio:</strong> DeseoComer actúa exclusivamente como plataforma intermediaria. La entrega del premio es responsabilidad única del local organizador. DeseoComer no asume responsabilidad por incumplimiento del local en la entrega del premio.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>5.5 Cancelación:</strong> El local puede cancelar un concurso solo si no tiene participantes activos. Con participantes, la cancelación debe gestionarse con el equipo de DeseoComer.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>5.6 Aceptación:</strong> Participar en un concurso implica la aceptación plena de estas condiciones y las específicas del local organizador.</p>

          <p style={SUB}><strong style={{ color: "#e8a84c" }}>5.7 Sistema de referidos multinivel:</strong> DeseoComer implementa un sistema de referidos de dos niveles. Los participantes obtienen +2 puntos por cada referido directo verificado y +1 punto adicional por cada referido que traigan sus referidos directos, con un máximo de 10 puntos acumulables por esta segunda capa.</p>
          <p style={SUB}>Los puntos de segundo nivel quedan sujetos a verificación antifraude y no se acreditan si se detectan registros desde la misma IP o en intervalos de tiempo sospechosamente cortos. DeseoComer se reserva el derecho de anular puntos obtenidos mediante prácticas fraudulentas en cualquier nivel de la cadena de referidos.</p>

          <h2 style={H2}>6. Entrega de premios</h2>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>6.1 Selección del ganador:</strong> El ganador es determinado automáticamente por el sistema según los puntos acumulados al cierre del concurso, sujeto a verificación antifraude.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>6.2 Plazo de reclamo:</strong> El ganador tiene 7 días desde la notificación por email para confirmar la recepción de su premio. Si no lo hace, el premio pasa al segundo lugar.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>6.3 Orden de precedencia:</strong> Si el ganador original no reclama su premio o es descalificado por fraude, el premio pasa en orden al 2° y 3° lugar. Cada uno tiene 5 y 3 días respectivamente para reclamarlo.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>6.4 Código de acreditación:</strong> El ganador recibirá un código único por email que debe presentar al local para retirar su premio.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>6.5 Responsabilidad de entrega:</strong> La entrega del premio es responsabilidad exclusiva del local organizador. DeseoComer actúa como intermediario facilitando la comunicación entre las partes.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>6.6 Disputas:</strong> Si el ganador reporta no haber recibido su premio, DeseoComer investigará el caso en un plazo de 48 horas.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>6.7 Premio no reclamado:</strong> Si ninguno de los 3 primeros lugares reclama el premio dentro del plazo establecido, el premio queda sin entregar y el concurso se marca como expirado.</p>
          <p style={SUB}><strong style={{ color: "#e8a84c" }}>6.8 Fraude:</strong> Cualquier participante descalificado por fraude pierde automáticamente el derecho al premio, que pasa al siguiente lugar.</p>

          <h2 style={H2}>7. Promociones</h2>
          <p style={P}>Las promociones publicadas en DeseoComer son responsabilidad exclusiva de cada local. DeseoComer no garantiza la disponibilidad, vigencia ni condiciones de las promociones. Ante cualquier inconveniente con una promoción, el usuario debe contactar directamente al local.</p>

          <h2 style={H2}>8. Propiedad intelectual</h2>
          <p style={P}>Todo el contenido de DeseoComer, incluyendo diseño, textos, logos e imágenes propias, está protegido por derechos de autor. Los locales conservan los derechos sobre su propio contenido (fotos, descripciones) y otorgan a DeseoComer una licencia de uso para su publicación en la plataforma.</p>

          <h2 style={H2}>9. Limitación de responsabilidad</h2>
          <p style={P}>DeseoComer no será responsable por daños directos o indirectos derivados del uso de la plataforma, la calidad de los productos o servicios de los locales, la veracidad de la información publicada por locales, ni por interrupciones del servicio por causas ajenas a nuestra voluntad.</p>

          <h2 style={H2}>10. Modificaciones</h2>
          <p style={P}>DeseoComer se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados en la plataforma. El uso continuado de DeseoComer tras los cambios implica su aceptación.</p>

          <h2 style={H2}>11. Legislación aplicable</h2>
          <p style={P}>Estos términos se rigen por las leyes de la República de Chile. Cualquier disputa será sometida a los tribunales competentes de Santiago de Chile.</p>

          <h2 style={H2}>12. Contacto</h2>
          <p style={{ ...P, marginBottom: 0 }}>Para consultas sobre estos términos escríbenos a través de nuestra página de contacto en <Link href="/contacto" style={{ color: "#e8a84c", textDecoration: "none" }}>DeseoComer.com/contacto</Link></p>
        </div>

        {/* Scroll to top */}
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.12em", color: "rgba(240,234,214,0.3)", textDecoration: "none" }}>↑ Volver arriba</a>
        </div>
      </section>
      <Footer />
    </main>
  );
}
