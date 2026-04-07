import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CLAVE = "admin_stats_cache";
const DC_PREFIXES = ["51.158.", "51.159.", "51.81.", "62.210.", "15.204.", "15.235.", "94.242.", "146.70.", "141.95.", "54.36.", "51.77.", "51.75.", "198.27.", "66.70.", "78.241.", "84.220."];

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ═══ 1. SUSPICIOUS USERS ═══
    const concursosActivos = await prisma.concurso.findMany({
      where: { activo: true, cancelado: false, fechaFin: { gt: new Date() } },
      select: { id: true, premio: true, slug: true },
    });
    const concursoIds = concursosActivos.map(c => c.id);

    let sospechosos: unknown[] = [];
    if (concursoIds.length > 0) {
      const participantes = await prisma.participanteConcurso.findMany({
        where: { concursoId: { in: concursoIds }, estado: "activo" },
        select: {
          id: true, concursoId: true, usuarioId: true, puntos: true,
          bonusRef: true, puntosMadrugador: true, puntosReferidosNuevos: true,
          puntosReferidosExistentes: true, puntosNivel2: true, puntosPendientes: true,
          puntosApoyos: true, referidorDirectoId: true,
          usuario: { select: { id: true, nombre: true, email: true, ipRegistro: true, createdAt: true } },
        },
      });

      const refsByUser: Record<string, typeof participantes> = {};
      for (const p of participantes) {
        if (p.referidorDirectoId) {
          if (!refsByUser[p.referidorDirectoId]) refsByUser[p.referidorDirectoId] = [];
          refsByUser[p.referidorDirectoId].push(p);
        }
      }

      const scored: { userId: string; nombre: string; email: string; concurso: string; concursoSlug: string; puntos: number; riesgo: number; flags: string[] }[] = [];
      const seen = new Set<string>();

      for (const p of participantes) {
        const key = `${p.usuario.id}-${p.concursoId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        let riesgo = 0;
        const flags: string[] = [];
        const refs = refsByUser[p.usuario.id] ?? [];
        if (refs.length === 0) continue;

        const sameIPRefs = refs.filter(r => r.usuario.ipRegistro && r.usuario.ipRegistro === p.usuario.ipRegistro);
        if (sameIPRefs.length > 0) { riesgo += 10; flags.push(`${sameIPRefs.length} ref misma IP`); }

        const refIPs: Record<string, number> = {};
        for (const r of refs) { const ip = r.usuario.ipRegistro; if (ip && ip !== "unknown") refIPs[ip] = (refIPs[ip] ?? 0) + 1; }
        if (Object.entries(refIPs).some(([, c]) => c > 2)) { riesgo += 10; flags.push("IPs con 3+ cuentas"); }

        const refsSorted = [...refs].sort((a, b) => new Date(a.usuario.createdAt).getTime() - new Date(b.usuario.createdAt).getTime());
        let rapidos = 0;
        for (let i = 1; i < refsSorted.length; i++) {
          if ((new Date(refsSorted[i].usuario.createdAt).getTime() - new Date(refsSorted[i - 1].usuario.createdAt).getTime()) / 60000 < 30) rapidos++;
        }
        if (rapidos > 5) { riesgo += 15; flags.push(`${rapidos} registros rápidos`); }
        else if (rapidos > 2) { riesgo += 8; flags.push(`${rapidos} registros rápidos`); }

        const vpnRefs = refs.filter(r => DC_PREFIXES.some(prefix => (r.usuario.ipRegistro ?? "").startsWith(prefix)));
        if (vpnRefs.length > 0) { riesgo += 30; flags.push(`${vpnRefs.length} ref VPN`); }

        const suma = 1 + (p.bonusRef ?? 0) + (p.puntosMadrugador ?? 0) + (p.puntosReferidosNuevos ?? 0) + (p.puntosReferidosExistentes ?? 0) + (p.puntosNivel2 ?? 0) + (p.puntosPendientes ?? 0) + (p.puntosApoyos ?? 0);
        if (p.puntos - suma > 5) { riesgo += 10; flags.push(`${p.puntos - suma} pts fantasma`); }

        if (riesgo > 0) {
          const concurso = concursosActivos.find(c => c.id === p.concursoId);
          scored.push({ userId: p.usuario.id, nombre: p.usuario.nombre ?? "?", email: p.usuario.email, concurso: concurso?.premio ?? "?", concursoSlug: concurso?.slug ?? p.concursoId, puntos: p.puntos, riesgo: Math.min(100, riesgo), flags });
        }
      }
      scored.sort((a, b) => b.riesgo - a.riesgo || b.puntos - a.puntos);
      sospechosos = scored.slice(0, 10);
    }

    // ═══ 2. USER TASTE STATS ═══
    const categorias: Record<string, number> = {};
    const comunas: Record<string, number> = {};
    const horarios: Record<string, number> = {};
    const ocasiones: Record<string, number> = {};
    const localesTop: Record<string, number> = {};
    let totalPerfiles = 0;

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
        if (gp.gustos.categorias) for (const [k, v] of Object.entries(gp.gustos.categorias)) categorias[k] = (categorias[k] ?? 0) + (v as number);
        if (gp.gustos.comunas) for (const [k, v] of Object.entries(gp.gustos.comunas)) comunas[k] = (comunas[k] ?? 0) + (v as number);
        if (gp.gustos.horario) for (const [k, v] of Object.entries(gp.gustos.horario)) horarios[k] = (horarios[k] ?? 0) + (v as number);
        if (gp.gustos.ocasiones) for (const [k, v] of Object.entries(gp.gustos.ocasiones)) ocasiones[k] = (ocasiones[k] ?? 0) + (v as number);
        if (gp.comportamiento?.localesVisitados) for (const lv of gp.comportamiento.localesVisitados) { if (lv.nombre) localesTop[lv.nombre] = (localesTop[lv.nombre] ?? 0) + 1; }
      }
    }

    const estilos: Record<string, number> = {};
    const estilosRaw = await prisma.usuario.groupBy({ by: ["estiloAlimentario"], where: { estiloAlimentario: { notIn: ["", "no_especificado"] } }, _count: true });
    for (const e of estilosRaw) { if (e.estiloAlimentario) estilos[e.estiloAlimentario] = e._count; }

    const top = (obj: Record<string, number>, n = 30) => Object.fromEntries(Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n));

    // ═══ 3. DAILY REGISTRATIONS ═══
    const desde = new Date();
    desde.setDate(desde.getDate() - 30);
    const regs = await prisma.usuario.findMany({ where: { createdAt: { gte: desde } }, select: { createdAt: true }, orderBy: { createdAt: "asc" } });
    const porDia: Record<string, number> = {};
    for (const u of regs) { const d = new Date(u.createdAt).toISOString().split("T")[0]; porDia[d] = (porDia[d] ?? 0) + 1; }
    const regResult: { dia: string; registros: number }[] = [];
    const cur = new Date(desde);
    const hoy = new Date();
    while (cur <= hoy) { const d = cur.toISOString().split("T")[0]; regResult.push({ dia: d, registros: porDia[d] ?? 0 }); cur.setDate(cur.getDate() + 1); }

    // ═══ SAVE CACHE ═══
    const cache = {
      sospechosos,
      usuarios: { totalPerfiles, categorias: top(categorias), comunas: top(comunas), horarios: top(horarios), ocasiones: top(ocasiones), localesTop: top(localesTop), estilos: top(estilos) },
      registros: { total: regs.length, porDia: regResult },
      calculadoAt: new Date().toISOString(),
    };

    const existing = await prisma.configSite.findUnique({ where: { clave: CLAVE } });
    if (existing) {
      await prisma.configSite.update({ where: { clave: CLAVE }, data: { valor: JSON.stringify(cache) } });
    } else {
      await prisma.configSite.create({ data: { id: CLAVE, clave: CLAVE, valor: JSON.stringify(cache) } });
    }

    console.log(`[Cron stats-admin] OK: ${sospechosos.length} sospechosos, ${totalPerfiles} perfiles, ${regs.length} registros`);
    return NextResponse.json({ ok: true, sospechosos: sospechosos.length, perfiles: totalPerfiles, registros: regs.length });
  } catch (error) {
    console.error("[Cron stats-admin]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
