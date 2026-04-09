"use client";

import { TOTAL_STEPS } from "@/types/onboarding";

interface Props {
  stepNum: number;
  phase: 1 | 2;
  heading: string;
  sub?: string;
  onBack?: () => void;
  onContinue: () => void;
  canContinue: boolean;
  continueLabel?: string;
  children: React.ReactNode;
}

export function StepShell({
  stepNum,
  phase,
  heading,
  sub,
  onBack,
  onContinue,
  canContinue,
  continueLabel = "Continue",
  children,
}: Props) {
  const progress = (stepNum / TOTAL_STEPS) * 100;

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center gap-3 px-6 pt-6 pb-4">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base font-bold"
          style={{ background: "#8C5A3C", fontFamily: "var(--font-playfair)" }}
        >
          S
        </div>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--text-secondary)", fontFamily: "var(--font-playfair)" }}
        >
          SiLog
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-gray-100">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #4B2E2B, #8C5A3C)",
          }}
        />
      </div>

      {/* Step counter */}
      <div className="px-8 lg:px-12 pt-8 flex items-center gap-3">
        <span
          className="text-[10px] font-bold tracking-[0.14em] uppercase"
          style={{ color: "#8C5A3C", fontFamily: "var(--font-dm-mono)" }}
        >
          Phase {phase}
        </span>
        <span style={{ color: "rgba(140,90,60,0.3)" }}>·</span>
        <span
          className="text-[10px] tracking-wider uppercase"
          style={{ color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" }}
        >
          Step {stepNum} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Heading */}
      <div className="px-8 lg:px-12 pt-6 pb-8 max-w-xl">
        <h1
          className="text-3xl lg:text-4xl font-bold leading-tight mb-3"
          style={{ fontFamily: "var(--font-playfair)", color: "var(--text)" }}
        >
          {heading}
        </h1>
        {sub && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {sub}
          </p>
        )}
      </div>

      {/* Form content */}
      <div className="flex-1 px-8 lg:px-12 pb-8 max-w-xl w-full">
        {children}
      </div>

      {/* Actions */}
      <div className="px-8 lg:px-12 py-6 border-t border-gray-100 flex items-center justify-between max-w-xl w-full">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-sm font-medium transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            ← Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: canContinue ? "var(--btn-primary)" : "var(--btn-disabled)" }}
        >
          {continueLabel} →
        </button>
      </div>
    </div>
  );
}
