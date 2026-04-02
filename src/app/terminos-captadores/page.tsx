import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const H: React.CSSProperties = { fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#e8a84c", marginBottom: 12, marginTop: 32 };
const P: React.CSSProperties = { fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.6)", lineHeight: 1.7, marginBottom: 10 };
const LI: React.CSSProperties = { ...P, paddingLeft: 16, position: "relative" as const };

export default function TerminosCaptadoresPage() {
  return (
    <main style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "120px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(1.3rem, 4vw, 1.8rem)", color: "#f5d080", textAlign: "center", marginBottom: 8, textTransform: "uppercase" }}>
          Términos del Programa de Captadores
        </h1>
        <p style={{ textAlign: "center", fontSize: "0.82rem", color: "rgba(240,234,214,0.3)", marginBottom: 40 }}>Última actualización: abril 2026</p>

        <h2 style={H}>1. Objetivo del programa</h2>
        <p style={P}>El programa de captadores de DeseoComer tiene como objetivo registrar locales gastronómicos que voluntariamente deseen aparecer en la plataforma.</p>

        <h2 style={H}>2. Obligaciones del captador</h2>
        <p style={LI}>• Solo puedes registrar locales que hayan dado su consentimiento explícito para aparecer en DeseoComer.</p>
        <p style={LI}>• Debes presentarte correctamente como representante del programa de captadores de DeseoComer.</p>
        <p style={LI}>• No puedes registrar locales con información falsa o sin autorización del dueño.</p>
        <p style={LI}>• No puedes crear locales ficticios o duplicados.</p>

        <h2 style={H}>3. Condiciones de pago</h2>
        <p style={LI}>• El pago de $10.000 se realiza únicamente cuando el local es verificado y activado por el equipo de DeseoComer.</p>
        <p style={LI}>• Si un local reporta no haber dado su consentimiento, el registro será eliminado y no se realizará pago alguno.</p>
        <p style={LI}>• DeseoComer se reserva el derecho de retener pagos mientras se investiga cualquier irregularidad.</p>
        <p style={LI}>• Los pagos son quincenales via transferencia bancaria previa presentación de RUT.</p>

        <h2 style={H}>4. Causales de descalificación</h2>
        <p style={LI}>• Registrar locales sin consentimiento del dueño.</p>
        <p style={LI}>• Proporcionar información falsa sobre los locales.</p>
        <p style={LI}>• Crear cuentas duplicadas o fraudulentas.</p>
        <p style={LI}>• Cualquier conducta deshonesta o que perjudique la reputación de DeseoComer.</p>

        <h2 style={H}>5. Aceptación</h2>
        <p style={P}>Al acceder al panel de captadores confirmas haber leído y aceptado estos términos en su totalidad.</p>
      </div>
      <Footer />
    </main>
  );
}
