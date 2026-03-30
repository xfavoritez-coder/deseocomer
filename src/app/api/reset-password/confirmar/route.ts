import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    const usuario = await prisma.usuario.findFirst({
      where: { resetToken: token, resetTokenExpira: { gt: new Date() } },
    });
    if (!usuario) return NextResponse.json({ error: "Link inválido o expirado" }, { status: 400 });

    const hash = await bcrypt.hash(password, 10);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hash, resetToken: null, resetTokenExpira: null },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Reset confirmar]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
