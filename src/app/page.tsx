import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ConcursosSection from "@/components/landing/ConcursosSection";
import PromocionesSection from "@/components/landing/PromocionesSection";
import LocalesSection from "@/components/landing/LocalesSection";
import SectionDivider from "@/components/landing/SectionDivider";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main style={{ background: "var(--bg-primary)", margin: 0, padding: 0, display: "block" }}>
      <Navbar />
      <HeroSection />
      <ConcursosSection />
      <SectionDivider fromBg="var(--bg-primary)" toBg="var(--bg-secondary)" />
      <PromocionesSection />
      <SectionDivider fromBg="var(--bg-secondary)" toBg="var(--bg-primary)" />
      <LocalesSection />
      <Footer />
    </main>
  );
}
