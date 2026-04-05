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

    await prisma.local.update({
      where: { id: localId },
      data: {
        estadoLocal: 'ACTIVO',
        activo: true,
        verificado: true,
        reclamadoEn: new Date(),
        activadoAt: new Date(),
        resetToken: null,
        resetTokenExpira: null,
      }
    })

    // Notificar admin
    await resend.emails.send({
      from,
      to: 'favoritez@gmail.com',
      subject: `Local reclamado — ${local.nombre}`,
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>Local reclamado y activado</h2>
          <p><strong>Local:</strong> ${local.nombre}</p>
          <p><strong>Email:</strong> ${local.email}</p>
          <p><strong>Encargado:</strong> ${local.nombreEncargado}</p>
          <p><strong>Teléfono:</strong> ${local.celularDueno}</p>
          <p><strong>Comuna:</strong> ${local.comuna}</p>
        </div>
      `
    }).catch(err => console.error('[Email admin reclamar]', err))

    // Notificar lista de espera
    const alertas = await prisma.localAlertaEspera.findMany({
      where: { localId, notificado: false }
    })

    for (const alerta of alertas) {
      await resend.emails.send({
        from,
        to: alerta.email,
        subject: `${local.nombre} ya está en DeseoComer`,
        html: `
          <div style="background:#0a0812;color:#f0ead6;font-family:Georgia,serif;padding:40px 20px;max-width:520px;margin:0 auto;">
            <p style="font-size:2rem;text-align:center;">🧞</p>
            <h1 style="color:#e8a84c;text-align:center;font-size:1.2rem;">
              ${local.nombre} ya está activo
            </h1>
            <p style="color:rgba(240,234,214,0.6);text-align:center;margin-bottom:28px;">
              Pediste que te avisáramos cuando este local se uniera a DeseoComer.
            </p>
            <a href="${appUrl}/locales/${local.slug}"
              style="display:block;background:#e8a84c;color:#0a0812;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-weight:700;">
              Ver ${local.nombre} →
            </a>
          </div>
        `
      }).catch(err => console.error('[Email alerta espera]', err))
      await prisma.localAlertaEspera.update({
        where: { id: alerta.id },
        data: { notificado: true, notificadoEn: new Date() }
      })
    }

    return NextResponse.redirect(
      new URL(`/panel?reclamado=1`, req.url)
    )

  } catch (error) {
    console.error('[verificar-local]', error)
    return NextResponse.redirect(new URL('/locales?error=interno', req.url))
  }
}
