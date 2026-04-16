"use client";

import { useOnboardingStore } from "@/store/onboarding";
import { StepShell } from "../StepShell";

interface Props {
  onComplete: () => void;
}

const OPTIONS = [
  {
    id: "short" as const,
    label: "Short — 1 to 3 pages",
    desc: "For students whose physical logbook has fewer pages per week. The AI targets 250–350 words per day entry.",
    icon: "📄",
  },
  {
    id: "long" as const,
    label: "Long — 4 to 5 pages",
    desc: "For students with more pages per week. The AI targets 400–450 words per day entry with more technical depth.",
    icon: "📋",
  },
];

export function Step4Logbook({ onComplete: _onComplete }: Props) {
  const { data, setField, nextStep, prevStep } = useOnboardingStore();

  const canContinue = !!data.notesLengthPreference;

  return (
    <StepShell
      stepNum={4}
      phase={1}
      heading="How long are your technical note pages?"
      sub="This controls how many words the AI writes per day entry — matching the space available in your actual logbook."
      onBack={prevStep}
      onContinue={nextStep}
      canContinue={canContinue}
    >
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const isSelected = data.notesLengthPreference === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setField("notesLengthPreference", opt.id)}
              className="w-full text-left p-5 rounded-xl border transition-all cursor-pointer"
              style={{
                background: isSelected ? "var(--btn-primary)" : "var(--card)",
                borderColor: isSelected ? "#4B2E2B" : "rgba(140,90,60,0.2)",
                borderWidth: isSelected ? "2px" : "1px",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{opt.icon}</span>
                  <div>
                    <div
                      className="text-sm font-semibold mb-1"
                      style={{ color: isSelected ? "white" : "var(--text)" }}
                    >
                      {opt.label}
                    </div>
                    <div
                      className="text-xs leading-relaxed"
                      style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}
                    >
                      {opt.desc}
                    </div>
                  </div>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    borderColor: isSelected ? "white" : "rgba(140,90,60,0.3)",
                    background: isSelected ? "white" : "transparent",
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

        <p className="text-[11px] pt-2" style={{ color: "#9CA3AF" }}>
          You can switch between short and long at any time before generating an entry.
        </p>
      </div>
    </StepShell>
  );
}
