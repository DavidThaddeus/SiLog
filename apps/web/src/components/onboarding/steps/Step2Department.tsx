"use client";

import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { StepShell } from "../StepShell";
import { LEVELS } from "@/lib/onboarding-constants";

const inputClass =
  "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold mb-1.5 tracking-wide uppercase";
const labelStyle = { color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" };

interface Props {
  onComplete: () => void;
}

export function Step2Department({ onComplete: _onComplete }: Props) {
  const { data, setField, nextStep, prevStep } = useOnboardingStore();
  const [focused, setFocused] = useState<string | null>(null);

  const canContinue = !!(data.department?.trim() && data.level);

  return (
    <StepShell
      stepNum={2}
      phase={1}
      heading="Your department and year."
      sub="This determines which academic theories we connect to your daily work — the core of the AI bridge system."
      onBack={prevStep}
      onContinue={nextStep}
      canContinue={canContinue}
    >
      <div className="space-y-5">
        {/* Department */}
        <div>
          <label className={labelClass} style={labelStyle}>
            Department / Course
          </label>
          <input
            type="text"
            placeholder="e.g. Industrial Mathematics, Computer Science…"
            className={inputClass}
            style={{
              borderColor: focused === "dept" ? "#8C5A3C" : "rgba(140,90,60,0.25)",
              color: "var(--text)",
            }}
            value={data.department ?? ""}
            onChange={(e) => setField("department", e.target.value)}
            onFocus={() => setFocused("dept")}
            onBlur={() => setFocused(null)}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>
            Be specific — "Industrial Mathematics" gives better bridges than "Science."
          </p>
        </div>

        {/* Level */}
        <div>
          <label className={labelClass} style={labelStyle}>
            Current level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {LEVELS.map((lvl) => {
              const isSelected = data.level === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setField("level", lvl)}
                  className="py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
                  style={{
                    background: isSelected ? "var(--btn-primary)" : "var(--card)",
                    color: isSelected ? "white" : "var(--text-muted)",
                    borderColor: isSelected ? "var(--btn-primary)" : "rgba(140,90,60,0.2)",
                  }}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI bridge preview */}
        {data.department && data.department.length > 3 && (
          <div
            className="p-4 rounded-xl border-l-4 text-sm leading-relaxed"
            style={{
              background: "var(--brown-faint-var)",
              borderLeftColor: "#8C5A3C",
              color: "var(--text-muted)",
            }}
          >
            <div
              className="text-[9px] font-bold tracking-widest uppercase mb-1.5"
              style={{ color: "#8C5A3C", fontFamily: "var(--font-dm-mono)" }}
            >
              AI bridge preview
            </div>
            For <strong style={{ color: "var(--text-secondary)" }}>{data.department}</strong>, the AI will
            connect your daily tasks to relevant course theory automatically.
          </div>
        )}
      </div>
    </StepShell>
  );
}
