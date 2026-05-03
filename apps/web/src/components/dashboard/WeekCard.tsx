"use client";

import React from "react";
import type { WeekEntry } from "@/types/dashboard";
import { useDashboardStore } from "@/store/dashboard";
import { DayRow } from "./DayRow";

interface Props {
  week: WeekEntry;
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}


function WeekCardInner({ week }: Props) {
  const { expandedWeekNumber, toggleWeek } = useDashboardStore();
  const isOpen = expandedWeekNumber === week.weekNumber;
  const completionPct = (week.completedDaysCount / 5) * 100;

  // ── Locked week — shows week number + day preview; banner handles the CTA ──
  if (week.isLocked) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      <div
        id={`week-${week.weekNumber}`}
        style={{
          border: "1px dashed rgba(140,90,60,0.2)",
          borderRadius: 12,
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        {/* Header */}
        <div
          className="gap-2 sm:gap-3 px-3 sm:px-5"
          style={{
            display: "flex", alignItems: "center",
            paddingTop: 12, paddingBottom: 12,
            background: "var(--surface)", userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "var(--font-dm-mono)", fontSize: 10, fontWeight: 700,
              color: "var(--muted)", letterSpacing: "0.06em", flexShrink: 0,
            }}>
              WK {String(week.weekNumber).padStart(2, "0")}
            </div>
            <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
              {fmtDate(week.startDate)} – {fmtDate(week.endDate)}
            </span>
          </div>
          <span style={{
            fontSize: 9, fontFamily: "var(--font-dm-mono)",
            color: "rgba(140,90,60,0.6)", letterSpacing: "0.06em",
          }}>
            🔒 LOCKED
          </span>
        </div>

        {/* Day preview — shows all 5 days so student knows what they'd log */}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {week.days.map((day) => {
            const dayDate = new Date(day.date + "T00:00:00");
            const isFutureDay = dayDate > today;
            return (
              <div
                key={day.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 20px",
                  opacity: isFutureDay ? 0.35 : 0.55,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ width: 64, flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>
                    {fmtDate(day.date)}
                  </div>
                  <div style={{
                    fontSize: 9, fontFamily: "var(--font-dm-mono)",
                    color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em",
                  }}>
                    {day.dayName.slice(0, 3)}
                  </div>
                </div>
                <div style={{ flex: 1, fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
                  {isFutureDay
                    ? "Future — not yet reached"
                    : day.isAttendanceDay
                      ? "Unlock to log this day"
                      : "Non-attendance day"}
                </div>
                {!isFutureDay && day.isAttendanceDay && (
                  <span style={{ fontSize: 9, color: "rgba(140,90,60,0.5)", fontFamily: "var(--font-dm-mono)" }}>
                    🔒
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Normal / future week card ───────────────────────────────────────────────
  return (
    <div
      id={`week-${week.weekNumber}`}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        opacity: week.isFutureWeek ? 0.55 : 1,
        background: "var(--bg)",
      }}
    >
      {/* Card header */}
      <div
        onClick={() => !week.isFutureWeek && toggleWeek(week.weekNumber)}
        className="gap-2 sm:gap-3 px-3 sm:px-5"
        style={{
          display: "flex",
          alignItems: "center",
          paddingTop: 12,
          paddingBottom: 12,
          cursor: week.isFutureWeek ? "default" : "pointer",
          background: week.isCurrentWeek
            ? "rgba(140,90,60,0.06)"
            : "var(--surface)",
          borderBottom: isOpen ? "1px solid var(--border)" : "none",
          userSelect: "none",
        }}
      >
        {/* Week label */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: 10,
              fontWeight: 700,
              color: week.isCurrentWeek ? "#8C5A3C" : "var(--muted)",
              letterSpacing: "0.06em",
              flexShrink: 0,
            }}
          >
            WK {String(week.weekNumber).padStart(2, "0")}
          </div>
          {week.isCurrentWeek && (
            <span
              style={{
                padding: "1px 8px",
                borderRadius: 10,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "var(--font-dm-mono)",
                background: "#8C5A3C",
                color: "white",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              CURRENT
            </span>
          )}
          <span
            style={{
              fontSize: 12,
              color: "var(--muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {fmtDate(week.startDate)} – {fmtDate(week.endDate)}
          </span>
        </div>

        {/* Completion chip — hidden on mobile to save space */}
        {!week.isFutureWeek && (
          <div className="hidden sm:flex" style={{ alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div
              style={{
                width: 64,
                height: 4,
                borderRadius: 2,
                background: "var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${completionPct}%`,
                  background: completionPct === 100
                    ? "#FFFFFF"
                    : "linear-gradient(90deg, #C87941, #E8A87C)",
                  borderRadius: 2,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--font-dm-mono)",
                color: "var(--muted)",
              }}
            >
              {week.completedDaysCount}/5
            </span>
          </div>
        )}

        {/* Chevron */}
        {!week.isFutureWeek && (
          <span
            style={{
              fontSize: 12,
              color: "var(--muted)",
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
              flexShrink: 0,
            }}
          >
            ▾
          </span>
        )}

        {week.isFutureWeek && (
          <span
            style={{
              fontSize: 10,
              fontFamily: "var(--font-dm-mono)",
              color: "var(--muted)",
            }}
          >
            Not started
          </span>
        )}
      </div>

      {/* Day rows */}
      {isOpen && !week.isFutureWeek && (
        <div>
          {week.days.map((day) => (
            <DayRow
              key={day.id}
              day={day}
              week={week}
              isFuture={false}
            />
          ))}

          {/* Week summary */}
          {week.weekSummary && (
            <div
              style={{
                padding: "12px 20px",
                background: "var(--brown-faint-var)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-dm-mono)",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#8C5A3C",
                  marginBottom: 5,
                }}
              >
                Weekly Summary
              </div>
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
                {week.weekSummary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const WeekCard = React.memo(WeekCardInner);
