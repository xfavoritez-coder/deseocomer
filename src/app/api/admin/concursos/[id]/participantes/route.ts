import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const participantes = await prisma.participanteConcurso.findMany({
      where: { concursoId: id },
      include: { usuario: { select: { id: true, nombre: true, email: true, ipRegistro: true, createdAt: true } } },
      orderBy: { puntos: "desc" },
    });

    // Calcular sospechosos
    const result = participantes.map(p => {
      const flags: string[] = [];

      // Más de 5 referidos en menos de 2 horas
      const referidos = participantes.filter(r => r.referidoPor === p.usuarioId);
      if (referidos.length > 5) {
        const sorted = referidos.map(r => r.createdAt.getTime()).sort();
        for (let i = 0; i <= sorted.length - 5; i++) {
          if (sorted[i + 4] - sorted[i] < 2 * 60 * 60 * 1000) {
            flags.push("5+ referidos en <2h");
            break;
          }
        }
      }

      // Más de 3 referidos desde la misma IP
      const ipCounts: Record<string, number> = {};
      for (const r of referidos) {
        const ip = r.usuario?.ipRegistro ?? "";
        if (ip && ip !== "unknown") ipCounts[ip] = (ipCounts[ip] ?? 0) + 1;
      }
      if (Object.values(ipCounts).some(c => c > 3)) flags.push("3+ referidos misma IP");

      // Más de 2 referidos con mismo dominio de correo
      const domainCounts: Record<string, number> = {};
      for (const r of referidos) {
        const domain = r.usuario?.email?.split("@")[1]?.toLowerCase() ?? "";
        if (domain) domainCounts[domain] = (domainCounts[domain] ?? 0) + 1;
      }
      // Excluir dominios comunes
      const commonDomains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com"];
      for (const [domain, count] of Object.entries(domainCounts)) {
        if (count > 2 && !commonDomains.includes(domain)) {
          flags.push(`2+ referidos dominio ${domain}`);
          break;
        }
      }

      return {
        id: p.id,
        usuarioId: p.usuarioId,
        nombre: p.usuario?.nombre ?? "Usuario",
        email: p.usuario?.email ?? "",
        puntos: p.puntos,
        puntosPendientes: p.puntosPendientes,
        referidos: referidos.length,
        estado: p.estado,
        createdAt: p.createdAt,
        flags,
        sospechoso: flags.length > 0 || p.estado === "sospechoso",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin participantes GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    await params; // consume params
    const { participanteId, estado } = await req.json();
    if (!participanteId || !estado) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    if (!["activo", "sospechoso", "revisado", "descalificado"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const data: { estado: string; puntos?: number } = { estado };
    if (estado === "descalificado") data.puntos = 0;

    const updated = await prisma.participanteConcurso.update({
      where: { id: participanteId },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin participantes PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
