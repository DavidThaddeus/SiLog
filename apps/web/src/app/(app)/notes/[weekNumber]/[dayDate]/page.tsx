"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard";
import { useOnboardingStore } from "@/store/onboarding";
import { generateMockWeeks, MOCK_ACTIVITY_BANK } from "@/lib/dashboard-mock";
import { AIChatPanel } from "@/components/notes/AIChatPanel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { DayEntry, WeekEntry } from "@/types/dashboard";
import { LogbookText } from "@/components/logbook/LogbookText";

type Tab = "day" | "week";


function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Day View ─────────────────────────────────────────────────────────────────
function DayView({ day, onNotesChange }: { day: DayEntry; onNotesChange: (t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(day.technicalNotesCurrent ?? day.technicalNotes ?? "");
  const { updateDayNotes } = useDashboardStore();

  // Keep draft in sync if notes change externally (e.g. from AI suggestion)
  useEffect(() => {
    setDraft(day.technicalNotesCurrent ?? day.technicalNotes ?? "");
  }, [day.technicalNotesCurrent, day.technicalNotes]);

  const handleSave = () => {
    updateDayNotes(day.id, draft);
    onNotesChange(draft);
    setEditing(false);
  };

  return (
    <div>
      {/* Progress chart entry */}
      {day.progressChartEntry && (
        <div
          style={{
            marginBottom: 20,
            padding: "10px 16px",
            borderRadius: 8,
            background: "#4B2E2B",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--font-dm-mono)",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Progress Chart Entry
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: "white",
              letterSpacing: "0.04em",
            }}
          >
            {day.progressChartEntry}
          </div>
        </div>
      )}

      {/* Academic bridge */}
      {day.deptBridgeUsed && (
        <div
          style={{
            marginBottom: 20,
            padding: "10px 16px",
            borderRadius: 8,
            background: "rgba(140,90,60,0.08)",
            border: "1px solid rgba(140,90,60,0.2)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--font-dm-mono)",
              color: "#8C5A3C",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Academic Bridge
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            {day.deptBridgeUsed}
          </div>
        </div>
      )}

      {/* Technical notes */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontFamily: "var(--font-dm-mono)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Technical Notes
          {day.status === "manually-edited" && (
            <span
              style={{
                marginLeft: 8,
                padding: "1px 6px",
                borderRadius: 4,
                background: "rgba(234,179,8,0.12)",
                color: "#92400E",
                border: "1px solid rgba(234,179,8,0.3)",
                fontSize: 8,
              }}
            >
              Edited
            </span>
          )}
        </div>
        <button
          onClick={() => (editing ? handleSave() : setEditing(true))}
          style={{
            padding: "5px 14px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: editing ? "var(--btn-primary)" : "var(--surface)",
            color: editing ? "white" : "var(--muted)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          } as React.CSSProperties}
        >
          {editing ? "Save ✓" : "✎ Edit"}
        </button>
      </div>

      {editing ? (
        <div>
          <textarea
            rows={18}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); onNotesChange(e.target.value); }}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 10,
              border: "2px solid #8C5A3C",
              background: "var(--card)",
              fontSize: 13,
              lineHeight: 1.8,
              color: "var(--text)",
              resize: "vertical",
              outline: "none",
              fontFamily: "var(--font-sans)",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => { setDraft(day.technicalNotesCurrent ?? day.technicalNotes ?? ""); setEditing(false); }}
              style={{
                padding: "7px 16px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--card)",
                fontSize: 12, color: "var(--muted)", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: "7px 20px", borderRadius: 8,
                background: "var(--btn-primary)", color: "white",
                border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              Save changes
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.85,
            color: "var(--text)",
            whiteSpace: "pre-wrap",
            padding: "20px",
            background: "var(--surface)",
            borderRadius: 10,
            border: "1px solid var(--border)",
          }}
        >
          <LogbookText text={day.technicalNotesCurrent ?? day.technicalNotes ?? "No notes generated yet."} />
        </div>
      )}
    </div>
  );
}

// ─── Week Compilation View ─────────────────────────────────────────────────────
function WeekCompilationView({ week }: { week: WeekEntry }) {
  const { updateWeekSummary } = useDashboardStore();
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(week.weekSummaryCurrent ?? week.weekSummary ?? "");
  // Show all attendance days — logged ones show their entry, unlogged ones show a placeholder
  const attendanceDays = week.days.filter((d) => d.isAttendanceDay);

  const saveSummary = () => {
    updateWeekSummary(week.weekNumber, summaryDraft);
    setEditingSummary(false);
  };

  return (
    <div>
      {/* Weekly summary */}
      <div
        style={{
          padding: "16px 20px",
          marginBottom: 28,
          background: "#4B2E2B",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Weekly Summary Paragraph
          </div>
          <button
            onClick={() => (editingSummary ? saveSummary() : setEditingSummary(true))}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              background: editingSummary ? "#8C5A3C" : "rgba(255,255,255,0.1)",
              color: "white",
              border: "none",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            {editingSummary ? "Save ✓" : "✎ Edit"}
          </button>
        </div>
        {editingSummary ? (
          <textarea
            rows={4}
            value={summaryDraft}
            onChange={(e) => setSummaryDraft(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)",
              fontSize: 13,
              lineHeight: 1.7,
              color: "white",
              resize: "vertical",
              outline: "none",
              fontFamily: "var(--font-sans)",
            }}
          />
        ) : (
          <p style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(255,255,255,0.8)", margin: 0 }}>
            {week.weekSummaryCurrent ?? week.weekSummary ?? "No weekly summary yet."}
          </p>
        )}
      </div>

      {/* All attendance days */}
      {attendanceDays.map((day) => {
        const notes = day.technicalNotesCurrent ?? day.technicalNotes ?? "";
        const hasEntry = day.hasNotes && notes.trim().length > 0;
        return (
          <div
            key={day.id}
            style={{
              marginBottom: 28,
              paddingBottom: 28,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: hasEntry ? "#8C5A3C" : "var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "white",
                  fontFamily: "var(--font-dm-mono)",
                  flexShrink: 0,
                }}
              >
                {day.dayName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  {day.dayName} — {formatDateShort(day.date)}
                </div>
                <StatusBadge status={day.status} />
              </div>
              {day.progressChartEntry && (
                <div
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-dm-mono)",
                    fontSize: 9,
                    color: "var(--muted)",
                    maxWidth: 300,
                    textAlign: "right",
                    lineHeight: 1.4,
                  }}
                >
                  {day.progressChartEntry}
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.85,
                color: hasEntry ? "var(--text)" : "var(--muted)",
                whiteSpace: "pre-wrap",
                padding: "16px 20px",
                background: "var(--surface)",
                borderRadius: 10,
                border: `1px solid ${hasEntry ? "var(--border)" : "rgba(140,90,60,0.1)"}`,
              }}
            >
              {hasEntry
                ? <LogbookText text={notes} />
                : <span style={{ fontSize: 12, fontStyle: "italic" }}>No entry logged yet for this day.</span>
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function NotesPage({
  params,
}: {
  params: Promise<{ weekNumber: string; dayDate: string }>;
}) {
  const { weekNumber, dayDate } = use(params);
  const router = useRouter();
  const { weeks, setWeeks, getDayEntry, getWeek } = useDashboardStore();
  const { data: profile } = useOnboardingStore();
  const notesLengthMode = (profile.notesLengthPreference as "short" | "long") ?? "long";

  const [tab, setTab] = useState<Tab>("day");
  const [chatNotes, setChatNotes] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Seed mock data if store is empty
  useEffect(() => {
    if (weeks.length === 0) {
      const mockWeeks = generateMockWeeks();
      setWeeks(mockWeeks);
      useDashboardStore.setState({ activityBank: MOCK_ACTIVITY_BANK });
    }
  }, [weeks.length, setWeeks]);

  const day = getDayEntry(dayDate);
  const week = getWeek(Number(weekNumber));

  useEffect(() => {
    if (day) setChatNotes(day.technicalNotesCurrent ?? day.technicalNotes ?? "");
  }, [day?.id]);

  if (!day || !week) {
    return (
      <div style={{ padding: 48, color: "var(--muted)", fontSize: 13 }}>
        Entry not found.{" "}
        <button onClick={() => router.back()} style={{ color: "#8C5A3C", cursor: "pointer", background: "none", border: "none" }}>
          ← Go back
        </button>
      </div>
    );
  }

  const handleApplySuggestion = (text: string) => {
    const { updateDayNotes } = useDashboardStore.getState();
    updateDayNotes(day.id, text);
    setChatNotes(text);
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 56px)", overflow: "hidden" }}>
      {/* Left: notes content */}
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "20px 16px" : "32px 36px", minWidth: 0 }}>
        {/* Back + breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              fontSize: 12,
              color: "var(--muted)",
              cursor: "pointer",
              background: "none",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ← Dashboard
          </button>
          <span style={{ color: "var(--border)", fontSize: 14 }}>›</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Week {week.weekNumber}</span>
          <span style={{ color: "var(--border)", fontSize: 14 }}>›</span>
          <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{day.dayName}</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: 26,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 4,
              lineHeight: 1.2,
            }}
          >
            {day.dayName}
          </h1>
          <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 10 }}>
            <span>{formatDateLong(day.date)}</span>
            <span>·</span>
            <span>Week {week.weekNumber} of {weeks.length}</span>
            <span>·</span>
            <StatusBadge status={day.status} />
          </div>
        </div>

        {/* Tab bar + mobile AI toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 4,
            }}
          >
            {(["day", "week"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 7,
                  border: "none",
                  background: tab === t ? "var(--btn-primary)" : "transparent",
                  color: tab === t ? "white" : "var(--muted)",
                  fontSize: 12,
                  fontWeight: tab === t ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {t === "day" ? `${day.dayName} Notes` : "Week Compilation"}
              </button>
            ))}
          </div>

          {/* AI refine button — on mobile shows/hides the chat panel as an overlay */}
          {isMobile && (
            <button
              onClick={() => setShowChat((v) => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 9,
                border: `1.5px solid ${showChat ? "#8C5A3C" : "var(--border)"}`,
                background: showChat ? "rgba(140,90,60,0.08)" : "var(--surface)",
                color: showChat ? "#8C5A3C" : "var(--muted)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ✦ AI Refine
            </button>
          )}
        </div>

        {/* Content */}
        {tab === "day" ? (
          <DayView
            day={day}
            onNotesChange={(t) => setChatNotes(t)}
          />
        ) : (
          <WeekCompilationView week={week} />
        )}
      </div>

      {/* Right: AI chat panel — side panel on desktop, slide-up overlay on mobile */}
      {isMobile ? (
        showChat && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setShowChat(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 40,
                background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)",
              }}
            />
            {/* Bottom sheet */}
            <div
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
                height: "70vh",
                background: "var(--bg)",
                borderTop: "1px solid var(--border)",
                borderRadius: "16px 16px 0 0",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Handle bar */}
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)" }} />
              </div>
              <div style={{ flex: 1, padding: "0 16px 16px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <AIChatPanel
                  currentNotes={chatNotes}
                  dayName={day.dayName}
                  onApplySuggestion={handleApplySuggestion}
                  notesLengthMode={notesLengthMode}
                />
              </div>
            </div>
          </>
        )
      ) : (
        <div
          style={{
            width: 340,
            padding: "32px 20px 32px 0",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AIChatPanel
            currentNotes={chatNotes}
            dayName={day.dayName}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>
      )}
    </div>
  );
}
