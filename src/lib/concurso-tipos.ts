export const TIPO_CONCURSO = {
  meritos: {
    label: "Méritos",
    emoji: "🏆",
    color: "#e8a84c",
    colorBg: "rgba(232,168,76,0.12)",
    colorBorder: "rgba(232,168,76,0.3)",
    badge: "🏆 MÉRITOS",
    descripcion: "Gana quien más puntos acumule",
  },
  sorteo: {
    label: "Sorteo",
    emoji: "🎲",
    color: "#ec4899",
    colorBg: "rgba(236,72,153,0.12)",
    colorBorder: "rgba(236,72,153,0.3)",
    badge: "🎲 SORTEO",
    descripcion: "Se sortea entre todos — más puntos, más chances",
  },
} as const;

export type ModalidadConcurso = keyof typeof TIPO_CONCURSO;
