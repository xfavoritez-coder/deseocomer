"use client";
import { useFavoritos } from "@/hooks/useFavoritos";

interface Props {
  localId: string;
  localData?: { categoria?: string; comuna?: string };
  size?: "sm" | "md";
  style?: React.CSSProperties;
}

export default function BotonFavorito({ localId, localData, size = "md", style }: Props) {
  const { toggleFavorito, esFavorito } = useFavoritos();
  const activo = esFavorito(localId);
  const dim = size === "sm" ? "30px" : "36px";

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorito(localId, localData); }}
      title={activo ? "Quitar de favoritos" : "Guardar favorito"}
      style={{
        width: dim, height: dim, borderRadius: "50%",
        background: activo ? "rgba(232,50,80,0.15)" : "rgba(13,7,3,0.75)",
        border: activo ? "1px solid rgba(232,50,80,0.4)" : "1px solid rgba(232,168,76,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        fontSize: size === "sm" ? "0.85rem" : "1rem",
        backdropFilter: "blur(4px)", transition: "all 0.2s ease", flexShrink: 0,
        ...style,
      }}
    >
      {activo ? "❤️" : "🤍"}
    </button>
  );
}
