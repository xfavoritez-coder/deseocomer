import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    // This migration is no longer needed — tags and categoria were merged into categorias[]
    return NextResponse.json({ ok: true, message: "Migration no longer needed. categoria+tags were merged into categorias[]." });
  } catch (error) {
    console.error("[Migrar tags]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
