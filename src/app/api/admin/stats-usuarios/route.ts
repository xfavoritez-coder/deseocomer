import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    const categorias: Record<string, number> = {};
    const comunas: Record<string, number> = {};
    const horarios: Record<string, number> = {};
    const ocasiones: Record<string, number> = {};
    const localesTop: Record<string, number> = {};
    const estilos: Record<string, number> = {};
    let totalPerfiles = 0;

    // Process in batches of 100 to avoid memory/connection issues
    let cursor: string | undefined;
    while (true) {
      const batch = await prisma.usuario.findMany({
        take: 100,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        where: { geniePerfil: { not: undefined } },
        select: { id: true, geniePerfil: true },
        orderBy: { id: "asc" },
      });

      if (batch.length === 0) break;
      cursor = batch[batch.length - 1].id;

      for (const u of batch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gp = u.geniePerfil as any;
        if (!gp?.gustos) continue;
        totalPerfiles++;

        if (gp.gustos.categorias) {
          for (const [cat, score] of Object.entries(gp.gustos.categorias)) {
            categorias[cat] = (categorias[cat] ?? 0) + (score as number);
          }
        }
        if (gp.gustos.comunas) {
          for (const [com, score] of Object.entries(gp.gustos.comunas)) {
            comunas[com] = (comunas[com] ?? 0) + (score as number);
          }
        }
        if (gp.gustos.horario) {
          for (const [h, score] of Object.entries(gp.gustos.horario)) {
            horarios[h] = (horarios[h] ?? 0) + (score as number);
          }
        }
        if (gp.gustos.ocasiones) {
          for (const [oc, score] of Object.entries(gp.gustos.ocasiones)) {
            ocasiones[oc] = (ocasiones[oc] ?? 0) + (score as number);
          }
        }
        if (gp.comportamiento?.localesVisitados) {
          for (const lv of gp.comportamiento.localesVisitados) {
            if (lv.nombre) localesTop[lv.nombre] = (localesTop[lv.nombre] ?? 0) + 1;
          }
        }
      }
    }

    // Estilos alimentarios
    const estilosRaw = await prisma.usuario.groupBy({
      by: ["estiloAlimentario"],
      where: { estiloAlimentario: { notIn: ["", "no_especificado"] } },
      _count: true,
    });
    for (const e of estilosRaw) {
      if (e.estiloAlimentario) estilos[e.estiloAlimentario] = e._count;
    }

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
      headers: { "Cache-Control": "private, max-age=120" },
    });
  } catch (error) {
    console.error("[Admin stats-usuarios]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
