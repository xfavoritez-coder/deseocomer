import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  emailConfirmacion,
  emailDisputa,
  emailDisputaAdmin,
} from "@/lib/emails/concurso-cierre";

// GET: Ganador confirma/disputa desde link de email
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = req.nextUrl.searchParams.get("token");
    const respuesta = req.nextUrl.searchParams.get("respuesta");

    if (!token || !respuesta) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        local: { select: { nombre: true, email: true, direccion: true, comuna: true, telefono: true } },
        ganadorActual: { select: { id: true, nombre: true, email: true, telefono: true } },
      },
    });

    if (!concurso) {
      return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });
    }
    if (concurso.confirmacionToken !== token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 403 });
    }
    if (!concurso.ganadorActual) {
      return NextResponse.json({ error: "Sin ganador asignado" }, { status: 400 });
    }
    if (concurso.estado === "completado") {
      return NextResponse.json({ ok: true, mensaje: "El premio ya fue confirmado", estado: "completado" });
    }

    if (respuesta === "si") {
      await prisma.concurso.update({
        where: { id: concurso.id },
        data: {
          estado: "completado",
          premioConfirmadoAt: new Date(),
          premioEntregado: true,
          premioEntregadoAt: new Date(),
        },
      });
      try {
        await emailConfirmacion({ nombre: concurso.ganadorActual.nombre, email: concurso.ganadorActual.email });
      } catch {}
      return NextResponse.json({ ok: true, estado: "completado" });
    }

    if (respuesta === "no") {
      await prisma.concurso.update({
        where: { id: concurso.id },
        data: {
          estado: "en_disputa",
          disputaAt: new Date(),
        },
      });
      const ganador = { nombre: concurso.ganadorActual.nombre, email: concurso.ganadorActual.email, telefono: concurso.ganadorActual.telefono };
      try {
        await emailDisputa(ganador);
        await emailDisputaAdmin(
          {
            concursoId: concurso.id,
            titulo: concurso.premio,
            premio: concurso.premio,
            codigoEntrega: concurso.codigoEntrega || "",
            local: concurso.local,
          },
          ganador,
        );
      } catch {}
      return NextResponse.json({ ok: true, estado: "en_disputa" });
    }

    return NextResponse.json({ error: "Respuesta inválida" }, { status: 400 });
  } catch (err) {
    console.error("[confirmar-entrega]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Local confirma entrega manualmente (legacy + nuevo)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { localId } = await req.json();
    if (!localId) return NextResponse.json({ error: "Falta localId" }, { status: 400 });

    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }], localId },
    });
    if (!concurso) return NextResponse.json({ error: "Concurso no encontrado" }, { status: 404 });
    if (new Date(concurso.fechaFin) > new Date()) return NextResponse.json({ error: "El concurso aún no ha finalizado" }, { status: 400 });
    if (concurso.estado === "completado" || concurso.premioEntregado) return NextResponse.json({ error: "El premio ya fue confirmado" }, { status: 400 });

    await prisma.concurso.update({
      where: { id: concurso.id },
      data: {
        premioEntregado: true,
        premioEntregadoAt: new Date(),
        estado: "completado",
        premioConfirmadoAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
