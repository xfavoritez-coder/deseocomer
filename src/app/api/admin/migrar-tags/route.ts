import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    // Migrate local tags
    const locales = await prisma.local.findMany({
      where: { tags: { hasSome: ["Japonés", "Italiano"] } },
      select: { id: true, tags: true },
    });

    let migradosLocales = 0;
    for (const local of locales) {
      const newTags = [...local.tags];
      if (newTags.includes("Japonés") && !newTags.includes("Sushi")) {
        newTags.push("Sushi");
      }
      if (newTags.includes("Italiano") && !newTags.includes("Pastas")) {
        newTags.push("Pastas");
      }
      const filtered = newTags.filter(t => t !== "Japonés" && t !== "Italiano");
      await prisma.local.update({ where: { id: local.id }, data: { tags: filtered } });
      migradosLocales++;
    }

    // Migrate user comidasFavoritas
    const usuarios = await prisma.usuario.findMany({
      where: { comidasFavoritas: { hasSome: ["Japonés", "Italiano"] } },
      select: { id: true, comidasFavoritas: true },
    });

    let migradosUsuarios = 0;
    for (const user of usuarios) {
      const newFavs = [...user.comidasFavoritas];
      if (newFavs.includes("Japonés") && !newFavs.includes("Sushi")) {
        newFavs.push("Sushi");
      }
      if (newFavs.includes("Italiano") && !newFavs.includes("Pastas")) {
        newFavs.push("Pastas");
      }
      const filtered = newFavs.filter(t => t !== "Japonés" && t !== "Italiano");
      await prisma.usuario.update({ where: { id: user.id }, data: { comidasFavoritas: filtered } });
      migradosUsuarios++;
    }

    return NextResponse.json({ ok: true, migradosLocales, migradosUsuarios });
  } catch (error) {
    console.error("[Migrar tags]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
