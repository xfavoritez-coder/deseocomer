import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const localId = req.nextUrl.searchParams.get("localId");
  if (!localId) {
    return NextResponse.json({ error: "localId requerido" }, { status: 400 });
  }

  const concurso = await prisma.concurso.findUnique({
    where: { id },
    select: {
      id: true,
      localId: true,
      premio: true,
      estado: true,
      _count: { select: { participantes: { where: { estado: { not: "descalificado" } } } } },
    },
  });

  if (!concurso || concurso.localId !== localId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (!["finalizado", "completado", "expirado"].includes(concurso.estado)) {
    return NextResponse.json({ error: "Concurso aún activo" }, { status: 400 });
  }

  const participantes = await prisma.participanteConcurso.findMany({
    where: { concursoId: id, estado: { not: "descalificado" } },
    orderBy: { puntos: "desc" },
    include: {
      usuario: {
        select: {
          nombre: true,
          email: true,
          telefono: true,
          ciudad: true,
          estiloAlimentario: true,
          comidasFavoritas: true,
        },
      },
    },
  });

  // Stats agregados
  let veganos = 0, vegetarianos = 0, comeDeTodo = 0;
  const comidasCount: Record<string, number> = {};

  for (const p of participantes) {
    const estilo = p.usuario.estiloAlimentario?.toLowerCase() ?? "";
    if (estilo === "vegano") veganos++;
    else if (estilo === "vegetariano") vegetarianos++;
    else comeDeTodo++;

    for (const comida of p.usuario.comidasFavoritas ?? []) {
      const key = comida.trim();
      if (key) comidasCount[key] = (comidasCount[key] ?? 0) + 1;
    }
  }

  const comidasTop = Object.entries(comidasCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nombre, count]) => ({ nombre, count }));

  const data = participantes.map((p, i) => ({
    posicion: i + 1,
    nombre: p.usuario.nombre,
    email: p.usuario.email,
    telefono: p.usuario.telefono ?? "",
    ciudad: p.usuario.ciudad ?? "",
    estiloAlimentario: p.usuario.estiloAlimentario ?? "",
    comidasFavoritas: p.usuario.comidasFavoritas ?? [],
    puntos: p.puntos,
  }));

  return NextResponse.json({
    concursoId: id,
    premio: concurso.premio,
    total: concurso._count.participantes,
    stats: {
      estilos: [
        { label: "Come de todo", emoji: "🥩", count: comeDeTodo },
        { label: "Vegetarianos", emoji: "🌱", count: vegetarianos },
        { label: "Veganos", emoji: "🌿", count: veganos },
      ],
      comidasTop,
    },
    participantes: data,
  });
}
