"use client";

import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { StepShell } from "../StepShell";

const inputClass =
  "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold mb-1.5 tracking-wide uppercase";
const labelStyle = { color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" };

interface Props {
  onComplete: () => void;
}

const DURATION_OPTIONS: { value: 3 | 6 | 12; label: string; weeks: number; detail: string }[] = [
  { value: 3,  label: "3 Months",  weeks: 13, detail: "13 weeks — short placement" },
  { value: 6,  label: "6 Months",  weeks: 26, detail: "26 weeks — standard SIWES" },
  { value: 12, label: "1 Year",    weeks: 52, detail: "52 weeks — extended placement" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Format a local ISO date string (YYYY-MM-DD) to a readable display. */
function formatDisplay(iso: string): string {
  if (!iso) return "";
  // Parse as local date to avoid UTC shift
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Add n weeks to a local date and return YYYY-MM-DD. */
function addWeeks(iso: string, weeks: number): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weeks * 7);
  const ey = date.getFullYear();
  const em = String(date.getMonth() + 1).padStart(2, "0");
  const ed = String(date.getDate()).padStart(2, "0");
  return `${ey}-${em}-${ed}`;
}

/** Check if a date string is a weekday (Mon–Fri). */
function isWeekday(iso: string): boolean {
  if (!iso) return true;
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day >= 1 && day <= 5;
}

export function Step5Dates({ onComplete: _onComplete }: Props) {
  const { data, setField, nextStep, prevStep } = useOnboardingStore();
  const [focused, setFocused] = useState<string | null>(null);

  const duration = data.siwesDuration ?? 6;
  const selectedOption = DURATION_OPTIONS.find((o) => o.value === duration) ?? DURATION_OPTIONS[1];
  const endDateISO = addWeeks(data.startDate ?? "", selectedOption.weeks);

  // Warn if selected start date is a weekend
  const startIsWeekend = data.startDate ? !isWeekday(data.startDate) : false;

  const canContinue = !!(data.startDate && data.supervisorName?.trim());

  return (
    <StepShell
      stepNum={5}
      phase={1}
      heading="When did you start and who is your supervisor?"
      sub="Your start date is used to calculate all your week dates. Pick a Monday (or the exact day you started)."
      onBack={prevStep}
      onContinue={nextStep}
      canContinue={canContinue}
    >
      <div className="space-y-6">

        {/* ── Duration ────────────────────────────────────── */}
        <div>
          <label className={labelClass} style={labelStyle}>
            SIWES duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((opt) => {
              const active = duration === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField("siwesDuration", opt.value)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 12,
                    border: active ? "2px solid #8C5A3C" : "1.5px solid rgba(140,90,60,0.25)",
                    background: active ? "rgba(140,90,60,0.1)" : "transparent",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#8C5A3C" : "var(--text)" }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {opt.detail}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Start Date ──────────────────────────────────── */}
        <div>
          <label className={labelClass} style={labelStyle}>
            SIWES start date
          </label>
          <input
            type="date"
            className={inputClass}
            style={{
              borderColor: focused === "date" ? "#8C5A3C" : "rgba(140,90,60,0.25)",
              color: data.startDate ? "var(--text)" : "#9CA3AF",
            }}
            value={data.startDate ?? ""}
            onChange={(e) => setField("startDate", e.target.value)}
            onFocus={() => setFocused("date")}
            onBlur={() => setFocused(null)}
          />

          {/* Weekend warning */}
          {startIsWeekend && (
            <p className="text-[11px] mt-1.5" style={{ color: "#dc2626" }}>
              ⚠ That date falls on a{" "}
              {DAY_NAMES[new Date(
                ...data.startDate!.split("-").map(Number) as [number, number, number]
              ).getDay()]}. SIWES typically starts on a Monday — please confirm your date.
            </p>
          )}

          {/* End date preview */}
          {data.startDate && !startIsWeekend && (
            <p className="text-[11px] mt-1.5" style={{ color: "#8C5A3C" }}>
              {selectedOption.weeks}-week programme ends approximately{" "}
              <strong>{formatDisplay(endDateISO)}</strong>
            </p>
          )}
          {data.startDate && startIsWeekend && endDateISO && (
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
              Approximate end: <strong>{formatDisplay(endDateISO)}</strong>
            </p>
          )}
        </div>

        {/* ── Supervisor ──────────────────────────────────── */}
        <div>
          <label className={labelClass} style={labelStyle}>
            Industry supervisor name
          </label>
          <input
            type="text"
            placeholder="e.g. Mr. Ayo Adeyemi, Engr. Chukwu…"
            className={inputClass}
            style={{
              borderColor: focused === "supervisor" ? "#8C5A3C" : "rgba(140,90,60,0.25)",
              color: "var(--text)",
            }}
            value={data.supervisorName ?? ""}
            onChange={(e) => setField("supervisorName", e.target.value)}
            onFocus={() => setFocused("supervisor")}
            onBlur={() => setFocused(null)}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>
            This is the person at your company responsible for signing your logbook.
          </p>
        </div>

        {/* ── Summary card ────────────────────────────────── */}
        {canContinue && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{ background: "var(--brown-faint-var)", color: "var(--text-muted)" }}
          >
            <div
              className="text-[9px] font-bold tracking-widest uppercase mb-2"
              style={{ color: "#8C5A3C", fontFamily: "var(--font-dm-mono)" }}
            >
              Profile summary so far
            </div>
            <div className="space-y-1 text-xs">
              <div><strong style={{ color: "var(--text-secondary)" }}>Student:</strong> {data.fullName} · {data.university}</div>
              <div><strong style={{ color: "var(--text-secondary)" }}>Course:</strong> {data.department} · {data.level}</div>
              <div><strong style={{ color: "var(--text-secondary)" }}>Placement:</strong> {data.companyName} · {data.industry}</div>
              <div><strong style={{ color: "var(--text-secondary)" }}>Supervisor:</strong> {data.supervisorName}</div>
              <div>
                <strong style={{ color: "var(--text-secondary)" }}>Duration:</strong>{" "}
                {formatDisplay(data.startDate!)} → {formatDisplay(endDateISO)}
                {" "}({selectedOption.weeks} weeks)
              </div>
            </div>
          </div>
        )}
      </div>
    </StepShell>
  );
}
