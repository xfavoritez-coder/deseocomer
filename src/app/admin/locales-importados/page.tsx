'use client'

import { useEffect, useState } from 'react'

interface LocalImportado {
  id: string
  nombre: string
  slug: string | null
  direccion: string | null
  comuna: string | null
  categorias: string[]
  googleRating: number | null
  googleReviews: number | null
  scoreConfianza: number | null
  estadoLocal: string
  sitioWeb: string | null
  telefono: string | null
  createdAt: string
}

type Filtro = 'todos' | 'alto' | 'medio' | 'rechazados'

export default function LocalesImportadosPage() {
  const [locales, setLocales] = useState<LocalImportado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [accionando, setAccionando] = useState<string | null>(null)

  useEffect(() => {
    cargarLocales()
  }, [])

  async function cargarLocales() {
    setLoading(true)
    const res = await fetch('/api/admin/locales-importados')
    const data = await res.json()
    setLocales(data.locales || [])
    setLoading(false)
  }

  async function aprobar(id: string) {
    setAccionando(id)
    await fetch('/api/admin/locales-importados', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, accion: 'aprobar' })
    })
    await cargarLocales()
    setAccionando(null)
  }

  async function rechazar(id: string) {
    setAccionando(id)
    await fetch('/api/admin/locales-importados', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, accion: 'rechazar' })
    })
    await cargarLocales()
    setAccionando(null)
  }

  const localesFiltrados = locales.filter(l => {
    if (filtro === 'alto')      return (l.scoreConfianza || 0) >= 80 && l.estadoLocal === 'NO_RECLAMADO'
    if (filtro === 'medio')     return (l.scoreConfianza || 0) < 80  && l.estadoLocal === 'NO_RECLAMADO'
    if (filtro === 'rechazados') return l.estadoLocal === 'RECHAZADO'
    return l.estadoLocal !== 'ACTIVO'
  })

  const totalAlto   = locales.filter(l => (l.scoreConfianza || 0) >= 80 && l.estadoLocal === 'NO_RECLAMADO').length
  const totalMedio  = locales.filter(l => (l.scoreConfianza || 0) < 80  && l.estadoLocal === 'NO_RECLAMADO').length
  const totalRechaz = locales.filter(l => l.estadoLocal === 'RECHAZADO').length

  function colorScore(score: number | null) {
    if (!score) return '#888'
    if (score >= 80) return '#3db89e'
    if (score >= 60) return '#e8a84c'
    return '#ec4899'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0812',
      padding: '2rem',
      fontFamily: 'Lato, sans-serif',
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'Cinzel Decorative, serif',
          color: '#e8a84c',
          fontSize: '1.5rem',
          marginBottom: '0.25rem'
        }}>
          Locales Importados
        </h1>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Locales desde Google Places — revisa y aprueba antes de que aparezcan en el directorio
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {[
          { label: 'Score alto (>=80)', valor: totalAlto,   color: '#3db89e', filtroKey: 'alto' as Filtro },
          { label: 'Score medio',       valor: totalMedio,  color: '#e8a84c', filtroKey: 'medio' as Filtro },
          { label: 'Rechazados',        valor: totalRechaz, color: '#ec4899', filtroKey: 'rechazados' as Filtro },
        ].map(stat => (
          <button
            key={stat.filtroKey}
            onClick={() => setFiltro(filtro === stat.filtroKey ? 'todos' : stat.filtroKey)}
            style={{
              background: filtro === stat.filtroKey ? stat.color + '22' : '#1a0e05',
              border: `1px solid ${filtro === stat.filtroKey ? stat.color : '#333'}`,
              borderRadius: '12px',
              padding: '1rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>
              {stat.valor}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.25rem' }}>
              {stat.label}
            </div>
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '3rem' }}>
          Cargando locales...
        </div>
      ) : localesFiltrados.length === 0 ? (
        <div style={{ color: '#888', textAlign: 'center', padding: '3rem' }}>
          No hay locales en esta categoria
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {localesFiltrados.map(local => (
            <div
              key={local.id}
              style={{
                background: '#1a0e05',
                border: '1px solid #2a1f10',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              {/* Score */}
              <div style={{
                minWidth: '48px',
                height: '48px',
                borderRadius: '50%',
                background: colorScore(local.scoreConfianza) + '22',
                border: `2px solid ${colorScore(local.scoreConfianza)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: colorScore(local.scoreConfianza),
              }}>
                {local.scoreConfianza || '?'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: '#fff',
                  marginBottom: '0.2rem'
                }}>
                  {local.nombre}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: '#888',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {local.comuna && <span>📍 {local.comuna}</span>}
                  {local.googleRating && (
                    <span>⭐ {local.googleRating} ({local.googleReviews} resenas)</span>
                  )}
                  {local.categorias.length > 0 && (
                    <span style={{ color: '#e8a84c' }}>
                      {local.categorias.join(', ')}
                    </span>
                  )}
                  {local.sitioWeb && (
                    <a
                      href={local.sitioWeb.startsWith('http') ? local.sitioWeb : `https://${local.sitioWeb}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3db89e', textDecoration: 'none' }}
                    >
                      Web
                    </a>
                  )}
                </div>
              </div>

              {/* Acciones */}
              {local.estadoLocal === 'NO_RECLAMADO' && (
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => aprobar(local.id)}
                    disabled={accionando === local.id}
                    style={{
                      background: '#3db89e22',
                      border: '1px solid #3db89e',
                      color: '#3db89e',
                      borderRadius: '8px',
                      padding: '0.4rem 0.9rem',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      opacity: accionando === local.id ? 0.5 : 1,
                    }}
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => rechazar(local.id)}
                    disabled={accionando === local.id}
                    style={{
                      background: '#ec489922',
                      border: '1px solid #ec4899',
                      color: '#ec4899',
                      borderRadius: '8px',
                      padding: '0.4rem 0.9rem',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      opacity: accionando === local.id ? 0.5 : 1,
                    }}
                  >
                    Rechazar
                  </button>
                </div>
              )}

              {local.estadoLocal === 'RECHAZADO' && (
                <span style={{
                  fontSize: '0.75rem',
                  color: '#ec4899',
                  border: '1px solid #ec489944',
                  borderRadius: '6px',
                  padding: '0.2rem 0.6rem'
                }}>
                  Rechazado
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
