import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { makeLocalSlug } from "@/lib/slugify";

export async function GET() {
  try {
    const locales = await prisma.local.findMany({
      where: {
        activo: true,
        ciudad: { not: "" },
        comuna: { not: "" },
        direccion: { not: "" },
        categoria: { not: "" },
      },
      include: {
        _count: { select: { favoritos: true, resenas: true, concursos: true, promociones: true } },
      },
    });
    // Filter out locals without at least 1 active day in horarios
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const complete = locales.filter(l => {
      if (!l.horarios || !Array.isArray(l.horarios)) return false;
      return (l.horarios as { activo: boolean }[]).some(h => h.activo);
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const safe = complete.map(({ password: _, ...rest }) => rest);
    return NextResponse.json(safe);
  } catch (error) {
    console.error("[API /locales GET] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, nombreDueno, email, password, telefono, ciudad } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const existe = await prisma.local.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const slug = makeLocalSlug(nombre, ciudad);
    const local = await prisma.local.create({
      data: { nombre, slug, nombreDueno, celularDueno: telefono, email, password: hash, ciudad, activo: false },
    });

    const { password: _, ...localSinPassword } = local;
    return NextResponse.json(localSinPassword, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
