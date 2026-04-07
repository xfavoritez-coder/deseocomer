import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

const DC_PREFIXES = ["51.158.", "51.159.", "51.81.", "62.210.", "15.204.", "15.235.", "94.242.", "146.70.", "141.95.", "54.36.", "51.77.", "51.75.", "198.27.", "66.70.", "78.241.", "84.220."];
const NOMBRES_FALSOS = ["goku", "ronaldinho", "jesucristo", "superman", "batman", "naruto", "pikachu", "messi", "cristiano", "drake", "beyonce", "shakira", "superestrell"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id: concursoId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Falta userId" }, { status: 400 });

    const participante = await prisma.participanteConcurso.findFirst({
      where: { concursoId, usuarioId: userId },
      include: { usuario: { select: { id: true, nombre: true, email: true, ipRegistro: true, createdAt: true } } },
    });
    if (!participante) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const referidos = await prisma.participanteConcurso.findMany({
      where: { concursoId, referidorDirectoId: userId },
      include: { usuario: { select: { id: true, nombre: true, email: true, ipRegistro: true, emailVerificado: true, createdAt: true } } },
      orderBy: { createdAt: "asc" },
    });

    // Analysis
    const ips: Record<string, number> = {};
    const dominios: Record<string, number> = {};
    const gmailNormalized: Record<string, string[]> = {};
    const registrosRapidos: { from: string; to: string; minutos: number }[] = [];
    const nombresSospechosos: string[] = [];

    for (const r of referidos) {
      const ip = r.usuario.ipRegistro || "unknown";
      ips[ip] = (ips[ip] ?? 0) + 1;
      const email = r.usuario.email ?? "";
      const d = email.split("@")[1] ?? "?";
      dominios[d] = (dominios[d] ?? 0) + 1;

      if (d === "gmail.com") {
        const norm = email.split("@")[0].toLowerCase().replace(/\./g, "").replace(/\+.*$/, "");
        if (!gmailNormalized[norm]) gmailNormalized[norm] = [];
        gmailNormalized[norm].push(r.usuario.nombre ?? "?");
      }

      // Detect suspicious names
      const nameLower = (r.usuario.nombre ?? "").toLowerCase();
      if (NOMBRES_FALSOS.some(n => nameLower.includes(n))) {
        nombresSospechosos.push(r.usuario.nombre ?? "?");
      }
    }

    for (let i = 1; i < referidos.length; i++) {
      const diff = (new Date(referidos[i].usuario.createdAt).getTime() - new Date(referidos[i - 1].usuario.createdAt).getTime()) / 60000;
      if (diff < 30) {
        registrosRapidos.push({ from: referidos[i - 1].usuario.nombre ?? "?", to: referidos[i].usuario.nombre ?? "?", minutos: Math.round(diff) });
      }
    }

    const ipsVPN = referidos.filter(r => DC_PREFIXES.some(p => (r.usuario.ipRegistro ?? "").startsWith(p))).length;
    const mismaIP = referidos.filter(r => r.usuario.ipRegistro === participante.usuario.ipRegistro && participante.usuario.ipRegistro !== "unknown").length;
    const emailsDuplicados = Object.entries(gmailNormalized).filter(([, names]) => names.length > 1);
    const ipsRepetidas = Object.entries(ips).filter(([, v]) => v > 1);

    // Math check
    const sumaFields = 1 + (participante.puntosMadrugador ?? 0) + (participante.bonusRef ?? 0) + (participante.puntosReferidosNuevos ?? 0) + (participante.puntosReferidosExistentes ?? 0) + (participante.puntosNivel2 ?? 0) + (participante.puntosPendientes ?? 0) + (participante.puntosApoyos ?? 0);
    const puntosFantasma = participante.puntos - sumaFields;

    // Risk score
    let riesgo = 0;
    if (ipsVPN > 0) riesgo += 30;
    if (emailsDuplicados.length > 0) riesgo += 30;
    if (registrosRapidos.length > 5) riesgo += 15;
    else if (registrosRapidos.length > 2) riesgo += 8;
    if (mismaIP > 0) riesgo += 10;
    if (ipsRepetidas.some(([, v]) => v > 2)) riesgo += 10;
    if (nombresSospechosos.length > 0) riesgo += 15;
    if (puntosFantasma > 5) riesgo += 10;

    // Auto-generate summary for the motivo textarea
    const infracciones: string[] = [];
    if (emailsDuplicados.length > 0) infracciones.push(`• Creación de ${emailsDuplicados.reduce((a, [, n]) => a + n.length, 0)} cuentas usando variaciones del mismo email (técnica de Gmail dot trick)`);
    if (ipsVPN > 0) infracciones.push(`• Uso de VPN/proxy: ${ipsVPN} registro${ipsVPN > 1 ? "s" : ""} desde IPs de datacenters europeos`);
    if (registrosRapidos.length > 2) infracciones.push(`• ${registrosRapidos.length} registros automatizados en menos de 30 minutos entre sí`);
    if (mismaIP > 0) infracciones.push(`• ${mismaIP} cuenta${mismaIP > 1 ? "s" : ""} creada${mismaIP > 1 ? "s" : ""} desde la misma IP que el participante`);
    if (ipsRepetidas.length > 0) infracciones.push(`• ${ipsRepetidas.length} IP${ipsRepetidas.length > 1 ? "s" : ""} compartida${ipsRepetidas.length > 1 ? "s" : ""} entre múltiples cuentas referidas`);
    if (nombresSospechosos.length > 0) infracciones.push(`• Uso de nombres ficticios: ${nombresSospechosos.join(", ")}`);
    if (puntosFantasma > 5) infracciones.push(`• ${puntosFantasma} puntos sin respaldo en los campos de tracking`);

    const resumenMotivo = infracciones.length > 0
      ? infracciones.join("\n")
      : "Actividad sospechosa detectada en la cuenta.";

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
        madrugador: participante.puntosMadrugador,
        bonusRef: participante.bonusRef,
        apoyos: participante.puntosApoyos,
        pendientes: participante.puntosPendientes,
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
        puntosFantasma,
        sumaFields,
        ipsRepetidas: ipsRepetidas.map(([ip, count]) => ({ ip, count })),
        ipsDuplicadas: Object.keys(Object.fromEntries(ipsRepetidas)),
        ipParticipante: participante.usuario.ipRegistro,
        ipsVPN,
        mismaIP,
        emailsDuplicados: emailsDuplicados.map(([norm, names]) => ({ email: norm + "@gmail.com", cuentas: names })),
        nombresSospechosos,
        registrosRapidos,
        dominios: Object.entries(dominios).sort((a, b) => b[1] - a[1]).map(([d, count]) => ({ dominio: d, count })),
        resumenMotivo,
      },
    });
  } catch (e) {
    console.error("[Admin investigar]", e);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
