import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, ciudad } = await req.json();
    if (!email || !ciudad) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }
    const entrada = await prisma.listaEsperaLocal.create({
      data: { email, ciudad },
    });
    return NextResponse.json(entrada, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
