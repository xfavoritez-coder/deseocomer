import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function TerminosPage() {
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />
      <section style={{ padding: "120px clamp(20px,5vw,60px) 80px", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.8rem, 5vw, 2.5rem)", color: "var(--accent)", marginBottom: "32px", textAlign: "center" }}>Términos y Condiciones</h1>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(232,168,76,0.15)", borderRadius: "20px", padding: "clamp(24px,5vw,40px)", fontFamily: "var(--font-lato)", fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.8 }}>
          <p style={{ marginBottom: "20px" }}>Última actualización: Marzo 2026</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>1. Aceptación de los términos</h2>
          <p style={{ marginBottom: "16px" }}>Al registrarte y usar DeseoComer, aceptas estos términos de uso. Si no estás de acuerdo, no uses la plataforma.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>2. Uso de la plataforma</h2>
          <p style={{ marginBottom: "16px" }}>DeseoComer es una plataforma gastronómica que conecta usuarios con locales de comida en Santiago. Los usuarios pueden participar en concursos, ver promociones y descubrir locales.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>3. Concursos y premios</h2>
          <p style={{ marginBottom: "16px" }}>Los concursos son organizados por los locales asociados. Los premios no son canjeables por dinero. El ganador es quien acumule más puntos al cierre del concurso. DeseoComer se reserva el derecho de descalificar cuentas fraudulentas.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>4. Cuentas de usuario</h2>
          <p style={{ marginBottom: "16px" }}>Cada persona puede tener una sola cuenta. Las cuentas con información falsa o duplicada pueden ser suspendidas. Eres responsable de mantener tu contraseña segura.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>5. Locales asociados</h2>
          <p style={{ marginBottom: "16px" }}>Los locales son responsables de cumplir con los premios publicados en sus concursos y las condiciones de sus promociones. DeseoComer actúa como intermediario.</p>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "var(--accent)", margin: "28px 0 12px" }}>6. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos términos. Los cambios serán comunicados por email a los usuarios registrados.</p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
