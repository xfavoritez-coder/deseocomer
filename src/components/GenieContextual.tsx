"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGenie } from "@/contexts/GenieContext";

// Track per page per day — each page gets ONE contextual toast per day
const KEY_PREFIX = "genio_ctx_";

function yaVisto(pathname: string): boolean {
  try {
    const key = KEY_PREFIX + new Date().toISOString().slice(0, 10) + "_" + pathname.replace(/\//g, "_");
    return !!localStorage.getItem(key);
  } catch { return true; }
}

function marcarVisto(pathname: string) {
  try {
    const key = KEY_PREFIX + new Date().toISOString().slice(0, 10) + "_" + pathname.replace(/\//g, "_");
    localStorage.setItem(key, "1");
  } catch {}
}

function getBirthdayData(): { dia: string; mes: string } | null {
  try {
    const raw = localStorage.getItem("deseocomer_user_birthday");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isTodayBirthday(b: { dia: string; mes: string }): boolean {
  const hoy = new Date();
  return hoy.getDate() === Number(b.dia) && (hoy.getMonth() + 1) === Number(b.mes);
}

// Birthday greeting is handled by GenieButton, so contextual should NOT repeat it.
// Instead, contextual gives page-specific tips that are DIFFERENT from the birthday greeting.
function getMensajeContextual(
  pathname: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perfil: any,
  userName: string | null,
  isLoggedIn: boolean,
): { texto: string; opciones: string[] } | null {
  const nombre = userName ? ` ${userName}` : "";

  const categorias = perfil?.gustos?.categorias ?? {};
  const favCat = Object.entries(categorias)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0];

  const birthday = getBirthdayData();
  const esCumple = birthday && isTodayBirthday(birthday);

  if (pathname === "/locales" || pathname.startsWith("/locales/")) {
    if (favCat && isLoggedIn) {
      return {
        texto: `🪔${nombre}, según tus gustos te puede interesar un local de ${favCat}`,
        opciones: ["Muéstrame", "Explorar todo"],
      };
    }
    if (esCumple && isLoggedIn) {
      return {
        texto: `🎂 Hay locales con ofertas especiales para celebrar tu día${nombre}`,
        opciones: ["Ver ofertas", "Explorar todo"],
      };
    }
    if (!isLoggedIn) {
      return {
        texto: "🪔 Guarda tus locales favoritos para que te recomiende mejor",
        opciones: ["Registrarme", "Ahora no"],
      };
    }
  }

  if (pathname === "/concursos" || pathname.startsWith("/concursos/")) {
    try { if (localStorage.getItem("genio_concursos_ya_sabe")) return null; } catch {}
    return {
      texto: "🏆 ¿Sabías que puedes ganar comida gratis invitando amigos?",
      opciones: ["¿Cómo funciona?", "Ya lo sé"],
    };
  }

  if (pathname === "/promociones" || pathname.startsWith("/promociones/")) {
    if (esCumple && isLoggedIn) {
      return {
        texto: `🎂 Hay promociones especiales de cumpleaños para ti${nombre}`,
        opciones: ["Ver mis ofertas", "Ver todas"],
      };
    }
    if (favCat && isLoggedIn) {
      return {
        texto: `🪔 Hay promociones de ${favCat} que podrían interesarte`,
        opciones: ["Ver ahora", "Explorar todo"],
      };
    }
  }

  return null;
}

export default function GenieContextual() {
  const pathname = usePathname();
  const { perfil, setToastActivo, toastActivo, userName, isLoggedIn } = useGenie();

  const toastRef = useRef(toastActivo);
  useEffect(() => { toastRef.current = toastActivo; }, [toastActivo]);

  useEffect(() => {
    if (toastActivo) return;
    if (pathname.startsWith("/panel") || pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/registro") || pathname.startsWith("/reset-password") || pathname.startsWith("/verificar-email") || pathname.startsWith("/login-local")) return;
    if (pathname === "/") return;
    if (pathname.startsWith("/concursos/como-funciona")) return;
    if (yaVisto(pathname)) return;

    const timer = setTimeout(() => {
      if (toastRef.current) return;
      if (yaVisto(pathname)) return;

      const mensaje = getMensajeContextual(pathname, perfil, userName, isLoggedIn);
      if (mensaje) {
        marcarVisto(pathname);
        setToastActivo({
          id: "contextual_" + pathname,
          mensaje: mensaje.texto,
          opciones: mensaje.opciones,
        });
      }
    }, 8000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
