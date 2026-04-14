"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    key: "ctxHunger",
    title: "Cuanta hambre tienes?",
    options: [
      { v: "LIGHT", emoji: "🥗", l: "Poca", sub: "algo liviano" },
      { v: "MEDIUM", emoji: "🍽️", l: "Normal", sub: "un plato esta bien" },
      { v: "HEAVY", emoji: "🍔", l: "Mucha", sub: "entrada + plato o mas" },
    ],
  },
];

const BUDGET_LABELS = [
  { max: 6000, label: "Menos de $6.000" },
  { max: 12000, label: "$6.000 – $12.000" },
  { max: 25000, label: "Mas de $12.000" },
];

export default function GenieContext() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [budget, setBudget] = useState(12000);
  const [noBudget, setNoBudget] = useState(false);

  const totalSteps = STEPS.length + 1; // +1 for budget
  const currentStep = STEPS[step];

  const selectOption = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
    // Auto advance after small delay
    setTimeout(() => {
      if (step < STEPS.length) setStep(step + 1);
    }, 200);
  };

  const finish = () => {
    const ctx = { ...answers, ctxBudget: noBudget ? null : budget };
    sessionStorage.setItem("genieContext", JSON.stringify(ctx));
    router.push("/genie/result");
  };

  const budgetLabel = budget <= 6000 ? BUDGET_LABELS[0].label : budget <= 12000 ? BUDGET_LABELS[1].label : BUDGET_LABELS[2].label;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0812", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <p style={{ fontSize: 32, textAlign: "center", marginBottom: 8 }}>🧞</p>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28, padding: "0 20px" }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "#e8a84c" : "rgba(232,168,76,0.12)" }} />
          ))}
        </div>

        {/* Steps 0-2: Multiple choice */}
        {step < STEPS.length && currentStep && (
          <div>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.2rem,3vw,1.5rem)", color: "#f5d080", textAlign: "center", marginBottom: 20 }}>{currentStep.title}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentStep.options.map((o: any) => {
                const active = answers[currentStep.key] === o.v;
                return (
                  <button key={o.v} onClick={() => selectOption(currentStep.key, o.v)} style={{ padding: "16px 18px", background: active ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.03)", border: active ? "1px solid #e8a84c" : "1px solid rgba(255,255,255,0.08)", borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
                    <span style={{ fontSize: 24 }}>{o.emoji}</span>
                    <div>
                      <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.92rem", color: active ? "#e8a84c" : "#f0ead6", display: "block" }}>{o.l}</span>
                      {o.sub && <span style={{ fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.35)" }}>{o.sub}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Budget slider */}
        {step === STEPS.length && (
          <div>
            <h2 style={{ fontFamily: "var(--font-cinzel-decorative)", fontSize: "clamp(1.2rem,3vw,1.5rem)", color: "#f5d080", textAlign: "center", marginBottom: 16 }}>Cuanto quieres gastar?</h2>

            <button onClick={() => { setNoBudget(true); finish(); }} style={{ width: "100%", padding: "14px 18px", background: noBudget ? "rgba(232,168,76,0.12)" : "rgba(255,255,255,0.03)", border: noBudget ? "1px solid #e8a84c" : "1px solid rgba(255,255,255,0.08)", borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🤷</span>
              <span style={{ fontFamily: "var(--font-cinzel)", fontSize: "0.92rem", color: noBudget ? "#e8a84c" : "#f0ead6" }}>Me da igual</span>
            </button>

            {!noBudget && (
              <>
                <p style={{ fontFamily: "var(--font-cinzel)", fontSize: "1.1rem", color: "#e8a84c", textAlign: "center", marginBottom: 4 }}>${budget.toLocaleString("es-CL")}</p>
                <p style={{ fontFamily: "var(--font-lato)", fontSize: "0.82rem", color: "rgba(240,234,214,0.4)", textAlign: "center", marginBottom: 16 }}>{budgetLabel}</p>

                <input type="range" min={2000} max={25000} step={1000} value={budget} onChange={e => { setBudget(Number(e.target.value)); setNoBudget(false); }} style={{ width: "100%", accentColor: "#e8a84c", marginBottom: 8 }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-lato)", fontSize: "0.72rem", color: "rgba(240,234,214,0.25)" }}>
                  <span>$2.000</span><span>$25.000</span>
                </div>
              </>
            )}

            <button onClick={() => { setNoBudget(false); finish(); }} style={{ width: "100%", marginTop: 20, padding: 16, background: "#e8a84c", color: "#0a0812", border: "none", borderRadius: 14, fontFamily: "var(--font-cinzel)", fontSize: "0.92rem", fontWeight: 700, cursor: "pointer" }}>
              Recomiendame 🧞
            </button>
          </div>
        )}

        {/* Back button */}
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{ width: "100%", marginTop: 12, padding: 12, background: "transparent", border: "none", fontFamily: "var(--font-cinzel)", fontSize: "0.82rem", color: "rgba(240,234,214,0.3)", cursor: "pointer" }}>
            ← Atras
          </button>
        )}
      </div>
    </div>
  );
}
