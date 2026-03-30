import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

    const usuario = await prisma.usuario.findFirst({ where: { tokenVerificacion: token } });
    if (!usuario) return NextResponse.json({ error: "Token inválido o ya usado" }, { status: 400 });

    await prisma.usuario.update({ where: { id: usuario.id }, data: { emailVerificado: true, tokenVerificacion: null } });
    return NextResponse.json({ ok: true, id: usuario.id, nombre: usuario.nombre, email: usuario.email });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
