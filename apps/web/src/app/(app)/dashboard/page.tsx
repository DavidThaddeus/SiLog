"use client";

import { useEffect, useMemo } from "react";
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

  // Single pass over all days — avoids 3× flatMap/filter in render
  const stats = useMemo(() => {
    let total = 0, aiGenerated = 0, manuallyEdited = 0;
    for (const w of weeks) {
      for (const d of w.days) {
        if (d.status === "filled") { total++; aiGenerated++; }
        else if (d.status === "auto-filled") { total++; aiGenerated++; }
        else if (d.status === "manually-edited") { total++; manuallyEdited++; }
      }
    }
    return { total, aiGenerated, manuallyEdited };
  }, [weeks]);

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
    <div className="px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-8" style={{ maxWidth: 1100, width: "100%", margin: "0 auto" }}>

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
        {/* Left: progress + week cards — on mobile, pushed below the right rail via order */}
        <div className="lg:order-1 order-2">
          <ProgressHeader />

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {weeks.map((week) => (
              <WeekCard key={week.weekNumber} week={week} />
            ))}
          </div>
        </div>

        {/* Right rail — on mobile appears FIRST (order-1), on desktop sticky sidebar */}
        <div className="lg:order-2 order-1 lg:sticky lg:top-[72px]" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                { label: "Total entries",   value: stats.total },
                { label: "AI-generated",    value: stats.aiGenerated },
                { label: "Manually edited", value: stats.manuallyEdited },
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
