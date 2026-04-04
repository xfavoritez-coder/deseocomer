import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const campanas = await prisma.campana.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { contactos: true } },
        contactos: { select: { abrioEmail: true, hizoClic: true, seRegistro: true }, take: 5000 },
      },
    });
    // Calculate real stats from contactos to avoid double-count issues
    const result = campanas.map(c => {
      const abiertos = c.contactos.filter(ct => ct.abrioEmail).length;
      const clicks = c.contactos.filter(ct => ct.hizoClic).length;
      const registrados = c.contactos.filter(ct => ct.seRegistro).length;
      return {
        id: c.id, asunto: c.asunto, template: c.template, estado: c.estado,
        totalContactos: c.totalContactos, totalEnviados: c.totalEnviados, totalErrores: c.totalErrores,
        totalAbiertos: abiertos, totalClicks: clicks, totalRegistrados: registrados,
        createdAt: c.createdAt, enviadoAt: c.enviadoAt,
      };
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { asunto, template, contactos } = await req.json();
    if (!asunto?.trim() || !Array.isArray(contactos) || contactos.length === 0) {
      return NextResponse.json({ error: "Asunto y contactos son requeridos" }, { status: 400 });
    }

    // Filter out emails already registered as locals
    const existingLocals = await prisma.local.findMany({
      where: { email: { in: contactos.map((c: any) => c.email.toLowerCase()) } },
      select: { email: true },
    });
    const registeredEmails = new Set(existingLocals.map(l => l.email.toLowerCase()));

    // Filter out unsubscribed emails
    const desuscritos = await prisma.contactoCampana.findMany({
      where: { email: { in: contactos.map((c: any) => c.email.toLowerCase()) }, errorEnvio: "desuscrito" },
      select: { email: true },
    });
    const unsubs = new Set(desuscritos.map(d => d.email.toLowerCase()));

    const validContactos = contactos.filter((c: any) => {
      const em = c.email.toLowerCase();
      return !registeredEmails.has(em) && !unsubs.has(em);
    });

    const campana = await prisma.campana.create({
      data: {
        asunto: asunto.trim(),
        template: template || "founder",
        totalContactos: validContactos.length,
        contactos: {
          createMany: {
            data: validContactos.map((c: any) => ({
              email: c.email.toLowerCase().trim(),
              nombre: c.nombre?.trim() || null,
            })),
            skipDuplicates: true,
          },
        },
      },
    });

    const filtrados = contactos.length - validContactos.length;
    return NextResponse.json({ ok: true, id: campana.id, contactos: validContactos.length, filtradosYaRegistrados: filtrados }, { status: 201 });
  } catch (e: any) {
    console.error("[Campanas POST]", e);
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    await prisma.contactoCampana.deleteMany({ where: { campanaId: id } });
    await prisma.campana.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al eliminar" }, { status: 500 });
  }
}
