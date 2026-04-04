import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function normalizar(texto: string): string {
  return texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// POST: usuario guarda una comida custom
export async function POST(req: NextRequest) {
  try {
    const { usuarioId, texto } = await req.json();
    if (!usuarioId || !texto?.trim()) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }
    const textoNorm = normalizar(texto);
    if (textoNorm.length < 2 || textoNorm.length > 50) {
      return NextResponse.json({ error: "Texto inválido" }, { status: 400 });
    }
    const existing = await prisma.comidaCustom.findFirst({
      where: { usuarioId, texto: textoNorm },
    });
    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id });
    }
    const custom = await prisma.comidaCustom.create({
      data: {
        texto: textoNorm,
        textoOriginal: texto.trim(),
        usuarioId,
      },
    });
    return NextResponse.json({ ok: true, id: custom.id });
  } catch (e) {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}

// GET: admin obtiene comidas custom agrupadas
export async function GET(req: NextRequest) {
  try {
    const customs = await prisma.comidaCustom.findMany({
      where: { ignorada: false, promovidaA: null },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { creadoEn: "desc" },
    });
    // Agrupar por texto normalizado
    const grupos: Record<string, {
      texto: string;
      variantes: string[];
      count: number;
      usuarios: { id: string; nombre: string }[];
      ids: string[];
      ultimaVez: Date;
    }> = {};
    for (const c of customs) {
      if (!grupos[c.texto]) {
        grupos[c.texto] = { texto: c.texto, variantes: [], count: 0, usuarios: [], ids: [], ultimaVez: c.creadoEn };
      }
      const g = grupos[c.texto];
      g.count++;
      if (!g.variantes.includes(c.textoOriginal)) g.variantes.push(c.textoOriginal);
      g.usuarios.push({ id: c.usuarioId, nombre: c.usuario.nombre });
      g.ids.push(c.id);
      if (c.creadoEn > g.ultimaVez) g.ultimaVez = c.creadoEn;
    }
    const resultado = Object.values(grupos).sort((a, b) => b.count - a.count);
    return NextResponse.json(resultado);
  } catch (e) {
    return NextResponse.json({ error: "Error al obtener" }, { status: 500 });
  }
}

// PUT: admin promueve, vincula o ignora
export async function PUT(req: NextRequest) {
  try {
    const { accion, texto, categoriaId, nuevaCategoria } = await req.json();
    // accion: "promover" | "vincular" | "ignorar"

    if (accion === "ignorar") {
      await prisma.comidaCustom.updateMany({
        where: { texto, ignorada: false, promovidaA: null },
        data: { ignorada: true },
      });
      return NextResponse.json({ ok: true });
    }

    if (accion === "vincular" && categoriaId) {
      // Vincular a categoría existente
      const cat = await prisma.categoriaComida.findUnique({ where: { id: categoriaId } });
      if (!cat) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

      const customs = await prisma.comidaCustom.findMany({
        where: { texto, ignorada: false, promovidaA: null },
      });
      // Marcar como promovidas
      await prisma.comidaCustom.updateMany({
        where: { texto, ignorada: false, promovidaA: null },
        data: { promovidaA: cat.id },
      });
      // Agregar categoría a comidasFavoritas de esos usuarios
      const userIds = [...new Set(customs.map(c => c.usuarioId))];
      for (const uid of userIds) {
        const user = await prisma.usuario.findUnique({ where: { id: uid }, select: { comidasFavoritas: true } });
        if (user && !user.comidasFavoritas.includes(cat.nombre)) {
          await prisma.usuario.update({
            where: { id: uid },
            data: { comidasFavoritas: { push: cat.nombre } },
          });
        }
      }
      return NextResponse.json({ ok: true, categoria: cat.nombre });
    }

    if (accion === "promover" && nuevaCategoria) {
      // Crear nueva categoría y vincular
      const slug = normalizar(nuevaCategoria.nombre);
      const cat = await prisma.categoriaComida.create({
        data: {
          nombre: nuevaCategoria.nombre,
          slug,
          emoji: nuevaCategoria.emoji || "",
          tipo: nuevaCategoria.tipo || "tag",
          estiloExcluido: nuevaCategoria.estiloExcluido || [],
          orden: nuevaCategoria.orden ?? 99,
        },
      });
      const customs = await prisma.comidaCustom.findMany({
        where: { texto, ignorada: false, promovidaA: null },
      });
      await prisma.comidaCustom.updateMany({
        where: { texto, ignorada: false, promovidaA: null },
        data: { promovidaA: cat.id },
      });
      const userIds = [...new Set(customs.map(c => c.usuarioId))];
      for (const uid of userIds) {
        const user = await prisma.usuario.findUnique({ where: { id: uid }, select: { comidasFavoritas: true } });
        if (user && !user.comidasFavoritas.includes(cat.nombre)) {
          await prisma.usuario.update({
            where: { id: uid },
            data: { comidasFavoritas: { push: cat.nombre } },
          });
        }
      }
      return NextResponse.json({ ok: true, categoria: cat.nombre, categoriaId: cat.id });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
