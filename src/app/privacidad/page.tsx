"use client";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const H2: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "16px", color: "#e8a84c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "12px", paddingTop: "28px", borderTop: "1px solid rgba(232,168,76,0.08)" };
const P: React.CSSProperties = { fontFamily: "var(--font-lato)", fontSize: "15px", color: "rgba(240,234,214,0.7)", lineHeight: 1.75, marginBottom: "16px" };

export default function PrivacidadPage() {
  return (
    <main style={{ background: "#0a0812", minHeight: "100vh" }}>
      <Navbar />
      <section style={{ maxWidth: "800px", margin: "0 auto", padding: "120px 20px 80px" }}>
        {/* Breadcrumb */}
        <Link href="/" style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.78rem", letterSpacing: "0.12em", color: "rgba(240,234,214,0.35)", textDecoration: "none", display: "inline-block", marginBottom: "32px" }}>← Volver</Link>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: "28px", color: "#f5d080", marginBottom: "12px" }}>Política de Privacidad</h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "14px", color: "rgba(240,234,214,0.4)" }}>Última actualización: marzo 2026</p>
        </div>

        {/* Contenido */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.15)", borderRadius: "20px", padding: "clamp(24px,5vw,40px)" }}>

          <h2 style={{ ...H2, paddingTop: 0, borderTop: "none" }}>1. Información que recopilamos</h2>
          <p style={P}>Recopilamos información que nos proporcionas directamente al registrarte: nombre, correo electrónico, fecha de nacimiento y ciudad. También recopilamos información de uso como páginas visitadas, concursos en los que participas y locales que marcas como favoritos.</p>

          <h2 style={H2}>2. Cómo usamos tu información</h2>
          <p style={P}>Usamos tu información para operar y mejorar la plataforma, personalizar tu experiencia gastronómica, enviarte comunicaciones relevantes sobre concursos y promociones, y garantizar la seguridad e integridad de la plataforma.</p>

          <h2 style={H2}>3. Correo electrónico y comunicaciones</h2>
          <p style={P}>Al registrarte aceptas recibir correos transaccionales (verificación, recuperación de contraseña). Los correos de marketing son opcionales y puedes cancelarlos en cualquier momento desde tu perfil o mediante el link de cada email.</p>

          <h2 style={H2}>4. Compartir información</h2>
          <p style={P}>No vendemos ni compartimos tu información personal con terceros con fines comerciales. Solo compartimos información con locales en la medida necesaria para operar los concursos y promociones (por ejemplo, nombre del ganador de un concurso).</p>

          <h2 style={H2}>5. Seguridad</h2>
          <p style={P}>Implementamos medidas técnicas para proteger tu información, incluyendo encriptación de contraseñas y conexiones seguras (HTTPS). Sin embargo, ningún sistema es completamente infalible y no podemos garantizar seguridad absoluta.</p>

          <h2 style={H2}>6. Cookies</h2>
          <p style={P}>Usamos cookies esenciales para el funcionamiento de la plataforma (sesión de usuario). No usamos cookies de rastreo publicitario de terceros.</p>

          <h2 style={H2}>7. Tus derechos</h2>
          <p style={P}>Tienes derecho a acceder a tu información personal, corregir datos incorrectos, solicitar la eliminación de tu cuenta y datos asociados, y oponerte al procesamiento de tus datos. Para ejercer estos derechos contáctanos en <Link href="/contacto" style={{ color: "#e8a84c", textDecoration: "none" }}>DeseoComer.com/contacto</Link></p>

          <h2 style={H2}>8. Retención de datos</h2>
          <p style={P}>Conservamos tu información mientras tu cuenta esté activa. Si eliminas tu cuenta, borraremos tus datos personales en un plazo de 30 días, excepto aquellos que debamos conservar por obligaciones legales.</p>

          <h2 style={H2}>9. Menores de edad</h2>
          <p style={P}>DeseoComer no está dirigido a menores de 13 años. No recopilamos conscientemente información de menores. Si detectamos una cuenta de menor, la eliminaremos.</p>

          <h2 style={H2}>10. Cambios a esta política</h2>
          <p style={P}>Podemos actualizar esta política ocasionalmente. Te notificaremos por email ante cambios significativos. El uso continuado de DeseoComer implica la aceptación de la política actualizada.</p>

          <h2 style={H2}>11. Contacto</h2>
          <p style={{ ...P, marginBottom: 0 }}>Para consultas sobre privacidad contáctanos en <Link href="/contacto" style={{ color: "#e8a84c", textDecoration: "none" }}>DeseoComer.com/contacto</Link></p>
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
