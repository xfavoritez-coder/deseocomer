import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ConcursosSection from "@/components/landing/ConcursosSection";
import PromocionesSection from "@/components/landing/PromocionesSection";
import LocalesSection from "@/components/landing/LocalesSection";
import SectionDivider from "@/components/landing/SectionDivider";
import Footer from "@/components/layout/Footer";
import { prisma } from "@/lib/prisma";

async function getPromociones() {
  try {
    const data = await prisma.promocion.findMany({
      where: { activa: true, local: { activo: true, direccion: { not: "" }, categoria: { not: null } } },
      include: { local: { select: { id: true, nombre: true, comuna: true, slug: true, logoUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    return data.map(p => ({
      id: p.id,
      localId: p.localId,
      local: p.local?.nombre ?? "Local",
      logoUrl: p.local?.logoUrl ?? "",
      comuna: p.local?.comuna ?? "",
      tipo: p.tipo,
      imagenUrl: p.imagenUrl ?? "",
      titulo: p.titulo,
      descripcion: p.descripcion ?? "",
      porcentajeDescuento: p.porcentajeDescuento ?? null,
      precioOriginal: p.precioOriginal ?? null,
      precioDescuento: p.precioDescuento ?? null,
      diasSemana: p.diasSemana as boolean[],
      horaInicio: p.horaInicio,
      horaFin: p.horaFin,
      activa: p.activa,
      esCumpleanos: p.esCumpleanos,
      condiciones: p.condiciones ?? null,
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const promocionesDB = await getPromociones();

  return (
    <main style={{ background: "var(--bg-primary)", margin: 0, padding: 0, display: "block" }}>
      <Navbar />
      <HeroSection />
      <ConcursosSection />
      <SectionDivider fromBg="var(--bg-primary)" toBg="var(--bg-secondary)" />
      <PromocionesSection initialData={promocionesDB} />
      <SectionDivider fromBg="var(--bg-secondary)" toBg="var(--bg-primary)" />
      <LocalesSection />
      <Footer />
    </main>
  );
}
