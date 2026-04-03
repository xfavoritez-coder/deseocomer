import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: obtener lista de toasts dismissed para un usuario
export async function GET(req: NextRequest) {
  try {
    const usuarioId = req.nextUrl.searchParams.get("usuarioId");
    if (!usuarioId) return NextResponse.json([]);

    const dismissed = await prisma.toastDismissed.findMany({
      where: { usuarioId },
      select: { toastId: true },
    });

    return NextResponse.json(dismissed.map(d => d.toastId));
  } catch {
    return NextResponse.json([]);
  }
}
