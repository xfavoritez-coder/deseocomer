import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";
import { recordatorioActivacionHtml } from "@/emails/recordatorioActivacionHtml";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const from = `DeseoComer <${process.env.FROM_EMAIL || "noreply@deseocomer.com"}>`;
  const log: string[] = [];

  try {
    // Usuarios registrados hace 2 días (ventana 24h-72h) que no verificaron
    const ahora = new Date();
    const hace3dias = new Date(ahora.getTime() - 72 * 3600000);
    const hace1dia = new Date(ahora.getTime() - 24 * 3600000);

    const usuarios = await prisma.usuario.findMany({
      where: {
        emailVerificado: false,
        createdAt: { gte: hace3dias, lte: hace1dia },
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        tokenVerificacion: true,
        updatedAt: true,
      },
    });

    if (usuarios.length === 0) {
      return NextResponse.json({ ok: true, mensaje: "No hay usuarios pendientes", enviados: 0 });
    }

    // Contar concursos activos
    const concursosActivos = await prisma.concurso.count({
      where: { activo: true, fechaFin: { gt: ahora } },
    });

    let enviados = 0;
    let errores = 0;

    for (const u of usuarios) {
      try {
        // Buscar si tiene referidor en alguna participación
        const participacion = await prisma.participanteConcurso.findFirst({
          where: { usuarioId: u.id, referidorDirectoId: { not: null } },
          select: { referidorDirectoId: true },
        });

        let referidorNombre: string | null = null;
        if (participacion?.referidorDirectoId) {
          const referidor = await prisma.usuario.findUnique({
            where: { id: participacion.referidorDirectoId },
            select: { nombre: true },
          });
          referidorNombre = referidor?.nombre?.split(/\s+/)[0] ?? null;
        }

        // Regenerar token si no tiene o si expiró (>48h)
        let token = u.tokenVerificacion;
        const tokenEdad = Date.now() - new Date(u.updatedAt).getTime();
        if (!token || tokenEdad > 48 * 3600000) {
          token = crypto.randomBytes(32).toString("hex");
          await prisma.usuario.update({
            where: { id: u.id },
            data: { tokenVerificacion: token },
          });
        }

        const html = recordatorioActivacionHtml({
          nombre: u.nombre,
          concursosActivos,
          referidorNombre,
          tokenVerificacion: token,
        });

        await resend.emails.send({
          from,
          to: u.email,
          subject: `🧞 ${u.nombre.split(/\s+/)[0]}, tu cuenta está casi lista — solo falta un clic`,
          html,
        });

        enviados++;
        log.push(`✅ ${u.email}`);
      } catch (err) {
        errores++;
        log.push(`❌ ${u.email}: ${err instanceof Error ? err.message : "error"}`);
      }
    }

    return NextResponse.json({ ok: true, total: usuarios.length, enviados, errores, log });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error interno" }, { status: 500 });
  }
}
