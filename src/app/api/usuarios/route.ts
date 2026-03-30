import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, telefono, ciudad, cumpleDia, cumpleMes, cumpleAnio } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: hash, telefono, ciudad, cumpleDia, cumpleMes, cumpleAnio },
    });

    const { password: _, ...usuarioSinPassword } = usuario;

    // Send welcome email (non-blocking)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/emails/bienvenida`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: usuario.nombre, email: usuario.email }),
    }).catch(console.error);

    return NextResponse.json(usuarioSinPassword, { status: 201 });
  } catch (error) {
    console.error("[API /usuarios] Error:", error);
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error interno", detalle: msg }, { status: 500 });
  }
}
