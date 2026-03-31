import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const body = await req.json();

    // Si solo viene activo, es cerrar/reactivar
    if (body.activo !== undefined && Object.keys(body).length === 1) {
      const concurso = await prisma.concurso.update({ where: { id }, data: { activo: body.activo } });
      return NextResponse.json(concurso);
    }

    // Edición completa (admin puede editar siempre)
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
