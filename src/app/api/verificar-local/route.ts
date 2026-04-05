import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const localId = searchParams.get('localId')

    if (!token || !localId) {
      return NextResponse.redirect(new URL('/locales?error=token_invalido', req.url))
    }

    const local = await prisma.local.findFirst({
      where: {
        id: localId,
        resetToken: token,
        resetTokenExpira: { gt: new Date() },
      }
    })

    if (!local) {
      return NextResponse.redirect(new URL('/locales?error=token_expirado', req.url))
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://deseocomer.com'
    const from = `DeseoComer <${process.env.FROM_EMAIL || 'noreply@deseocomer.com'}>`

    // Marcar como reclamado pero NO activar — requiere aprobación admin
    await prisma.local.update({
      where: { id: localId },
      data: {
        verificado: true,
        reclamadoEn: new Date(),
        resetToken: null,
        resetTokenExpira: null,
      }
    })

    // Notificar admin para que apruebe
    await resend.emails.send({
      from,
      to: 'favoritez@gmail.com',
      subject: `Nuevo reclamo de local — ${local.nombre}`,
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>Un dueño reclamó su local</h2>
          <p><strong>Local:</strong> ${local.nombre}</p>
          <p><strong>Email:</strong> ${local.email}</p>
          <p><strong>Encargado:</strong> ${local.nombreEncargado}</p>
          <p><strong>Teléfono:</strong> ${local.celularDueno}</p>
          <p><strong>Comuna:</strong> ${local.comuna}</p>
          <p style="margin-top:16px"><strong>Acción requerida:</strong> Aprueba o rechaza desde el panel admin.</p>
          <a href="${appUrl}/admin/locales" style="display:inline-block;background:#e8a84c;color:#0a0812;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:12px;">Ir al admin →</a>
        </div>
      `
    }).catch(err => console.error('[Email admin reclamar]', err))

    // Redirigir a página de pendiente
    return NextResponse.redirect(
      new URL(`/local-pendiente`, req.url)
    )

  } catch (error) {
    console.error('[verificar-local]', error)
    return NextResponse.redirect(new URL('/locales?error=interno', req.url))
  }
}
