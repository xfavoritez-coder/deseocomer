import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — listar todos los locales importados
export async function GET() {
  try {
    const locales = await prisma.local.findMany({
      where: {
        origenImportacion: 'GOOGLE_PLACES',
      },
      select: {
        id:             true,
        nombre:         true,
        slug:           true,
        direccion:      true,
        comuna:         true,
        categorias:     true,
        googleRating:   true,
        googleReviews:  true,
        scoreConfianza: true,
        estadoLocal:    true,
        sitioWeb:       true,
        telefono:       true,
        createdAt:      true,
      },
      orderBy: [
        { scoreConfianza: 'desc' },
        { googleRating: 'desc' },
      ]
    })

    return NextResponse.json({ locales })

  } catch (error) {
    console.error('Error cargando locales importados:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PATCH — aprobar o rechazar un local importado
export async function PATCH(req: NextRequest) {
  try {
    const { id, accion } = await req.json()

    if (!id || !accion) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    if (accion === 'aprobar') {
      await prisma.local.update({
        where: { id },
        data: {
          estadoLocal: 'ACTIVO',
        }
      })

      return NextResponse.json({ ok: true, mensaje: 'Local aprobado para el directorio' })
    }

    if (accion === 'rechazar') {
      await prisma.local.update({
        where: { id },
        data: {
          estadoLocal: 'RECHAZADO',
        }
      })

      return NextResponse.json({ ok: true, mensaje: 'Local rechazado' })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })

  } catch (error) {
    console.error('Error actualizando local importado:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
