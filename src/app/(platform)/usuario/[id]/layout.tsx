import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const isCuid = id.length > 20;
    const usuario = await prisma.usuario.findFirst({
      where: isCuid ? { id } : { codigoRef: id },
      select: { nombre: true },
    });
    if (!usuario) return { title: "Usuario — DeseoComer" };

    const parts = (usuario.nombre ?? "Usuario").trim().split(/\s+/);
    const nombre = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];

    return {
      title: `${nombre} — Perfil | DeseoComer`,
      description: `Perfil de ${nombre} en DeseoComer.`,
    };
  } catch {
    return { title: "DeseoComer" };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
