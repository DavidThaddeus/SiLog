"use client";

import Image from "next/image";
import { STEP_META } from "@/types/onboarding";

interface Props {
  currentStep: number;
}

export function ProgressPanel({ currentStep }: Props) {
  return (
    <aside className="hidden lg:flex flex-col w-[320px] min-h-screen bg-dark text-white shrink-0">
      {/* Logo */}
      <div className="px-8 pt-10 pb-8 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 mb-1">
          <Image
            src="/silogfinal.png"
            alt="SiLog"
            width={48}
            height={48}
            style={{ objectFit: "contain", flexShrink: 0 }}
          />
          <div>
            <div
              className="text-[15px] font-semibold leading-tight"
              style={{ fontFamily: "var(--font-playfair)", color: "white" }}
            >
              SiLog
            </div>
            <div
              className="text-[10px] mt-0.5 tracking-widest uppercase"
              style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-dm-mono)" }}
            >
              Setup Profile
            </div>
          </div>
        </div>
      </div>

      {/* Step list */}
      <nav className="flex-1 px-6 py-6 overflow-y-auto">
        {/* Phase 1 */}
        <div
          className="text-[9px] font-bold tracking-[0.14em] uppercase mb-3 px-2"
          style={{ color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-dm-mono)" }}
        >
          Phase 1 — Identity
        </div>
        {STEP_META.filter((s) => s.phase === 1).map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isCompleted = currentStep > stepNum;
          return (
            <div
              key={step.num}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-all"
              style={{
                background: isActive ? "rgba(140,90,60,0.18)" : "transparent",
                borderLeft: isActive ? "2px solid #8C5A3C" : "2px solid transparent",
              }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  background: isCompleted
                    ? "#8C5A3C"
                    : isActive
                    ? "rgba(140,90,60,0.3)"
                    : "rgba(255,255,255,0.08)",
                  color: isCompleted || isActive ? "white" : "rgba(255,255,255,0.3)",
                }}
              >
                {isCompleted ? "✓" : step.num}
              </div>
              <span
                className="text-[12px] leading-tight"
                style={{
                  color: isActive
                    ? "white"
                    : isCompleted
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.35)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}

        {/* Phase 2 */}
        <div
          className="text-[9px] font-bold tracking-[0.14em] uppercase mt-6 mb-3 px-2"
          style={{ color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-dm-mono)" }}
        >
          Phase 2 — Coverage
        </div>
        {STEP_META.filter((s) => s.phase === 2).map((step, idx) => {
          const stepNum = idx + 6;
          const isActive = currentStep === stepNum;
          const isCompleted = currentStep > stepNum;
          return (
            <div
              key={step.num}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 transition-all"
              style={{
                background: isActive ? "rgba(140,90,60,0.18)" : "transparent",
                borderLeft: isActive ? "2px solid #8C5A3C" : "2px solid transparent",
              }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  background: isCompleted
                    ? "#8C5A3C"
                    : isActive
                    ? "rgba(140,90,60,0.3)"
                    : "rgba(255,255,255,0.08)",
                  color: isCompleted || isActive ? "white" : "rgba(255,255,255,0.3)",
                }}
              >
                {isCompleted ? "✓" : step.num}
              </div>
              <span
                className="text-[12px] leading-tight"
                style={{
                  color: isActive
                    ? "white"
                    : isCompleted
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(255,255,255,0.35)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-8 py-6 border-t border-white/[0.06]">
        <div
          className="text-[10px] leading-relaxed"
          style={{ color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-dm-mono)" }}
        >
          Profile saved permanently.
          <br />Never asked again.
        </div>
      </div>
    </aside>
  );
}
