import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";
import disposableDomains from "disposable-email-domains";

// In-memory blacklist cache (refreshed every 5 minutes)
let cachedBlacklist: { ips: string[]; emails: string[] } | null = null;
let blacklistLoadedAt = 0;
async function getBlacklist() {
  if (cachedBlacklist && Date.now() - blacklistLoadedAt < 5 * 60 * 1000) return cachedBlacklist;
  try {
    const row = await prisma.configSite.findUnique({ where: { clave: "blacklist_infractores" } });
    if (row?.valor) {
      const bl = JSON.parse(row.valor);
      cachedBlacklist = { ips: bl.ips ?? [], emails: bl.emails ?? [] };
    } else {
      cachedBlacklist = { ips: [], emails: [] };
    }
  } catch {
    cachedBlacklist = cachedBlacklist ?? { ips: [], emails: [] };
  }
  blacklistLoadedAt = Date.now();
  return cachedBlacklist;
}

async function generarCodigoRef(nombre: string): Promise<string> {
  const base = nombre.replace(/\s/g, '').slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
  for (let i = 0; i < 10; i++) {
    const codigo = base + Math.floor(Math.random() * 900 + 100);
    const existe = await prisma.usuario.findFirst({ where: { codigoRef: codigo } });
    if (!existe) return codigo;
  }
  return base + Date.now().toString().slice(-4);
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, telefono, ciudad, cumpleDia, cumpleMes, cumpleAnio, estiloAlimentario, comidasFavoritas, refCode, concursoId: refConcursoId, turnstileToken } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Turnstile verification — always required
    if (!turnstileToken) {
      return NextResponse.json({ error: "Verificación de seguridad requerida. Recarga la página." }, { status: 403 });
    }
    const tsSecret = process.env.TURNSTILE_SECRET_KEY || "0x4AAAAAAC1ee-ppSpuFz59luDj_HRkzcfE";
    if (tsSecret) {
      const tsRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: tsSecret, response: turnstileToken, remoteip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "" }),
      });
      const tsData = await tsRes.json();
      if (!tsData.success) {
        return NextResponse.json({ error: "Verificación de seguridad fallida. Recarga la página e intenta de nuevo." }, { status: 403 });
      }
    }

    // Blacklist de dominios desechables
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) {
      return NextResponse.json(
        { error: "Este tipo de correo no está permitido. Por favor usa un correo personal como Gmail u Outlook." },
        { status: 400 }
      );
    }


    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 });
    }

    // Gmail dot trick detection: gmail ignores dots, so a.b@gmail = ab@gmail
    // Lightweight check: search by prefix pattern instead of full table scan
    if (domain === "gmail.com") {
      const [localPart] = email.split("@");
      const normalized = localPart.toLowerCase().replace(/\./g, "").replace(/\+.*$/, "");
      // Build LIKE pattern from first 4 chars with wildcards: "came%" matches camile, came.le, etc.
      const prefix = normalized.slice(0, 4);
      if (prefix.length >= 4) {
        const candidates = await prisma.usuario.findMany({
          where: { email: { startsWith: prefix, endsWith: "@gmail.com", mode: "insensitive" } },
          select: { email: true },
          take: 10,
        });
        const dupes = candidates.filter(c => {
          const [cLocal] = c.email.split("@");
          return cLocal.toLowerCase().replace(/\./g, "").replace(/\+.*$/, "") === normalized;
        });
        if (dupes.length >= 2) {
          return NextResponse.json(
            { error: "Ya existen cuentas asociadas a este correo. No se permiten variaciones del mismo email." },
            { status: 400 }
          );
        }
      }
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    // Block known datacenter/VPN IP ranges (common bot sources)
    const DC_PREFIXES = ["51.158.", "51.159.", "51.81.", "62.210.", "15.204.", "15.235.", "94.242.", "146.70.", "141.95.", "54.36.", "51.77.", "51.75.", "198.27.", "66.70."];
    if (ip !== "unknown" && DC_PREFIXES.some(p => ip.startsWith(p))) {
      return NextResponse.json(
        { error: "No se permite el registro desde esta red. Si estás usando VPN, desactívala e intenta de nuevo." },
        { status: 403 }
      );
    }

    // Check blacklist (cached in memory, no DB query)
    const bl = await getBlacklist();
    if (ip !== "unknown" && bl.ips.includes(ip)) {
      return NextResponse.json({ error: "No se permite el registro desde esta red." }, { status: 403 });
    }
    const [localPart] = email.split("@");
    const emailNorm = domain === "gmail.com" ? localPart.toLowerCase().replace(/\./g, "").replace(/\+.*$/, "") + "@gmail.com" : email.toLowerCase();
    if (bl.emails.includes(emailNorm)) {
      return NextResponse.json({ error: "Este correo no está permitido." }, { status: 403 });
    }

    // Límite de cuentas por IP (máx 3 en 24h)
    if (ip !== "unknown") {
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const cuentasDesdeIP = await prisma.usuario.count({
        where: { ipRegistro: ip, createdAt: { gte: hace24h } },
      });
      if (cuentasDesdeIP >= 3) {
        return NextResponse.json(
          { error: "Has creado demasiadas cuentas recientemente. Intenta más tarde." },
          { status: 429 }
        );
      }
    }

    const hash = await bcrypt.hash(password, 10);
    const tokenVerificacion = crypto.randomBytes(32).toString("hex");
    const codigoRef = await generarCodigoRef(nombre);

    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: hash, telefono, ciudad, cumpleDia, cumpleMes, cumpleAnio, emailVerificado: false, tokenVerificacion, ipRegistro: ip, codigoRef, ...(estiloAlimentario && { estiloAlimentario }), ...(comidasFavoritas?.length && { comidasFavoritas }), ...(refCode && { registroRefCode: refCode }), ...(refConcursoId && { registroRefConcursoId: refConcursoId }) },
    });

    const { password: _, ...usuarioSinPassword } = usuario;

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let verificationUrl = `${baseUrl}/verificar-email?token=${tokenVerificacion}`;
    if (refCode) verificationUrl += `&ref=${encodeURIComponent(refCode)}`;
    if (refConcursoId) verificationUrl += `&concurso=${encodeURIComponent(refConcursoId)}`;

    // Resolve referrer name if refCode provided
    let refNombre: string | null = null;
    let concursoInfo: { premio: string; local: string } | null = null;
    if (refCode) {
      const referidor = await prisma.usuario.findFirst({ where: { OR: [{ codigoRef: refCode.toUpperCase() }, { id: refCode }] }, select: { nombre: true } });
      refNombre = referidor?.nombre?.split(" ")[0] ?? null;
    }
    if (refConcursoId) {
      const conc = await prisma.concurso.findFirst({ where: { OR: [{ id: refConcursoId }, { slug: refConcursoId }] }, select: { premio: true, local: { select: { nombre: true } } } });
      if (conc) concursoInfo = { premio: conc.premio, local: conc.local.nombre };
    }

    resend.emails.send({
      from: process.env.FROM_EMAIL ? `DeseoComer <${process.env.FROM_EMAIL}>` : "DeseoComer <onboarding@resend.dev>",
      to: email,
      subject: refNombre ? `${nombre.split(" ")[0]}, ${refNombre} te invitó a un concurso 🏆` : "Activa tu cuenta en DeseoComer",
      html: buildVerificationHtml(nombre, verificationUrl, refNombre, concursoInfo),
    }).catch(err => console.error("[Registro] Error enviando email:", err));

    // Link to lista espera comunas if exists
    try { await prisma.listaEsperaComuna.updateMany({ where: { email }, data: { usuarioId: usuario.id } }); } catch {}

    // Check for multiple accounts with same IP
    let alertaIP = false;
    if (ip && ip !== "unknown") {
      const cuentasMismaIP = await prisma.usuario.count({ where: { ipRegistro: ip } });
      if (cuentasMismaIP >= 2) alertaIP = true;
    }

    return NextResponse.json({ ...usuarioSinPassword, alertaIP }, { status: 201 });
  } catch (error) {
    console.error("[API /usuarios] Error:", error);
    const msg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error interno", detalle: msg }, { status: 500 });
  }
}

function buildVerificationHtml(nombre: string, url: string, refNombre?: string | null, concursoInfo?: { premio: string; local: string } | null): string {
  const header = `<div style="text-align:center;margin-bottom:32px"><p style="font-size:28px;margin:0 0 8px">🧞</p><h1 style="color:#e8a84c;font-size:20px;letter-spacing:0.3em;text-transform:uppercase;margin:0">DeseoComer</h1></div>`;
  const footer = `<div style="text-align:center;margin-top:32px"><p style="color:#5a4028;font-size:12px">Hecho con 💛 · DeseoComer.com</p></div>`;
  const spam = `<p style="color:#c0a060;font-size:14px;line-height:1.5;margin-top:16px;text-align:center">¿No ves el botón? Revisa tu carpeta de <strong>spam</strong> o correo no deseado.</p>`;
  const wrap = (c: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background-color:#1a0e05;font-family:Georgia,serif;margin:0;padding:0"><div style="max-width:560px;margin:0 auto;padding:40px 24px">${header}<div style="background-color:#2d1a08;border-radius:20px;border:1px solid rgba(232,168,76,0.25);padding:40px 32px">${c}</div>${footer}</div></body></html>`;
  const btn = (href: string, label: string) => `<div style="text-align:center;margin-bottom:24px"><a href="${href}" style="background-color:#e8a84c;color:#1a0e05;font-size:14px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:12px;display:inline-block">${label}</a></div>`;
  const firstName = nombre.split(" ")[0];

  if (refNombre) {
    return wrap([
      `<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">¡${refNombre} te invitó a un concurso!</h2>`,
      concursoInfo
        ? `<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:12px">Hola ${firstName}, activa tu cuenta para entrar al concurso y ganar:</p><div style="background:rgba(232,168,76,0.06);border:1px solid rgba(232,168,76,0.15);border-radius:12px;padding:14px 18px;margin-bottom:20px;text-align:center"><p style="color:#f5d080;font-size:20px;font-weight:bold;margin:0 0 4px">🏆 ${concursoInfo.premio}</p><p style="color:rgba(240,234,214,0.5);font-size:13px;margin:0">en ${concursoInfo.local}</p></div>`
        : `<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:20px">Hola ${firstName}, activa tu cuenta para entrar al concurso y ganar comida gratis.</p>`,
      `<div style="background:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.2);border-radius:12px;padding:16px 20px;margin-bottom:24px">`,
      `<p style="color:#f5d080;font-size:14px;font-weight:bold;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.08em">Así funciona:</p>`,
      `<p style="color:#f5d080;font-size:15px;line-height:2;margin:0">① Activa tu cuenta con el botón de abajo</p>`,
      `<p style="color:#f5d080;font-size:15px;line-height:2;margin:0">② Verifica tu cuenta con tu celular</p>`,
      `<p style="color:#3db89e;font-size:15px;line-height:2;margin:0">③ <strong>Ambos ganan +3 puntos</strong> automáticamente</p>`,
      `</div>`,
      btn(url, `Activar mi cuenta →`),
      `<p style="color:#c0a060;font-size:14px;line-height:1.6;margin-top:8px">Los puntos de referido se acreditan cuando verificas tu cuenta con tu celular. Solo necesitas hacerlo una vez.</p>`,
      spam,
    ].join(""));
  }

  return wrap([
    `<h2 style="color:#e8a84c;font-size:22px;margin-top:0;margin-bottom:16px">Hola ${firstName}, activa tu cuenta</h2>`,
    `<p style="color:#c0a060;font-size:16px;line-height:1.7;margin-bottom:32px">Para participar en concursos y descubrir los mejores locales de comida, activa tu cuenta:</p>`,
    btn(url, "Activar mi cuenta →"),
    `<p style="color:#5a4028;font-size:13px;line-height:1.6">El link expira en 48 horas. Si no creaste esta cuenta, ignora este email.</p>`,
    spam,
  ].join(""));
}
