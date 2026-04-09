"use client";


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


export function WeekCard({ week }: Props) {
  const { expandedWeekNumber, toggleWeek } = useDashboardStore();
  const isOpen = expandedWeekNumber === week.weekNumber;
  const completionPct =
    week.totalAttendanceDays > 0
      ? (week.completedDaysCount / week.totalAttendanceDays) * 100
      : 0;

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
                  background: completionPct === 100 ? "#4B2E2B" : "#8C5A3C",
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
              {week.completedDaysCount}/{week.totalAttendanceDays}
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
