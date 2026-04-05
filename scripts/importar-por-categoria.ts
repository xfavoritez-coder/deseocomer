// Importa locales por categoría específica en cada comuna
// Uso: npx tsx scripts/importar-por-categoria.ts

import { PrismaClient, OrigenLocal, EstadoLocal } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
})
const API_KEY = process.env.GOOGLE_PLACES_API_KEY!

if (!API_KEY) { console.error('ERROR: Falta GOOGLE_PLACES_API_KEY'); process.exit(1) }

const COMUNAS = [
  'Providencia, Santiago', 'Las Condes, Santiago', 'Ñuñoa, Santiago',
  'Santiago Centro, Santiago', 'Vitacura, Santiago', 'La Reina, Santiago',
  'Macul, Santiago', 'San Miguel, Santiago', 'Estación Central, Santiago',
  'Independencia, Santiago', 'Recoleta, Santiago', 'Quinta Normal, Santiago',
  'Lo Barnechea, Santiago', 'Peñalolén, Santiago', 'La Florida, Santiago',
  'Maipú, Santiago', 'Pudahuel, Santiago', 'Cerrillos, Santiago',
  'San Joaquín, Santiago', 'Huechuraba, Santiago', 'Puente Alto, Santiago',
  'San Bernardo, Santiago', 'La Cisterna, Santiago', 'El Bosque, Santiago',
  'Quilicura, Santiago', 'Renca, Santiago', 'Conchalí, Santiago',
]

const QUERIES = [
  'comida mexicana', 'tacos', 'hamburguesas', 'pizza', 'comida peruana',
  'comida china', 'comida árabe', 'comida india', 'comida thai',
  'comida coreana', 'comida mediterránea', 'comida vegana',
  'comida vegetariana', 'parrilla', 'mariscos', 'pastas',
  'pollo broaster', 'ramen', 'brunch', 'postres', 'heladerías',
  'empanadas', 'comida saludable', 'poke bowl',
]

const MAPA_CATEGORIAS: Record<string, string> = {
  sushi_restaurant: 'Sushi', pizza_restaurant: 'Pizza', hamburger_restaurant: 'Hamburguesa',
  mexican_restaurant: 'Mexicano', vegan_restaurant: 'Vegano', vegetarian_restaurant: 'Vegetariano',
  italian_restaurant: 'Pastas', seafood_restaurant: 'Mariscos', steak_house: 'Carnes / Parrilla',
  barbecue_restaurant: 'Carnes / Parrilla', ramen_restaurant: 'Ramen', japanese_restaurant: 'Sushi',
  korean_restaurant: 'Coreano', thai_restaurant: 'Thai', mediterranean_restaurant: 'Mediterráneo',
  middle_eastern_restaurant: 'Árabe', peruvian_restaurant: 'Peruano', chinese_restaurant: 'Chifa',
  breakfast_restaurant: 'Brunch', brunch_restaurant: 'Brunch', cafe: 'Café', coffee_shop: 'Café',
  bakery: 'Postres', dessert_shop: 'Postres', sandwich_shop: 'Saludable', salad_shop: 'Saludable',
  chicken_restaurant: 'Pollo', pasta_restaurant: 'Pastas', indian_restaurant: 'India',
  ice_cream_shop: 'Postres', restaurant: 'Fusión',
}

// Map query keywords to DeseoComer categories as fallback
const QUERY_TO_CAT: Record<string, string> = {
  'comida mexicana': 'Mexicano', 'tacos': 'Mexicano', 'hamburguesas': 'Hamburguesa',
  'pizza': 'Pizza', 'comida peruana': 'Peruano', 'comida china': 'Chifa',
  'comida árabe': 'Árabe', 'comida india': 'India', 'comida thai': 'Thai',
  'comida coreana': 'Coreano', 'comida mediterránea': 'Mediterráneo',
  'comida vegana': 'Vegano', 'comida vegetariana': 'Vegetariano',
  'parrilla': 'Carnes / Parrilla', 'mariscos': 'Mariscos', 'pastas': 'Pastas',
  'pollo broaster': 'Pollo', 'ramen': 'Ramen', 'brunch': 'Brunch',
  'postres': 'Postres', 'heladerías': 'Postres', 'empanadas': 'Empanadas',
  'comida saludable': 'Saludable', 'poke bowl': 'Poke Bowl',
  'sandwich': 'Sandwich', 'jugos': 'Jugos y Smoothies', 'smoothies': 'Jugos y Smoothies',
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

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

function mapearCategoria(types: string[], queryFallback?: string): string[] {
  const categorias: string[] = []
  for (const type of types) {
    const cat = MAPA_CATEGORIAS[type]
    if (cat && !categorias.includes(cat) && cat !== 'Fusión') categorias.push(cat)
  }
  if (categorias.length === 0 && queryFallback && QUERY_TO_CAT[queryFallback]) {
    categorias.push(QUERY_TO_CAT[queryFallback])
  }
  if (categorias.length === 0) categorias.push('Fusión')
  return categorias.slice(0, 3)
}

function extraerComuna(address: string): string {
  const partes = address.split(',').map(p => p.trim())
  if (partes.length >= 3) return partes[partes.length - 3] || partes[partes.length - 2] || ''
  if (partes.length >= 2) return partes[partes.length - 2] || ''
  return ''
}

function slugify(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

async function buscarLugares(query: string): Promise<any[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': [
        'places.id', 'places.displayName', 'places.formattedAddress', 'places.location',
        'places.rating', 'places.userRatingCount', 'places.types',
        'places.regularOpeningHours', 'places.websiteUri', 'places.nationalPhoneNumber',
      ].join(','),
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'es', regionCode: 'CL', maxResultCount: 20 }),
  })
  const data = await res.json()
  if (data.error) { console.error(`   API Error: ${data.error.message}`); return [] }
  return data.places || []
}

async function procesarLocal(lugar: any, stats: any, queryFallback: string): Promise<void> {
  const placeId = lugar.id
  const nombre = lugar.displayName?.text || ''
  if (!nombre) { stats.descartados++; return }

  const existePorPlace = await prisma.local.findFirst({ where: { googlePlaceId: placeId } })
  if (existePorPlace) { stats.duplicados++; return }

  const existePorNombre = await prisma.local.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' }, direccion: { contains: (lugar.formattedAddress || '').split(',')[0] || '', mode: 'insensitive' } }
  })
  if (existePorNombre) {
    await prisma.local.update({
      where: { id: existePorNombre.id },
      data: { googlePlaceId: placeId, googleRating: lugar.rating || null, googleReviews: lugar.userRatingCount || null,
        horarioGoogle: lugar.regularOpeningHours?.weekdayDescriptions ? { descripcion: lugar.regularOpeningHours.weekdayDescriptions } : undefined }
    })
    stats.duplicados++; return
  }

  const score = calcularScore(lugar)
  if (score < 50) { stats.descartados++; return }

  const categorias = mapearCategoria(lugar.types || [], queryFallback)
  const direccion = lugar.formattedAddress || ''
  const comuna = extraerComuna(direccion)

  const slugBase = slugify(nombre)
  let slug = slugBase; let intento = 1
  while (await prisma.local.findFirst({ where: { slug } })) { slug = `${slugBase}-${intento}`; intento++ }

  try {
    await prisma.local.create({
      data: {
        slug, nombre, email: `imported+${placeId.replace(/[^a-zA-Z0-9]/g, '')}@deseocomer.com`,
        password: '', ciudad: 'santiago', comuna, direccion,
        lat: lugar.location?.latitude || null, lng: lugar.location?.longitude || null,
        telefono: lugar.nationalPhoneNumber || null, sitioWeb: lugar.websiteUri || null,
        categorias, activo: false, verificado: false,
        origenImportacion: OrigenLocal.GOOGLE_PLACES, estadoLocal: EstadoLocal.NO_RECLAMADO,
        googlePlaceId: placeId, googleRating: lugar.rating || null, googleReviews: lugar.userRatingCount || null,
        horarioGoogle: lugar.regularOpeningHours?.weekdayDescriptions ? { descripcion: lugar.regularOpeningHours.weekdayDescriptions } : undefined,
        scoreConfianza: score,
      }
    })
    stats.importados++
    console.log(`  ✓ [${score}] ${nombre} — ${categorias.join(', ')} — ${comuna}`)
  } catch (error: any) {
    if (error.code === 'P2002') stats.duplicados++
    else { stats.errores++; console.error(`  ✗ ${nombre}: ${error.message}`) }
  }
}

async function main() {
  console.log('\n🧞 Importación por categoría — Google Places')
  console.log('='.repeat(60))
  console.log(`   Comunas: ${COMUNAS.length} | Queries: ${QUERIES.length}`)
  console.log(`   Total búsquedas: ${COMUNAS.length * QUERIES.length}\n`)

  const stats = { importados: 0, descartados: 0, duplicados: 0, errores: 0 }

  for (const comuna of COMUNAS) {
    console.log(`\n📍 ${comuna}`)
    for (const query of QUERIES) {
      const fullQuery = `${query} en ${comuna} Chile`
      try {
        const places = await buscarLugares(fullQuery)
        if (places.length > 0) {
          console.log(`   "${query}" → ${places.length} resultados`)
          for (const lugar of places) {
            await procesarLocal(lugar, stats, query)
            await sleep(200)
          }
        }
        await sleep(1000)
      } catch (e: any) { console.error(`   ✗ ${query}: ${e.message}`) }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`  ✓ Importados:  ${stats.importados}`)
  console.log(`  = Duplicados:  ${stats.duplicados}`)
  console.log(`  ✗ Descartados: ${stats.descartados}`)
  console.log(`  ! Errores:     ${stats.errores}`)
  console.log('='.repeat(60))
}

main().catch(console.error).finally(() => prisma.$disconnect())
