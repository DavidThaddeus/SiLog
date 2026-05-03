"use client";

import { useMemo } from "react";
import { useDashboardStore } from "@/store/dashboard";
import { useOnboardingStore } from "@/store/onboarding";

export function ProgressHeader() {
  const { weeks } = useDashboardStore();
  const { data } = useOnboardingStore();

  const { completedWeeks, currentWeek, totalWeeks, pct } = useMemo(() => {
    const completedWeeks = weeks.filter((w) => !w.isFutureWeek && !w.isCurrentWeek).length;
    const currentWeek = weeks.find((w) => w.isCurrentWeek);
    const totalWeeks = weeks.length;
    const pct = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;
    return { completedWeeks, currentWeek, totalWeeks, pct };
  }, [weeks]);

  return (
    <div
      className="px-4 py-4 sm:px-6 sm:py-5"
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            Week {currentWeek?.weekNumber ?? "—"} of {totalWeeks}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {data.companyName ? (
              <>
                {data.companyName}
                {data.department && (
                  <span style={{ opacity: 0.6 }}> · {data.department}</span>
                )}
              </>
            ) : (
              "SIWES Programme"
            )}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-dm-mono)",
              fontSize: 24,
              fontWeight: 700,
              color: "#8C5A3C",
              lineHeight: 1,
            }}
          >
            {completedWeeks}
            <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 400 }}>
              /{totalWeeks}
            </span>
          </div>
          <div
            style={{
              fontSize: 9,
              fontFamily: "var(--font-dm-mono)",
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 2,
            }}
          >
            Weeks done
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: pct >= 100
              ? "white"
              : "linear-gradient(90deg, #C87941, #E8A87C)",
            borderRadius: 3,
            transition: "width 0.8s ease",
          }}
        />
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
        }}
      >
        {[
          { label: "Completed", value: completedWeeks },
          { label: "Remaining", value: totalWeeks - completedWeeks - 1 },
          {
            label: "This week",
            value: currentWeek
              ? `${currentWeek.completedDaysCount}/5 days`
              : "—",
          },
        ].map(({ label, value }) => (
          <div key={label}>
            <div
              style={{
                fontSize: 9,
                fontFamily: "var(--font-dm-mono)",
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 2,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
