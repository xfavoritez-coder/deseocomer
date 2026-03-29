"use client";
import { createContext, useContext } from "react";
import { getThemeByPeriod } from "@/hooks/useTimeTheme";
import type { TimeTheme } from "@/hooks/useTimeTheme";

export const ThemeContext = createContext<TimeTheme>(getThemeByPeriod("mediodia"));

export function useTheme(): TimeTheme {
  return useContext(ThemeContext);
}
