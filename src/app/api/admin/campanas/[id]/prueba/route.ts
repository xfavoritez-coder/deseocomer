import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";
import { resend } from "@/lib/resend";
import { buildEmailHtml } from "@/lib/emails/campana-locales";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const { emailPrueba } = await req.json();
    if (!emailPrueba?.includes("@")) return NextResponse.json({ error: "Email inválido" }, { status: 400 });

    const campana = await prisma.campana.findUnique({ where: { id } });
    if (!campana) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

    // Get cupos
    const [cfgTotal, cfgUsados] = await Promise.all([
      prisma.configSite.findUnique({ where: { clave: "cupos_founder_total" } }),
      prisma.configSite.findUnique({ where: { clave: "cupos_founder_usados" } }),
    ]);
    const cuposRestantes = Math.max(0, (cfgTotal ? parseInt(cfgTotal.valor) : 50) - (cfgUsados ? parseInt(cfgUsados.valor) : 0));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
    // Test links don't track (use # as id)
    const trackClickUrl = `${baseUrl}/registro-local`;
    const trackOpenUrl = `${baseUrl}/api/track/open?id=test`;

    const html = buildEmailHtml({
      nombre: "Nombre de Prueba",
      cuposRestantes,
      trackClickUrl,
      trackOpenUrl,
      email: emailPrueba,
    });

    const from = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <hola@deseocomer.com>";
    await resend.emails.send({ from, to: emailPrueba, subject: `[PRUEBA] ${campana.asunto}`, html });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error al enviar" }, { status: 500 });
  }
}
