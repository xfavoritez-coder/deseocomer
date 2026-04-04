import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";
import { resend } from "@/lib/resend";
import { buildEmailHtml } from "@/lib/emails/campana-locales";

const LOTE = 10;
const PAUSA = 1500;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const campana = await prisma.campana.findUnique({ where: { id } });
    if (!campana) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    if (campana.estado === "completada") return NextResponse.json({ error: "Campaña ya fue enviada" }, { status: 400 });

    // Mark as sending
    await prisma.campana.update({ where: { id }, data: { estado: "enviando" } });

    // Get cupos once before loop
    const config = await prisma.configSite.findUnique({ where: { clave: "cupos_founder_total" } });
    const configUsados = await prisma.configSite.findUnique({ where: { clave: "cupos_founder_usados" } });
    const cuposTotal = config ? parseInt(config.valor) : 50;
    const cuposUsados = configUsados ? parseInt(configUsados.valor) : 0;
    const cuposRestantes = Math.max(0, cuposTotal - cuposUsados);

    const contactos = await prisma.contactoCampana.findMany({
      where: { campanaId: id, errorEnvio: null },
      orderBy: { createdAt: "asc" },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
    const from = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <hola@deseocomer.com>";
    let enviados = 0;
    let errores = 0;

    for (let i = 0; i < contactos.length; i += LOTE) {
      const lote = contactos.slice(i, i + LOTE);

      for (const contacto of lote) {
        const trackClickUrl = `${baseUrl}/api/track/click?id=${contacto.id}&url=${encodeURIComponent(baseUrl + "/registro-local")}`;
        const trackOpenUrl = `${baseUrl}/api/track/open?id=${contacto.id}`;

        const html = buildEmailHtml({
          nombre: contacto.nombre,
          cuposRestantes,
          trackClickUrl,
          trackOpenUrl,
          email: contacto.email,
        });

        try {
          await resend.emails.send({ from, to: contacto.email, subject: campana.asunto, html });
          enviados++;
        } catch (e: any) {
          errores++;
          await prisma.contactoCampana.update({
            where: { id: contacto.id },
            data: { errorEnvio: e.message?.slice(0, 200) || "Error desconocido" },
          }).catch(() => {});
        }
      }

      // Update progress
      await prisma.campana.update({
        where: { id },
        data: { totalEnviados: enviados, totalErrores: errores },
      }).catch(() => {});

      // Pause between batches
      if (i + LOTE < contactos.length) {
        await new Promise(r => setTimeout(r, PAUSA));
      }
    }

    await prisma.campana.update({
      where: { id },
      data: { estado: "completada", enviadoAt: new Date(), totalEnviados: enviados, totalErrores: errores },
    });

    return NextResponse.json({ ok: true, enviados, errores });
  } catch (e: any) {
    console.error("[Campana enviar]", e);
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 });
  }
}
