"use client";

import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard";

export function ActivityBankWidget() {
  const router = useRouter();
  const { activityBank } = useDashboardStore();
  const bankedCount = activityBank.items.length;
  const emptyCoverageCount = Math.ceil(bankedCount / 2.5);

  return (
    <div
      style={{
        border: "1px solid rgba(140,90,60,0.2)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 18px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>◈</span>
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
          Activity Bank
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px" }}>
        {bankedCount === 0 ? (
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
            No banked activities yet. When you log a very busy day and have leftover tasks,
            they'll be saved here automatically.
          </p>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span
                style={{
                  fontFamily: "var(--font-playfair)",
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#8C5A3C",
                  lineHeight: 1,
                }}
              >
                {bankedCount}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {bankedCount === 1 ? "activity" : "activities"} saved
              </span>
            </div>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "0 0 14px" }}>
              Covers approximately{" "}
              <strong style={{ color: "var(--text)" }}>{emptyCoverageCount}</strong>{" "}
              empty {emptyCoverageCount === 1 ? "day" : "days"}
            </p>

            {/* Mini bar */}
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: "var(--border)",
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min((bankedCount / 10) * 100, 100)}%`,
                  background: "linear-gradient(90deg, #4B2E2B, #8C5A3C)",
                  borderRadius: 2,
                }}
              />
            </div>
          </>
        )}

        <button
          onClick={() => router.push("/activity-bank")}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--muted)",
            cursor: "pointer",
            fontFamily: "var(--font-dm-mono)",
            transition: "all 0.15s",
          }}
        >
          Manage Bank →
        </button>
      </div>
    </div>
  );
}
