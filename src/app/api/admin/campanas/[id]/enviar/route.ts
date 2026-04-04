import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";
import { resend } from "@/lib/resend";
import { buildEmailHtml } from "@/lib/emails/campana-locales";

// Vercel has 60s timeout — send as many as we can in ~50s, then return.
// Frontend calls again to continue sending the rest.
const MAX_DURATION_MS = 50000;
const LOTE = 10;
const PAUSA = 500;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const campana = await prisma.campana.findUnique({ where: { id } });
    if (!campana) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

    // Mark as sending
    if (campana.estado !== "enviando") {
      await prisma.campana.update({ where: { id }, data: { estado: "enviando" } });
    }

    // Get cupos once
    const [cfgTotal, cfgUsados] = await Promise.all([
      prisma.configSite.findUnique({ where: { clave: "cupos_founder_total" } }),
      prisma.configSite.findUnique({ where: { clave: "cupos_founder_usados" } }),
    ]);
    const cuposRestantes = Math.max(0, (cfgTotal ? parseInt(cfgTotal.valor) : 50) - (cfgUsados ? parseInt(cfgUsados.valor) : 0));

    // Only get contacts not yet sent (no error AND not already sent via abrioEmail check won't work — we need a "enviado" marker)
    // Use a simple approach: contacts without errorEnvio that haven't been counted as sent yet
    // We track sent contacts by adding a special marker in errorEnvio field: null = not sent, "" = sent ok, "error..." = failed
    // But current schema uses null for "not sent yet". Let's use a different approach:
    // Skip contacts that were already processed by checking if they exist in the sent count
    // Better: add "enviado" boolean. But schema is already deployed.
    // Simplest: use errorEnvio = "" as "sent successfully" marker, null = pending
    const contactosPendientes = await prisma.contactoCampana.findMany({
      where: { campanaId: id, errorEnvio: null },
      orderBy: { createdAt: "asc" },
      take: 500, // Process max 500 per call
    });

    if (contactosPendientes.length === 0) {
      // All done
      const totalEnviados = await prisma.contactoCampana.count({ where: { campanaId: id, errorEnvio: "" } });
      const totalErrores = await prisma.contactoCampana.count({ where: { campanaId: id, errorEnvio: { not: null, notIn: [""] } } });
      await prisma.campana.update({
        where: { id },
        data: { estado: "completada", enviadoAt: new Date(), totalEnviados: totalEnviados, totalErrores: totalErrores },
      });
      return NextResponse.json({ ok: true, completada: true, enviados: totalEnviados, errores: totalErrores, pendientes: 0 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
    const from = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <hola@deseocomer.com>";
    let enviados = 0;
    let errores = 0;
    const startTime = Date.now();

    for (let i = 0; i < contactosPendientes.length; i += LOTE) {
      // Check time budget
      if (Date.now() - startTime > MAX_DURATION_MS) break;

      const lote = contactosPendientes.slice(i, i + LOTE);

      for (const contacto of lote) {
        if (Date.now() - startTime > MAX_DURATION_MS) break;

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
          // Mark as sent successfully (errorEnvio = "" means sent ok)
          await prisma.contactoCampana.update({ where: { id: contacto.id }, data: { errorEnvio: "" } }).catch(() => {});
          enviados++;
        } catch (e: any) {
          errores++;
          await prisma.contactoCampana.update({
            where: { id: contacto.id },
            data: { errorEnvio: e.message?.slice(0, 200) || "Error desconocido" },
          }).catch(() => {});
        }
      }

      if (i + LOTE < contactosPendientes.length && Date.now() - startTime < MAX_DURATION_MS) {
        await new Promise(r => setTimeout(r, PAUSA));
      }
    }

    // Update progress
    const totalEnviados = await prisma.contactoCampana.count({ where: { campanaId: id, errorEnvio: "" } });
    const totalErrores = await prisma.contactoCampana.count({ where: { campanaId: id, errorEnvio: { not: null, notIn: [""] } } });
    const pendientes = await prisma.contactoCampana.count({ where: { campanaId: id, errorEnvio: null } });

    await prisma.campana.update({
      where: { id },
      data: {
        totalEnviados,
        totalErrores,
        ...(pendientes === 0 ? { estado: "completada", enviadoAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ ok: true, completada: pendientes === 0, enviados: totalEnviados, errores: totalErrores, pendientes, enviadosEstaVez: enviados });
  } catch (e: any) {
    console.error("[Campana enviar]", e);
    return NextResponse.json({ error: e.message || "Error interno" }, { status: 500 });
  }
}
