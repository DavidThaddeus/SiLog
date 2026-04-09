"use client";

import { useRef, useState } from "react";
import { useOnboardingStore } from "@/store/onboarding";
import { StepShell } from "../StepShell";
import { POPULAR_UNIVERSITIES } from "@/lib/onboarding-constants";

const inputClass =
  "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors";
const labelClass = "block text-xs font-semibold mb-1.5 tracking-wide uppercase";
const labelStyle = { color: "var(--text-muted)", fontFamily: "var(--font-dm-mono)" };

interface Props {
  onComplete: () => void;
}

export function Step1Name({ onComplete: _onComplete }: Props) {
  const { data, setField, nextStep } = useOnboardingStore();
  const [uniInput, setUniInput] = useState(data.university ?? "");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter list: if input is empty show all, otherwise filter
  const filtered = uniInput.trim()
    ? POPULAR_UNIVERSITIES.filter((u) =>
        u.toLowerCase().includes(uniInput.toLowerCase())
      )
    : [...POPULAR_UNIVERSITIES];

  const isFromList = POPULAR_UNIVERSITIES.includes(
    uniInput as (typeof POPULAR_UNIVERSITIES)[number]
  );

  const canContinue = !!(data.fullName?.trim() && uniInput.trim());

  const selectSuggestion = (uni: string) => {
    setUniInput(uni);
    setField("university", uni);
    setOpen(false);
  };

  const handleUniChange = (val: string) => {
    setUniInput(val);
    setField("university", val);
    setOpen(true);
  };

  const handleContinue = () => {
    setField("university", uniInput.trim());
    nextStep();
  };

  // Extract acronym from "(XXX)" suffix
  const getAcronym = (u: string) => u.match(/\(([^)]+)\)$/)?.[1] ?? null;
  const getBaseName = (u: string) => u.replace(/ \([^)]+\)$/, "");

  return (
    <StepShell
      stepNum={1}
      phase={1}
      heading="What's your name and university?"
      sub="This personalises your logbook output and determines which template we use."
      onContinue={handleContinue}
      canContinue={canContinue}
    >
      <div className="space-y-5">
        {/* Full Name */}
        <div>
          <label className={labelClass} style={labelStyle}>Full name</label>
          <input
            type="text"
            placeholder="e.g. Adewale Johnson Okonkwo"
            className={inputClass}
            style={{
              borderColor: focused === "name" ? "#8C5A3C" : "rgba(140,90,60,0.25)",
              color: "var(--text)",
            }}
            value={data.fullName ?? ""}
            onChange={(e) => setField("fullName", e.target.value)}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
          />
          <p className="text-[11px] mt-1.5" style={{ color: "#9CA3AF" }}>
            Use your name exactly as it appears on your university ID.
          </p>
        </div>

        {/* University combobox */}
        <div ref={containerRef}>
          <label className={labelClass} style={labelStyle}>University</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search or type your university…"
              className={inputClass}
              style={{
                borderTopColor: open || focused === "uni" ? "#8C5A3C" : "rgba(140,90,60,0.25)",
                borderRightColor: open || focused === "uni" ? "#8C5A3C" : "rgba(140,90,60,0.25)",
                borderBottomColor: open ? "rgba(140,90,60,0.1)" : (open || focused === "uni" ? "#8C5A3C" : "rgba(140,90,60,0.25)"),
                borderLeftColor: open || focused === "uni" ? "#8C5A3C" : "rgba(140,90,60,0.25)",
                color: "var(--text)",
                borderBottomLeftRadius: open ? 0 : undefined,
                borderBottomRightRadius: open ? 0 : undefined,
              }}
              value={uniInput}
              onChange={(e) => handleUniChange(e.target.value)}
              onFocus={() => { setFocused("uni"); setOpen(true); }}
              onBlur={() => {
                setFocused(null);
                // Small delay so clicks on suggestions register first
                setTimeout(() => setOpen(false), 160);
              }}
              autoComplete="off"
            />

            {/* Chevron icon */}
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs transition-transform"
              style={{
                color: "#9CA3AF",
                transform: `translateY(-50%) rotate(${open ? "180deg" : "0deg"})`,
              }}
            >
              ▾
            </div>

            {/* Dropdown */}
            {open && (
              <div
                className="absolute z-20 w-full overflow-y-auto border border-t-0 shadow-lg"
                style={{
                  background: "var(--card)",
                  borderColor: "#8C5A3C",
                  borderBottomLeftRadius: "12px",
                  borderBottomRightRadius: "12px",
                  maxHeight: "260px",
                  top: "100%",
                  left: 0,
                }}
              >
                {filtered.length === 0 ? (
                  <div className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>
                    No match — your typed name will be used.
                  </div>
                ) : (
                  filtered.map((uni) => {
                    const acronym = getAcronym(uni);
                    const baseName = getBaseName(uni);
                    const isSelected = uniInput === uni;
                    return (
                      <button
                        key={uni}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors cursor-pointer"
                        style={{
                          background: isSelected ? "rgba(140,90,60,0.12)" : "var(--card)",
                          borderBottom: "1px solid rgba(140,90,60,0.07)",
                        }}
                        onMouseDown={() => selectSuggestion(uni)}
                      >
                        {acronym && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                            style={{
                              fontFamily: "var(--font-dm-mono)",
                              background: isSelected ? "#8C5A3C" : "rgba(140,90,60,0.1)",
                              color: isSelected ? "white" : "#8C5A3C",
                            }}
                          >
                            {acronym}
                          </span>
                        )}
                        <span
                          className="text-sm leading-tight"
                          style={{ color: isSelected ? "#8C5A3C" : "var(--text)", fontWeight: isSelected ? 600 : 400 }}
                        >
                          {baseName}
                        </span>
                        {isSelected && (
                          <span className="ml-auto text-xs" style={{ color: "#8C5A3C" }}>✓</span>
                        )}
                      </button>
                    );
                  })
                )}
                {/* Always show "use custom" hint when typing something not in list */}
                {uniInput.trim() && !isFromList && (
                  <div
                    className="px-4 py-2.5 text-xs border-t"
                    style={{
                      color: "#8C5A3C",
                      borderColor: "rgba(140,90,60,0.1)",
                      background: "rgba(140,90,60,0.03)",
                    }}
                  >
                    Using custom: <strong>{uniInput}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {!open && uniInput && (
            <p className="text-[11px] mt-1.5" style={{ color: isFromList ? "#8C5A3C" : "#6B4C3B" }}>
              {isFromList ? `✓ ${uniInput}` : `Using: ${uniInput}`}
            </p>
          )}
        </div>
      </div>
    </StepShell>
  );
}
