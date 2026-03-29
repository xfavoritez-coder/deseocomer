"use client";
import { useState, useEffect } from "react";

export function useCiudad() {
  const [ciudad, setCiudad] = useState("Santiago");

  useEffect(() => {
    const saved = localStorage.getItem("ciudad_seleccionada");
    if (saved) setCiudad(saved);

    const handler = (e: Event) => setCiudad((e as CustomEvent<string>).detail);
    window.addEventListener("ciudadCambiada", handler);
    return () => window.removeEventListener("ciudadCambiada", handler);
  }, []);

  return ciudad;
}
