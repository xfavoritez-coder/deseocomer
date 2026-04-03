import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";
import crypto from "crypto";
import { emailGanador, emailLocal, emailNuevoGanador } from "@/lib/emails/concurso-cierre";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://deseocomer.com";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const body = await req.json();

    // ── Admin action: aprobar ganador (en_revision → finalizado) ──
    if (body.accion === "aprobar_ganador") {
      const c = await prisma.concurso.findUnique({
        where: { id },
        include: {
          local: { select: { email: true, nombre: true, direccion: true, comuna: true, telefono: true } },
          ganadorActual: { select: { id: true, nombre: true, email: true, telefono: true } },
        },
      });
      if (!c || c.estado !== "en_revision") return NextResponse.json({ error: "No está en revisión" }, { status: 400 });

      const token = crypto.randomUUID();
      await prisma.concurso.update({ where: { id }, data: { estado: "finalizado", confirmacionToken: token, ganadorNotificadoAt: new Date(), localNotificadoAt: new Date() } });

      if (c.ganadorActual) {
        const emailData = { concursoId: c.id, titulo: c.premio, premio: c.premio, codigoEntrega: c.codigoEntrega!, local: c.local };
        const ganador = { nombre: c.ganadorActual.nombre, email: c.ganadorActual.email, telefono: c.ganadorActual.telefono };
        const urls = { confirm: `${BASE_URL}/concursos/confirmar?id=${c.id}&token=${token}&respuesta=si`, disputa: `${BASE_URL}/concursos/confirmar?id=${c.id}&token=${token}&respuesta=no` };
        try {
          await emailGanador(emailData, ganador, urls.confirm, urls.disputa);
          await emailLocal(emailData, c.local.email, ganador);
        } catch {}
      }
      return NextResponse.json({ ok: true, estado: "finalizado" });
    }

    // ── Admin action: descalificar ganador y pasar al siguiente ──
    if (body.accion === "descalificar_ganador") {
      const c = await prisma.concurso.findUnique({
        where: { id },
        include: { local: { select: { email: true, nombre: true, direccion: true, comuna: true, telefono: true } } },
      });
      if (!c) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

      // Find next winner
      let siguienteId: string | null = null;
      let orden = 2;
      if (c.ganadorActualId === c.ganador1Id && c.ganador2Id) { siguienteId = c.ganador2Id; orden = 2; }
      else if (c.ganadorActualId === c.ganador2Id && c.ganador3Id) { siguienteId = c.ganador3Id; orden = 3; }

      if (siguienteId) {
        const token = crypto.randomUUID();
        await prisma.concurso.update({
          where: { id },
          data: { ganadorActualId: siguienteId, ganadorDescartadoRazon: "fraude", estado: "finalizado", confirmacionToken: token, ganadorNotificadoAt: new Date(), localNotificadoAt: new Date() },
        });
        const nuevoGanador = await prisma.usuario.findUnique({ where: { id: siguienteId }, select: { nombre: true, email: true, telefono: true } });
        if (nuevoGanador) {
          const emailData = { concursoId: c.id, titulo: c.premio, premio: c.premio, codigoEntrega: c.codigoEntrega!, local: c.local };
          const urls = { confirm: `${BASE_URL}/concursos/confirmar?id=${c.id}&token=${token}&respuesta=si`, disputa: `${BASE_URL}/concursos/confirmar?id=${c.id}&token=${token}&respuesta=no` };
          try {
            await emailNuevoGanador(emailData, nuevoGanador, orden, orden === 2 ? 5 : 3, urls.confirm, urls.disputa);
            await emailLocal(emailData, c.local.email, nuevoGanador);
          } catch {}
        }
        return NextResponse.json({ ok: true, estado: "finalizado", nuevoGanador: siguienteId });
      } else {
        await prisma.concurso.update({ where: { id }, data: { estado: "expirado", premioExpiradoAt: new Date(), ganadorDescartadoRazon: "fraude" } });
        return NextResponse.json({ ok: true, estado: "expirado" });
      }
    }

    // ── Admin action: resolver disputa ──
    if (body.accion === "resolver_disputa") {
      const resolucion = body.resolucion; // "entregado" | "no_entregado"
      if (resolucion === "entregado") {
        await prisma.concurso.update({ where: { id }, data: { estado: "completado", premioConfirmadoAt: new Date(), premioEntregado: true, premioEntregadoAt: new Date() } });
      } else {
        // Reopen as finalizado so the flow continues
        await prisma.concurso.update({ where: { id }, data: { estado: "finalizado", disputaAt: null } });
      }
      return NextResponse.json({ ok: true, estado: resolucion === "entregado" ? "completado" : "finalizado" });
    }

    // ── Si solo viene activo, es cerrar/reactivar ──
    if (body.activo !== undefined && Object.keys(body).length === 1) {
      const data: Record<string, unknown> = { activo: body.activo };
      if (!body.activo) data.estado = "cancelado";
      const concurso = await prisma.concurso.update({ where: { id }, data });
      return NextResponse.json(concurso);
    }

    // ── Edición completa (admin puede editar siempre) ──
    const concurso = await prisma.concurso.update({
      where: { id },
      data: {
        ...(body.premio !== undefined && { premio: body.premio }),
        ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
        ...(body.imagenUrl !== undefined && { imagenUrl: body.imagenUrl }),
        ...(body.fechaFin !== undefined && { fechaFin: new Date(body.fechaFin) }),
        ...(body.condiciones !== undefined && { condiciones: body.condiciones }),
        ...(body.activo !== undefined && { activo: body.activo }),
      },
    });
    return NextResponse.json(concurso);
  } catch (error) {
    console.error("[Admin concursos PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
