import { prisma } from '@/lib/prisma'

export async function enriquecerLocalConGoogle(localId: string) {
  try {
    const local = await prisma.local.findUnique({
      where: { id: localId },
      select: {
        id: true,
        nombre: true,
        comuna: true,
        googlePlaceId: true,
        sitioWeb: true,
        horarios: true,
      }
    })

    if (!local || local.googlePlaceId) return

    const query = `${local.nombre} ${local.comuna || 'Santiago'} Chile`

    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
        'X-Goog-FieldMask': [
          'places.id',
          'places.rating',
          'places.userRatingCount',
          'places.regularOpeningHours',
          'places.websiteUri',
        ].join(','),
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'es',
        regionCode: 'CL',
        maxResultCount: 1,
      })
    })

    const data = await res.json()
    const lugar = data.places?.[0]

    if (!lugar) return
    if (!lugar.rating || lugar.rating < 3.5) return
    if (!lugar.userRatingCount || lugar.userRatingCount < 5) return

    const horarioGoogle = lugar.regularOpeningHours?.weekdayDescriptions
      ? { descripcion: lugar.regularOpeningHours.weekdayDescriptions }
      : null

    await prisma.local.update({
      where: { id: localId },
      data: {
        googlePlaceId: lugar.id,
        googleRating: lugar.rating,
        googleReviews: lugar.userRatingCount,
        ...(horarioGoogle && { horarioGoogle }),
        ...(!local.sitioWeb && lugar.websiteUri && { sitioWeb: lugar.websiteUri }),
      }
    })

    console.log(`[Google] Enriquecido: ${local.nombre} → ★ ${lugar.rating}`)

  } catch (error) {
    console.error('[Google enriquecer]', error)
  }
}
