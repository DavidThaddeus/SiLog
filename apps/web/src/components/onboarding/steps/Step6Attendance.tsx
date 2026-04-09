"use client";

import { useOnboardingStore } from "@/store/onboarding";
import { StepShell } from "../StepShell";
import { WEEKDAYS } from "@/lib/onboarding-constants";

interface Props {
  onComplete: () => void;
}

export function Step6Attendance({ onComplete: _onComplete }: Props) {
  const { data, setField, nextStep, prevStep } = useOnboardingStore();

  const selected = data.attendanceDayNames ?? [];
  const canContinue = selected.length > 0;

  const toggleDay = (day: string) => {
    const next = selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day];
    // Preserve weekday order
    const ordered = WEEKDAYS.filter((d) => next.includes(d));
    setField("attendanceDayNames", ordered);
  };

  const dayCount = selected.length;
  const nonAttendanceDays = 5 - dayCount;

  return (
    <StepShell
      stepNum={6}
      phase={2}
      heading="Which days do you go to the office?"
      sub="Select all the days you are physically present at your SIWES company each week."
      onBack={prevStep}
      onContinue={nextStep}
      canContinue={canContinue}
    >
      <div className="space-y-6">
        {/* Day selector */}
        <div className="grid grid-cols-5 gap-2">
          {WEEKDAYS.map((day) => {
            const isSelected = selected.includes(day);
            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className="flex flex-col items-center py-4 rounded-xl border transition-all cursor-pointer"
                style={{
                  background: isSelected ? "var(--btn-primary)" : "var(--card)",
                  borderColor: isSelected ? "var(--btn-primary)" : "rgba(140,90,60,0.2)",
                  borderWidth: isSelected ? "2px" : "1px",
                }}
              >
                <span
                  className="text-[10px] font-bold tracking-wide"
                  style={{
                    fontFamily: "var(--font-dm-mono)",
                    color: isSelected ? "rgba(255,255,255,0.7)" : "#9CA3AF",
                  }}
                >
                  {day.slice(0, 3).toUpperCase()}
                </span>
                <span
                  className="text-base font-bold mt-0.5"
                  style={{ color: isSelected ? "white" : "var(--text-secondary)" }}
                >
                  {day.charAt(0)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary */}
        {dayCount > 0 && (
          <div className="space-y-3">
            <div
              className="p-4 rounded-xl text-sm leading-relaxed"
              style={{ background: "var(--brown-faint-var)", color: "var(--text-muted)" }}
            >
              <div
                className="text-[9px] font-bold tracking-widest uppercase mb-2"
                style={{ color: "#8C5A3C", fontFamily: "var(--font-dm-mono)" }}
              >
                Coverage plan
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <strong style={{ color: "var(--text-secondary)" }}>Office days ({dayCount}):</strong>{" "}
                  {selected.join(", ")} — AI uses your real work tasks.
                </div>
                {nonAttendanceDays > 0 && (
                  <div>
                    <strong style={{ color: "var(--text-secondary)" }}>
                      Non-attendance days ({nonAttendanceDays}):
                    </strong>{" "}
                    AI fills from Activity Bank + personal study stream.
                  </div>
                )}
              </div>
            </div>

            {dayCount === 5 && (
              <div
                className="p-3 rounded-xl text-xs border"
                style={{
                  background: "rgba(140,90,60,0.06)",
                  borderColor: "rgba(140,90,60,0.2)",
                  color: "var(--text-muted)",
                }}
              >
                Full attendance week. Activity Bank still handles overflow from busy days.
              </div>
            )}
          </div>
        )}
      </div>
    </StepShell>
  );
}
