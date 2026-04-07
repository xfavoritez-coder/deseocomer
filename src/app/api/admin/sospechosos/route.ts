import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

const DC_PREFIXES = ["51.158.", "51.159.", "51.81.", "62.210.", "15.204.", "15.235.", "94.242.", "146.70.", "141.95.", "54.36.", "51.77.", "51.75.", "198.27.", "66.70.", "78.241.", "84.220."];

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;

  try {
    // Get active contests
    const concursosActivos = await prisma.concurso.findMany({
      where: { activo: true, cancelado: false, fechaFin: { gt: new Date() } },
      select: { id: true, premio: true, slug: true },
    });
    const concursoIds = concursosActivos.map(c => c.id);
    if (concursoIds.length === 0) return NextResponse.json({ sospechosos: [] });

    // Get all active participants with their referrals
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

    // Build IP map and referral map
    const ipMap: Record<string, string[]> = {}; // ip -> [userId, ...]
    for (const p of participantes) {
      const ip = p.usuario.ipRegistro;
      if (ip && ip !== "unknown") {
        if (!ipMap[ip]) ipMap[ip] = [];
        if (!ipMap[ip].includes(p.usuario.id)) ipMap[ip].push(p.usuario.id);
      }
    }

    // Group referrals by referrer
    const refsByUser: Record<string, typeof participantes> = {};
    for (const p of participantes) {
      if (p.referidorDirectoId) {
        if (!refsByUser[p.referidorDirectoId]) refsByUser[p.referidorDirectoId] = [];
        refsByUser[p.referidorDirectoId].push(p);
      }
    }

    // Score each participant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scored: { userId: string; nombre: string; email: string; concurso: string; concursoSlug: string; puntos: number; riesgo: number; flags: string[] }[] = [];

    const seen = new Set<string>();
    for (const p of participantes) {
      const key = `${p.usuario.id}-${p.concursoId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      let riesgo = 0;
      const flags: string[] = [];
      const refs = refsByUser[p.usuario.id] ?? [];

      // 1. Referrals from same IP as participant
      const sameIPRefs = refs.filter(r => r.usuario.ipRegistro && r.usuario.ipRegistro === p.usuario.ipRegistro);
      if (sameIPRefs.length > 0) {
        riesgo += 25;
        flags.push(`${sameIPRefs.length} ref misma IP`);
      }

      // 2. Referrals sharing IPs with each other
      const refIPs: Record<string, number> = {};
      for (const r of refs) {
        const ip = r.usuario.ipRegistro;
        if (ip && ip !== "unknown") refIPs[ip] = (refIPs[ip] ?? 0) + 1;
      }
      const sharedIPs = Object.entries(refIPs).filter(([, c]) => c > 1);
      if (sharedIPs.length > 0) {
        riesgo += 20;
        flags.push(`${sharedIPs.reduce((a, [, c]) => a + c, 0)} refs IPs compartidas`);
      }

      // 3. Rapid registrations among referrals
      const refsSorted = [...refs].sort((a, b) => new Date(a.usuario.createdAt).getTime() - new Date(b.usuario.createdAt).getTime());
      let rapidos = 0;
      for (let i = 1; i < refsSorted.length; i++) {
        const diff = (new Date(refsSorted[i].usuario.createdAt).getTime() - new Date(refsSorted[i - 1].usuario.createdAt).getTime()) / 60000;
        if (diff < 15) rapidos++;
      }
      if (rapidos > 2) {
        riesgo += 15;
        flags.push(`${rapidos} registros <15min`);
      }

      // 4. VPN IPs among referrals
      const vpnRefs = refs.filter(r => DC_PREFIXES.some(prefix => (r.usuario.ipRegistro ?? "").startsWith(prefix)));
      if (vpnRefs.length > 0) {
        riesgo += 20;
        flags.push(`${vpnRefs.length} ref VPN`);
      }

      // 5. Ghost points
      const suma = 1 + (p.bonusRef ?? 0) + (p.puntosMadrugador ?? 0) + (p.puntosReferidosNuevos ?? 0) + (p.puntosReferidosExistentes ?? 0) + (p.puntosNivel2 ?? 0) + (p.puntosPendientes ?? 0) + (p.puntosApoyos ?? 0);
      const fantasma = p.puntos - suma;
      if (fantasma > 3) {
        riesgo += 10;
        flags.push(`${fantasma} pts fantasma`);
      }

      // 6. Participant IP is shared with other unrelated accounts
      const ipUsers = ipMap[p.usuario.ipRegistro ?? ""] ?? [];
      if (ipUsers.length > 2) {
        riesgo += 10;
        flags.push(`IP compartida ${ipUsers.length} cuentas`);
      }

      if (riesgo > 0) {
        const concurso = concursosActivos.find(c => c.id === p.concursoId);
        scored.push({
          userId: p.usuario.id,
          nombre: p.usuario.nombre ?? "?",
          email: p.usuario.email,
          concurso: concurso?.premio ?? "?",
          concursoSlug: concurso?.slug ?? p.concursoId,
          puntos: p.puntos,
          riesgo: Math.min(100, riesgo),
          flags,
        });
      }
    }

    // Sort by risk and return top 10
    scored.sort((a, b) => b.riesgo - a.riesgo || b.puntos - a.puntos);

    return NextResponse.json({ sospechosos: scored.slice(0, 10) });
  } catch (error) {
    console.error("[Admin sospechosos]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
