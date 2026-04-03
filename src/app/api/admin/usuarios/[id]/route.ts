import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";
import { resend } from "@/lib/resend";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;

    // Get all participations with referral data
    const participaciones = await prisma.participanteConcurso.findMany({
      where: { usuarioId: id },
      select: {
        id: true, concursoId: true, puntos: true, puntosNivel2: true, puntosNivel2Pendientes: true,
        referidoPor: true, referidorDirectoId: true, referidorNivel2Id: true, estado: true,
        concurso: { select: { id: true, slug: true, premio: true, fechaFin: true, estado: true, local: { select: { nombre: true } } } },
      },
    });

    const result = await Promise.all(participaciones.map(async (p) => {
      // Who referred this user
      let referidoPorNombre: string | null = null;
      if (p.referidorDirectoId) {
        const ref = await prisma.usuario.findUnique({ where: { id: p.referidorDirectoId }, select: { id: true, nombre: true, email: true } });
        if (ref) referidoPorNombre = ref.nombre;
      }

      // Direct referrals (people this user brought)
      const referidosDirectos = await prisma.participanteConcurso.findMany({
        where: { concursoId: p.concursoId, referidorDirectoId: id },
        select: { usuarioId: true, puntos: true, estado: true, usuario: { select: { id: true, nombre: true, email: true, emailVerificado: true, ipRegistro: true } } },
      });

      // Level 2 referrals (people brought by this user's referrals)
      const referidosNivel2 = await prisma.participanteConcurso.findMany({
        where: { concursoId: p.concursoId, referidorNivel2Id: id },
        select: { usuarioId: true, puntos: true, estado: true, usuario: { select: { id: true, nombre: true, email: true, emailVerificado: true, ipRegistro: true } } },
      });

      return {
        concursoId: p.concursoId,
        premio: p.concurso.premio,
        localNombre: p.concurso.local.nombre,
        slug: p.concurso.slug,
        estadoConcurso: p.concurso.estado,
        fechaFin: p.concurso.fechaFin,
        puntos: p.puntos,
        puntosNivel2: p.puntosNivel2,
        puntosNivel2Pendientes: p.puntosNivel2Pendientes,
        estado: p.estado,
        referidoPorId: p.referidorDirectoId,
        referidoPorNombre,
        referidosDirectos: referidosDirectos.map(r => ({
          id: r.usuario.id, nombre: r.usuario.nombre, email: r.usuario.email,
          verificado: r.usuario.emailVerificado, puntos: r.puntos, estado: r.estado,
          ipRegistro: r.usuario.ipRegistro ?? "",
        })),
        referidosNivel2: referidosNivel2.map(r => ({
          id: r.usuario.id, nombre: r.usuario.nombre, email: r.usuario.email,
          verificado: r.usuario.emailVerificado, puntos: r.puntos, estado: r.estado,
          ipRegistro: r.usuario.ipRegistro ?? "",
        })),
      };
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin usuarios GET referidos]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const body = await req.json();
    const { accion } = body;

    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (accion === "editar") {
      const updated = await prisma.usuario.update({
        where: { id },
        data: {
          ...(body.nombre !== undefined && { nombre: body.nombre }),
          ...(body.email !== undefined && { email: body.email }),
          ...(body.ciudad !== undefined && { ciudad: body.ciudad }),
          ...(body.telefono !== undefined && { telefono: body.telefono || null }),
          ...(body.fotoUrl !== undefined && { fotoUrl: body.fotoUrl }),
          ...(body.tipo !== undefined && { tipo: body.tipo }),
          ...(body.cumpleDia !== undefined && { cumpleDia: body.cumpleDia ? Number(body.cumpleDia) : null }),
          ...(body.cumpleMes !== undefined && { cumpleMes: body.cumpleMes ? Number(body.cumpleMes) : null }),
          ...(body.cumpleAnio !== undefined && { cumpleAnio: body.cumpleAnio ? Number(body.cumpleAnio) : null }),
        },
      });
      const { password: _, ...safe } = updated;
      return NextResponse.json({ ok: true, data: safe });
    }

    if (accion === "resetear-foto") {
      await prisma.usuario.update({ where: { id }, data: { fotoUrl: "" } });
      return NextResponse.json({ ok: true });
    }

    if (accion === "cambiar-password") {
      if (!body.nuevaPassword || body.nuevaPassword.length < 8) return NextResponse.json({ error: "Mínimo 8 caracteres" }, { status: 400 });
      const hash = await bcrypt.hash(body.nuevaPassword, 10);
      await prisma.usuario.update({ where: { id }, data: { password: hash } });
      return NextResponse.json({ ok: true });
    }

    if (accion === "activar") {
      await prisma.usuario.update({ where: { id }, data: { emailVerificado: true, emailVerificadoAt: new Date(), tokenVerificacion: null } });
      return NextResponse.json({ ok: true });
    }

    if (accion === "desactivar") {
      await prisma.usuario.update({ where: { id }, data: { emailVerificado: false } });
      return NextResponse.json({ ok: true });
    }

    if (accion === "reenviar-verificacion") {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.usuario.update({ where: { id }, data: { tokenVerificacion: token } });
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deseocomer.com";
      const url = `${baseUrl}/verificar-email?token=${token}`;
      await resend.emails.send({
        from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
        to: usuario.email,
        subject: "Activa tu cuenta en DeseoComer",
        html: `<div style="background:#1a0e05;font-family:Georgia,serif;padding:40px;max-width:560px;margin:0 auto"><div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div><div style="background:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px"><h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">Confirma tu email, ${usuario.nombre}</h2><p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:32px">Activa tu cuenta para participar en concursos:</p><div style="text-align:center;margin-bottom:32px"><a href="${url}" style="background:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Activar mi cuenta →</a></div></div></div>`,
      });
      return NextResponse.json({ ok: true });
    }

    if (accion === "ajustar-puntos") {
      const { concursoId, nuevosPuntos, motivo, enviarCorreo } = body;
      if (!concursoId || nuevosPuntos === undefined) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

      const participante = await prisma.participanteConcurso.findUnique({
        where: { concursoId_usuarioId: { concursoId, usuarioId: id } },
        include: { concurso: { select: { premio: true, local: { select: { nombre: true } } } } },
      });
      if (!participante) return NextResponse.json({ error: "No participa en este concurso" }, { status: 404 });

      const puntosAnteriores = participante.puntos;
      await prisma.participanteConcurso.update({
        where: { id: participante.id },
        data: { puntos: parseInt(nuevosPuntos) },
      });

      if (enviarCorreo) {
        try {
          const diferencia = parseInt(nuevosPuntos) - puntosAnteriores;
          const subieron = diferencia > 0;
          await resend.emails.send({
            from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
            to: usuario.email,
            subject: `Ajuste de puntos en tu concurso · DeseoComer`,
            html: `<html><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>
<div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">Ajuste de puntos</h2>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Hola ${usuario.nombre.split(" ")[0]},</p>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Te informamos que se ha realizado un ajuste en tus puntos del concurso <strong style="color:#f5d080">"${participante.concurso.premio}"</strong> de <strong style="color:#e8a84c">${participante.concurso.local.nombre}</strong>.</p>
<div style="background-color:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.15);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
<p style="color:rgba(240,234,214,0.5);font-size:14px;margin:0 0 8px">Puntos anteriores: <strong style="color:rgba(240,234,214,0.7)">${puntosAnteriores}</strong></p>
<p style="color:#e8a84c;font-size:24px;font-weight:bold;margin:0">Puntos actuales: ${nuevosPuntos}</p>
<p style="color:${subieron ? "#3db89e" : "#ff8080"};font-size:14px;margin:8px 0 0">${subieron ? "+" : ""}${diferencia} puntos</p>
</div>
${motivo ? `<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px"><strong style="color:#e8a84c">Motivo:</strong> ${motivo}</p>` : ""}
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Recuerda que los puntos de referidos solo se acreditan cuando la persona que invitaste verifica su correo electrónico. Si tus referidos activan su cuenta, los puntos correspondientes se sumarán automáticamente.</p>
<div style="text-align:center"><a href="https://deseocomer.com/concursos" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">Ver mis concursos →</a></div>
</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`,
          });
        } catch (emailErr) {
          console.error("[Email ajuste puntos]", emailErr);
        }
      }

      return NextResponse.json({ ok: true, puntosAnteriores, nuevosPuntos: parseInt(nuevosPuntos) });
    }

    if (accion === "descalificar") {
      // Descalificar de todos los concursos activos
      const participaciones = await prisma.participanteConcurso.findMany({
        where: { usuarioId: id, concurso: { activo: true, cancelado: false, fechaFin: { gt: new Date() } } },
      });
      if (participaciones.length === 0) return NextResponse.json({ error: "No participa en concursos activos" }, { status: 400 });
      await prisma.participanteConcurso.updateMany({
        where: { id: { in: participaciones.map(p => p.id) } },
        data: { estado: "descalificado", puntos: 0 },
      });

      // Send descalificacion email
      try {
        const concursosAfectados = await prisma.participanteConcurso.findMany({
          where: { id: { in: participaciones.map(p => p.id) } },
          include: { concurso: { select: { premio: true, local: { select: { nombre: true } } } } },
        });
        const listaConcursos = concursosAfectados.map(p => `• ${p.concurso.premio} (${p.concurso.local.nombre})`).join("\n");

        await resend.emails.send({
          from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
          to: usuario.email,
          subject: "Aviso importante sobre tu participación · DeseoComer",
          html: `<html><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>
<div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">
<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">Aviso sobre tu participación</h2>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Hola ${usuario.nombre.split(" ")[0]},</p>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Lamentamos informarte que tu participación ha sido descalificada en los siguientes concursos por incumplimiento de las reglas de la plataforma:</p>
<div style="background-color:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.2);border-radius:12px;padding:16px;margin-bottom:16px">
<p style="color:#ff8080;font-size:14px;line-height:1.7;margin:0;white-space:pre-line">${listaConcursos}</p>
</div>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:16px">Esto puede deberse a:</p>
<p style="color:#c0a060;font-size:14px;line-height:1.8;margin-bottom:16px">• Uso de cuentas múltiples o correos temporales<br/>• Registros desde la misma dirección IP<br/>• Patrones sospechosos de actividad<br/>• Otras violaciones a los términos y condiciones</p>
<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:0">Si crees que esto es un error, puedes contactarnos respondiendo a este correo.</p>
</div>
<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 y mucha hambre · DeseoComer.com</p></div>
</div></body></html>`,
        });
      } catch (emailErr) {
        console.error("[Email descalificacion]", emailErr);
      }

      return NextResponse.json({ ok: true, descalificados: participaciones.length });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("[Admin usuarios PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { id } = await params;
    await prisma.participanteConcurso.deleteMany({ where: { usuarioId: id } });
    await prisma.favorito.deleteMany({ where: { usuarioId: id } });
    await prisma.resena.deleteMany({ where: { usuarioId: id } });
    await prisma.usuario.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin usuarios DELETE]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
