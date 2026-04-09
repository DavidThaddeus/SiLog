"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DayEntry, WeekEntry } from "@/types/dashboard";
import { useDashboardStore } from "@/store/dashboard";
import { StatusBadge } from "./StatusBadge";

interface Props {
  day: DayEntry;
  week: WeekEntry;
  isFuture: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function InlineEditPanel({
  day,
  week,
  onClose,
}: {
  day: DayEntry;
  week: WeekEntry;
  onClose: () => void;
}) {
  const { updateDayNotes, updateDayActivityName, updateWeekSummary } = useDashboardStore();
  const [notes, setNotes] = useState(day.technicalNotesCurrent ?? day.technicalNotes ?? "");
  const [activityName, setActivityName] = useState(day.progressChartEntry ?? "");
  const [weeklySummary, setWeeklySummary] = useState(week.weekSummaryCurrent ?? week.weekSummary ?? "");
  const [saved, setSaved] = useState(false);

  const notesOriginal = day.technicalNotesCurrent ?? day.technicalNotes ?? "";
  const activityOriginal = day.progressChartEntry ?? "";
  const summaryOriginal = week.weekSummaryCurrent ?? week.weekSummary ?? "";

  const hasChanged =
    notes !== notesOriginal ||
    activityName !== activityOriginal ||
    weeklySummary !== summaryOriginal;

  const handleSave = () => {
    if (notes !== notesOriginal) updateDayNotes(day.id, notes);
    if (activityName !== activityOriginal) updateDayActivityName(day.id, activityName);
    if (weeklySummary !== summaryOriginal) updateWeekSummary(week.weekNumber, weeklySummary);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(140,90,60,0.25)",
    background: "var(--input-bg)",
    fontSize: 13,
    lineHeight: 1.6,
    color: "var(--text)",
    fontFamily: "var(--font-sans)",
    outline: "none",
  };

  const labelStyle = {
    fontSize: 9,
    fontFamily: "var(--font-dm-mono)",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "#8C5A3C",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div
      style={{
        padding: "16px 20px 20px",
        background: "var(--brown-faint-var)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div
          style={{
            fontSize: 9,
            fontFamily: "var(--font-dm-mono)",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8C5A3C",
          }}
        >
          Edit — {day.dayName}
        </div>
        <button
          onClick={onClose}
          style={{ fontSize: 14, color: "var(--muted)", cursor: "pointer", background: "none", border: "none", lineHeight: 1 }}
        >
          ✕
        </button>
      </div>

      {/* Activity name (summary title) */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Day Activity Name</label>
        <input
          type="text"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          placeholder="e.g. Hardware Diagnostics and RAM Module Replacement"
          style={{ ...inputStyle, resize: undefined }}
        />
      </div>

      {/* Technical notes */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Technical Notes</label>
        <textarea
          rows={7}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {/* Academic bridge hint */}
      {day.deptBridgeUsed && (
        <div
          style={{
            marginBottom: 14,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(140,90,60,0.08)",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          <span style={{ fontWeight: 700, color: "#8C5A3C", fontFamily: "var(--font-dm-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Academic bridge:{" "}
          </span>
          {day.deptBridgeUsed}
        </div>
      )}

      {/* Weekly summary */}
      {(week.weekSummaryCurrent || week.weekSummary) && (
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Week {week.weekNumber} Summary</label>
          <textarea
            rows={4}
            value={weeklySummary}
            onChange={(e) => setWeeklySummary(e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{
            padding: "7px 16px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--card)",
            fontSize: 12,
            color: "var(--muted)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanged}
          style={{
            padding: "7px 20px",
            borderRadius: 8,
            border: "none",
            background: hasChanged ? "var(--btn-primary)" : "var(--btn-disabled)",
            color: "white",
            fontSize: 12,
            fontWeight: 600,
            cursor: hasChanged ? "pointer" : "default",
            transition: "background 0.2s",
          }}
        >
          {saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>

      <p style={{ marginTop: 10, fontSize: 11, color: "var(--muted)" }}>
        For full edit + AI assistant →{" "}
        <button
          style={{ color: "#8C5A3C", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 11 }}
        >
          Open Notes Page
        </button>
      </p>
    </div>
  );
}

export function DayRow({ day, week, isFuture }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const muted = isFuture || day.status === "non-working";

  const openNotesPage = () => {
    router.push(`/notes/${week.weekNumber}/${day.date}`);
  };

  return (
    <div
      style={{
        opacity: muted ? 0.4 : 1,
        borderBottom: "1px solid var(--border)",
        transition: "opacity 0.15s",
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "76px 100px 1fr auto",
          alignItems: "center",
          gap: 10,
          padding: "10px 20px",
          background: day.status === "empty" && !isFuture ? "rgba(140,90,60,0.02)" : "transparent",
        }}
      >
        {/* Date */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>
            {formatDate(day.date)}
          </div>
          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--font-dm-mono)",
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {day.dayName.slice(0, 3)}
          </div>
        </div>

        {/* Status */}
        <div>
          <StatusBadge status={day.status} />
        </div>

        {/* Key activities */}
        <div style={{ minWidth: 0 }}>
          {day.keyActivities.length > 0 ? (
            <p
              style={{
                fontSize: 12,
                color: "var(--text)",
                opacity: 0.75,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                margin: 0,
              }}
            >
              {day.keyActivities.slice(0, 2).join(" · ")}
              {day.keyActivities.length > 2 && (
                <span style={{ color: "var(--muted)", fontSize: 11 }}>
                  {" "}+{day.keyActivities.length - 2}
                </span>
              )}
            </p>
          ) : (
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, fontStyle: "italic" }}>
              {day.isAttendanceDay ? "No entry yet" : "Non-attendance day"}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {!isFuture && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            {(day.status === "empty" || day.status === "non-working") && !day.hasNotes ? (
              <button
                onClick={() => router.push(`/entry?week=${week.weekNumber}&date=${day.date}`)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 8,
                  background: day.status === "non-working" ? "transparent" : "var(--btn-primary)",
                  color: day.status === "non-working" ? "#8C5A3C" : "white",
                  border: day.status === "non-working" ? "1px dashed rgba(140,90,60,0.5)" : "none",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {day.status === "non-working" ? "+ Log anyway" : "+ Log"}
              </button>
            ) : (
              <>
                <button
                  onClick={openNotesPage}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    fontSize: 11,
                    color: "var(--text)",
                    cursor: "pointer",
                    fontFamily: "var(--font-dm-mono)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Notes ↗
                </button>

                <button
                  onClick={() => setEditOpen((o) => !o)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: `1px solid ${editOpen ? "var(--btn-primary)" : "var(--border)"}`,
                    background: editOpen ? "var(--btn-primary)" : "var(--surface)",
                    fontSize: 11,
                    color: editOpen ? "white" : "var(--muted)",
                    cursor: "pointer",
                    fontFamily: "var(--font-dm-mono)",
                  }}
                >
                  {editOpen ? "Close" : "Edit"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Inline edit panel */}
      {editOpen && (
        <InlineEditPanel day={day} week={week} onClose={() => setEditOpen(false)} />
      )}
    </div>
  );
}
