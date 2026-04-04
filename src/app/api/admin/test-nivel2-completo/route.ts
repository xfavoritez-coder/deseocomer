import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let yaEjecutado = false;

export const maxDuration = 15;

export async function GET() {
  if (yaEjecutado) {
    return NextResponse.json({ error: "Ya ejecutado. Reiniciar deploy para ejecutar de nuevo." });
  }
  yaEjecutado = true;

  const logs: string[] = [];
  const log = (msg: string) => { console.log(msg); logs.push(msg); };

  try {
    // Buscar a Marcelo
    const marcelo = await prisma.usuario.findFirst({
      where: { nombre: { contains: "marcelo suarez", mode: "insensitive" } },
      select: { id: true, nombre: true, emailVerificado: true, ipRegistro: true, createdAt: true },
    });

    if (!marcelo) {
      return NextResponse.json({ error: "Marcelo no encontrado", logs });
    }
    log(`Marcelo: ${marcelo.nombre} (${marcelo.id}) verificado: ${marcelo.emailVerificado}`);

    // Activar email
    if (!marcelo.emailVerificado) {
      await prisma.usuario.update({
        where: { id: marcelo.id },
        data: { emailVerificado: true, emailVerificadoAt: new Date() },
      });
      log("Email activado");
    } else {
      log("Email ya estaba activado");
    }

    // Mover puntosPendientes de Marcelo
    const pendientes = await prisma.participanteConcurso.findMany({
      where: { usuarioId: marcelo.id, puntosPendientes: { gt: 0 } },
      select: { id: true, puntosPendientes: true, concurso: { select: { activo: true, fechaFin: true, premio: true } } },
    });
    for (const p of pendientes) {
      if (p.concurso.activo && new Date(p.concurso.fechaFin) > new Date()) {
        await prisma.participanteConcurso.update({
          where: { id: p.id },
          data: { puntos: { increment: p.puntosPendientes }, puntosPendientes: 0 },
        });
        log(`Acreditados ${p.puntosPendientes} pts pendientes en "${p.concurso.premio}"`);
      }
    }

    // Acreditar referidor directo
    const conRef = await prisma.participanteConcurso.findMany({
      where: { usuarioId: marcelo.id, referidorDirectoId: { not: null } },
      select: { concursoId: true, referidorDirectoId: true },
    });
    for (const mp of conRef) {
      if (!mp.referidorDirectoId) continue;
      const conc = await prisma.concurso.findUnique({ where: { id: mp.concursoId }, select: { activo: true, fechaFin: true, premio: true } });
      if (!conc?.activo || new Date(conc.fechaFin) <= new Date()) continue;
      const refPart = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: mp.concursoId, usuarioId: mp.referidorDirectoId } },
        select: { id: true, puntosPendientes: true },
      });
      if (refPart && refPart.puntosPendientes > 0) {
        await prisma.participanteConcurso.update({
          where: { id: refPart.id },
          data: { puntos: { increment: refPart.puntosPendientes }, puntosPendientes: 0 },
        });
        log(`Referidor directo: +${refPart.puntosPendientes} pts en "${conc.premio}"`);
      }
    }

    // Nivel 2
    const misP = await prisma.participanteConcurso.findMany({
      where: { usuarioId: marcelo.id, referidorNivel2Id: { not: null } },
      select: { concursoId: true, referidorDirectoId: true, referidorNivel2Id: true },
    });
    log(`Participaciones con nivel2: ${misP.length}`);

    for (const mp of misP) {
      if (!mp.referidorNivel2Id) continue;
      const conc = await prisma.concurso.findUnique({ where: { id: mp.concursoId }, select: { activo: true, fechaFin: true, premio: true } });
      if (!conc?.activo || new Date(conc.fechaFin) <= new Date()) { log(`Concurso no activo, skip`); continue; }

      const n2Part = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: mp.concursoId, usuarioId: mp.referidorNivel2Id } },
        select: { id: true, puntosNivel2: true, puntosNivel2Pendientes: true },
      });
      if (!n2Part) { log("Nivel2 no participa, skip"); continue; }

      const refDirecto = mp.referidorDirectoId
        ? await prisma.usuario.findUnique({ where: { id: mp.referidorDirectoId }, select: { ipRegistro: true, createdAt: true } })
        : null;
      const refN2 = await prisma.usuario.findUnique({ where: { id: mp.referidorNivel2Id }, select: { ipRegistro: true, nombre: true } });

      const mismaIP = !!(marcelo.ipRegistro && marcelo.ipRegistro !== "unknown" && marcelo.ipRegistro !== "" &&
        (marcelo.ipRegistro === refDirecto?.ipRegistro || marcelo.ipRegistro === refN2?.ipRegistro));
      const menosDeUnaHora = refDirecto?.createdAt ? (Date.now() - new Date(refDirecto.createdAt).getTime()) < 3600000 : false;

      log(`IP check: misma=${mismaIP}, <1h=${menosDeUnaHora}, n2actual=${n2Part.puntosNivel2}`);

      if (mismaIP || menosDeUnaHora) {
        await prisma.participanteConcurso.update({ where: { id: n2Part.id }, data: { puntosNivel2Pendientes: { increment: 1 } } });
        log(`⚠️ Pendiente (antifraude) para ${refN2?.nombre}`);
      } else if ((n2Part.puntosNivel2 ?? 0) < 10) {
        await prisma.participanteConcurso.update({ where: { id: n2Part.id }, data: { puntos: { increment: 1 }, puntosNivel2: { increment: 1 } } });
        log(`✅ +1 nivel2 a ${refN2?.nombre}`);
      }
    }

    // Verificar resultado
    const millaray = await prisma.usuario.findFirst({
      where: { nombre: { contains: "millaray", mode: "insensitive" } },
      select: { id: true, nombre: true },
    });
    const partM = millaray ? await prisma.participanteConcurso.findFirst({
      where: { usuarioId: millaray.id, concurso: { premio: { contains: "Cena" } } },
      select: { puntos: true, puntosNivel2: true, puntosNivel2Pendientes: true },
    }) : null;

    const resultado = partM?.puntosNivel2 && partM.puntosNivel2 >= 1 ? "✅ OK"
      : partM?.puntosNivel2Pendientes && partM.puntosNivel2Pendientes >= 1 ? "⚠️ PENDIENTE (antifraude)"
      : "❌ NO FUNCIONÓ";
    log(`RESULTADO: ${resultado}`);

    return NextResponse.json({
      marcelo: { id: marcelo.id, nombre: marcelo.nombre, verificado: true },
      millaray: millaray ? { nombre: millaray.nombre, participacion: partM } : null,
      resultado,
      logs,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error", logs }, { status: 500 });
  }
}
