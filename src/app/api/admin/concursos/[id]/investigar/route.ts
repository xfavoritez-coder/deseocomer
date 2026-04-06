import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id: concursoId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

    // Get participant
    const participante = await prisma.participanteConcurso.findFirst({
      where: { concursoId, usuarioId: userId },
      include: { usuario: { select: { id: true, nombre: true, email: true, ipRegistro: true, createdAt: true } } },
    });
    if (!participante) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Get all referrals
    const referidos = await prisma.participanteConcurso.findMany({
      where: { concursoId, referidorDirectoId: userId },
      include: { usuario: { select: { id: true, nombre: true, email: true, ipRegistro: true, emailVerificado: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Analyze
    const ips: Record<string, number> = {};
    const dominios: Record<string, number> = {};
    const gmailNormalized: Record<string, string[]> = {};
    const registrosRapidos: { from: string; to: string; minutos: number }[] = [];

    for (const r of referidos) {
      const ip = r.usuario.ipRegistro || "unknown";
      ips[ip] = (ips[ip] ?? 0) + 1;
      const email = r.usuario.email ?? "";
      const d = email.split("@")[1] ?? "?";
      dominios[d] = (dominios[d] ?? 0) + 1;

      // Gmail normalization
      if (d === "gmail.com") {
        const norm = email.split("@")[0].toLowerCase().replace(/\./g, "").replace(/\+.*$/, "");
        if (!gmailNormalized[norm]) gmailNormalized[norm] = [];
        gmailNormalized[norm].push(r.usuario.nombre ?? "?");
      }
    }

    // Check rapid registrations
    for (let i = 1; i < referidos.length; i++) {
      const diff = (new Date(referidos[i].usuario.createdAt).getTime() - new Date(referidos[i - 1].usuario.createdAt).getTime()) / 60000;
      if (diff < 30) {
        registrosRapidos.push({
          from: referidos[i - 1].usuario.nombre ?? "?",
          to: referidos[i].usuario.nombre ?? "?",
          minutos: Math.round(diff),
        });
      }
    }

    // IPs de datacenter
    const DC_PREFIXES = ["51.158.", "51.159.", "51.81.", "62.210.", "15.204.", "15.235.", "94.242.", "146.70.", "141.95."];
    const ipsVPN = referidos.filter(r => DC_PREFIXES.some(p => (r.usuario.ipRegistro ?? "").startsWith(p))).length;

    // Same IP as investigado
    const mismaIP = referidos.filter(r => r.usuario.ipRegistro === participante.usuario.ipRegistro && participante.usuario.ipRegistro !== "unknown").length;

    // Gmail duplicates
    const emailsDuplicados = Object.entries(gmailNormalized).filter(([, names]) => names.length > 1);

    // Risk score
    let riesgo = 0;
    if (ipsVPN > 0) riesgo += 30;
    if (emailsDuplicados.length > 0) riesgo += 30;
    if (registrosRapidos.length > 5) riesgo += 20;
    if (mismaIP > 0) riesgo += 10;
    if (Object.values(ips).some(v => v > 2)) riesgo += 10;

    return NextResponse.json({
      participante: {
        nombre: participante.usuario.nombre,
        email: participante.usuario.email,
        ip: participante.usuario.ipRegistro,
        puntos: participante.puntos,
        estado: participante.estado,
        refNuevos: participante.puntosReferidosNuevos,
        refExistentes: participante.puntosReferidosExistentes,
        nivel2: participante.puntosNivel2,
      },
      totalReferidos: referidos.length,
      referidos: referidos.map(r => ({
        nombre: r.usuario.nombre,
        email: r.usuario.email,
        ip: r.usuario.ipRegistro,
        verificado: r.usuario.emailVerificado,
        createdAt: r.usuario.createdAt,
        estado: r.estado,
      })),
      analisis: {
        riesgo: Math.min(100, riesgo),
        ipsRepetidas: Object.entries(ips).filter(([, v]) => v > 1).map(([ip, count]) => ({ ip, count })),
        ipsVPN,
        mismaIP,
        emailsDuplicados: emailsDuplicados.map(([norm, names]) => ({ email: norm + "@gmail.com", cuentas: names })),
        registrosRapidos,
        dominios: Object.entries(dominios).sort((a, b) => b[1] - a[1]).map(([d, count]) => ({ dominio: d, count })),
      },
    });
  } catch (e) {
    console.error("[Admin investigar]", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
