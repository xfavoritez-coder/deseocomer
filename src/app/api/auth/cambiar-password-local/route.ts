import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { localId, passActual, passNueva } = await req.json();
    if (!localId || !passActual || !passNueva) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    if (passNueva.length < 8) return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 });

    const local = await prisma.local.findUnique({ where: { id: localId }, select: { password: true } });
    if (!local) return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });

    const valida = await bcrypt.compare(passActual, local.password);
    if (!valida) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 401 });

    const hash = await bcrypt.hash(passNueva, 10);
    await prisma.local.update({ where: { id: localId }, data: { password: hash } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
