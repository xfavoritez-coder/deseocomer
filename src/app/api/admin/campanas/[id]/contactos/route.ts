import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const contactos = await prisma.contactoCampana.findMany({
      where: { campanaId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, nombre: true, abrioEmail: true, hizoClic: true, seRegistro: true, errorEnvio: true, abrioAt: true, clicAt: true },
    });
    return NextResponse.json(contactos);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
