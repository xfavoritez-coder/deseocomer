import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const configs = await prisma.configSite.findMany();
    const map: Record<string, string> = {};
    for (const c of configs) map[c.clave] = c.valor;
    return NextResponse.json(map);
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const body = await req.json();
    const entries = Object.entries(body) as [string, string][];
    for (const [clave, valor] of entries) {
      await prisma.configSite.upsert({
        where: { clave },
        create: { clave, valor },
        update: { valor },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
