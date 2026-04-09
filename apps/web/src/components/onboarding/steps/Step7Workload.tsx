"use client";

import { useOnboardingStore } from "@/store/onboarding";
import { StepShell } from "../StepShell";

const WORKLOAD_OPTIONS = [
  {
    value: "light" as const,
    label: "Light",
    sub: "1–2 tasks per attendance day",
    detail: "Mostly observing, occasional small tasks.",
    icon: "◇",
  },
  {
    value: "moderate" as const,
    label: "Moderate",
    sub: "3–4 tasks per attendance day",
    detail: "Regular work with some variation.",
    icon: "◈",
  },
  {
    value: "heavy" as const,
    label: "Very busy",
    sub: "5+ tasks per attendance day",
    detail: "Constantly active — tasks overflow daily.",
    icon: "◉",
  },
] as const;

interface Props {
  onComplete: () => void;
}

export function Step7Workload({ onComplete: _onComplete }: Props) {
  const { data, setField, nextStep, prevStep } = useOnboardingStore();

  const canContinue = !!data.workloadLevel;

  return (
    <StepShell
      stepNum={7}
      phase={2}
      heading="How busy are your office days?"
      sub="This controls the Activity Bank — how aggressively we store overflow tasks from busy days to fill quiet ones."
      onBack={prevStep}
      onContinue={nextStep}
      canContinue={canContinue}
    >
      <div className="space-y-3">
        {WORKLOAD_OPTIONS.map((opt) => {
          const isSelected = data.workloadLevel === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setField("workloadLevel", opt.value)}
              className="w-full text-left p-4 rounded-xl border transition-all cursor-pointer"
              style={{
                background: isSelected ? "var(--btn-primary)" : "var(--card)",
                borderColor: isSelected ? "var(--btn-primary)" : "rgba(140,90,60,0.2)",
                borderWidth: isSelected ? "2px" : "1px",
              }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="text-2xl mt-0.5 shrink-0"
                  style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#8C5A3C" }}
                >
                  {opt.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span
                      className="text-sm font-bold"
                      style={{ color: isSelected ? "white" : "var(--text)" }}
                    >
                      {opt.label}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{
                        fontFamily: "var(--font-dm-mono)",
                        color: isSelected ? "rgba(255,255,255,0.6)" : "#9CA3AF",
                      }}
                    >
                      {opt.sub}
                    </span>
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}
                  >
                    {opt.detail}
                  </p>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center"
                  style={{
                    borderColor: isSelected ? "var(--btn-primary)" : "rgba(140,90,60,0.3)",
                    background: isSelected ? "var(--btn-primary)" : "transparent",
                  }}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full" style={{ background: "#4B2E2B" }} />
                  )}
                </div>
              </div>
            </button>
          );
        })}

        <p className="text-[11px] pt-1" style={{ color: "#9CA3AF" }}>
          You can update this later from your settings. It only affects how the AI
          prioritises the Activity Bank.
        </p>
      </div>
    </StepShell>
  );
}
