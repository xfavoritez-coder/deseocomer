import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { makeLocalSlug } from "@/lib/slugify";
import { CATEGORIAS } from "@/lib/categorias";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Support both CUID and slug lookup
    const local = await prisma.local.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        menuItems: true,
        concursos: { include: { participantes: { include: { usuario: { select: { id: true, nombre: true } } }, orderBy: { puntos: "desc" } }, _count: { select: { participantes: true } } }, orderBy: { createdAt: "desc" } },
        promociones: { where: { activa: true } },
        resenas: { include: { usuario: { select: { id: true, nombre: true } } } },
        _count: { select: { favoritos: true, resenas: true } },
      },
    });
    if (!local) return NextResponse.json({ error: "Local no encontrado" }, { status: 404 });
    // Increment view count (fire and forget)
    prisma.local.update({ where: { id: local.id }, data: { vistas: { increment: 1 } } }).catch(() => {});
    const { password: _, ...safe } = local as Record<string, unknown>;

    // Limpiar datos de locales importados
    if (local.origenImportacion === 'GOOGLE_PLACES') {
      const comunaLimpia = (local.comuna ?? '')
        .replace(/,.*$/, '')
        .replace(/\s*local\s*\d+/gi, '')
        .replace(/\s*\d{5,}/g, '')
        .trim();
      safe.comuna = comunaLimpia || local.comuna;

      const direccionLimpia = (local.direccion ?? '')
        .replace(/,?\s*\d{7}\s*/g, '')
        .replace(/,\s*local\s*\d+\s*$/gi, '')
        .replace(/,\s*región\s*metropolitana.*/gi, '')
        .trim();
      safe.direccion = direccionLimpia || local.direccion;

      const cats = local.categorias ?? [];
      safe.categorias = [...new Set(cats)];
    }

    // Para locales importados: generar horarios desde horarioGoogle si no tiene horarios propios
    if (local.origenImportacion === 'GOOGLE_PLACES' && !local.horarios && local.horarioGoogle) {
      const MAPA_DIAS: Record<string, string> = {
        'lunes': 'Lunes', 'martes': 'Martes', 'miércoles': 'Miércoles',
        'jueves': 'Jueves', 'viernes': 'Viernes', 'sábado': 'Sábado', 'domingo': 'Domingo'
      };
      const hg = local.horarioGoogle as { descripcion?: string[] };
      if (hg.descripcion) {
        safe.horarios = hg.descripcion.map((linea: string) => {
          const [diaRaw, horasRaw] = linea.split(': ');
          const dia = MAPA_DIAS[diaRaw?.toLowerCase().trim()] ?? diaRaw;
          if (!horasRaw || horasRaw.toLowerCase().includes('cerrado')) {
            return { dia, abre: '', cierra: '', cerrado: true };
          }
          const separador = horasRaw.includes('–') ? '–' : '-';
          const [abre, cierra] = horasRaw.split(separador).map((h: string) => h.trim());
          return { dia, abre: abre ?? '', cierra: cierra ?? '', cerrado: false };
        });
      }
    }

    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Generate slug if missing
    const existing = await prisma.local.findUnique({ where: { id }, select: { slug: true, comuna: true } });
    let slugUpdate: { slug?: string } = {};
    if (existing && !existing.slug && body.nombre) {
      const slug = makeLocalSlug(body.nombre, body.comuna ?? existing.comuna ?? undefined);
      const taken = await prisma.local.findUnique({ where: { slug }, select: { id: true } });
      if (!taken) slugUpdate = { slug };
    }

    const local = await prisma.local.update({
      where: { id },
      data: {
        nombre: body.nombre, descripcion: body.descripcion,
        historia: body.historia, telefono: body.telefono, instagram: body.instagram,
        direccion: body.direccion, comuna: body.comuna, ciudad: body.ciudad,
        ...(body.nombreDueno !== undefined && { nombreDueno: body.nombreDueno }),
        ...(body.celularDueno !== undefined && { celularDueno: body.celularDueno }),
        ...(body.sitioWeb !== undefined && { sitioWeb: body.sitioWeb }),
        lat: body.lat, lng: body.lng,
        horarios: body.horarios, logoUrl: body.logoUrl, portadaUrl: body.portadaUrl,
        galeria: body.galeria, tieneMenu: body.tieneMenu,
        ...(body.categorias !== undefined && {
          categorias: Array.isArray(body.categorias)
            ? body.categorias.filter((c: string) => CATEGORIAS.includes(c as any)).slice(0, 3)
            : [],
        }),
        ...(body.sirveEnMesa !== undefined && { sirveEnMesa: body.sirveEnMesa }),
        ...(body.tieneDelivery !== undefined && { tieneDelivery: body.tieneDelivery }),
        ...(body.comunasDelivery !== undefined && { comunasDelivery: body.comunasDelivery }),
        ...(body.tieneRetiro !== undefined && { tieneRetiro: body.tieneRetiro }),
        ...(body.linkPedido !== undefined && { linkPedido: body.linkPedido }),
        ...slugUpdate,
      },
    });
    const { password: _, ...safe } = local;
    return NextResponse.json(safe);
  } catch (err) {
    console.error("[PUT /api/locales] Error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
