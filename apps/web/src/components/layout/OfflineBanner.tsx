"use client";

export function OfflineBanner({ cachedAt }: { cachedAt: string }) {
  const date = new Date(cachedAt);
  const formatted = date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 56, // below topbar
        left: 0,
        right: 0,
        zIndex: 200,
        background: "#92400E",
        color: "#FEF3C7",
        fontSize: 13,
        fontWeight: 500,
        textAlign: "center",
        padding: "7px 16px",
        letterSpacing: 0.1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <span style={{ opacity: 0.85 }}>⚠</span>
      <span>
        You&apos;re offline — showing data from {formatted}. Changes won&apos;t save until your connection is restored.
      </span>
    </div>
  );
}
