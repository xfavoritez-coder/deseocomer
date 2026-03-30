import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { activo, verificado } = await req.json();
    const local = await prisma.local.update({ where: { id }, data: { ...(activo !== undefined && { activo }), ...(verificado !== undefined && { verificado }) } });
    return NextResponse.json(local);
  } catch { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}
