import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.includes("@")) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

    const lower = email.toLowerCase().trim();

    // Mark all campaign contacts with this email as having an error (won't receive future emails)
    const updated = await prisma.contactoCampana.updateMany({
      where: { email: lower },
      data: { errorEnvio: "desuscrito" },
    });

    return NextResponse.json({ ok: true, updated: updated.count });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
