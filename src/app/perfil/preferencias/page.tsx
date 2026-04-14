"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const RESTRICTIONS = [
  { v: "sin gluten", l: "Sin gluten" },
  { v: "vegetariano", l: "Vegetariano" },
  { v: "vegano", l: "Vegano" },
  { v: "sin mariscos", l: "Sin mariscos" },
  { v: "sin cerdo", l: "Sin cerdo" },
  { v: "sin lácteos", l: "Sin lacteos" },
  { v: "sin frutos secos", l: "Sin frutos secos" },
  { v: "como de todo", l: "Como de todo" },
];

const FITNESS = [
  { v: "NONE", emoji: "🍔", l: "En modo chancho", sub: "como lo que sea" },
  { v: "GAINING", emoji: "💪", l: "Subiendo masa", sub: "busco calorias y proteina" },
  { v: "CUTTING", emoji: "🥗", l: "Cuidandome", sub: "proteinas, bajo carbo" },
  { v: "MAINTAINING", emoji: "😐", l: "Sin preferencia", sub: "" },
];

const RISK = [
  { v: "SAFE", emoji: "🎯", l: "Prefiero lo conocido" },
  { v: "BALANCED", emoji: "⚖️", l: "Mezcla de ambos" },
  { v: "EXPLORER", emoji: "🧭", l: "Me gusta probar cosas nuevas" },
];

export default function PreferenciasPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [fitnessMode, setFitnessMode] = useState("NONE");
  const [riskProfile, setRiskProfile] = useState("BALANCED");
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push("/login"); return; }
    fetch(`/api/perfil/preferencias?userId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        setRestrictions(d.dietaryRestrictions ?? []);
        setFitnessMode(d.fitnessMode ?? "NONE");
        setRiskProfile(d.riskProfile ?? "BALANCED");
        setFavoriteIngredients(d.favoriteIngredients ?? []);
        setAvoidIngredients(d.avoidIngredients ?? []);
        setLoading(false);
        initialized.current = true;
      })
      .catch(() => setLoading(false));
  }, [user, isLoading, router]);

  const save = useCallback((data: Record<string, unknown>) => {
    if (!user || !initialized.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch(`/api/perfil/preferencias?userId=${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(() => {
        setToast("Guardado 🧞");
        setTimeout(() => setToast(""), 2000);
      }).catch(() => {});
    }, 500);
  }, [user]);

  const toggleRestriction = (v: string) => {
    let next: string[];
    if (v === "como de todo") {
      next = ["como de todo"];
    } else {
      next = restrictions.filter(x => x !== "como de todo");
      next = next.includes(v) ? next.filter(x => x !== v) : [...next, v];
    }
    setRestrictions(next);
    save({ dietaryRestrictions: next.includes("como de todo") ? [] : next });
  };

  const changeFitness = (v: string) => {
    setFitnessMode(v);
    save({ fitnessMode: v === "NONE" ? null : v });
  };

  const changeRisk = (v: string) => {
    setRiskProfile(v);
    save({ riskProfile: v });
  };

  const resetLearned = async () => {
    if (!user) return;
    await fetch(`/api/perfil/preferencias?userId=${user.id}`, { method: "DELETE" });
    setFavoriteIngredients([]);
    setAvoidIngredients([]);
    setConfirmReset(false);
    setToast("Perfil reseteado 🧞");
    setTimeout(() => setToast(""), 2000);
  };

  if (isLoading || loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0812", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-cinzel)", color: "rgba(240,234,214,0.4)" }}>Cargando...</p>
      </div>
    );
  }

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "12px 16px", borderRadius: 12, cursor: "pointer", textAlign: "left" as const,
    background: active ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.03)",
    border: active ? "1px solid #e8a84c" : "1px solid rgba(255,255,255,0.08)",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0a0812", padding: "clamp(80px,10vw,120px) clamp(16px,3vw,24px) 40px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {toast && <div style={{ position: "fixed", top: 20, right: 20, background: "#3db89e", color: "#fff", padding: "10px 20px", borderRadius: 10, fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", zIndex: 1000 }}>{toast}</div>}

        <button onClick={() => router.back()} style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>← Volver</button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 32, marginBottom: 4 }}>🧞</p>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.3rem,4vw,1.7rem)", color: "#f5d080", marginBottom: 4 }}>Mis preferencias</h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.35)" }}>Esto mejora las recomendaciones del Genio</p>
        </div>

        {/* 1. Restrictions */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#e8a84c", letterSpacing: "0.1em", marginBottom: 12 }}>QUE NO COMES</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {RESTRICTIONS.map(r => {
              const active = restrictions.includes(r.v);
              return (
                <button key={r.v} onClick={() => toggleRestriction(r.v)} style={chip(active)}>
                  <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.88rem", color: active ? "#e8a84c" : "rgba(240,234,214,0.6)" }}>{active ? "✓ " : ""}{r.l}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Fitness */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#e8a84c", letterSpacing: "0.1em", marginBottom: 12 }}>COMO ANDAS AHORA</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FITNESS.map(f => {
              const active = fitnessMode === f.v;
              return (
                <button key={f.v} onClick={() => changeFitness(f.v)} style={{ ...chip(active), display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{f.emoji}</span>
                  <div>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: active ? "#e8a84c" : "#f0ead6", margin: 0 }}>{f.l}</p>
                    {f.sub && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.3)", margin: 0 }}>{f.sub}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Risk profile */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#e8a84c", letterSpacing: "0.1em", marginBottom: 12 }}>COMO ERES PARA COMER</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {RISK.map(r => {
              const active = riskProfile === r.v;
              return (
                <button key={r.v} onClick={() => changeRisk(r.v)} style={{ ...chip(active), display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{r.emoji}</span>
                  <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: active ? "#e8a84c" : "#f0ead6" }}>{r.l}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Learned profile */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#e8a84c", letterSpacing: "0.1em", marginBottom: 12 }}>LO QUE EL GENIO APRENDIO DE TI</h2>
          <div style={{ background: "rgba(45,26,8,0.5)", border: "1px solid rgba(232,168,76,0.1)", borderRadius: 14, padding: 16 }}>
            {favoriteIngredients.length === 0 && avoidIngredients.length === 0 ? (
              <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.35)", textAlign: "center", lineHeight: 1.6 }}>Aun no tenemos suficiente informacion. Sigue usando el Genio y aprenderemos mas de ti 🧞</p>
            ) : (
              <>
                {favoriteIngredients.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", color: "#3db89e", marginBottom: 6 }}>Te gusta</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {favoriteIngredients.slice(0, 5).map(i => (
                        <span key={i} style={{ padding: "4px 10px", borderRadius: 12, background: "rgba(61,184,158,0.1)", border: "1px solid rgba(61,184,158,0.25)", fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "#3db89e" }}>{i}</span>
                      ))}
                    </div>
                  </div>
                )}
                {avoidIngredients.length > 0 && (
                  <div>
                    <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.72rem", color: "#ff6b6b", marginBottom: 6 }}>Evita</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {avoidIngredients.slice(0, 5).map(i => (
                        <span key={i} style={{ padding: "4px 10px", borderRadius: 12, background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", fontFamily: "var(--font-lato)", fontSize: "0.78rem", color: "#ff6b6b" }}>{i}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* 5. Reset */}
        {(favoriteIngredients.length > 0 || avoidIngredients.length > 0) && (
          <section>
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)} style={{ width: "100%", padding: 14, background: "transparent", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 12, fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "#ff6b6b", cursor: "pointer" }}>
                Resetear lo que aprendio el Genio
              </button>
            ) : (
              <div style={{ background: "rgba(255,80,80,0.06)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.5)", marginBottom: 14, lineHeight: 1.6 }}>Seguro? El Genio perdera todo lo que aprendio de tus gustos.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setConfirmReset(false)} style={{ flex: 1, padding: 12, background: "transparent", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 10, fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", cursor: "pointer" }}>Cancelar</button>
                  <button onClick={resetLearned} style={{ flex: 1, padding: 12, background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.4)", borderRadius: 10, fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "#ff6b6b", cursor: "pointer", fontWeight: 700 }}>Si, resetear</button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
