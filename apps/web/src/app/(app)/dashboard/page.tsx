"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard";
import { ProgressHeader } from "@/components/dashboard/ProgressHeader";
import { WeekCard } from "@/components/dashboard/WeekCard";
import { ActivityBankWidget } from "@/components/dashboard/ActivityBankWidget";
import { useInitWeeks } from "@/hooks/useInitWeeks";
import type { WeekEntry } from "@/types/dashboard";

function MonthBanner({ blockNumber, isLocked }: { blockNumber: number; isLocked: boolean }) {
  const router = useRouter();

  if (isLocked) {
    return (
      <div
        onClick={() => router.push("/pricing")}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 16px", borderRadius: 10, cursor: "pointer",
          background: "rgba(140,90,60,0.06)",
          border: "1px dashed rgba(140,90,60,0.35)",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(140,90,60,0.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(140,90,60,0.06)")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🔐</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#8C5A3C", fontFamily: "var(--font-dm-mono)" }}>
            Month {blockNumber}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· locked</span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#8C5A3C" }}>
          Unlock this month →
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 16px", borderRadius: 10,
      background: "rgba(34,197,94,0.05)",
      border: "1px solid rgba(34,197,94,0.3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>✅</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d", fontFamily: "var(--font-dm-mono)" }}>
          Month {blockNumber}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· unlocked</span>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#15803d" }}>
        ✓ Paid
      </span>
    </div>
  );
}

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
            {weeks.map((week: WeekEntry, idx: number) => {
              // Show ONE banner at the start of every paid/locked month group (skip week 1 which is free)
              const isFirstOfBlock =
                week.blockNumber > 0 &&
                (idx === 0 || weeks[idx - 1].blockNumber !== week.blockNumber);

              return (
                <div key={week.weekNumber}>
                  {isFirstOfBlock && (
                    <div style={{ marginBottom: 4 }}>
                      <MonthBanner blockNumber={week.blockNumber} isLocked={week.isLocked} />
                    </div>
                  )}
                  <WeekCard week={week} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right rail — on mobile appears FIRST (order-1), on desktop sticky sidebar */}
        <div className="lg:order-2 order-1 lg:sticky lg:top-[72px]" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ActivityBankWidget />
        </div>
      </div>
    </div>
  );
}
