"use client";
import { useState, useEffect } from "react";

export type TimePeriod = "madrugada" | "manana" | "mediodia" | "tarde" | "noche";

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

  manana: {
    label: "Mañana", icon: "🌅",
    // Página
    bg:          "#1c0c00",
    bgSecondary: "rgba(32,15,2,0.95)",
    text:        "#fff0d8",
    textMuted:   "#c08040",
    accent:      "#e07030",
    borderColor: "rgba(224,112,48,0.25)",
    // Hero: amanecer cálido naranja → amarillo → celeste
    heroGradient:   "linear-gradient(180deg, #ff6010 0%, #ff9030 12%, #ffbe50 28%, #ffd878 48%, #ffe8a8 68%, #d4c890 82%, #c09858 100%)",
    heroAtmosphere: "radial-gradient(ellipse at 50% 20%, rgba(255,200,80,0.35) 0%, transparent 60%)",
    starCount: 0,
    colorTitle: "#e07030",
    colorLink:  "#2aac9a",
    colorLabel: "#804818",
    colorText:  "#d4a870",
    colorHeroSubtitle: "rgba(255,255,255,0.9)",
  },

  mediodia: {
    label: "Mediodía", icon: "🌞",
    // Página
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

  tarde: {
    label: "Tarde", icon: "🌇",
    // Página
    bg:          "#140608",
    bgSecondary: "rgba(24,8,6,0.95)",
    text:        "#ffd8a0",
    textMuted:   "#a06040",
    accent:      "#e04820",
    borderColor: "rgba(224,72,32,0.25)",
    // Hero: atardecer — morado arriba → naranja fuego → rojo → dorado
    heroGradient:   "linear-gradient(180deg, #100018 0%, #38004a 8%, #800028 18%, #c02018 30%, #e04010 45%, #f07018 58%, #d05818 72%, #901808 88%, #500808 100%)",
    heroAtmosphere: "radial-gradient(ellipse at 50% 55%, rgba(255,100,20,0.3) 0%, transparent 60%)",
    starCount: 12,
    colorTitle: "#e04820",
    colorLink:  "#3db8a8",
    colorLabel: "#701818",
    colorText:  "#cc8860",
    colorHeroSubtitle: "rgba(61,184,158,0.9)",
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
  if (hour < 6)  return "madrugada";
  if (hour < 12) return "manana";
  if (hour < 16) return "mediodia";
  if (hour < 20) return "tarde";
  return "noche";
}

export function useTimeTheme(): TimeTheme {
  const [theme, setTheme] = useState<TimeTheme | null>(null);

  useEffect(() => {
    const update = () => {
      const t = getThemeByPeriod(getPeriod(new Date().getHours()));
      setTheme(t);
      applyThemeVars(t);
    };
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  return theme ?? getThemeByPeriod("mediodia");
}
