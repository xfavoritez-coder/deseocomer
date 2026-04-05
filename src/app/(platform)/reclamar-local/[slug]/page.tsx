'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function ReclamarLocalPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [local, setLocal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    fetch(`/api/locales/${slug}`)
      .then(r => r.json())
      .then(data => {
        if (data.reclamadoEn || data.activo) {
          router.replace(`/locales/${slug}`)
          return
        }
        setLocal(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug, router])

  async function handleSubmit() {
    setError('')
    if (!nombre.trim()) return setError('Ingresa tu nombre')
    if (!email.trim()) return setError('Ingresa tu email')
    if (!telefono.trim()) return setError('Ingresa tu teléfono')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (password !== password2) return setError('Las contraseñas no coinciden')
    setEnviando(true)
    const res = await fetch('/api/reclamar-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: local.id, nombre, email, telefono, password })
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Error al procesar')
      setEnviando(false)
      return
    }
    setEnviado(true)
  }

  if (loading) return (
    <main style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--text-muted)' }}>Cargando...</p>
      </div>
      <Footer />
    </main>
  )

  return (
    <main style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '60px 20px 80px' }}>

        <Link href={`/locales/${slug}`} style={{
          fontFamily: 'var(--font-cinzel)', fontSize: '0.75rem',
          color: 'var(--text-muted)', textDecoration: 'none',
          display: 'inline-block', marginBottom: '32px'
        }}>← Volver</Link>

        {!enviado ? (
          <>
            {/* Local precargado */}
            <div style={{
              background: 'rgba(232,168,76,0.05)',
              border: '1px solid rgba(232,168,76,0.15)',
              borderRadius: '14px', padding: '20px 24px', marginBottom: '28px'
            }}>
              <p style={{
                fontFamily: 'var(--font-cinzel)', fontSize: '0.65rem',
                letterSpacing: '0.25em', textTransform: 'uppercase',
                color: 'rgba(240,234,214,0.35)', marginBottom: '10px'
              }}>Tu local</p>
              <p style={{
                fontFamily: 'var(--font-cinzel-decorative)',
                fontSize: '1.2rem', color: '#e8a84c', marginBottom: '6px'
              }}>{local?.nombre}</p>
              <p style={{
                fontFamily: 'var(--font-lato)', fontSize: '0.85rem',
                color: 'rgba(240,234,214,0.45)'
              }}>
                {local?.direccion}{local?.comuna ? `, ${local.comuna}` : ''}
                {local?.categorias?.[0] ? ` · ${local.categorias[0]}` : ''}
              </p>
            </div>

            <p style={{
              fontFamily: 'var(--font-cinzel)', fontSize: '0.65rem',
              letterSpacing: '0.25em', textTransform: 'uppercase',
              color: '#a78bfa', marginBottom: '20px'
            }}>Tus datos de acceso</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Nombre del encargado</label>
                <input
                  type="text" value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={inputStyle}
                />
                <p style={{ fontFamily: 'var(--font-lato)', fontSize: '0.72rem',
                  color: 'rgba(240,234,214,0.3)', marginTop: '5px' }}>
                  Será tu email de acceso al panel
                </p>
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input
                  type="tel" value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="+56 9 xxxx xxxx"
                  autoComplete="tel"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Contraseña</label>
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Confirmar contraseña</label>
                <input
                  type="password" value={password2}
                  onChange={e => setPassword2(e.target.value)}
                  placeholder="Repite tu contraseña"
                  style={inputStyle}
                />
              </div>

              {error && (
                <p style={{
                  fontFamily: 'var(--font-lato)', fontSize: '0.85rem',
                  color: '#ff6b6b', background: 'rgba(255,107,107,0.08)',
                  border: '1px solid rgba(255,107,107,0.2)',
                  borderRadius: '8px', padding: '10px 14px'
                }}>{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={enviando}
                style={{
                  background: enviando ? 'rgba(232,168,76,0.3)' : '#e8a84c',
                  color: '#0a0812', border: 'none', borderRadius: '12px',
                  padding: '14px', fontFamily: 'var(--font-cinzel)',
                  fontSize: '0.85rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: enviando ? 'not-allowed' : 'pointer', marginTop: '8px'
                }}
              >
                {enviando ? 'Enviando...' : 'Reclamar este local →'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📬</div>
            <h2 style={{
              fontFamily: 'var(--font-cinzel-decorative)',
              fontSize: '1.4rem', color: '#e8a84c', marginBottom: '16px'
            }}>Revisa tu email</h2>
            <p style={{
              fontFamily: 'var(--font-lato)', fontSize: '0.9rem',
              color: 'rgba(240,234,214,0.6)', lineHeight: 1.7,
              maxWidth: '360px', margin: '0 auto 16px'
            }}>
              Enviamos un link de verificación a{' '}
              <strong style={{ color: '#f0ead6' }}>{email}</strong>.
              Haz clic en ese link para activar tu local.
            </p>
            <p style={{
              fontFamily: 'var(--font-lato)', fontSize: '0.78rem',
              color: 'rgba(240,234,214,0.3)'
            }}>¿No llegó? Revisa tu carpeta de spam.</p>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-cinzel)',
  fontSize: '0.7rem', letterSpacing: '0.15em',
  textTransform: 'uppercase', color: 'rgba(240,234,214,0.45)',
  marginBottom: '7px'
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(232,168,76,0.2)',
  borderRadius: '10px', color: 'var(--text-primary)',
  fontFamily: 'var(--font-lato)', fontSize: '0.95rem',
  outline: 'none', boxSizing: 'border-box'
}
