"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard";
import { ProgressHeader } from "@/components/dashboard/ProgressHeader";
import { WeekCard } from "@/components/dashboard/WeekCard";
import { ActivityBankWidget } from "@/components/dashboard/ActivityBankWidget";
import { useInitWeeks } from "@/hooks/useInitWeeks";

export default function DashboardPage() {
  const router = useRouter();
  const { weeks, expandedWeekNumber } = useDashboardStore();

  useInitWeeks();

  // Restore scroll position to the last-viewed week when returning from notes/entry
  useEffect(() => {
    if (expandedWeekNumber == null || weeks.length === 0) return;
    const el = document.getElementById(`week-${expandedWeekNumber}`);
    if (el) {
      // Small delay so the DOM has rendered the expanded card
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [weeks.length]); // only runs once after weeks are loaded/returned to page

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8" style={{ maxWidth: 1100 }}>

      {/* Defense prep CTA */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24,
          padding: "14px 20px",
          borderRadius: 12,
          background: "#4B2E2B",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "white",
              marginBottom: 2,
            }}
          >
            Defense Prep Mode
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Practice answering panel questions on any week of your logbook.
          </div>
        </div>
        <button
          onClick={() => router.push("/defense")}
          style={{
            padding: "10px 20px",
            minHeight: 44,
            borderRadius: 8,
            background: "#8C5A3C",
            color: "white",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Start Session →
        </button>
      </div>

      {/* Two-column layout: week list + right rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Left: progress + week cards */}
        <div>
          <ProgressHeader />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {weeks.map((week) => (
              <WeekCard key={week.weekNumber} week={week} />
            ))}
          </div>
        </div>

        {/* Right rail — sticky on desktop, normal flow on mobile */}
        <div className="lg:sticky lg:top-[72px]" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ActivityBankWidget />

          {/* Quick stats */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--bg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 18px 12px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text)",
                }}
              >
                Quick Stats
              </span>
            </div>
            <div style={{ padding: "14px 18px" }}>
              {[
                {
                  label: "Total entries",
                  value: weeks.flatMap((w) => w.days).filter((d) => d.status !== "empty" && d.status !== "non-working").length,
                },
                {
                  label: "AI-generated",
                  value: weeks
                    .flatMap((w) => w.days)
                    .filter((d) => d.status === "auto-filled").length,
                },
                {
                  label: "Manually edited",
                  value: weeks
                    .flatMap((w) => w.days)
                    .filter((d) => d.status === "manually-edited").length,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-dm-mono)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
