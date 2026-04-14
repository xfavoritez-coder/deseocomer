"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dish = any;

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

const FITNESS_OPTIONS = [
  { v: "NONE", emoji: "🍔", l: "En modo chancho", sub: "como lo que sea" },
  { v: "GAINING", emoji: "💪", l: "Subiendo masa", sub: "busco calorias y proteina" },
  { v: "CUTTING", emoji: "🥗", l: "Cuidandome", sub: "proteinas, bajo carbo" },
  { v: "MAINTAINING", emoji: "😐", l: "Sin preferencia", sub: "" },
];

function getSessionId(): string {
  return localStorage.getItem("genie_session_id") ?? "";
}

export default function GeniePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [phase, setPhase] = useState<"loading" | "onboarding" | "dishes">("loading");

  // Onboarding state
  const [obStep, setObStep] = useState(0);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [fitnessMode, setFitnessMode] = useState("NONE");
  const [savingOb, setSavingOb] = useState(false);

  // Dishes state
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingDishes, setLoadingDishes] = useState(false);
  const seenIdsRef = useRef<string[]>([]);
  const geoRequested = useRef(false);

  // Check onboarding status
  const { isLoading: authLoading } = useAuth();
  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve
    if (!user) {
      // Guest: check sessionStorage for onboarding done
      const done = sessionStorage.getItem("genieOnboardingDone");
      if (done === "true") { setPhase("dishes"); requestGeo(); }
      else setPhase("onboarding");
      return;
    }
    fetch(`/api/genie/onboarding?userId=${user.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.onboardingDone) { setPhase("dishes"); requestGeo(); }
        else setPhase("onboarding");
      })
      .catch(() => setPhase("onboarding"));
  }, [user, authLoading]);

  // Geolocation
  const requestGeo = useCallback(() => {
    if (geoRequested.current) return;
    geoRequested.current = true;

    const fallback = { lat: -33.4569, lng: -70.6483 };
    const timeout = setTimeout(() => {
      if (!sessionStorage.getItem("userCoords")) {
        sessionStorage.setItem("userCoords", JSON.stringify(fallback));
      }
    }, 5000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          clearTimeout(timeout);
          sessionStorage.setItem("userCoords", JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
        },
        () => {
          clearTimeout(timeout);
          sessionStorage.setItem("userCoords", JSON.stringify(fallback));
        },
        { timeout: 5000, maximumAge: 300000 }
      );
    } else {
      clearTimeout(timeout);
      sessionStorage.setItem("userCoords", JSON.stringify(fallback));
    }
  }, []);

  // Load dishes when entering dishes phase
  useEffect(() => {
    if (phase === "dishes") loadDishes();
  }, [phase]);

  const loadDishes = async () => {
    setLoadingDishes(true);
    const sid = getSessionId();
    const exclude = seenIdsRef.current.join(",");
    const params = new URLSearchParams({ sessionId: sid });
    if (user?.id) params.set("userId", user.id);
    if (exclude) params.set("exclude", exclude);

    try {
      const res = await fetch(`/api/genie/dishes?${params}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setDishes(data);
        setSelected(new Set());
        // Register VIEWED
        fetch("/api/genie/interaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            menuItemIds: data.map((d: Dish) => d.id),
            action: "VIEWED",
            userId: user?.id || null,
            sessionId: sid,
          }),
        }).catch(() => {});
      }
    } catch {}
    setLoadingDishes(false);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    // Register IGNORED for non-selected visible dishes
    const sid = getSessionId();
    const ignored = dishes.filter(d => !selected.has(d.id)).map(d => d.id);
    if (ignored.length > 0) {
      fetch("/api/genie/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemIds: ignored, action: "IGNORED", userId: user?.id || null, sessionId: sid }),
      }).catch(() => {});
    }

    // Save selected to session
    sessionStorage.setItem("genieSelectedDishes", JSON.stringify([...selected]));
    router.push("/genie/context");
  };

  const handleOtherDishes = () => {
    // Register IGNORED for all current dishes
    const sid = getSessionId();
    fetch("/api/genie/interaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuItemIds: dishes.map(d => d.id), action: "IGNORED", userId: user?.id || null, sessionId: sid }),
    }).catch(() => {});

    seenIdsRef.current.push(...dishes.map(d => d.id));
    loadDishes();
  };

  const saveOnboarding = async () => {
    setSavingOb(true);
    const finalRestrictions = restrictions.includes("como de todo") ? [] : restrictions;
    await fetch("/api/genie/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id || null,
        sessionId: getSessionId(),
        dietaryRestrictions: finalRestrictions,
        fitnessMode: fitnessMode === "NONE" ? null : fitnessMode,
      }),
    });
    setSavingOb(false);
    sessionStorage.setItem("genieOnboardingDone", "true");
    setPhase("dishes");
    requestGeo();
  };

  // ── ONBOARDING ──
  if (phase === "onboarding") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0812", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🧞</p>
        <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.4rem,4vw,1.8rem)", color: "#f5d080", textAlign: "center", marginBottom: 8 }}>El Genio quiere conocerte</h1>
        <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.9rem", color: "rgba(240,234,214,0.45)", textAlign: "center", marginBottom: 32, maxWidth: 400 }}>Solo 2 preguntas para recomendarte mejor.</p>

        {/* Progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, width: "100%", maxWidth: 300 }}>
          {[0, 1].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= obStep ? "#e8a84c" : "rgba(232,168,76,0.15)" }} />)}
        </div>

        {obStep === 0 && (
          <div style={{ width: "100%", maxWidth: 400 }}>
            <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "#e8a84c", textAlign: "center", marginBottom: 16 }}>Que NO comes?</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {RESTRICTIONS.map(r => {
                const active = restrictions.includes(r.v);
                return (
                  <button key={r.v} onClick={() => {
                    if (r.v === "como de todo") setRestrictions(["como de todo"]);
                    else setRestrictions(prev => prev.filter(x => x !== "como de todo").includes(r.v) ? prev.filter(x => x !== r.v) : [...prev.filter(x => x !== "como de todo"), r.v]);
                  }} style={{ padding: "14px 18px", background: active ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.03)", border: active ? "1px solid #e8a84c" : "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontFamily: "var(--font-lato)", fontSize: "0.92rem", color: active ? "#e8a84c" : "rgba(240,234,214,0.6)", cursor: "pointer", textAlign: "left" }}>
                    {active ? "✓ " : ""}{r.l}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setObStep(1)} style={{ width: "100%", marginTop: 20, padding: 14, background: "#e8a84c", color: "#0a0812", border: "none", borderRadius: 12, fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>Siguiente</button>
          </div>
        )}

        {obStep === 1 && (
          <div style={{ width: "100%", maxWidth: 400 }}>
            <h2 style={{ fontFamily: "var(--font-cinzel)", fontSize: "1rem", color: "#e8a84c", textAlign: "center", marginBottom: 16 }}>Como andas ahora?</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FITNESS_OPTIONS.map(f => {
                const active = fitnessMode === f.v;
                return (
                  <button key={f.v} onClick={() => setFitnessMode(f.v)} style={{ padding: "14px 18px", background: active ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.03)", border: active ? "1px solid #e8a84c" : "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 22 }}>{f.emoji}</span>
                    <div>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.88rem", color: active ? "#e8a84c" : "#f0ead6", margin: 0 }}>{f.l}</p>
                      {f.sub && <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.75rem", color: "rgba(240,234,214,0.35)", margin: 0 }}>{f.sub}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button onClick={() => setObStep(0)} style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid rgba(232,168,76,0.3)", borderRadius: 12, fontFamily: "var(--font-cinzel)", fontSize: "0.85rem", color: "#e8a84c", cursor: "pointer" }}>Atras</button>
              <button onClick={saveOnboarding} disabled={savingOb} style={{ flex: 2, padding: 14, background: "#e8a84c", color: "#0a0812", border: "none", borderRadius: 12, fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", fontWeight: 700, cursor: "pointer", opacity: savingOb ? 0.5 : 1 }}>{savingOb ? "Guardando..." : "Listo, recomiendame"}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LOADING ──
  if (phase === "loading" || loadingDishes) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0812", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🧞</p>
        <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.9rem", color: "rgba(240,234,214,0.4)" }}>Buscando platos...</p>
      </div>
    );
  }

  // ── DISHES GRID ──
  return (
    <div style={{ minHeight: "100vh", background: "#0a0812", padding: "clamp(20px,4vw,40px) clamp(16px,3vw,24px)" }}>
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontSize: 32, marginBottom: 6 }}>🧞</p>
          <h1 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.2rem,3.5vw,1.6rem)", color: "#f5d080", marginBottom: 6 }}>Que te tinca?</h1>
          <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.85rem", color: "rgba(240,234,214,0.4)" }}>Toca los platos que te llamen</p>
        </div>

        {dishes.length === 0 ? (
          <p style={{ fontFamily: "var(--font-lato)", color: "rgba(240,234,214,0.3)", textAlign: "center", padding: 40 }}>No hay platos disponibles aun. Vuelve pronto.</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
              {dishes.map((d: Dish) => {
                const isSel = selected.has(d.id);
                return (
                  <button key={d.id} onClick={() => toggleSelect(d.id)} style={{ position: "relative", aspectRatio: "1", borderRadius: 14, overflow: "hidden", border: isSel ? "2px solid #3db89e" : "2px solid transparent", cursor: "pointer", background: "rgba(45,26,8,0.6)", padding: 0 }}>
                    {d.imagenUrl ? (
                      <img src={d.imagenUrl} alt={d.nombre} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isSel ? 0.7 : 1, transition: "opacity 0.15s" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🍽️</div>
                    )}
                    {/* Name overlay */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.8))", padding: "20px 6px 6px" }}>
                      <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(0.55rem,1.5vw,0.7rem)", color: "#f0ead6", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nombre}</p>
                      <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.6rem", color: "rgba(240,234,214,0.4)", margin: 0 }}>${Number(d.precio).toLocaleString("es-CL")}</p>
                    </div>
                    {/* Check */}
                    {isSel && (
                      <div style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "#3db89e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff" }}>✓</div>
                    )}
                  </button>
                );
              })}
            </div>

            <button onClick={handleNext} disabled={selected.size === 0} style={{ width: "100%", padding: 16, background: selected.size > 0 ? "#e8a84c" : "rgba(232,168,76,0.15)", color: selected.size > 0 ? "#0a0812" : "rgba(240,234,214,0.3)", border: "none", borderRadius: 14, fontFamily: "var(--font-cinzel)", fontSize: "0.92rem", fontWeight: 700, cursor: selected.size > 0 ? "pointer" : "default", marginBottom: 10 }}>
              Estos me tincan →
            </button>

            <button onClick={handleOtherDishes} style={{ width: "100%", padding: 14, background: "transparent", border: "1px solid rgba(232,168,76,0.2)", borderRadius: 14, fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", cursor: "pointer" }}>
              Ver otros platos
            </button>
          </>
        )}
      </div>
    </div>
  );
}
