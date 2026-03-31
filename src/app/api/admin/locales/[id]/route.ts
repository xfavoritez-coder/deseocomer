import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const { activo, verificado } = await req.json();
    const local = await prisma.local.update({ where: { id }, data: { ...(activo !== undefined && { activo }), ...(verificado !== undefined && { verificado }) } });
    return NextResponse.json(local);
  } catch (error) {
    console.error("[Admin locales PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
