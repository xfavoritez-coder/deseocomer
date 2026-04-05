import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function extraerComunaDeDireccion(direccion: string): { comuna: string; direccionLimpia: string } {
  // Formato típico: "Calle 123, Local X, 7510054 Providencia, Región Metropolitana"
  const partes = direccion.split(',').map(p => p.trim())

  let comuna = ''
  let idxRegion = -1
  let idxPostal = -1

  for (let i = 0; i < partes.length; i++) {
    // Buscar parte con código postal (7 dígitos seguido de nombre)
    const matchPostal = partes[i].match(/^\d{7}\s+(.+)/)
    if (matchPostal) {
      comuna = matchPostal[1].trim()
      idxPostal = i
    }
    // Buscar "Región Metropolitana" o "Chile"
    if (/región\s*metropolitana|chile$/i.test(partes[i])) {
      idxRegion = i
    }
  }

  // Si no encontró por código postal, tomar la parte antes de "Región Metropolitana"
  if (!comuna && idxRegion > 0) {
    comuna = partes[idxRegion - 1].replace(/^\d+\s*/, '').trim()
  }

  // Si aún no hay comuna, intentar la penúltima parte
  if (!comuna && partes.length >= 3) {
    const candidata = partes[partes.length - 2].replace(/^\d+\s*/, '').trim()
    if (candidata && !/región|chile|metropolitana/i.test(candidata)) {
      comuna = candidata
    }
  }

  // Limpiar dirección: quitar desde el código postal en adelante
  let corte = idxPostal >= 0 ? idxPostal : idxRegion >= 0 ? idxRegion : partes.length
  const partesLimpias = partes.slice(0, corte).map(p => p.trim()).filter(Boolean)
  let direccionLimpia = partesLimpias.join(', ')

  // Quitar "Santiago" suelto al final
  direccionLimpia = direccionLimpia.replace(/,\s*Santiago\s*$/i, '').trim()
  // Quitar coma final
  direccionLimpia = direccionLimpia.replace(/,\s*$/, '').trim()

  return { comuna, direccionLimpia }
}

async function main() {
  console.log('🧞 Fix comunas de locales importados')
  console.log('='.repeat(50))

  const locales = await prisma.local.findMany({
    where: { origenImportacion: 'GOOGLE_PLACES' },
    select: { id: true, nombre: true, comuna: true, direccion: true }
  })

  console.log(`Total locales importados: ${locales.length}\n`)

  let actualizados = 0
  let sinCambio = 0

  for (const local of locales) {
    if (!local.direccion) { sinCambio++; continue }

    const { comuna, direccionLimpia } = extraerComunaDeDireccion(local.direccion)

    // Solo actualizar si encontró una comuna válida
    const comunaValida = comuna && comuna.length > 2 && !/^\d+$/.test(comuna) && !/local\s*\d/i.test(comuna)

    if (!comunaValida && local.comuna && !/local\s*\d/i.test(local.comuna) && !/^\d+$/.test(local.comuna)) {
      // La comuna actual está bien, solo limpiar dirección
      if (direccionLimpia !== local.direccion) {
        await prisma.local.update({
          where: { id: local.id },
          data: { direccion: direccionLimpia }
        })
        actualizados++
        console.log(`  ~ ${local.nombre} | dir limpia: ${direccionLimpia}`)
      } else {
        sinCambio++
      }
      continue
    }

    if (comunaValida) {
      await prisma.local.update({
        where: { id: local.id },
        data: {
          comuna: comuna,
          direccion: direccionLimpia || local.direccion,
        }
      })
      actualizados++
      console.log(`  ✓ ${local.nombre} | ${local.comuna} → ${comuna} | ${direccionLimpia}`)
    } else {
      sinCambio++
      console.log(`  ? ${local.nombre} | no se pudo extraer comuna de: ${local.direccion}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✓ Actualizados: ${actualizados}`)
  console.log(`= Sin cambio:   ${sinCambio}`)
  console.log('='.repeat(50))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
