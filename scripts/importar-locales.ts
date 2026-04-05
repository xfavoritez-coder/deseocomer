// =================================================================
// scripts/importar-locales.ts
// Importa restaurantes desde Google Places API a DeseoComer
// Uso: npx ts-node scripts/importar-locales.ts
// =================================================================

import { PrismaClient, OrigenLocal, EstadoLocal } from '@prisma/client'
import * as https from 'https'

const prisma = new PrismaClient()
const API_KEY = process.env.GOOGLE_PLACES_API_KEY!

if (!API_KEY) {
  console.error('ERROR: Falta GOOGLE_PLACES_API_KEY en variables de entorno')
  process.exit(1)
}

// -----------------------------------------------------------------
// COMUNAS A BARRER (empezamos con 2 para testear)
// -----------------------------------------------------------------
const COMUNAS = [
  'Providencia, Santiago',
  'Las Condes, Santiago',
  'Ñuñoa, Santiago',
  'Santiago Centro, Santiago',
  'Vitacura, Santiago',
  'La Reina, Santiago',
  'Macul, Santiago',
  'San Miguel, Santiago',
  'Estación Central, Santiago',
  'Independencia, Santiago',
  'Recoleta, Santiago',
  'Quinta Normal, Santiago',
  'Lo Barnechea, Santiago',
  'Peñalolén, Santiago',
  'La Florida, Santiago',
  'Maipú, Santiago',
  'Pudahuel, Santiago',
  'Cerrillos, Santiago',
  'San Joaquín, Santiago',
  'Huechuraba, Santiago',
]

// -----------------------------------------------------------------
// MAPA DE CATEGORÍAS GOOGLE → DeseoComer
// -----------------------------------------------------------------
const MAPA_CATEGORIAS: Record<string, string> = {
  sushi_restaurant:         'Sushi',
  pizza_restaurant:         'Pizza',
  hamburger_restaurant:     'Hamburguesa',
  mexican_restaurant:       'Mexicano',
  vegan_restaurant:         'Vegano',
  vegetarian_restaurant:    'Vegetariano',
  italian_restaurant:       'Pastas',
  seafood_restaurant:       'Mariscos',
  steak_house:              'Carnes / Parrilla',
  barbecue_restaurant:      'Carnes / Parrilla',
  ramen_restaurant:         'Ramen',
  japanese_restaurant:      'Sushi',
  korean_restaurant:        'Coreano',
  thai_restaurant:          'Thai',
  mediterranean_restaurant: 'Mediterráneo',
  middle_eastern_restaurant:'Árabe',
  peruvian_restaurant:      'Peruano',
  chinese_restaurant:       'Chifa',
  breakfast_restaurant:     'Brunch',
  brunch_restaurant:        'Brunch',
  cafe:                     'Café',
  coffee_shop:              'Café',
  bakery:                   'Postres',
  dessert_shop:             'Postres',
  sandwich_shop:            'Saludable',
  salad_shop:               'Saludable',
  chicken_restaurant:       'Pollo',
  pasta_restaurant:         'Pastas',
  indian_restaurant:        'India',
  ice_cream_shop:           'Postres',
  restaurant:               'Fusión',
}

// -----------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function calcularScore(lugar: any): number {
  let score = 0

  const rating = lugar.rating ?? 0
  const reviews = lugar.userRatingCount ?? 0

  if (rating >= 4.5) score += 40
  else if (rating >= 4.0) score += 30
  else if (rating >= 3.5) score += 20
  else return 0

  if (reviews >= 100) score += 30
  else if (reviews >= 50) score += 20
  else if (reviews >= 10) score += 10
  else return 0

  if (lugar.formattedAddress) score += 10
  if (lugar.regularOpeningHours) score += 10
  if (lugar.websiteUri) score += 10

  return Math.min(score, 100)
}

function mapearCategoria(types: string[]): string[] {
  const categorias: string[] = []
  for (const type of types) {
    const cat = MAPA_CATEGORIAS[type]
    if (cat && !categorias.includes(cat) && cat !== 'Fusión') {
      categorias.push(cat)
    }
  }
  if (categorias.length === 0) categorias.push('Fusión')
  return categorias.slice(0, 3)
}

function extraerComuna(address: string): string {
  const partes = address.split(',').map(p => p.trim())
  // Formato típico: "Av. X 123, Providencia, Región Metropolitana, Chile"
  if (partes.length >= 3) {
    return partes[partes.length - 3] || partes[partes.length - 2] || ''
  }
  if (partes.length >= 2) {
    return partes[partes.length - 2] || ''
  }
  return ''
}

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// -----------------------------------------------------------------
// BÚSQUEDA EN GOOGLE PLACES API (New)
// -----------------------------------------------------------------
async function buscarLugares(query: string, nextPageToken?: string): Promise<{ places: any[]; nextPageToken?: string }> {


  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      textQuery: query,
      languageCode: 'es',
      regionCode: 'CL',
      maxResultCount: 20,
      ...(nextPageToken && { pageToken: nextPageToken }),
    })

    const options = {
      hostname: 'places.googleapis.com',
      path: '/v1/places:searchText',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.userRatingCount',
          'places.types',
          'places.regularOpeningHours',
          'places.websiteUri',
          'places.nationalPhoneNumber',
          'places.googleMapsUri',
          'nextPageToken',
        ].join(','),
      },
    }

    const req = https.request(options, (res: any) => {
      let data = ''
      res.on('data', (chunk: any) => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) {
            console.error(`   API Error: ${json.error.message}`)
            resolve({ places: [] })
            return
          }
          resolve({ places: json.places || [], nextPageToken: json.nextPageToken })
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// -----------------------------------------------------------------
// PROCESAR Y GUARDAR UN LOCAL
// -----------------------------------------------------------------
async function procesarLocal(lugar: any, stats: any): Promise<void> {
  const placeId = lugar.id
  const nombre = lugar.displayName?.text || ''

  if (!nombre) { stats.descartados++; return }

  // Verificar si ya existe por placeId O por nombre+dirección similar
  const existePorPlace = await prisma.local.findFirst({ where: { googlePlaceId: placeId } })
  if (existePorPlace) { stats.duplicados++; return }

  const existePorNombre = await prisma.local.findFirst({
    where: {
      nombre: { equals: nombre, mode: 'insensitive' },
      direccion: { contains: (lugar.formattedAddress || '').split(',')[0] || '', mode: 'insensitive' },
    }
  })
  if (existePorNombre) {
    // Local ya existe (registrado manualmente), actualizar con datos de Google
    await prisma.local.update({
      where: { id: existePorNombre.id },
      data: {
        googlePlaceId: placeId,
        googleRating: lugar.rating || null,
        googleReviews: lugar.userRatingCount || null,
        horarioGoogle: lugar.regularOpeningHours?.weekdayDescriptions
          ? { descripcion: lugar.regularOpeningHours.weekdayDescriptions }
          : undefined,
      }
    })
    stats.duplicados++
    console.log(`  = Ya existe (enriquecido): ${nombre}`)
    return
  }

  // Calcular score
  const score = calcularScore(lugar)
  if (score < 50) {
    stats.descartados++
    return
  }

  const categorias = mapearCategoria(lugar.types || [])
  const direccion = lugar.formattedAddress || ''
  const comuna = extraerComuna(direccion)

  // Generar slug único
  const slugBase = slugify(nombre)
  let slug = slugBase
  let intento = 1
  while (await prisma.local.findFirst({ where: { slug } })) {
    slug = `${slugBase}-${intento}`
    intento++
  }

  const emailFicticio = `imported+${placeId.replace(/[^a-zA-Z0-9]/g, '')}@deseocomer.com`

  const horarioGoogle = lugar.regularOpeningHours?.weekdayDescriptions
    ? { descripcion: lugar.regularOpeningHours.weekdayDescriptions }
    : null

  try {
    await prisma.local.create({
      data: {
        slug,
        nombre,
        email: emailFicticio,
        password: '',
        ciudad: 'santiago',
        comuna,
        direccion,
        lat: lugar.location?.latitude || null,
        lng: lugar.location?.longitude || null,
        telefono: lugar.nationalPhoneNumber || null,
        sitioWeb: lugar.websiteUri || null,
        categorias,
        activo: false,
        verificado: false,
        origenImportacion: OrigenLocal.GOOGLE_PLACES,
        estadoLocal: EstadoLocal.NO_RECLAMADO,
        googlePlaceId: placeId,
        googleRating: lugar.rating || null,
        googleReviews: lugar.userRatingCount || null,
        horarioGoogle: horarioGoogle ?? undefined,
        scoreConfianza: score,
      }
    })

    stats.importados++
    const scoreTag = score >= 80 ? '✓' : '~'
    console.log(`  ${scoreTag} [${score}] ${nombre} — ${categorias.join(', ')} — ${comuna}`)

  } catch (error: any) {
    if (error.code === 'P2002') {
      stats.duplicados++
    } else {
      stats.errores++
      console.error(`  ✗ Error: ${nombre} — ${error.message}`)
    }
  }
}

// -----------------------------------------------------------------
// FUNCIÓN PRINCIPAL
// -----------------------------------------------------------------
async function main() {
  console.log('')
  console.log('🧞 DeseoComer — Importador de locales desde Google Places')
  console.log('='.repeat(60))
  console.log(`   Comunas: ${COMUNAS.length}`)
  console.log(`   API Key: ${API_KEY.slice(0, 8)}...`)
  console.log('')

  const stats = {
    importados: 0,
    descartados: 0,
    duplicados: 0,
    errores: 0,
  }

  for (const comuna of COMUNAS) {
    console.log(`\n📍 ${comuna}`)

    try {
      // Buscar con diferentes queries para más cobertura
      const queries = [
        `restaurantes en ${comuna} Chile`,
        `cafeterías en ${comuna} Chile`,
        `sushi en ${comuna} Chile`,
      ]

      for (const query of queries) {
        const { places } = await buscarLugares(query)
        console.log(`   "${query.split(' en ')[0]}" → ${places.length} resultados`)

        for (const lugar of places) {
          await procesarLocal(lugar, stats)
          await sleep(100)
        }

        await sleep(500)
      }

      await sleep(1000)

    } catch (error: any) {
      console.error(`   ✗ Error en ${comuna}: ${error.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN')
  console.log('='.repeat(60))
  console.log(`  ✓ Importados:   ${stats.importados}`)
  console.log(`  = Duplicados:   ${stats.duplicados}`)
  console.log(`  ✗ Descartados:  ${stats.descartados}`)
  console.log(`  ! Errores:      ${stats.errores}`)
  console.log('='.repeat(60))
  console.log(`\nTotal nuevos en BD: ${stats.importados}`)
  console.log('Todos entran como NO_RECLAMADO + activo=false.')
  console.log('Revisa en admin para aprobar o que los dueños reclamen.\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
