import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_DOMAINS = ["deseocomer.com", "www.deseocomer.com"];

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const url = req.nextUrl.searchParams.get("url") || "https://deseocomer.com/registro-local";

  // Validate URL domain to prevent open redirect
  let destino = "https://deseocomer.com/registro-local";
  try {
    const parsed = new URL(url);
    if (ALLOWED_DOMAINS.includes(parsed.hostname)) destino = url;
  } catch {}

  if (id) {
    try {
      const contacto = await prisma.contactoCampana.findUnique({ where: { id } });
      if (contacto && !contacto.hizoClic) {
        await prisma.contactoCampana.update({
          where: { id },
          data: { hizoClic: true, clicAt: new Date() },
        });
      }
    } catch {}
  }

  return NextResponse.redirect(destino);
}
