"use client";
import { useState, useEffect, useRef } from "react";

export type TimePeriod = "madrugada" | "dia" | "noche";

export interface TimeTheme {
  period: TimePeriod;
  label: string;
  icon: string;
  // Página (cards, secciones)
  bg: string;
  bgSecondary: string;
  text: string;
  textMuted: string;
  accent: string;
  borderColor: string;
  // Hero section
  heroGradient: string;
  heroAtmosphere: string;
  starCount: number;
  colorTitle: string;
  colorLink:  string;
  colorLabel: string;
  colorText:  string;
  colorHeroSubtitle: string;
}

export const THEMES: Record<TimePeriod, Omit<TimeTheme, "period">> = {

  madrugada: {
    label: "Madrugada", icon: "✨",
    // Página
    bg:          "#07040f",
    bgSecondary: "rgba(14,8,24,0.95)",
    text:        "#f0d080",
    textMuted:   "#7a6040",
    accent:      "#c4853a",
    borderColor: "rgba(196,133,58,0.22)",
    // Hero: cielo nocturno profundo, casi negro
    heroGradient:   "linear-gradient(180deg, #020108 0%, #080420 30%, #120830 60%, #0a0618 85%, #15100a 100%)",
    heroAtmosphere: "radial-gradient(ellipse at 50% 40%, rgba(124,63,168,0.25) 0%, transparent 65%)",
    starCount: 140,
    colorTitle: "#c4853a",
    colorLink:  "#3db89e",
    colorLabel: "#5a3c18",
    colorText:  "#c0a060",
    colorHeroSubtitle: "rgba(61,184,158,0.9)",
  },

  dia: {
    label: "Día", icon: "☀️",
    // Página — mismos colores que mediodía
    bg:          "#1e1400",
    bgSecondary: "rgba(32,20,2,0.95)",
    text:        "#fff8e0",
    textMuted:   "#b09040",
    accent:      "#e8a020",
    borderColor: "rgba(232,160,32,0.25)",
    // Hero: cielo azul luminoso despejado
    heroGradient:   "linear-gradient(180deg, #0a5090 0%, #1878b8 15%, #2898d8 35%, #50b8e8 55%, #90d4f4 74%, #c8eef8 88%, #e0f4fa 100%)",
    heroAtmosphere: "radial-gradient(ellipse at 50% 15%, rgba(255,255,200,0.4) 0%, transparent 55%)",
    starCount: 0,
    colorTitle: "#e8a020",
    colorLink:  "#1aa098",
    colorLabel: "#706018",
    colorText:  "#cca858",
    colorHeroSubtitle: "rgba(255,255,255,0.9)",
  },

  noche: {
    label: "Noche", icon: "🌙",
    // Página
    bg:          "#060410",
    bgSecondary: "rgba(10,8,20,0.95)",
    text:        "#e0d8f0",
    textMuted:   "#586090",
    accent:      "#b8860b",
    borderColor: "rgba(184,134,11,0.22)",
    // Hero: noche profunda azul marino
    heroGradient:   "linear-gradient(180deg, #020306 0%, #040a1e 22%, #060c28 55%, #050a20 80%, #080c14 100%)",
    heroAtmosphere: "radial-gradient(ellipse at 50% 35%, rgba(40,60,160,0.2) 0%, transparent 65%)",
    starCount: 110,
    colorTitle: "#b8860b",
    colorLink:  "#3db89e",
    colorLabel: "#282e48",
    colorText:  "#b0a8c8",
    colorHeroSubtitle: "rgba(61,184,158,0.9)",
  },
};

export function getThemeByPeriod(period: TimePeriod): TimeTheme {
  return { period, ...THEMES[period] };
}

export function applyThemeVars(theme: TimeTheme) {
  const root = document.documentElement;
  root.style.setProperty("--bg-primary",   theme.bg);
  root.style.setProperty("--bg-secondary", theme.bgSecondary);
  root.style.setProperty("--text-primary", theme.text);
  root.style.setProperty("--text-muted",   theme.textMuted);
  root.style.setProperty("--accent",       theme.accent);
  root.style.setProperty("--border-color", theme.borderColor);
  root.style.setProperty("--theme-bg",     theme.bg);
  root.style.setProperty("--theme-text",   theme.text);
  root.style.setProperty("--theme-accent", theme.accent);
  root.style.setProperty("--color-title",  theme.colorTitle);
  root.style.setProperty("--color-link",   theme.colorLink);
  root.style.setProperty("--color-label",  theme.colorLabel);
  root.style.setProperty("--color-text",   theme.colorText);
  root.style.setProperty("--color-hero-subtitle", theme.colorHeroSubtitle);
}

function getPeriod(hour: number): TimePeriod {
  if (hour < 7)  return "madrugada";
  if (hour < 20) return "dia";
  return "noche";
}

export function useTimeTheme(): TimeTheme {
  // Inicializar sincrónicamente con el período correcto — nunca null
  const [theme, setTheme] = useState<TimeTheme>(() =>
    getThemeByPeriod(getPeriod(new Date().getHours()))
  );
  const periodRef = useRef(theme.period);

  useEffect(() => {
    applyThemeVars(theme);

    // Interval: solo actualizar cuando el período cambia realmente
    const interval = setInterval(() => {
      const periodoNuevo = getPeriod(new Date().getHours());
      if (periodoNuevo !== periodRef.current) {
        periodRef.current = periodoNuevo;
        const newTheme = getThemeByPeriod(periodoNuevo);
        setTheme(newTheme);
        applyThemeVars(newTheme);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return theme;
}
