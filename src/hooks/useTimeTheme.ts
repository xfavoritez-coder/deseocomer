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

  dia: {
    label: "Día", icon: "☀️",
    bg:          "#1a0e05",
    bgSecondary: "#080d18",
    text:        "#fff8e0",
    textMuted:   "rgba(255,245,210,0.7)",
    accent:      "#e8a84c",
    borderColor: "rgba(232,168,76,0.28)",
    heroGradient:   "linear-gradient(180deg, #0a5090 0%, #1878b8 15%, #2898d8 35%, #50b8e8 55%, #90d4f4 74%, #c8eef8 88%, #e0f4fa 100%)",
    heroAtmosphere: "radial-gradient(ellipse at 50% 15%, rgba(255,255,200,0.4) 0%, transparent 55%)",
    starCount: 0,
    colorTitle: "#f5d080",
    colorLink:  "#3db89e",
    colorLabel: "rgba(255,245,210,0.55)",
    colorText:  "rgba(255,245,210,0.85)",
    colorHeroSubtitle: "rgba(255,255,255,0.92)",
  },

  noche: {
    label: "Noche", icon: "🌙",
    bg:          "#0a0812",
    bgSecondary: "#080d18",
    text:        "#f0ead6",
    textMuted:   "rgba(240,234,214,0.65)",
    accent:      "#e8a84c",
    borderColor: "rgba(232,168,76,0.22)",
    heroGradient:   "linear-gradient(180deg, #020306 0%, #040a1e 22%, #060c28 55%, #050a20 80%, #080c14 100%)",
    heroAtmosphere: "radial-gradient(ellipse at 50% 35%, rgba(40,60,160,0.2) 0%, transparent 65%)",
    starCount: 110,
    colorTitle: "#f5d080",
    colorLink:  "#3db89e",
    colorLabel: "rgba(240,234,214,0.5)",
    colorText:  "rgba(240,234,214,0.82)",
    colorHeroSubtitle: "rgba(61,184,158,0.95)",
  },

  madrugada: {
    label: "Madrugada", icon: "✨",
    bg:          "#07040f",
    bgSecondary: "#0c0818",
    text:        "#ede0ff",
    textMuted:   "rgba(237,224,255,0.62)",
    accent:      "#c8a0ff",
    borderColor: "rgba(200,160,255,0.22)",
    heroGradient:   "linear-gradient(180deg, #020108 0%, #080420 30%, #120830 60%, #0a0618 85%, #15100a 100%)",
    heroAtmosphere: "radial-gradient(ellipse at 50% 40%, rgba(124,63,168,0.28) 0%, transparent 65%)",
    starCount: 140,
    colorTitle: "#e0c8ff",
    colorLink:  "#3db89e",
    colorLabel: "rgba(237,224,255,0.5)",
    colorText:  "rgba(237,224,255,0.8)",
    colorHeroSubtitle: "rgba(61,184,158,0.95)",
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
  // Default to "dia" on SSR to avoid hydration mismatch, then sync on client
  const [theme, setTheme] = useState<TimeTheme>(() =>
    typeof window !== "undefined"
      ? getThemeByPeriod(getPeriod(new Date().getHours()))
      : getThemeByPeriod("dia")
  );
  const periodRef = useRef(theme.period);

  useEffect(() => {
    // Sync correct period on client mount (SSR defaults to "dia")
    const correctPeriod = getPeriod(new Date().getHours());
    if (correctPeriod !== theme.period) {
      const correct = getThemeByPeriod(correctPeriod);
      setTheme(correct);
      periodRef.current = correctPeriod;
      applyThemeVars(correct);
    } else {
      applyThemeVars(theme);
    }

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
