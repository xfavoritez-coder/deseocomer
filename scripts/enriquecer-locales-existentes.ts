import { PrismaClient } from '@prisma/client'
import { enriquecerLocalConGoogle } from '../src/lib/enriquecer-local-google'

const prisma = new PrismaClient()

async function main() {
  const locales = await prisma.local.findMany({
    where: {
      activo: true,
      googlePlaceId: null,
    },
    select: { id: true, nombre: true, comuna: true }
  })

  console.log(`Encontrados ${locales.length} locales sin datos de Google`)

  let enriquecidos = 0
  for (const local of locales) {
    console.log(`Procesando: ${local.nombre}...`)
    await enriquecerLocalConGoogle(local.id)
    enriquecidos++
    await new Promise(r => setTimeout(r, 500))
  }

  console.log(`Listo. ${enriquecidos} locales procesados.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
