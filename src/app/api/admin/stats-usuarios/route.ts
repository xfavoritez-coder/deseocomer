import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    const usuarios = await prisma.usuario.findMany({
      where: { geniePerfil: { not: undefined } },
      select: { geniePerfil: true },
    });

    const categorias: Record<string, number> = {};
    const comunas: Record<string, number> = {};
    const horarios: Record<string, number> = {};
    const ocasiones: Record<string, number> = {};
    const localesTop: Record<string, number> = {};
    const estilos: Record<string, number> = {};
    let totalPerfiles = 0;

    for (const u of usuarios) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gp = u.geniePerfil as any;
      if (!gp?.gustos) continue;
      totalPerfiles++;

      // Categorías preferidas
      if (gp.gustos.categorias) {
        for (const [cat, score] of Object.entries(gp.gustos.categorias)) {
          categorias[cat] = (categorias[cat] ?? 0) + (score as number);
        }
      }

      // Comunas preferidas
      if (gp.gustos.comunas) {
        for (const [com, score] of Object.entries(gp.gustos.comunas)) {
          comunas[com] = (comunas[com] ?? 0) + (score as number);
        }
      }

      // Horarios (momentos del día)
      if (gp.gustos.horario) {
        for (const [h, score] of Object.entries(gp.gustos.horario)) {
          horarios[h] = (horarios[h] ?? 0) + (score as number);
        }
      }

      // Ocasiones
      if (gp.gustos.ocasiones) {
        for (const [oc, score] of Object.entries(gp.gustos.ocasiones)) {
          ocasiones[oc] = (ocasiones[oc] ?? 0) + (score as number);
        }
      }

      // Locales más visitados
      if (gp.comportamiento?.localesVisitados) {
        for (const lv of gp.comportamiento.localesVisitados) {
          if (lv.nombre) localesTop[lv.nombre] = (localesTop[lv.nombre] ?? 0) + 1;
        }
      }
    }

    // Estilos alimentarios (campo directo del usuario)
    const estilosRaw = await prisma.usuario.groupBy({
      by: ["estiloAlimentario"],
      where: { estiloAlimentario: { notIn: ["", "no_especificado"] } },
      _count: true,
    });
    for (const e of estilosRaw) {
      if (e.estiloAlimentario) estilos[e.estiloAlimentario] = e._count;
    }

    // Top 30 de cada cosa
    const top = (obj: Record<string, number>, n = 30) =>
      Object.fromEntries(Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n));

    return NextResponse.json({
      totalPerfiles,
      categorias: top(categorias),
      comunas: top(comunas),
      horarios: top(horarios),
      ocasiones: top(ocasiones),
      localesTop: top(localesTop),
      estilos: top(estilos),
    }, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    console.error("[Admin stats-usuarios]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
