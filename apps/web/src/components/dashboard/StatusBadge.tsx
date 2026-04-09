import type { DayStatus } from "@/types/dashboard";

const CONFIG: Record<DayStatus, { label: string; bg: string; color: string; border?: string; dashed?: boolean }> = {
  filled: {
    label: "Filled",
    bg: "#4B2E2B",
    color: "white",
  },
  "auto-filled": {
    label: "Auto-filled",
    bg: "rgba(140,90,60,0.1)",
    color: "#8C5A3C",
    border: "rgba(140,90,60,0.3)",
  },
  "manually-edited": {
    label: "Edited",
    bg: "rgba(234,179,8,0.1)",
    color: "#92400E",
    border: "rgba(234,179,8,0.35)",
  },
  empty: {
    label: "Empty",
    bg: "transparent",
    color: "#9CA3AF",
    border: "var(--border)",
    dashed: true,
  },
  "non-working": {
    label: "Off",
    bg: "transparent",
    color: "var(--text-muted)",
    border: "var(--border)",
    dashed: true,
  },
};

export function StatusBadge({ status }: { status: DayStatus }) {
  const c = CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        fontFamily: "var(--font-dm-mono)",
        background: c.bg,
        color: c.color,
        border: c.border
          ? `1px ${c.dashed ? "dashed" : "solid"} ${c.border}`
          : "none",
        whiteSpace: "nowrap",
      }}
    >
      {c.label}
    </span>
  );
}
