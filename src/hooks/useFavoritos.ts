"use client";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "deseocomer_favoritos";

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<string[]>([]);

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("deseocomer_session") || "{}");
      if (session.loggedIn && session.id) {
        fetch(`/api/favoritos?usuarioId=${session.id}`)
          .then(r => r.json())
          .then(data => {
            if (Array.isArray(data)) {
              const ids = data.map((f: { localId: string }) => f.localId);
              setFavoritos(ids);
              // Sync localStorage → BD
              const localFavs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
              const nuevos = localFavs.filter(id => !ids.includes(id));
              if (nuevos.length > 0) {
                nuevos.forEach(localId => {
                  fetch("/api/favoritos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuarioId: session.id, localId }) }).catch(() => {});
                });
                setFavoritos([...ids, ...nuevos]);
              }
              localStorage.removeItem(STORAGE_KEY);
            }
          })
          .catch(() => {
            setFavoritos(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
          });
      } else {
        setFavoritos(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
      }
    } catch {
      setFavoritos([]);
    }
  }, []);

  const toggleFavorito = useCallback(async (localId: string, localData?: { categoria?: string; comuna?: string }) => {
    const session = JSON.parse(localStorage.getItem("deseocomer_session") || "{}");
    const esFav = favoritos.includes(localId);

    // Optimistic update
    setFavoritos(prev => esFav ? prev.filter(id => id !== localId) : [...prev, localId]);

    if (session.loggedIn && session.id) {
      try {
        const res = await fetch("/api/favoritos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ usuarioId: session.id, localId }) });
        const data = await res.json();
        if (data.accion === "agregado" && localData) {
          window.dispatchEvent(new CustomEvent("favorito_guardado", { detail: localData }));
        }
      } catch {
        setFavoritos(prev => esFav ? [...prev, localId] : prev.filter(id => id !== localId));
      }
    } else {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as string[];
      const next = esFav ? current.filter(id => id !== localId) : [...current, localId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      if (!esFav) window.dispatchEvent(new CustomEvent("favorito_sin_login", { detail: localData }));
    }
  }, [favoritos]);

  const esFavorito = useCallback((localId: string) => favoritos.includes(localId), [favoritos]);

  return { favoritos, toggleFavorito, esFavorito };
}
