"use client";

import { useState } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { StepShell } from "../StepShell";
import { INDUSTRIES, COMPANY_DEPARTMENTS } from "@/lib/onboarding-constants";

const inputClass =
  "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold mb-1.5 tracking-wide uppercase";
const labelStyle = { color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" };

// Industries without "Other" — we handle Other separately
const INDUSTRY_OPTIONS = INDUSTRIES.filter((i) => i !== "Other");

interface Props {
  onComplete: () => void;
}

export function Step3Company({ onComplete: _onComplete }: Props) {
  const { data, setField, nextStep, prevStep } = useOnboardingStore();
  const [focused, setFocused] = useState<string | null>(null);

  // Track whether "Other" tab is selected
  const isOtherSelected =
    data.industry !== undefined &&
    !INDUSTRY_OPTIONS.includes(data.industry as typeof INDUSTRY_OPTIONS[number]);
  const [customIndustry, setCustomIndustry] = useState(isOtherSelected ? data.industry ?? "" : "");
  const [otherActive, setOtherActive] = useState(isOtherSelected);

  // Company department suggestions shown on focus
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);
  const deptQuery = data.companyDepartment ?? "";
  const deptSuggestions = COMPANY_DEPARTMENTS.filter((d) =>
    d.toLowerCase().includes(deptQuery.toLowerCase())
  ).slice(0, 6);

  const selectIndustry = (ind: string) => {
    setOtherActive(false);
    setCustomIndustry("");
    setField("industry", ind);
  };

  const activateOther = () => {
    setOtherActive(true);
    setField("industry", customIndustry); // may be empty
  };

  const handleCustomIndustry = (val: string) => {
    setCustomIndustry(val);
    setField("industry", val);
  };

  const industryReady = otherActive ? customIndustry.trim().length > 0 : !!data.industry;
  const canContinue = !!(
    data.companyName?.trim() &&
    industryReady &&
    data.companyDepartment?.trim()
  );

  return (
    <StepShell
      stepNum={3}
      phase={1}
      heading="Tell us about your placement."
      sub="Company name, industry, and the department you're attached to — this sets the vocabulary and context for every entry."
      onBack={prevStep}
      onContinue={nextStep}
      canContinue={canContinue}
    >
      <div className="space-y-5">
        {/* Company name */}
        <div>
          <label className={labelClass} style={labelStyle}>Company name</label>
          <input
            type="text"
            placeholder="e.g. New Horizons Nigeria, First Bank IT dept…"
            className={inputClass}
            style={{
              borderColor: focused === "company" ? "#8C5A3C" : "rgba(140,90,60,0.25)",
              color: "var(--text)",
            }}
            value={data.companyName ?? ""}
            onChange={(e) => setField("companyName", e.target.value)}
            onFocus={() => setFocused("company")}
            onBlur={() => setFocused(null)}
          />
        </div>

        {/* Company department */}
        <div className="relative">
          <label className={labelClass} style={labelStyle}>
            Which department are you attached to?
          </label>
          <input
            type="text"
            placeholder="e.g. IT Department, Finance & Accounts, Engineering…"
            className={inputClass}
            style={{
              borderColor: focused === "dept" ? "#8C5A3C" : "rgba(140,90,60,0.25)",
              color: "var(--text)",
            }}
            value={deptQuery}
            onChange={(e) => {
              setField("companyDepartment", e.target.value);
              setShowDeptSuggestions(true);
            }}
            onFocus={() => { setFocused("dept"); setShowDeptSuggestions(true); }}
            onBlur={() => { setFocused(null); setTimeout(() => setShowDeptSuggestions(false), 150); }}
          />
          {showDeptSuggestions && deptSuggestions.length > 0 && deptQuery.length > 0 && (
            <div
              className="absolute z-10 w-full mt-1 rounded-xl border overflow-hidden shadow-lg"
              style={{ background: "var(--card)", borderColor: "rgba(140,90,60,0.2)" }}
            >
              {deptSuggestions.map((dept) => (
                <button
                  key={dept}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#F5EDE7] cursor-pointer"
                  style={{ color: "var(--text)", borderBottom: "1px solid rgba(140,90,60,0.08)" }}
                  onMouseDown={() => {
                    setField("companyDepartment", dept);
                    setShowDeptSuggestions(false);
                  }}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}
          <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>
            This helps the AI know what kind of work you do day-to-day.
          </p>
        </div>

        {/* Industry */}
        <div>
          <label className={labelClass} style={labelStyle}>Industry</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {INDUSTRY_OPTIONS.map((ind) => {
              const isSelected = !otherActive && data.industry === ind;
              return (
                <button
                  key={ind}
                  onClick={() => selectIndustry(ind)}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer"
                  style={{
                    background: isSelected ? "var(--btn-primary)" : "var(--card)",
                    color: isSelected ? "white" : "var(--text-muted)",
                    borderColor: isSelected ? "var(--btn-primary)" : "rgba(140,90,60,0.2)",
                  }}
                >
                  {ind}
                </button>
              );
            })}
            {/* Other pill */}
            <button
              onClick={activateOther}
              className="px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer"
              style={{
                background: otherActive ? "#8C5A3C" : "var(--card)",
                color: otherActive ? "white" : "var(--text-muted)",
                borderColor: otherActive ? "#8C5A3C" : "rgba(140,90,60,0.2)",
              }}
            >
              Other…
            </button>
          </div>

          {/* Custom industry text input (shown when Other is active) */}
          {otherActive && (
            <input
              type="text"
              placeholder="Describe your industry, e.g. Fashion & Tailoring, Printing…"
              className={inputClass}
              style={{
                borderColor: focused === "custom-industry" ? "#8C5A3C" : "rgba(140,90,60,0.3)",
                color: "var(--text)",
                marginTop: "6px",
              }}
              value={customIndustry}
              onChange={(e) => handleCustomIndustry(e.target.value)}
              onFocus={() => setFocused("custom-industry")}
              onBlur={() => setFocused(null)}
              autoFocus
            />
          )}
        </div>

        {/* Preview */}
        {data.companyName && industryReady && data.companyDepartment && (
          <div
            className="p-4 rounded-xl text-xs leading-relaxed space-y-1"
            style={{ background: "var(--brown-faint-var)", color: "var(--text-muted)" }}
          >
            <div
              className="text-[9px] font-bold tracking-widest uppercase mb-2"
              style={{ color: "#8C5A3C", fontFamily: "var(--font-dm-mono)" }}
            >
              Entry context preview
            </div>
            <div>
              <strong style={{ color: "var(--text-secondary)" }}>Placement:</strong> {data.companyName}
            </div>
            <div>
              <strong style={{ color: "var(--text-secondary)" }}>Department:</strong> {data.companyDepartment}
            </div>
            <div>
              <strong style={{ color: "var(--text-secondary)" }}>Industry:</strong> {data.industry}
            </div>
          </div>
        )}
      </div>
    </StepShell>
  );
}
