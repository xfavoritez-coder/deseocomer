import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PrivacidadPage() {
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />
      <section style={{ padding: "120px clamp(20px,5vw,60px) 80px", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.8rem, 5vw, 2.5rem)", color: "var(--accent)", marginBottom: "32px", textAlign: "center" }}>Política de Privacidad</h1>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.15)", borderRadius: "20px", padding: "clamp(24px,5vw,40px)", fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.8 }}>
          <p style={{ marginBottom: "20px" }}>Última actualización: Marzo 2026</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>1. Datos que recopilamos</h2>
          <p style={{ marginBottom: "16px" }}>Recopilamos: nombre, email, contraseña encriptada, fecha de cumpleaños (opcional), y datos de uso como favoritos y participación en concursos.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>2. Cómo usamos tus datos</h2>
          <p style={{ marginBottom: "16px" }}>Usamos tus datos para: gestionar tu cuenta, personalizar recomendaciones, enviar notificaciones de concursos y promociones, y mejorar la plataforma.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>3. Protección de datos</h2>
          <p style={{ marginBottom: "16px" }}>Las contraseñas se almacenan encriptadas con bcrypt. Usamos conexiones HTTPS. No compartimos datos personales con terceros sin tu consentimiento.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>4. Emails</h2>
          <p style={{ marginBottom: "16px" }}>Te enviaremos emails de verificación, recuperación de contraseña y notificaciones de concursos. Puedes desuscribirte en cualquier momento.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>5. Cookies y almacenamiento local</h2>
          <p style={{ marginBottom: "16px" }}>Usamos localStorage para mantener tu sesión y preferencias. No usamos cookies de seguimiento de terceros.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>6. Contacto</h2>
          <p>Para consultas sobre privacidad, escríbenos a hola@deseocomer.com</p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
