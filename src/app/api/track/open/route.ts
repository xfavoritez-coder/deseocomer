import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    try {
      const contacto = await prisma.contactoCampana.findUnique({ where: { id } });
      if (contacto && !contacto.abrioEmail) {
        await prisma.contactoCampana.update({
          where: { id },
          data: { abrioEmail: true, abrioAt: new Date() },
        });
      }
    } catch {}
  }

  // 1x1 transparent GIF
  const pixel = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
  return new NextResponse(pixel, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}
