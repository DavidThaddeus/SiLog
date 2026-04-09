"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FREE_GENERATION_LIMIT } from "@/store/subscription";

interface Props {
  generationsUsed: number;
  generationsLeft: number;
}

export function TrialBanner({ generationsUsed, generationsLeft }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();
  if (dismissed) return null;

  const isNew = generationsUsed === 0;
  const isLow = generationsLeft <= 1;
  const bg = isLow ? "#7f1d1d" : "#4B2E2B";

  const message = isLow && generationsLeft === 0
    ? `You've used all ${FREE_GENERATION_LIMIT} free AI entries. Upgrade to keep writing.`
    : isLow
    ? `Last free entry left! Upgrade to keep writing.`
    : isNew
    ? `Free plan: ${FREE_GENERATION_LIMIT} AI entries included — ${generationsLeft} remaining.`
    : `Free plan: ${generationsLeft} of ${FREE_GENERATION_LIMIT} AI entries remaining.`;

  return (
    <div style={{
      background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 12, padding: "9px 40px 9px 16px",
      fontSize: 13, flexWrap: "wrap", position: "relative", zIndex: 60,
    }}>
      <span style={{ fontWeight: 600 }}>{message}</span>
      <button
        onClick={() => router.push("/pricing")}
        style={{
          background: "#fff", color: "#8C5A3C", fontWeight: 700,
          fontSize: 12, padding: "5px 14px", borderRadius: 20,
          border: "none", cursor: "pointer", flexShrink: 0,
        }}
      >
        {isNew ? "See plans" : "Upgrade now"}
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", color: "rgba(255,255,255,0.6)",
          fontSize: 16, cursor: "pointer", lineHeight: 1, padding: 4,
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
