import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

let yaEjecutado = false;

export async function GET() {
  if (yaEjecutado) {
    return NextResponse.json({ error: "Ya ejecutado. Reiniciar deploy para ejecutar de nuevo." });
  }
  yaEjecutado = true;

  const logs: string[] = [];
  const log = (msg: string) => { console.log(msg); logs.push(msg); };

  try {
    // ━━━ PASO 2: Activar email de Marcelo ━━━
    log("[Paso2] Buscando a Marcelo Suarez...");
    const marceloUpdate = await prisma.usuario.updateMany({
      where: { nombre: { contains: "marcelo suarez", mode: "insensitive" } },
      data: { emailVerificado: true, emailVerificadoAt: new Date() },
    });
    log(`[Paso2] Usuarios actualizados: ${marceloUpdate.count}`);

    const marcelo = await prisma.usuario.findFirst({
      where: { nombre: { contains: "marcelo suarez", mode: "insensitive" } },
      select: { id: true, nombre: true, emailVerificado: true, ipRegistro: true, createdAt: true },
    });

    if (!marcelo) {
      return NextResponse.json({ error: "Marcelo no encontrado", logs });
    }
    log(`[Paso2] Marcelo: ${marcelo.nombre} (${marcelo.id}) verificado: ${marcelo.emailVerificado}`);

    // ━━━ PASO 3A: Mover puntosPendientes de Marcelo a reales ━━━
    log("[Paso3A] Buscando puntosPendientes de Marcelo...");
    const participaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: marcelo.id, puntosPendientes: { gt: 0 } },
      include: { concurso: { select: { activo: true, fechaFin: true, premio: true } } },
    });
    log(`[Paso3A] Participaciones con puntos pendientes: ${participaciones.length}`);

    for (const p of participaciones) {
      if (p.concurso.activo && new Date(p.concurso.fechaFin) > new Date()) {
        await prisma.participanteConcurso.update({
          where: { id: p.id },
          data: { puntos: { increment: p.puntosPendientes }, puntosPendientes: 0 },
        });
        log(`[Paso3A] Acreditados ${p.puntosPendientes} puntos pendientes en "${p.concurso.premio}"`);
      }
    }

    // ━━━ PASO 3B: Acreditar puntos al referidor directo ━━━
    log("[Paso3B] Buscando referidor directo de Marcelo...");
    const misParticipaciones2 = await prisma.participanteConcurso.findMany({
      where: { usuarioId: marcelo.id, referidorDirectoId: { not: null } },
      select: { concursoId: true, referidorDirectoId: true },
    });
    log(`[Paso3B] Participaciones con referidor directo: ${misParticipaciones2.length}`);

    for (const mp of misParticipaciones2) {
      if (!mp.referidorDirectoId) continue;
      const conc = await prisma.concurso.findUnique({
        where: { id: mp.concursoId },
        select: { activo: true, fechaFin: true, premio: true },
      });
      if (!conc?.activo || new Date(conc.fechaFin) <= new Date()) {
        log(`[Paso3B] Concurso "${conc?.premio}" no activo o ya cerrado, skip`);
        continue;
      }

      const refPart = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: mp.concursoId, usuarioId: mp.referidorDirectoId } },
      });
      if (refPart && refPart.puntosPendientes > 0) {
        await prisma.participanteConcurso.update({
          where: { id: refPart.id },
          data: { puntos: { increment: refPart.puntosPendientes }, puntosPendientes: 0 },
        });
        const refUser = await prisma.usuario.findUnique({ where: { id: mp.referidorDirectoId }, select: { nombre: true } });
        log(`[Paso3B] Acreditados ${refPart.puntosPendientes} puntos a referidor directo "${refUser?.nombre}" en "${conc.premio}"`);
      } else {
        const refUser = await prisma.usuario.findUnique({ where: { id: mp.referidorDirectoId }, select: { nombre: true } });
        log(`[Paso3B] Referidor directo "${refUser?.nombre}" no tiene puntos pendientes (pendientes: ${refPart?.puntosPendientes ?? "no participa"})`);
      }
    }

    // ━━━ PASO 3C: Nivel 2 ━━━
    log("[Paso3C-Nivel2] Buscando participaciones con nivel2 para usuario: " + marcelo.id + " " + marcelo.nombre);
    const misParticipaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: marcelo.id },
      select: { concursoId: true, referidorDirectoId: true, referidorNivel2Id: true },
    });
    log(`[Paso3C-Nivel2] Total encontradas: ${misParticipaciones.length}`);

    for (const mp of misParticipaciones) {
      if (!mp.referidorNivel2Id) {
        log(`[Paso3C-Nivel2] ConcursoId ${mp.concursoId}: sin nivel2Id, skip`);
        continue;
      }

      log(`[Paso3C-Nivel2] Procesando concursoId: ${mp.concursoId}, nivel2Id: ${mp.referidorNivel2Id}`);

      const concurso = await prisma.concurso.findUnique({
        where: { id: mp.concursoId },
        select: { activo: true, fechaFin: true, premio: true },
      });
      if (!concurso?.activo || new Date(concurso.fechaFin) <= new Date()) {
        log(`[Paso3C-Nivel2] Concurso "${concurso?.premio}" no activo o cerrado, skip`);
        continue;
      }

      const nivel2Participante = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId: mp.concursoId, usuarioId: mp.referidorNivel2Id } },
      });
      if (!nivel2Participante) {
        log(`[Paso3C-Nivel2] Nivel2 no participa en este concurso, skip`);
        continue;
      }

      const referidorDirecto = mp.referidorDirectoId
        ? await prisma.usuario.findUnique({ where: { id: mp.referidorDirectoId }, select: { ipRegistro: true, createdAt: true, nombre: true } })
        : null;
      const referidorNivel2 = await prisma.usuario.findUnique({
        where: { id: mp.referidorNivel2Id },
        select: { ipRegistro: true, nombre: true },
      });

      const mismaIP = (marcelo.ipRegistro && marcelo.ipRegistro !== "unknown" && marcelo.ipRegistro !== "") &&
        (marcelo.ipRegistro === referidorDirecto?.ipRegistro || marcelo.ipRegistro === referidorNivel2?.ipRegistro);
      const menosDeUnaHora = referidorDirecto?.createdAt
        ? (Date.now() - new Date(referidorDirecto.createdAt).getTime()) < 3600000
        : false;

      log(`[Paso3C-Nivel2] mismaIP: ${mismaIP} (marcelo: ${marcelo.ipRegistro}, directo: ${referidorDirecto?.ipRegistro}, nivel2: ${referidorNivel2?.ipRegistro})`);
      log(`[Paso3C-Nivel2] menosDeUnaHora: ${menosDeUnaHora}`);
      log(`[Paso3C-Nivel2] puntosNivel2 actuales de ${referidorNivel2?.nombre}: ${nivel2Participante.puntosNivel2}`);

      if (mismaIP || menosDeUnaHora) {
        await prisma.participanteConcurso.update({
          where: { id: nivel2Participante.id },
          data: { puntosNivel2Pendientes: { increment: 1 } },
        });
        log(`[Paso3C-Nivel2] ⚠️ Marcado como PENDIENTE (fraude) para ${referidorNivel2?.nombre}`);
      } else {
        if ((nivel2Participante.puntosNivel2 ?? 0) < 10) {
          await prisma.participanteConcurso.update({
            where: { id: nivel2Participante.id },
            data: { puntos: { increment: 1 }, puntosNivel2: { increment: 1 } },
          });
          log(`[Paso3C-Nivel2] ✅ +1 punto nivel2 acreditado a ${referidorNivel2?.nombre} en "${concurso.premio}"`);
        } else {
          log(`[Paso3C-Nivel2] ⚠️ ${referidorNivel2?.nombre} ya tiene 10 puntos nivel2, límite alcanzado`);
        }
      }
    }

    // ━━━ PASO 4: Verificar resultado ━━━
    log("[Paso4] Verificando resultado final...");

    const millaray = await prisma.usuario.findFirst({
      where: { nombre: { contains: "millaray", mode: "insensitive" } },
      select: { id: true, nombre: true },
    });

    let partMillaray = null;
    if (millaray) {
      partMillaray = await prisma.participanteConcurso.findFirst({
        where: {
          usuarioId: millaray.id,
          concurso: { premio: { contains: "Cena" } },
        },
        select: {
          puntos: true,
          puntosNivel2: true,
          puntosNivel2Pendientes: true,
        },
      });
    }

    const marceloFinal = await prisma.usuario.findFirst({
      where: { nombre: { contains: "marcelo suarez", mode: "insensitive" } },
      select: { id: true, nombre: true, emailVerificado: true },
    });

    log(`[Paso4] Marcelo verificado: ${marceloFinal?.emailVerificado}`);
    log(`[Paso4] Millaray: ${millaray?.nombre ?? "NO ENCONTRADA"}`);
    log(`[Paso4] Millaray puntos totales: ${partMillaray?.puntos ?? "N/A"}`);
    log(`[Paso4] Millaray puntosNivel2: ${partMillaray?.puntosNivel2 ?? "N/A"}`);
    log(`[Paso4] Millaray nivel2Pendientes: ${partMillaray?.puntosNivel2Pendientes ?? "N/A"}`);

    if (partMillaray && partMillaray.puntosNivel2 >= 1) {
      log("[Paso4] ✅ NIVEL 2 FUNCIONA CORRECTAMENTE");
    } else if (partMillaray && partMillaray.puntosNivel2Pendientes >= 1) {
      log("[Paso4] ⚠️ NIVEL 2 MARCADO COMO PENDIENTE (antifraude detectó IP similar o registro reciente)");
    } else {
      log("[Paso4] ❌ NIVEL 2 NO FUNCIONÓ - revisar logs");
    }

    return NextResponse.json({
      marcelo: marceloFinal,
      millaray: millaray ? { ...millaray, participacion: partMillaray } : null,
      resultado: partMillaray?.puntosNivel2 && partMillaray.puntosNivel2 >= 1
        ? "✅ OK"
        : partMillaray?.puntosNivel2Pendientes && partMillaray.puntosNivel2Pendientes >= 1
          ? "⚠️ PENDIENTE (antifraude)"
          : "❌ NO FUNCIONÓ",
      logs,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error", logs }, { status: 500 });
  }
}
