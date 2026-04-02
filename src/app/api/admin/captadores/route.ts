import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const captadores = await prisma.captador.findMany({
      include: {
        locales: {
          select: {
            id: true, nombre: true, createdAt: true,
            concursos: { where: { activo: true, cancelado: false }, select: { id: true } },
          },
        },
        pagos: { select: { monto: true, createdAt: true, referencia: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = captadores.map(c => {
      const totalLocales = c.locales.length;
      const localesConConcurso = c.locales.filter(l => l.concursos.length > 0).length;
      const totalGanado = totalLocales * 10000 + localesConConcurso * 5000;
      const totalPagado = c.pagos.reduce((s, p) => s + p.monto, 0);
      const pendiente = totalGanado - totalPagado;
      return { ...c, locales: undefined, pagos: undefined, totalLocales, localesConConcurso, totalGanado, totalPagado, pendiente };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API admin/captadores GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, telefono, rut, codigo } = await req.json();
    if (!nombre || !email || !codigo) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    // Check unique constraints
    const existeEmail = await prisma.captador.findUnique({ where: { email } });
    if (existeEmail) return NextResponse.json({ error: "Email ya registrado" }, { status: 400 });

    let codigoFinal = codigo;
    const existeCodigo = await prisma.captador.findUnique({ where: { codigo } });
    if (existeCodigo) codigoFinal = codigo + Math.floor(Math.random() * 90 + 10);

    const captador = await prisma.captador.create({
      data: { nombre, email, telefono: telefono || "", rut: rut || "", codigo: codigoFinal },
    });

    // Send welcome email (fire and forget)
    try {
      const base = req.nextUrl.origin;
      await fetch(`${base}/api/emails/bienvenida-captador`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captadorId: captador.id }),
      });
    } catch (e) { console.error("[Email bienvenida captador]", e); }

    return NextResponse.json(captador, { status: 201 });
  } catch (error) {
    console.error("[API admin/captadores POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
