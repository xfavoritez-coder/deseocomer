import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const locales = await prisma.local.findMany({
      where: {
        OR: [
          { origenImportacion: null },
          { origenImportacion: { not: "GOOGLE_PLACES" } },
          { origenImportacion: "GOOGLE_PLACES", reclamadoEn: { not: null } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, slug: true, nombre: true, nombreDueno: true, celularDueno: true, email: true, telefono: true,
        ciudad: true, comuna: true, direccion: true, categorias: true, logoUrl: true, portadaUrl: true,
        lat: true, lng: true, instagram: true, sitioWeb: true, descripcion: true, historia: true,
        activo: true, captadorCodigo: true, createdAt: true, estadoLocal: true, origenImportacion: true, reclamadoEn: true,
        sirveEnMesa: true, tieneDelivery: true, comunasDelivery: true, tieneRetiro: true, linkPedido: true,
        _count: { select: { concursos: true, promociones: true, favoritos: true, resenas: true } },
      },
    });
    return NextResponse.json(locales);
  } catch (error) {
    console.error("[Admin locales]", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authErr = checkAdminAuth(req);
  if (authErr) return authErr;
  try {
    const { nombre, email, password, comuna, direccion, categorias, descripcion, telefono, instagram, sitioWeb } = await req.json();
    if (!nombre?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Nombre, email y contraseña son obligatorios" }, { status: 400 });
    }

    const exists = await prisma.local.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (exists) return NextResponse.json({ error: "Ya existe un local con ese email" }, { status: 400 });

    const slug = nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const hashed = await bcrypt.hash(password, 10);

    const local = await prisma.local.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password: hashed,
        slug,
        comuna: comuna || null,
        direccion: direccion || null,
        categorias: categorias ?? [],
        descripcion: descripcion || null,
        telefono: telefono || null,
        instagram: instagram || null,
        sitioWeb: sitioWeb || null,
        activo: true,
        origenImportacion: "MANUAL_ADMIN",
      },
      select: {
        id: true, slug: true, nombre: true, nombreDueno: true, celularDueno: true, email: true, telefono: true,
        ciudad: true, comuna: true, direccion: true, categorias: true, logoUrl: true, portadaUrl: true,
        lat: true, lng: true, instagram: true, sitioWeb: true, descripcion: true,
        activo: true, captadorCodigo: true, createdAt: true, estadoLocal: true, origenImportacion: true,
        sirveEnMesa: true, tieneDelivery: true, tieneRetiro: true,
        _count: { select: { concursos: true, promociones: true, favoritos: true, resenas: true } },
      },
    });

    return NextResponse.json(local, { status: 201 });
  } catch (error) {
    console.error("[Admin locales POST]", error);
    return NextResponse.json({ error: "Error al crear local" }, { status: 500 });
  }
}
