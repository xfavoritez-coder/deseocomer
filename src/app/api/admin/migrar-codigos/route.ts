import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    const usuarios = await prisma.usuario.findMany({
      where: { codigoRef: "" },
      select: { id: true, nombre: true },
    });

    let migrados = 0;
    for (const u of usuarios) {
      const base = u.nombre.replace(/\s/g, '').slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
      let codigo = "";
      for (let i = 0; i < 10; i++) {
        const candidato = base + Math.floor(Math.random() * 900 + 100);
        const existe = await prisma.usuario.findFirst({ where: { codigoRef: candidato } });
        if (!existe) { codigo = candidato; break; }
      }
      if (!codigo) codigo = base + Date.now().toString().slice(-4);
      await prisma.usuario.update({ where: { id: u.id }, data: { codigoRef: codigo } });
      migrados++;
    }

    return NextResponse.json({ ok: true, migrados });
  } catch (error) {
    console.error("[Migrar códigos]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
