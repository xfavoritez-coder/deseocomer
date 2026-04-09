import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { nivel2Html } from "@/emails/nivel2Html";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    let refCodeParam = searchParams.get("ref");
    let concursoParam = searchParams.get("concurso");
    if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

    const usuario = await prisma.usuario.findFirst({ where: { tokenVerificacion: token } });
    if (!usuario) return NextResponse.json({ error: "Token inválido o ya usado" }, { status: 400 });

    // Reject tokens older than 48 hours (use updatedAt since token is regenerated on resend)
    const tokenAge = Date.now() - new Date(usuario.updatedAt).getTime();
    if (tokenAge > 48 * 60 * 60 * 1000) return NextResponse.json({ error: "Este enlace ha expirado. Solicita uno nuevo." }, { status: 400 });

    // Fallback: use ref data saved at registration if not in URL
    if (!refCodeParam && usuario.registroRefCode) refCodeParam = usuario.registroRefCode;
    if (!concursoParam && usuario.registroRefConcursoId) concursoParam = usuario.registroRefConcursoId;

    await prisma.usuario.update({ where: { id: usuario.id }, data: { emailVerificado: true, emailVerificadoAt: new Date(), tokenVerificacion: null } });

    let autoReferidorNombre: string | null = null;
    let autoConcursoSlug: string | null = null;

    // Auto-participate in concurso if referred
    if (refCodeParam && concursoParam) {
      try {
        const referidor = await prisma.usuario.findFirst({ where: { OR: [{ codigoRef: refCodeParam.toUpperCase() }, { id: refCodeParam }] }, select: { id: true } });
        if (referidor) {
          const concurso = await prisma.concurso.findFirst({
            where: { OR: [{ id: concursoParam }, { slug: concursoParam }], activo: true },
          });
          if (concurso && new Date(concurso.fechaFin) > new Date()) {
            const yaParticipa = await prisma.participanteConcurso.findUnique({
              where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: usuario.id } },
            });
            if (!yaParticipa) {
              const refParticipante = await prisma.participanteConcurso.findUnique({
                where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidor.id } },
              });

              let referidorNivel2Id: string | null = null;
              if (refParticipante?.referidorDirectoId) {
                referidorNivel2Id = refParticipante.referidorDirectoId;
              }

              const totalPart = await prisma.participanteConcurso.count({ where: { concursoId: concurso.id } });
              const esMadrugador = totalPart < 10;
              const puntosBase = 1;
              const puntosRefBonus = 3;
              const puntosMadrugador = esMadrugador ? 2 : 0;

              // Referral points stay PENDING until phone is verified
              const telVerificado = usuario.telefonoVerificado;
              const puntosReales = puntosBase + puntosMadrugador + (telVerificado ? puntosRefBonus : 0);
              const puntosPend = telVerificado ? 0 : puntosRefBonus;

              await prisma.participanteConcurso.create({
                data: {
                  concursoId: concurso.id, usuarioId: usuario.id, referidoPor: referidor.id,
                  puntos: puntosReales, puntosPendientes: puntosPend,
                  referidorDirectoId: referidor.id, referidorNivel2Id, esMadrugador, puntosMadrugador,
                },
              });

              // Give referrer +3 points (pending if new user hasn't verified phone)
              if (refParticipante) {
                if (telVerificado) {
                  await prisma.participanteConcurso.update({
                    where: { id: refParticipante.id },
                    data: { puntos: { increment: 3 }, puntosReferidosNuevos: { increment: 3 } },
                  });
                } else {
                  await prisma.participanteConcurso.update({
                    where: { id: refParticipante.id },
                    data: { puntosPendientes: { increment: 3 } },
                  });
                }
              }

              const premioCorto = concurso.premio && concurso.premio.length > 30 ? concurso.premio.substring(0, 30) + "..." : (concurso.premio || "un concurso");
              const cSlug = concurso.slug || concurso.id;

              // Nivel 2 referrer — also pending if phone not verified
              if (referidorNivel2Id) {
                const nivel2Part = await prisma.participanteConcurso.findUnique({
                  where: { concursoId_usuarioId: { concursoId: concurso.id, usuarioId: referidorNivel2Id } },
                });
                if (nivel2Part && (nivel2Part.puntosNivel2 ?? 0) < 20) {
                  if (telVerificado) {
                    await prisma.participanteConcurso.update({
                      where: { id: nivel2Part.id },
                      data: { puntos: { increment: 2 }, puntosNivel2: { increment: 2 } },
                    });
                    const refDirectoNombre = refParticipante ? (await prisma.usuario.findUnique({ where: { id: referidor.id }, select: { nombre: true } }))?.nombre?.split(" ")[0] : "tu referido";
                    prisma.notificacion.create({ data: { usuarioId: referidorNivel2Id, tipo: "nivel2", mensaje: `La red de ${refDirectoNombre ?? "tu referido"} te sumó +2 puntos en "${premioCorto}" 🧞`, datos: { concursoSlug: cSlug } } }).catch(() => {});
                    // Email nivel 2 — una sola vez en la vida
                    const n2User = await prisma.usuario.findUnique({ where: { id: referidorNivel2Id }, select: { email: true, nombre: true, emailNivel2Enviado: true } });
                    if (n2User && !n2User.emailNivel2Enviado) {
                      const from = process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <noreply@deseocomer.com>";
                      resend.emails.send({ from, to: n2User.email, subject: `🧞 ${n2User.nombre.split(/\s+/)[0]}, ¡tu red te está sumando puntos!`, html: nivel2Html({ nombre: n2User.nombre, referidoDirectoNombre: refDirectoNombre ?? "tu referido", premioConcurso: concurso.premio, concursoSlug: cSlug }) }).then(() => {
                        prisma.usuario.update({ where: { id: referidorNivel2Id! }, data: { emailNivel2Enviado: true } }).catch(() => {});
                      }).catch(() => {})
                    }
                  } else {
                    await prisma.participanteConcurso.update({
                      where: { id: nivel2Part.id },
                      data: { puntosNivel2Pendientes: { increment: 2 } },
                    });
                  }
                }
              }

              // Notificación al nuevo participante
              if (telVerificado) {
                const totalPts = puntosBase + puntosRefBonus + puntosMadrugador;
                prisma.notificacion.create({ data: { usuarioId: usuario.id, tipo: "entrada_concurso", mensaje: `¡Entraste a "${premioCorto}" con ${totalPts} puntos! (+1 base, +3 por referido${esMadrugador ? ", +2 madrugador" : ""}) 🎉`, datos: { concursoSlug: cSlug } } }).catch(() => {});
              } else {
                prisma.notificacion.create({ data: { usuarioId: usuario.id, tipo: "entrada_concurso", mensaje: `¡Entraste a "${premioCorto}"! Verifica tu celular para activar tus +3 puntos de referido 📱`, datos: { concursoSlug: cSlug } } }).catch(() => {});
              }

              // Notificación al referidor
              if (refParticipante) {
                const nombreRef = usuario.nombre?.split(" ")[0] ?? "Alguien";
                if (telVerificado) {
                  prisma.notificacion.create({ data: { usuarioId: referidor.id, tipo: "referido_nuevo", mensaje: `${nombreRef} se unió con tu link en "${premioCorto}". +3 pts para ti 🎉`, datos: { concursoSlug: cSlug } } }).catch(() => {});
                } else {
                  prisma.notificacion.create({ data: { usuarioId: referidor.id, tipo: "referido_nuevo", mensaje: `${nombreRef} activó su cuenta con tu link en "${premioCorto}". Sus +3 pts se acreditarán cuando verifique su celular 📱`, datos: { concursoSlug: cSlug } } }).catch(() => {});
                }
              }

              prisma.usuario.update({ where: { id: usuario.id }, data: { totalConcursosParticipados: { increment: 1 } } }).catch(() => {});
            }
          }
        }
        // Set concursoSlug and referidorNombre for the response
        const refUser = referidor ? await prisma.usuario.findUnique({ where: { id: referidor.id }, select: { nombre: true } }) : null;
        autoReferidorNombre = refUser?.nombre?.split(" ")[0] ?? null;
        autoConcursoSlug = concursoParam;
      } catch (e) { console.error("[verificar-email] Error auto-participar:", e); }
    }

    // Puntos pendientes (propios, referidor directo, nivel 2) se convierten
    // a reales SOLO al verificar teléfono (ver /api/verificar-telefono/verificar)

    return NextResponse.json({ ok: true, id: usuario.id, nombre: usuario.nombre, email: usuario.email, referidorNombre: autoReferidorNombre, concursoSlug: autoConcursoSlug, telefonoVerificado: usuario.telefonoVerificado });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
