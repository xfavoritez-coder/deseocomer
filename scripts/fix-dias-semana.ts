import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const promos = await prisma.promocion.findMany({
    select: { id: true, titulo: true, diasSemana: true },
  });

  console.log(`Found ${promos.length} promociones`);
  let fixed = 0;

  for (const p of promos) {
    const dias = p.diasSemana as unknown;
    if (!Array.isArray(dias) || dias.length !== 7 || typeof dias[0] !== "boolean") {
      console.log(`  SKIP ${p.titulo} — not a 7-boolean array`);
      continue;
    }

    // Rotate right by 1: old [Lun,Mar,Mie,Jue,Vie,Sab,Dom] → new [Dom,Lun,Mar,Mie,Jue,Vie,Sab]
    const old = dias as boolean[];
    const rotated = [old[6], old[0], old[1], old[2], old[3], old[4], old[5]];

    // Only update if something actually changed
    if (JSON.stringify(old) === JSON.stringify(rotated)) {
      console.log(`  SAME ${p.titulo} — no change needed`);
      continue;
    }

    const DIAS_CORRECT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const oldDays = old.map((v, i) => v ? DIAS_CORRECT[i] : null).filter(Boolean).join(", ");
    const newDays = rotated.map((v, i) => v ? DIAS_CORRECT[i] : null).filter(Boolean).join(", ");

    console.log(`  FIX ${p.titulo}: [${oldDays}] → [${newDays}]`);

    await prisma.promocion.update({
      where: { id: p.id },
      data: { diasSemana: rotated },
    });
    fixed++;
  }

  console.log(`\nDone. Fixed ${fixed} of ${promos.length} promociones.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
