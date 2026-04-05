import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { localId, nombre, email, telefono, password } = await req.json()

    if (!localId || !nombre || !email || !telefono || !password) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Contraseña mínimo 8 caracteres' }, { status: 400 })
    }

    const local = await prisma.local.findUnique({
      where: { id: localId },
      select: { id: true, nombre: true, estadoLocal: true, slug: true }
    })
    if (!local) return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 })
    if (local.estadoLocal === 'RECHAZADO' || local.estadoLocal === 'SUSPENDIDO') {
      return NextResponse.json({ error: 'Este local no está disponible' }, { status: 409 })
    }
    // Check select to see if already claimed
    const localFull = await prisma.local.findUnique({ where: { id: localId }, select: { reclamadoEn: true, activo: true } })
    if (localFull?.reclamadoEn || localFull?.activo) {
      return NextResponse.json({ error: 'Este local ya fue reclamado' }, { status: 409 })
    }

    const emailExiste = await prisma.local.findFirst({
      where: { email, NOT: { id: localId } }
    })
    if (emailExiste) {
      return NextResponse.json({ error: 'Este email ya está en uso' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const token = crypto.randomBytes(32).toString('hex')
    const tokenExpira = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.local.update({
      where: { id: localId },
      data: {
        email,
        password: passwordHash,
        nombreDueno: nombre,
        nombreEncargado: nombre,
        celularDueno: telefono,
        reclamadoPor: email,
        resetToken: token,
        resetTokenExpira: tokenExpira,
      }
    })

    const urlVerificacion = `${process.env.NEXT_PUBLIC_APP_URL || 'https://deseocomer.com'}/api/verificar-local?token=${token}&localId=${localId}`

    await resend.emails.send({
      from: `DeseoComer <${process.env.FROM_EMAIL || 'noreply@deseocomer.com'}>`,
      to: email,
      subject: `Activa tu local — ${local.nombre}`,
      html: `
        <div style="background:#0a0812;color:#f0ead6;font-family:Georgia,serif;padding:40px 20px;max-width:520px;margin:0 auto;">
          <p style="font-size:2rem;text-align:center;">🧞</p>
          <h1 style="color:#e8a84c;text-align:center;font-size:1.3rem;margin-bottom:8px;">
            Hola ${nombre}
          </h1>
          <p style="color:rgba(240,234,214,0.6);text-align:center;margin-bottom:8px;">
            Activa tu local <strong style="color:#f0ead6">${local.nombre}</strong> en DeseoComer
          </p>
          <p style="color:rgba(240,234,214,0.4);text-align:center;margin-bottom:28px;font-size:0.9rem;">
            Haz clic para verificar tu email y comenzar a publicar concursos
          </p>
          <a href="${urlVerificacion}" style="display:block;background:#e8a84c;color:#0a0812;text-decoration:none;text-align:center;padding:16px;border-radius:12px;font-weight:700;font-size:1rem;">
            Verificar y activar mi local →
          </a>
          <p style="font-size:0.78rem;color:rgba(240,234,214,0.25);text-align:center;margin-top:24px;">
            Este link expira en 24 horas. Si no solicitaste esto, ignora este email.
          </p>
        </div>
      `
    })

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[reclamar-local]', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
