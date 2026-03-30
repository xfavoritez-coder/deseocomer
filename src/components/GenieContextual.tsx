"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGenie } from "@/contexts/GenieContext";

const CONTEXTUAL_PREFIX = "genio_contextual_mostrado_";

function yaMostradoHoy(pathname: string): boolean {
  try {
    const key = CONTEXTUAL_PREFIX + new Date().toISOString().slice(0, 10) + "_" + pathname;
    return !!localStorage.getItem(key);
  } catch { return true; }
}

function marcarMostrado(pathname: string) {
  try {
    const key = CONTEXTUAL_PREFIX + new Date().toISOString().slice(0, 10) + "_" + pathname;
    localStorage.setItem(key, "1");
  } catch {}
}

function getBirthdayData(): { dia: string; mes: string } | null {
  try {
    const raw = localStorage.getItem("deseocomer_user_birthday");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isTodayBirthday(birthday: { dia: string; mes: string }): boolean {
  const hoy = new Date();
  return hoy.getDate() === Number(birthday.dia) && (hoy.getMonth() + 1) === Number(birthday.mes);
}

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
    if (esCumple) {
      return {
        texto: `🎂 ¡Feliz cumpleaños${nombre}! Hay locales con ofertas especiales para celebrar tu día`,
        opciones: ["Ver ofertas de cumpleaños", "Gracias 🎂"],
      };
    }
    if (favCat && isLoggedIn) {
      return {
        texto: `🪔${nombre}, según tus gustos te puede interesar un local de ${favCat}`,
        opciones: ["Muéstrame", "Explorar todo"],
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
    return {
      texto: "🏆 ¿Sabías que puedes ganar comida gratis invitando amigos?",
      opciones: ["¿Cómo funciona?", "Ya lo sé"],
    };
  }

  if (pathname === "/promociones" || pathname.startsWith("/promociones/")) {
    if (esCumple) {
      return {
        texto: `🎂 ¡Hoy es tu día${nombre}! Hay promociones especiales de cumpleaños para ti`,
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

  useEffect(() => {
    if (toastActivo) return;
    if (pathname.startsWith("/panel") || pathname.startsWith("/admin")) return;
    if (yaMostradoHoy(pathname)) return;

    const timer = setTimeout(() => {
      const mensaje = getMensajeContextual(pathname, perfil, userName, isLoggedIn);
      if (mensaje) {
        marcarMostrado(pathname);
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
