import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const concurso = await prisma.concurso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        local: { select: { id: true, nombre: true, slug: true, logoUrl: true, portadaUrl: true, comuna: true, direccion: true, telefono: true, email: true } },
        participantes: { where: { estado: { not: "descalificado" } }, include: { usuario: { select: { id: true, nombre: true, fotoUrl: true, email: true, telefono: true } } }, orderBy: { puntos: "desc" } },
        ganadorActual: { select: { id: true, nombre: true } },
        _count: { select: { participantes: { where: { estado: { not: "descalificado" } } }, listaEspera: true } },
      },
    });
    if (!concurso) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Increment view count (fire and forget)
    prisma.concurso.update({ where: { id: concurso.id }, data: { vistas: { increment: 1 } } }).catch(() => {});

    // Lazy close: if contest ended but still "activo", close it now and send emails
    if (concurso.estado === "activo" && new Date(concurso.fechaFin) <= new Date() && concurso.participantes.length > 0) {
      const crypto = await import("crypto");
      const { emailGanador, emailLocal } = await import("@/lib/emails/concurso-cierre");
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";

      const codigo = `DC-${Math.floor(100000 + Math.random() * 900000)}`;
      const token = crypto.randomUUID();

      let ganador1Id: string;
      let ganador2Id: string | null = null;
      let ganador3Id: string | null = null;

      if (concurso.modalidadConcurso === "sorteo") {
        const totalBoletos = concurso.participantes.reduce((acc, p) => acc + Math.max(1, p.puntos), 0);
        let rand = Math.random() * totalBoletos;
        let ganadorIdx = 0;
        for (let i = 0; i < concurso.participantes.length; i++) {
          rand -= Math.max(1, concurso.participantes[i].puntos);
          if (rand <= 0) { ganadorIdx = i; break; }
        }
        ganador1Id = concurso.participantes[ganadorIdx].usuario.id;
        const fallbacks = concurso.participantes.filter(p => p.usuario.id !== ganador1Id).sort((a, b) => b.puntos - a.puntos);
        ganador2Id = fallbacks[0]?.usuario.id ?? null;
        ganador3Id = fallbacks[1]?.usuario.id ?? null;
      } else {
        const [p1, p2, p3] = concurso.participantes;
        ganador1Id = p1.usuario.id;
        ganador2Id = p2?.usuario.id ?? null;
        ganador3Id = p3?.usuario.id ?? null;
      }

      const ganadorPart = concurso.participantes.find(p => p.usuario.id === ganador1Id)!;
      const esSospechoso = ganadorPart.estado === "sospechoso";

      await prisma.concurso.update({
        where: { id: concurso.id },
        data: {
          estado: esSospechoso ? "en_revision" : "finalizado",
          activo: false,
          ganador1Id,
          ganador2Id,
          ganador3Id,
          ganadorActualId: ganador1Id,
          codigoEntrega: codigo,
          confirmacionToken: token,
          ...(!esSospechoso ? { ganadorNotificadoAt: new Date(), localNotificadoAt: new Date() } : {}),
        },
      });

      if (!esSospechoso) {
        const emailData = {
          concursoId: concurso.id, titulo: concurso.premio, premio: concurso.premio, codigoEntrega: codigo,
          local: { nombre: concurso.local.nombre, direccion: concurso.local.direccion, comuna: concurso.local.comuna, telefono: concurso.local.telefono },
        };
        const ganador = { nombre: ganadorPart.usuario.nombre, email: ganadorPart.usuario.email!, telefono: ganadorPart.usuario.telefono };
        const urls = {
          confirm: `${BASE_URL}/concursos/confirmar?id=${concurso.id}&token=${token}&respuesta=si`,
          disputa: `${BASE_URL}/concursos/confirmar?id=${concurso.id}&token=${token}&respuesta=no`,
        };
        try {
          await emailGanador(emailData, ganador, urls.confirm, urls.disputa);
          await emailLocal(emailData, concurso.local.email!, ganador);
        } catch (e) { console.error("[Lazy close email]", e); }
      }

      // Re-fetch with updated data
      const updated = await prisma.concurso.findFirst({
        where: { id: concurso.id },
        include: {
          local: { select: { id: true, nombre: true, slug: true, logoUrl: true, portadaUrl: true, comuna: true, direccion: true, telefono: true, email: true } },
          participantes: { where: { estado: { not: "descalificado" } }, include: { usuario: { select: { id: true, nombre: true, fotoUrl: true } } }, orderBy: { puntos: "desc" } },
          ganadorActual: { select: { id: true, nombre: true } },
          _count: { select: { participantes: { where: { estado: { not: "descalificado" } } } } },
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json(concurso);
  } catch (error) {
    console.error("[API /concursos/[id]] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Check participants
    const existing = await prisma.concurso.findUnique({
      where: { id },
      include: { _count: { select: { participantes: true } } },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Cancel action
    if (body.cancelar === true) {
      if ((existing._count?.participantes ?? 0) > 0) {
        return NextResponse.json({ error: "No puedes cancelar un concurso con participantes activos" }, { status: 403 });
      }
      const updated = await prisma.concurso.update({
        where: { id },
        data: { cancelado: true, activo: false, estado: "cancelado", motivoCancelacion: body.motivo ?? "" },
      });
      return NextResponse.json(updated);
    }

    // Edit action — block if has participants
    if ((existing._count?.participantes ?? 0) > 0) {
      return NextResponse.json({ error: "No puedes editar un concurso con participantes activos" }, { status: 403 });
    }

    const concurso = await prisma.concurso.update({
      where: { id },
      data: {
        ...(body.premio !== undefined && { premio: body.premio }),
        ...(body.descripcion !== undefined && { descripcion: body.descripcion }),
        ...(body.imagenUrl !== undefined && { imagenUrl: body.imagenUrl }),
        ...(body.fechaFin !== undefined && { fechaFin: new Date(body.fechaFin) }),
        ...(body.condiciones !== undefined && { condiciones: body.condiciones }),
      },
    });
    return NextResponse.json(concurso);
  } catch (error) {
    console.error("[API /concursos/[id] PUT] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
