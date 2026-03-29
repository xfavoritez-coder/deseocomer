import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const locales = await prisma.local.findMany({
      where: { activo: true },
      select: {
        id: true, nombre: true, categoria: true,
        descripcion: true, comuna: true, logoUrl: true,
        portadaUrl: true, verificado: true,
        _count: { select: { favoritos: true, resenas: true } },
      },
    });
    return NextResponse.json(locales);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, telefono, ciudad } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const existe = await prisma.local.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const local = await prisma.local.create({
      data: { nombre, email, password: hash, telefono, ciudad },
    });

    const { password: _, ...localSinPassword } = local;
    return NextResponse.json(localSinPassword, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
