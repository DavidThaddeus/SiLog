"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard";
import { useOnboardingStore } from "@/store/onboarding";
import { useSubscriptionStore, FREE_GENERATION_LIMIT } from "@/store/subscription";
import { useInitWeeks } from "@/hooks/useInitWeeks";
import { saveUserData } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { authHeaders } from "@/lib/auth-fetch";
import type { DayEntry, WeekEntry, BankedActivity } from "@/types/dashboard";
import type { GenerateEntryResponse } from "@/app/api/ai/generate-entry/route";
import type { ExtractActivitiesResponse } from "@/app/api/ai/extract-activities/route";
import { LogbookText } from "@/components/logbook/LogbookText";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
}
function fmtShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });
}
function fmtShortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const STEP_LABELS = ["Select Day", "Describe", "Activities", "AI Preview", "Done"];

// ─── Shared styles ───────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 9,
  fontFamily: "var(--font-dm-mono)",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#8C5A3C",
  marginBottom: 6,
};

// ─── Step bar ────────────────────────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
      {STEP_LABELS.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEP_LABELS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, fontFamily: "var(--font-dm-mono)",
                background: done ? "#8C5A3C" : active ? "#4B2E2B" : "transparent",
                color: done || active ? "white" : "var(--muted)",
                border: done || active ? "none" : "1px solid var(--border)",
              }}>
                {done ? "✓" : num}
              </div>
              <span className="step-label" style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--muted)", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: done ? "#8C5A3C" : "var(--border)", margin: "0 8px", transition: "background 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Pick day ────────────────────────────────────────────────────────

function Step1DayPicker({ weeks, onSelect }: {
  weeks: WeekEntry[];
  onSelect: (day: DayEntry, week: WeekEntry) => void;
}) {
  const currentWeek = weeks.find((w) => w.isCurrentWeek);
  const [viewWeekNum, setViewWeekNum] = useState(currentWeek?.weekNumber ?? 1);
  const viewWeek = weeks.find((w) => w.weekNumber === viewWeekNum);
  if (!viewWeek) return null;

  const pastWeeks = weeks.filter((w) => !w.isFutureWeek);
  const maxWeek = pastWeeks.length;

  // A day can be logged if: it's not filled yet AND the week isn't in the future
  const canLog = (d: DayEntry) =>
    (d.status === "empty" || d.status === "non-working") && !viewWeek.isFutureWeek;

  const isOff = (d: DayEntry) => !d.isAttendanceDay;

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
        Which day are you logging?
      </h2>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        Select any unfilled day below — including days you weren't originally scheduled but still attended.
      </p>

      {/* Week nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 14, padding: "10px 16px", borderRadius: 10,
        background: "var(--brown-faint-var)", border: "1px solid var(--border)",
      }}>
        <button onClick={() => setViewWeekNum((n) => Math.max(1, n - 1))} disabled={viewWeekNum <= 1}
          style={{ background: "none", border: "none", fontSize: 18, color: viewWeekNum <= 1 ? "var(--border)" : "var(--muted)", cursor: viewWeekNum <= 1 ? "default" : "pointer", padding: "0 4px" }}>
          ‹
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
            Week {viewWeek.weekNumber}
            {viewWeek.isCurrentWeek && (
              <span style={{ marginLeft: 8, fontSize: 9, fontFamily: "var(--font-dm-mono)", color: "#8C5A3C", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Current
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "var(--font-dm-mono)" }}>
            {fmtShort(viewWeek.startDate)} – {fmtShort(viewWeek.endDate)}
          </div>
        </div>
        <button onClick={() => setViewWeekNum((n) => Math.min(maxWeek, n + 1))} disabled={viewWeekNum >= maxWeek}
          style={{ background: "none", border: "none", fontSize: 18, color: viewWeekNum >= maxWeek ? "var(--border)" : "var(--muted)", cursor: viewWeekNum >= maxWeek ? "default" : "pointer", padding: "0 4px" }}>
          ›
        </button>
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {viewWeek.days.map((day) => {
          const loggable = canLog(day);
          const filled = day.hasNotes;
          const wasOff = isOff(day);
          // Non-attendance but loggable = student actually came in
          const overrideDay = loggable && wasOff;

          return (
            <button key={day.id} onClick={() => loggable && onSelect(day, viewWeek)} disabled={!loggable}
              style={{
                padding: "14px 8px", borderRadius: 10, textAlign: "center", cursor: loggable ? "pointer" : "default",
                transition: "all 0.15s",
                border: loggable ? (overrideDay ? "1.5px dashed #B8805F" : "1.5px dashed #8C5A3C") : "1px solid var(--border)",
                background: loggable ? (overrideDay ? "rgba(184,128,95,0.06)" : "rgba(140,90,60,0.04)") : (filled ? "var(--surface)" : "transparent"),
                opacity: viewWeek.isFutureWeek ? 0.3 : 1,
              }}>
              <div style={{ fontSize: 9, fontFamily: "var(--font-dm-mono)", color: loggable ? (overrideDay ? "#B8805F" : "#8C5A3C") : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                {day.dayName.slice(0, 3)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: loggable ? "var(--text-secondary)" : "var(--text)", marginBottom: 6 }}>
                {fmtShort(day.date).split(" ")[0]}
              </div>
              <div style={{ fontSize: 8, fontFamily: "var(--font-dm-mono)", fontWeight: 700, color: loggable ? (overrideDay ? "#B8805F" : "#8C5A3C") : (filled ? "var(--text-secondary)" : "var(--muted)"), letterSpacing: "0.05em" }}>
                {filled ? "FILLED" : loggable ? (overrideDay ? "LOG IN" : "LOG") : (viewWeek.isFutureWeek ? "FUTURE" : "OFF")}
              </div>
            </button>
          );
        })}
      </div>

      {viewWeek.days.filter(canLog).length === 0 && !viewWeek.isFutureWeek && (
        <p style={{ marginTop: 16, fontSize: 12, color: "var(--muted)", textAlign: "center", fontStyle: "italic" }}>
          All days for this week are filled. Browse other weeks above.
        </p>
      )}
    </div>
  );
}

// ─── Step 2: Describe ────────────────────────────────────────────────────────

function Step2Describe({ day, week, onNext, onBack }: {
  day: DayEntry;
  week: WeekEntry;
  onNext: (raw: string, nothingToday: boolean, nothingReason: string) => void;
  onBack: () => void;
}) {
  const [nothing, setNothing] = useState(false);
  const [raw, setRaw] = useState("");
  const [nothingReason, setNothingReason] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");
  const isOverrideDay = !day.isAttendanceDay;
  const canContinue = nothing ? true : raw.trim().length > 15;

  // Voice support detection
  const hasSpeechSupport = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  function toggleVoice() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    baseTextRef.current = raw;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event: any) => {
      let spoken = "";
      for (let i = 0; i < event.results.length; i++) {
        spoken += event.results[i][0].transcript;
      }
      const base = baseTextRef.current;
      setRaw((base ? base + " " : "") + spoken);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }

  // Stop listening if component unmounts
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-dm-mono)", color: "#8C5A3C", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
          {day.dayName} · {fmtDate(day.date)} · Week {week.weekNumber}
          {isOverrideDay && (
            <span style={{ marginLeft: 8, color: "#B8805F" }}>· Extra attendance day</span>
          )}
        </div>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          What happened at work today?
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Write or speak in your own words — any language. SiLog extracts every activity and transforms it into professional logbook language.
        </p>
      </div>

      {/* Nothing today toggle */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          padding: "10px 14px", borderRadius: 8,
          border: `1px solid ${nothing ? "#8C5A3C" : "var(--border)"}`,
          background: nothing ? "rgba(140,90,60,0.06)" : "transparent", transition: "all 0.15s",
        }}>
          <div onClick={() => setNothing((n) => !n)} style={{
            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
            border: `2px solid ${nothing ? "#8C5A3C" : "var(--border)"}`,
            background: nothing ? "#8C5A3C" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {nothing && <span style={{ fontSize: 9, color: "white", fontWeight: 700 }}>✓</span>}
          </div>
          <div onClick={() => setNothing((n) => !n)}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>
              Nothing significant today
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              Auto-fill from Activity Bank or personal study stream.
            </div>
          </div>
        </label>
      </div>

      {nothing ? (
        <div>
          <label style={labelStyle}>Brief reason (optional)</label>
          <input type="text" value={nothingReason} onChange={(e) => setNothingReason(e.target.value)}
            placeholder="e.g. General observation tasks, no formal assignment"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(140,90,60,0.25)", background: "var(--card)", fontSize: 13, color: "var(--text)", fontFamily: "var(--font-sans)", outline: "none" }}
          />
        </div>
      ) : (
        <div>
          {/* Label + voice toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>What did you do?</label>
            {hasSpeechSupport && (
              <button
                onClick={toggleVoice}
                title={isListening ? "Stop recording" : "Dictate your entry"}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 20,
                  border: `1.5px solid ${isListening ? "#DC2626" : "rgba(140,90,60,0.35)"}`,
                  background: isListening ? "rgba(220,38,38,0.06)" : "transparent",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  color: isListening ? "#DC2626" : "#8C5A3C",
                  transition: "all 0.15s",
                }}>
                {isListening ? (
                  <>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%", background: "#DC2626",
                      display: "inline-block", animation: "pulse 1s ease-in-out infinite",
                    }} />
                    Stop
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 13 }}>🎙</span>
                    Speak
                  </>
                )}
              </button>
            )}
          </div>
          {isListening && (
            <div style={{
              marginBottom: 8, padding: "7px 12px", borderRadius: 8,
              background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
              fontSize: 11, color: "#DC2626", display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626", flexShrink: 0, animation: "pulse 1s ease-in-out infinite", display: "inline-block" }} />
              Listening… speak naturally. Tap Stop when done.
            </div>
          )}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
          <textarea rows={8} value={raw} onChange={(e) => setRaw(e.target.value)}
            placeholder={`Tell SiLog everything that happened today.\n\nExamples:\n• "I fixed 3 computers, replaced RAM on one, helped with printer on the 3rd floor, and configured 2 new staff email accounts"\n• "Today I worked on the ML model we're building — implemented gradient descent and tested it"\n• "I helped configure the router and they explained subnetting, also I relabelled some cables in the server room"`}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: `1px solid ${isListening ? "rgba(220,38,38,0.3)" : "rgba(140,90,60,0.25)"}`, background: "var(--card)", fontSize: 13, lineHeight: 1.75, color: "var(--text)", resize: "vertical", fontFamily: "var(--font-sans)", outline: "none", transition: "border-color 0.2s" }}
          />
          <div style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(140,90,60,0.06)", fontSize: 11, color: "var(--text-muted)" }}>
            <strong style={{ color: "#8C5A3C" }}>Tip:</strong> Include every task, even small ones. Busy days produce banked activities for your quiet days.
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
          ← Back
        </button>
        <button onClick={() => onNext(raw, nothing, nothingReason)} disabled={!canContinue}
          style={{ padding: "9px 28px", borderRadius: 8, border: "none", background: canContinue ? "var(--btn-primary)" : "var(--btn-disabled)", color: "white", fontSize: 13, fontWeight: 600, cursor: canContinue ? "pointer" : "default", transition: "background 0.2s" }}>
          Next: Confirm Activities →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Confirm activities + Activity Bank ──────────────────────────────

function Step3Activities({ day, week, activities, loading, nothingToday, bankedItems, initialBankIds = [], onNext, onBack }: {
  day: DayEntry;
  week: WeekEntry;
  activities: string[];
  loading: boolean;
  nothingToday: boolean;
  bankedItems: BankedActivity[];
  initialBankIds?: string[];
  onNext: (selectedForToday: string[], toBankTexts: string[], usedBankIds: string[]) => void;
  onBack: () => void;
}) {
  // For normal path: checkboxes per extracted activity
  const [forToday, setForToday] = useState<Set<number>>(new Set());
  const [forBank, setForBank] = useState<Set<number>>(new Set());
  // For "nothing today" path: select from bank — pre-populate if coming from activity bank
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set(initialBankIds));

  // Auto-check the first 3 activities for today on load
  useEffect(() => {
    if (activities.length > 0) {
      const initial = new Set(activities.slice(0, Math.min(3, activities.length)).map((_, i) => i));
      setForToday(initial);
      const bankSet = new Set(activities.slice(3).map((_, i) => i + 3));
      setForBank(bankSet);
    }
  }, [activities]);

  const toggleToday = (i: number) => {
    setForToday((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
    setForBank((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

  const toggleBank = (i: number) => {
    setForBank((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
    setForToday((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
  };

  const toggleBankItem = (id: string) => {
    setSelectedBankIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleNext = () => {
    if (nothingToday) {
      const usedIds = Array.from(selectedBankIds);
      const selected = bankedItems.filter((b) => usedIds.includes(b.id)).map((b) => b.activityText);
      onNext(selected, [], usedIds);
    } else {
      const selectedForToday = activities.filter((_, i) => forToday.has(i));
      const toBankTexts = activities.filter((_, i) => forBank.has(i));
      onNext(selectedForToday, toBankTexts, []);
    }
  };

  const canProceed = nothingToday
    ? true // can generate with nothing (curriculum fallback)
    : forToday.size > 0;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "48px 0" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#8C5A3C", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Extracting activities…</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-dm-mono)", color: "#8C5A3C", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
          {day.dayName} · Week {week.weekNumber} — Activity Confirmation
        </div>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          {nothingToday ? "Select from Activity Bank" : "Confirm your activities"}
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          {nothingToday
            ? "No entry for today — pick activities from your bank to use, or leave empty for a curriculum fallback entry."
            : `I found ${activities?.length ?? 0} activities. Select which to use in today's logbook (2–3 recommended). The rest can go to your Activity Bank for quiet days.`}
        </p>
      </div>

      {nothingToday ? (
        // Nothing today — pick from Activity Bank
        bankedItems.length > 0 ? (
          <div>
            <label style={labelStyle}>Available in Activity Bank ({bankedItems.length})</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {bankedItems.map((item) => {
                const selected = selectedBankIds.has(item.id);
                return (
                  <div key={item.id} onClick={() => toggleBankItem(item.id)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                      border: `1px solid ${selected ? "#8C5A3C" : "var(--border)"}`,
                      background: selected ? "rgba(140,90,60,0.06)" : "var(--surface)",
                      transition: "all 0.15s",
                    }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      border: `2px solid ${selected ? "#8C5A3C" : "var(--border)"}`,
                      background: selected ? "#8C5A3C" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {selected && <span style={{ fontSize: 9, color: "white", fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>{item.activityText}</div>
                      <div style={{ fontSize: 10, fontFamily: "var(--font-dm-mono)", color: "var(--muted)", marginTop: 2 }}>
                        Originally {fmtShortDate(item.originalDate)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedBankIds.size === 0 && (
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(140,90,60,0.06)", fontSize: 11, color: "var(--text-muted)" }}>
                No bank items selected — the AI will generate a curriculum-based fallback entry.
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "20px 18px", borderRadius: 10, border: "1px dashed var(--border)", background: "var(--surface)", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Activity Bank is empty. The AI will generate a curriculum-based entry for this day.
          </div>
        )
      ) : (
        // Normal path — extracted activities
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {activities.map((act, i) => {
              const isToday = forToday.has(i);
              const isBanked = forBank.has(i);
              return (
                <div key={i} style={{
                  padding: "12px 14px", borderRadius: 10,
                  border: `1px solid ${isToday ? "#4B2E2B" : isBanked ? "rgba(140,90,60,0.35)" : "var(--border)"}`,
                  background: isToday ? "rgba(75,46,43,0.04)" : isBanked ? "rgba(140,90,60,0.04)" : "var(--surface)",
                  transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 10, lineHeight: 1.5 }}>{act}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => toggleToday(i)} style={{
                      padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
                      border: "none", fontFamily: "var(--font-dm-mono)",
                      background: isToday ? "var(--btn-primary)" : "var(--border)",
                      color: isToday ? "white" : "var(--muted)",
                    }}>
                      {isToday ? "✓ Use today" : "Use today"}
                    </button>
                    <button onClick={() => toggleBank(i)} style={{
                      padding: "4px 12px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
                      border: "none", fontFamily: "var(--font-dm-mono)",
                      background: isBanked ? "#8C5A3C" : "var(--border)",
                      color: isBanked ? "white" : "var(--muted)",
                    }}>
                      {isBanked ? "✓ Save to Bank" : "Save to Bank"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(140,90,60,0.06)", fontSize: 11, color: "var(--text-muted)" }}>
            <strong style={{ color: "#8C5A3C" }}>{forToday.size}</strong> activities for today's logbook ·{" "}
            <strong style={{ color: "#8C5A3C" }}>{forBank.size}</strong> saved to Activity Bank
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
          ← Edit Description
        </button>
        <button onClick={handleNext} disabled={!canProceed}
          style={{ padding: "9px 28px", borderRadius: 8, border: "none", background: canProceed ? "var(--btn-primary)" : "var(--btn-disabled)", color: "white", fontSize: 13, fontWeight: 600, cursor: canProceed ? "pointer" : "default" }}>
          Generate Entry →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: AI Preview ──────────────────────────────────────────────────────

function Step4Preview({ day, week, generated, loading, onSave, onRefine, onBack }: {
  day: DayEntry;
  week: WeekEntry;
  generated: GenerateEntryResponse | null;
  loading: boolean;
  onSave: () => void;
  onRefine: (instruction: string) => void;
  onBack: () => void;
}) {
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState("");

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#8C5A3C", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Generating your logbook entry…</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Connecting to AI and formatting into professional SIWES language.</div>
      </div>
    );
  }

  if (!generated) return null;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "var(--font-dm-mono)", color: "#8C5A3C", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
          {day.dayName} · Week {week.weekNumber} — AI Draft
        </div>
        <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          Review your logbook entry
        </h2>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Check the entry below. You can ask the AI to refine it before saving.</p>
      </div>

      {/* Progress chart badge */}
      <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 12px", borderRadius: 20, background: "#4B2E2B", color: "white", fontSize: 10, fontFamily: "var(--font-dm-mono)", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 16 }}>
        {generated.progressChartEntry}
      </div>

      {/* Key activities */}
      <div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{ fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 10 }}>
          Key Activities
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {generated.keyActivities.map((act, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "var(--text)", marginBottom: i < generated.keyActivities.length - 1 ? 6 : 0 }}>
              <span style={{ color: "#8C5A3C", fontWeight: 700, flexShrink: 0 }}>·</span>
              {act}
            </li>
          ))}
        </ul>
      </div>

      {/* Technical notes */}
      <div style={{ marginBottom: 16, padding: "16px 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)" }}>
        <div style={{ fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 10 }}>
          Technical Notes
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text)" }}>
          <LogbookText text={generated.technicalNotes} />
        </div>
      </div>

      {/* Academic bridge */}
      <div style={{ marginBottom: 24, padding: "10px 14px", borderRadius: 8, background: "rgba(140,90,60,0.08)", fontSize: 11, color: "var(--text-muted)" }}>
        <span style={{ fontWeight: 700, color: "#8C5A3C", fontFamily: "var(--font-dm-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Academic Bridge:{" "}
        </span>
        {generated.deptBridgeUsed}
      </div>

      {/* Refine */}
      {refineOpen ? (
        <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 10, border: "1px solid rgba(140,90,60,0.3)", background: "rgba(140,90,60,0.04)" }}>
          <label style={labelStyle}>What should change?</label>
          <textarea rows={3} value={refineText} onChange={(e) => setRefineText(e.target.value)}
            placeholder="e.g. Make it more technical, add more maths, change tone, focus on the Python work…"
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(140,90,60,0.25)", background: "var(--card)", fontSize: 12, lineHeight: 1.6, color: "var(--text)", resize: "none", fontFamily: "var(--font-sans)", outline: "none", marginBottom: 10 }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => { setRefineOpen(false); setRefineText(""); }}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={() => { if (refineText.trim()) { onRefine(refineText.trim()); setRefineText(""); setRefineOpen(false); } }}
              disabled={!refineText.trim()}
              style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: refineText.trim() ? "#8C5A3C" : "var(--btn-disabled)", color: "white", fontSize: 11, fontWeight: 600, cursor: refineText.trim() ? "pointer" : "default" }}>
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setRefineOpen(true)}
          style={{ display: "block", width: "100%", padding: "10px 16px", borderRadius: 8, border: "1.5px dashed rgba(140,90,60,0.35)", background: "transparent", fontSize: 12, color: "#8C5A3C", cursor: "pointer", marginBottom: 20, textAlign: "center" }}>
          ✎ Ask AI to refine this entry
        </button>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
          ← Activities
        </button>
        <button onClick={onSave}
          style={{ padding: "9px 28px", borderRadius: 8, border: "none", background: "var(--btn-primary)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Looks good → Save
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: Done ─────────────────────────────────────────────────────────────

function Step5Done({ day, week, bankedCount, saving }: { day: DayEntry; week: WeekEntry; bankedCount: number; saving: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      {saving ? (
        <>
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "#4B2E2B", margin: "0 auto 20px", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Saving entry…</div>
        </>
      ) : (
        <>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#4B2E2B", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, color: "white" }}>
            ✓
          </div>
          <div style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            Entry saved!
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
            {day.dayName} · Week {week.weekNumber} · {fmtDate(day.date)}
          </div>
          {bankedCount > 0 && (
            <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: "rgba(140,90,60,0.1)", border: "1px solid rgba(140,90,60,0.2)", fontSize: 11, color: "#8C5A3C", fontFamily: "var(--font-dm-mono)" }}>
              ◈ {bankedCount} {bankedCount === 1 ? "activity" : "activities"} banked for future days
            </div>
          )}
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>Redirecting to dashboard…</div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EntryPage() {
  return (
    <Suspense>
      <EntryPageInner />
    </Suspense>
  );
}

function EntryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { weeks, activityBank, fillDayEntry, addToBank, consumeFromBank } = useDashboardStore();
  const { data: profile } = useOnboardingStore();

  useInitWeeks();

  const [step, setStep] = useState(1);
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekEntry | null>(null);

  // Parse bank items from ?bankItems=id1,id2
  const bankItemsParam = searchParams.get("bankItems");
  const preselectedBankIds = bankItemsParam ? bankItemsParam.split(",").filter(Boolean) : [];

  // Load extracted text from study PDFs once
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("study_materials")
        .select("extracted_text, file_name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (!data || data.length === 0) return;
      // Concatenate all PDFs with headings; cap each at 10k chars to stay within token budget
      const combined = data
        .map((m: { file_name: string; extracted_text: string }) =>
          `[Study material: ${m.file_name}]\n${(m.extracted_text ?? "").slice(0, 10_000)}`
        )
        .join("\n\n---\n\n");
      setStudyMaterialsText(combined);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch daily usage on mount so user sees remaining calls before generating
  useEffect(() => {
    authHeaders().then((headers) =>
      fetch("/api/ai/usage", { headers }).then((r) => r.json()).then((d) => {
        if (typeof d.callsToday === "number") setDailyCallsUsed(d.callsToday);
        if (typeof d.dailyLimit === "number") setDailyLimit(d.dailyLimit);
      }).catch(() => {})
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If coming from dashboard with ?week=X&date=YYYY-MM-DD, pre-select and skip to step 2
  useEffect(() => {
    if (weeks.length === 0) return;
    const weekParam = searchParams.get("week");
    const dateParam = searchParams.get("date");
    if (!weekParam || !dateParam) return;
    const week = weeks.find((w) => w.weekNumber === Number(weekParam));
    const day = week?.days.find((d) => d.date === dateParam);
    if (week && day) {
      setSelectedDay(day);
      setSelectedWeek(week);
      setStep(2);
    }
  }, [weeks, searchParams]);

  // Step 2 state
  const [rawDescription, setRawDescription] = useState("");
  const [nothingToday, setNothingToday] = useState(false);
  const [nothingReason, setNothingReason] = useState("");

  // Step 3 state
  const [extractedActivities, setExtractedActivities] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [selectedForToday, setSelectedForToday] = useState<string[]>([]);
  const [toBankTexts, setToBankTexts] = useState<string[]>([]);
  const [usedBankIds, setUsedBankIds] = useState<string[]>([]);

  // Step 4 state
  const [generated, setGenerated] = useState<GenerateEntryResponse | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Daily usage
  const [dailyCallsUsed, setDailyCallsUsed] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);

  // Step 5 state
  const [saving, setSaving] = useState(false);
  const [savedBankedCount, setSavedBankedCount] = useState(0);

  // Study materials (loaded once on mount)
  const [studyMaterialsText, setStudyMaterialsText] = useState<string>("");

  // ── Step 2 → 3: Extract activities ─────────────────────────
  const handleDescribeNext = async (raw: string, nothing: boolean, nothingR: string) => {
    setRawDescription(raw);
    setNothingToday(nothing);
    setNothingReason(nothingR);
    setStep(3);

    if (!nothing && raw.trim().length > 10) {
      setExtracting(true);
      try {
        const res = await fetch("/api/ai/extract-activities", {
          method: "POST",
          headers: await authHeaders(),
          body: JSON.stringify({ rawDescription: raw, dayName: selectedDay?.dayName ?? "Monday" }),
        });
        const data: ExtractActivitiesResponse = await res.json();
        setExtractedActivities(Array.isArray(data.activities) ? data.activities : []);
      } catch {
        setExtractedActivities([raw.trim()]);
      } finally {
        setExtracting(false);
      }
    }
  };

  // ── Step 3 → 4: Generate full entry ────────────────────────
  const callGenerate = async (forToday: string[], refineInstruction?: string) => {
    setGenerating(true);
    setGenerated(null);
    setGenerateError(null);

    const activitiesText = forToday.length > 0
      ? forToday.join("\n")
      : nothingReason || "No significant task assigned today.";

    const hasActivities = forToday.length > 0;
    const isRefine = !!refineInstruction;

    // On refine: give the AI the previous entry + the user's exact instruction
    // On first generate: give the activities as usual
    let rawDescription: string;
    if (isRefine) {
      const prevNotes = generated?.technicalNotes ?? "";
      rawDescription = prevNotes
        ? `PREVIOUS ENTRY (rewrite this based on the instruction below):\n${prevNotes}\n\nORIGINAL ACTIVITIES: ${activitiesText}\n\nUSER INSTRUCTION: ${refineInstruction}`
        : `${activitiesText}\n\nUSER INSTRUCTION: ${refineInstruction}`;
    } else {
      rawDescription = activitiesText;
    }

    const body = {
      rawDescription,
      dayName: selectedDay?.dayName ?? "Monday",
      department: profile.department ?? "Industrial Mathematics",
      companyDepartment: profile.companyDepartment ?? "IT Department",
      industry: profile.industry ?? "Technology",
      studyFraming: profile.studyLogbookFraming ?? null,
      // On refine, never send nothingToday — the AI must see the instruction
      nothingToday: isRefine ? false : (nothingToday && !hasActivities),
      nothingReason: (isRefine || hasActivities) ? undefined : nothingReason,
      // Pass extracted PDF text so AI can reference actual study content
      studyMaterialsText: studyMaterialsText || undefined,
    };

    try {
      const res = await fetch("/api/ai/generate-entry", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(body),
      });
      if (res.status === 402) {
        // Lifetime free limit exhausted
        useSubscriptionStore.getState().setGenerationsUsed(FREE_GENERATION_LIMIT);
        setGenerateError("You've used all 5 free AI entries. Upgrade your plan to keep generating logbook entries.");
        setGenerating(false);
        return;
      }
      if (res.status === 429) {
        try {
          const errData = await res.json();
          if (typeof errData?.limit === "number") setDailyLimit(errData.limit);
          if (typeof errData?.callsToday === "number") setDailyCallsUsed(errData.callsToday);
          setGenerateError(`You've used all ${errData?.limit ?? dailyLimit ?? ""} AI calls for today. Come back at 12:00 AM Nigeria time.`);
        } catch {
          setGenerateError("You've reached today's AI generation limit. Come back at 12:00 AM Nigeria time.");
        }
        setGenerating(false);
        return;
      }
      if (!res.ok) {
        try {
          const errData = await res.json();
          setGenerateError(errData?.error ?? "Something went wrong generating your entry. Please try again.");
        } catch {
          setGenerateError("Something went wrong generating your entry. Please try again.");
        }
        setGenerating(false);
        return;
      }
      const data: GenerateEntryResponse = await res.json();
      // Guard: only set if response has the expected shape
      if (!data || !Array.isArray(data.keyActivities)) {
        setGenerating(false);
        return;
      }
      setGenerated(data);
      // Sync generation count and daily usage from server
      const meta = data as GenerateEntryResponse & { _generationsUsed?: number; _callsToday?: number; _dailyLimit?: number };
      if (typeof meta._generationsUsed === "number") {
        useSubscriptionStore.getState().setGenerationsUsed(meta._generationsUsed);
      }
      if (typeof meta._callsToday === "number") setDailyCallsUsed(meta._callsToday);
      if (typeof meta._dailyLimit === "number") setDailyLimit(meta._dailyLimit);
    } catch {
      // noop, spinner stays
    } finally {
      setGenerating(false);
    }
  };

  const handleActivitiesNext = (forToday: string[], toBankArr: string[], usedBankIdsArr: string[]) => {
    setSelectedForToday(forToday);
    setToBankTexts(toBankArr);
    setUsedBankIds(usedBankIdsArr);
    setStep(4);
    callGenerate(forToday);
  };

  // ── Step 4 → 5: Save ───────────────────────────────────────
  const handleSave = async () => {
    if (!selectedDay || !selectedWeek || !generated) return;
    setStep(5);
    setSaving(true);

    await new Promise((r) => setTimeout(r, 600));

    // Save banked activities
    if (toBankTexts.length > 0) {
      addToBank(toBankTexts.map((text) => ({ text, date: selectedDay.date })));
    }
    if (usedBankIds.length > 0) {
      consumeFromBank(usedBankIds);
    }
    setSavedBankedCount(toBankTexts.length);

    fillDayEntry(selectedDay.id, {
      technicalNotes: generated.technicalNotes,
      keyActivities: generated.keyActivities,
      progressChartEntry: generated.progressChartEntry,
      deptBridgeUsed: generated.deptBridgeUsed,
      notesPreview: generated.technicalNotes.slice(0, 160) + "…",
    });

    // Explicitly save to Supabase immediately — don't rely solely on debounced subscribe
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { weeks: latestWeeks, activityBank: latestBank } = useDashboardStore.getState();
      const { error } = await saveUserData(user.id, latestWeeks, latestBank);
      if (error) console.error("[handleSave] Failed to persist entry:", error);
    }

    setSaving(false);
    // Open the week card for the filled day before navigating
    if (selectedWeek) {
      useDashboardStore.getState().setExpandedWeek(selectedWeek.weekNumber);
    }
    await new Promise((r) => setTimeout(r, 800));
    const weekHash = selectedWeek ? `#week-${selectedWeek.weekNumber}` : "";
    router.push(`/dashboard${weekHash}`);
  };

  const liveDay = selectedDay
    ? (useDashboardStore.getState().getDayEntry(selectedDay.id) ?? selectedDay)
    : null;

  return (
    <div className="page-pad" style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <button onClick={() => router.push("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", marginBottom: 28, padding: 0 }}>
          ← Dashboard
        </button>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 9, fontFamily: "var(--font-dm-mono)", fontWeight: 700, color: "#8C5A3C", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
            02 / New Entry
          </div>
        </div>

        {step < 5 && <StepBar step={step} />}

        <div className="card-pad" style={{ background: "var(--card)", borderRadius: 16, border: "1px solid var(--border)" }}>
          {step === 1 && weeks.length > 0 && (
            <Step1DayPicker weeks={weeks} onSelect={(day, week) => {
              setSelectedDay(day);
              setSelectedWeek(week);
              if (preselectedBankIds.length > 0) {
                // Coming from Activity Bank — skip describe, go straight to step 3 in nothingToday mode
                setNothingToday(true);
                setStep(3);
              } else {
                setStep(2);
              }
            }} />
          )}

          {/* Daily usage pill — shown on steps 2, 3, 4 so users always know their remaining calls */}
          {(step === 2 || step === 3) && dailyLimit !== null && dailyCallsUsed !== null && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 20,
                background: dailyCallsUsed >= dailyLimit ? "rgba(220,38,38,0.08)" : "rgba(140,90,60,0.08)",
                border: `1px solid ${dailyCallsUsed >= dailyLimit ? "rgba(220,38,38,0.2)" : "rgba(140,90,60,0.2)"}`,
                fontSize: 11, fontFamily: "var(--font-dm-mono)", fontWeight: 600,
                color: dailyCallsUsed >= dailyLimit ? "#DC2626" : "#8C5A3C",
              }}>
                <span style={{ fontSize: 9 }}>◈</span>
                {dailyCallsUsed >= dailyLimit
                  ? `Limit reached · Come back at 12:00 AM Nigeria time`
                  : `${dailyLimit - dailyCallsUsed} of ${dailyLimit} AI logs remaining today`}
              </div>
            </div>
          )}

          {step === 2 && selectedDay && selectedWeek && (
            <Step2Describe day={selectedDay} week={selectedWeek} onNext={handleDescribeNext} onBack={() => setStep(1)} />
          )}

          {step === 3 && selectedDay && selectedWeek && (
            <Step3Activities
              day={selectedDay} week={selectedWeek}
              activities={extractedActivities} loading={extracting}
              nothingToday={nothingToday}
              bankedItems={activityBank.items}
              initialBankIds={preselectedBankIds}
              onNext={handleActivitiesNext}
              onBack={() => preselectedBankIds.length > 0 ? setStep(1) : setStep(2)}
            />
          )}

          {step === 4 && selectedDay && selectedWeek && (
            <>
              {/* Daily usage pill */}
              {dailyLimit !== null && dailyCallsUsed !== null && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 12px", borderRadius: 20,
                    background: dailyCallsUsed >= dailyLimit ? "rgba(220,38,38,0.08)" : "rgba(140,90,60,0.08)",
                    border: `1px solid ${dailyCallsUsed >= dailyLimit ? "rgba(220,38,38,0.2)" : "rgba(140,90,60,0.2)"}`,
                    fontSize: 11, fontFamily: "var(--font-dm-mono)", fontWeight: 600,
                    color: dailyCallsUsed >= dailyLimit ? "#DC2626" : "#8C5A3C",
                  }}>
                    <span style={{ fontSize: 9 }}>◈</span>
                    {dailyCallsUsed >= dailyLimit
                      ? `Daily limit reached · Resets 12:00 AM`
                      : `${dailyLimit - dailyCallsUsed} of ${dailyLimit} AI calls remaining today`}
                  </div>
                </div>
              )}
              {generateError && (
                <div style={{ margin: "0 0 16px", padding: "12px 16px", borderRadius: 10, background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", fontSize: 13, color: "#DC2626" }}>
                  {generateError}
                </div>
              )}
              <Step4Preview
                day={selectedDay} week={selectedWeek}
                generated={generated} loading={generating}
                onSave={handleSave}
                onRefine={(instr) => callGenerate(selectedForToday, instr)}
                onBack={() => setStep(3)}
              />
            </>
          )}

          {step === 5 && liveDay && selectedWeek && (
            <Step5Done day={liveDay} week={selectedWeek} bankedCount={savedBankedCount} saving={saving} />
          )}
        </div>
      </div>
    </div>
  );
}
