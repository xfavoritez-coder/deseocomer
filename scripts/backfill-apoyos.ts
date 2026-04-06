import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const participantes = await prisma.participanteConcurso.findMany({
    select: {
      id: true,
      puntos: true,
      bonusRef: true,
      puntosMadrugador: true,
      puntosReferidosNuevos: true,
      puntosReferidosExistentes: true,
      puntosNivel2: true,
      puntosPendientes: true,
      puntosApoyos: true,
    },
  });

  let updated = 0;
  for (const p of participantes) {
    const sumaTracked = 1 + (p.bonusRef ?? 0) + (p.puntosMadrugador ?? 0) + (p.puntosReferidosNuevos ?? 0) + (p.puntosReferidosExistentes ?? 0) + (p.puntosNivel2 ?? 0) + (p.puntosPendientes ?? 0);
    const apoyosCalculados = Math.max(0, p.puntos - sumaTracked);

    if (apoyosCalculados > 0 && (p.puntosApoyos ?? 0) === 0) {
      await prisma.participanteConcurso.update({
        where: { id: p.id },
        data: { puntosApoyos: apoyosCalculados },
      });
      updated++;
    }
  }

  console.log(`Backfill completado: ${updated} participantes actualizados de ${participantes.length} total.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
