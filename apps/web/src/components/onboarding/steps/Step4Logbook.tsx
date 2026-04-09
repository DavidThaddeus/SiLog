"use client";

import { useOnboardingStore } from "@/store/onboarding";
import { StepShell } from "../StepShell";
import { BUILT_IN_TEMPLATES } from "@/lib/onboarding-constants";

interface Props {
  onComplete: () => void;
}

export function Step4Logbook({ onComplete: _onComplete }: Props) {
  const { data, setField, nextStep, prevStep } = useOnboardingStore();

  const canContinue = !!data.logbookTemplateId;

  return (
    <StepShell
      stepNum={4}
      phase={1}
      heading="Which logbook format do you use?"
      sub="This controls how the AI structures every entry — headings, columns, paragraph style."
      onBack={prevStep}
      onContinue={nextStep}
      canContinue={canContinue}
    >
      <div className="space-y-2">
        {BUILT_IN_TEMPLATES.map((tpl) => {
          const isSelected = data.logbookTemplateId === tpl.id;
          const isCustom = tpl.id === "custom";
          return (
            <button
              key={tpl.id}
              onClick={() => setField("logbookTemplateId", tpl.id)}
              className="w-full text-left p-4 rounded-xl border transition-all cursor-pointer"
              style={{
                background: isSelected ? (isCustom ? "var(--card)" : "var(--btn-primary)") : "var(--card)",
                borderColor: isSelected
                  ? isCustom
                    ? "#8C5A3C"
                    : "#4B2E2B"
                  : "rgba(140,90,60,0.2)",
                borderWidth: isSelected ? "2px" : "1px",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className="text-sm font-semibold mb-0.5"
                    style={{ color: isSelected && !isCustom ? "white" : "var(--text)" }}
                  >
                    {tpl.shortName !== "Other" && (
                      <span
                        className="text-[10px] font-bold mr-2 px-1.5 py-0.5 rounded"
                        style={{
                          background: isSelected && !isCustom ? "rgba(255,255,255,0.2)" : "rgba(140,90,60,0.12)",
                          color: isSelected && !isCustom ? "white" : "#8C5A3C",
                          fontFamily: "var(--font-dm-mono)",
                        }}
                      >
                        {tpl.shortName}
                      </span>
                    )}
                    {tpl.universityName}
                  </div>
                  <div
                    className="text-xs leading-relaxed"
                    style={{ color: isSelected && !isCustom ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}
                  >
                    {tpl.notes}
                  </div>
                </div>
                <div
                  className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    borderColor: isSelected ? (isCustom ? "#8C5A3C" : "var(--btn-primary)") : "rgba(140,90,60,0.3)",
                    background: isSelected ? (isCustom ? "#8C5A3C" : "white") : "transparent",
                  }}
                >
                  {isSelected && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: isCustom ? "white" : "#4B2E2B" }}
                    />
                  )}
                </div>
              </div>
            </button>
          );
        })}

        <p className="text-[11px] pt-2" style={{ color: "#9CA3AF" }}>
          More universities are added regularly. If yours isn't listed, select "Other" and
          describe your format on the next screen.
        </p>
      </div>
    </StepShell>
  );
}
