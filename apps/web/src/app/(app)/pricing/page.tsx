"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import {
  BLOCK_NGN, BLOCK_NGN_KOBO,
  BLOCK_FUNAAB_NGN, BLOCK_FUNAAB_NGN_KOBO,
  isFunaabEmail,
  blockWeekRange,
  totalBlockCount,
} from "@/lib/pricing";
import { FREE_GENERATION_LIMIT, useSubscriptionStore } from "@/store/subscription";
import { useOnboardingStore } from "@/store/onboarding";
import { useDashboardStore } from "@/store/dashboard";
import { supabase } from "@/lib/supabase";
import { durationMonthsToWeeks, recalcWeekFlags } from "@/lib/dashboard-mock";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PaystackPop: any;
  }
}

const DURATION_LABELS: Record<number, string> = {
  3: "3 Months",
  6: "6 Months",
  12: "1 Year",
};

export default function PricingPage() {
  const [selected, setSelected] = useState<number[]>([]); // month numbers selected
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
      setUserId(user?.id ?? null);
    });
  }, []);

  const {
    status,
    generationsUsed,
    subscribedAt,
    isFullPayment: isFullyPaid,
    purchasedBlocks,
    markPaid,
    addPurchasedBlock,
  } = useSubscriptionStore();

  const siwesDuration = (useOnboardingStore((s) => s.data.siwesDuration) ?? 6) as 3 | 6 | 12;
  const fullName = useOnboardingStore((s) => s.data.fullName);

  const isFunaab = userEmail ? isFunaabEmail(userEmail) : false;
  const pricePerMonth = isFunaab ? BLOCK_FUNAAB_NGN : BLOCK_NGN;
  const pricePerMonthKobo = isFunaab ? BLOCK_FUNAAB_NGN_KOBO : BLOCK_NGN_KOBO;

  const totalWeeks = durationMonthsToWeeks(siwesDuration);
  const numMonths = totalBlockCount(totalWeeks);
  const generationsLeft = Math.max(0, FREE_GENERATION_LIMIT - generationsUsed);
  const durationLabel = DURATION_LABELS[siwesDuration];

  // Old monthly subscribers (paid, no block rows) → all unlocked
  const isOldMonthlyPaid = status === "paid" && purchasedBlocks.length === 0 && !isFullyPaid;
  const isAllUnlocked = isFullyPaid || isOldMonthlyPaid;

  const totalSelected = selected.length;
  const totalPrice = totalSelected * pricePerMonth;
  const totalKobo = totalSelected * pricePerMonthKobo;

  function toggleMonth(monthNum: number) {
    setSelected((prev) =>
      prev.includes(monthNum) ? prev.filter((m) => m !== monthNum) : [...prev, monthNum]
    );
  }

  async function handlePay() {
    if (selected.length === 0) return;
    if (typeof window === "undefined" || !window.PaystackPop) {
      setError("Payment system is loading — wait a moment and try again.");
      return;
    }
    setPaying(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Session expired. Please refresh and log in again.");
      setPaying(false);
      return;
    }

    const monthLabel = selected.length === 1
      ? `Month ${selected[0]}`
      : `Months ${selected.sort((a, b) => a - b).join(", ")}`;

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: userEmail ?? session.user.email ?? "",
      amount: totalKobo,
      currency: "NGN",
      metadata: {
        custom_fields: [
          { display_name: "Name", variable_name: "name", value: fullName ?? userEmail },
          { display_name: "Months", variable_name: "months", value: monthLabel },
          { display_name: "User ID", variable_name: "user_id", value: userId ?? session.user.id },
        ],
      },
      callback: (response: { reference: string }) => {
        fetch("/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            reference: response.reference,
            planId: selected.length === 1 ? `block_${selected[0]}` : "blocks",
            blockNumbers: selected,
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error("Verification failed");
            return res.json() as Promise<{ ok: boolean; blockNumbers: number[]; purchasedAt: string }>;
          })
          .then(({ blockNumbers }) => {
            // 1. Update subscription store with new blocks
            blockNumbers.forEach((bn) => addPurchasedBlock(bn));
            markPaid(null, false, new Date().toISOString());
            setSelected([]);

            // 2. Recompute dashboard week lock states immediately so the
            //    dashboard reflects the unlock without requiring a page refresh
            const newPurchasedBlocks = useSubscriptionStore.getState().purchasedBlocks;
            const currentWeeks = useDashboardStore.getState().weeks;
            useDashboardStore.getState().setWeeks(
              recalcWeekFlags(currentWeeks, newPurchasedBlocks, true)
            );
          })
          .catch(() => {
            setError(
              `Payment received but verification failed. Reference: ${response.reference} — contact support.`
            );
          })
          .finally(() => setPaying(false));
      },
      onClose: () => setPaying(false),
    });

    handler.openIframe();
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8" style={{ maxWidth: 580, margin: "0 auto", paddingBottom: totalSelected > 0 ? 100 : undefined }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 10, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 8,
        }}>
          Plans &amp; Pricing
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text)" }}>
          Unlock your logbook
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Your SIWES duration: <strong style={{ color: "var(--text)" }}>{durationLabel}</strong>.
          Select one or more months to unlock and pay once.
        </p>
      </div>

      {/* Free generation status */}
      {status === "free" && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 16px", borderRadius: 20, marginBottom: 24,
          background: "rgba(140,90,60,0.08)", border: "1px solid rgba(140,90,60,0.25)",
        }}>
          <span style={{ fontSize: 13 }}>◉</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#8C5A3C" }}>
            Free preview · {generationsLeft} of {FREE_GENERATION_LIMIT} AI entries remaining in Week 1
          </span>
        </div>
      )}

      {/* FUNAAB discount badge */}
      {isFunaab && (
        <div style={{
          marginBottom: 20, padding: "9px 13px", borderRadius: 8,
          background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)",
          fontSize: 12, color: "#15803d", display: "flex", alignItems: "center", gap: 7,
        }}>
          <span style={{ fontSize: 14 }}>🎓</span>
          <span>
            <strong>FUNAAB student discount applied</strong> — ₦{(BLOCK_NGN - BLOCK_FUNAAB_NGN).toLocaleString()} off every month.
          </span>
        </div>
      )}

      {/* Selection hint */}
      {!isAllUnlocked && numMonths > 0 && (
        <div style={{ marginBottom: 16, fontSize: 12, color: "var(--text-muted)" }}>
          Tap a month to select it. Select multiple to pay for them all at once.
        </div>
      )}

      {/* Month list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Week 1 — Free */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", borderRadius: 12,
          border: "1px solid rgba(34,197,94,0.35)", background: "rgba(34,197,94,0.05)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontFamily: "var(--font-dm-mono)", fontWeight: 700, color: "var(--muted)" }}>
                WEEK 1
              </span>
              <span style={{
                padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                fontFamily: "var(--font-dm-mono)", background: "rgba(34,197,94,0.15)",
                color: "#15803d", letterSpacing: "0.04em",
              }}>
                FREE
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
              Week 1 — free preview, up to 5 AI entries
            </div>
          </div>
          <span style={{ fontSize: 16, color: "#15803d" }}>✓</span>
        </div>

        {/* Paid months */}
        {Array.from({ length: numMonths }, (_, i) => {
          const monthNum = i + 1;
          const { start, end } = blockWeekRange(monthNum, totalWeeks);
          const isPurchased = isAllUnlocked || purchasedBlocks.includes(monthNum);
          const isSelected = selected.includes(monthNum);

          return (
            <div
              key={monthNum}
              onClick={() => !isPurchased && toggleMonth(monthNum)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", borderRadius: 12, gap: 12,
                border: isPurchased
                  ? "1px solid rgba(34,197,94,0.35)"
                  : isSelected
                  ? "2px solid #8C5A3C"
                  : "1px solid rgba(140,90,60,0.2)",
                background: isPurchased
                  ? "rgba(34,197,94,0.04)"
                  : isSelected
                  ? "rgba(140,90,60,0.08)"
                  : "var(--card)",
                cursor: isPurchased ? "default" : "pointer",
                transition: "all 0.15s",
              }}
            >
              {/* Checkbox */}
              {!isPurchased && (
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: isSelected ? "none" : "1.5px solid rgba(140,90,60,0.4)",
                  background: isSelected ? "#8C5A3C" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                </div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                    Month {monthNum}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>
                    Weeks {start}–{end}
                  </span>
                  {isPurchased && (
                    <span style={{
                      padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                      fontFamily: "var(--font-dm-mono)", background: "rgba(34,197,94,0.12)",
                      color: "#15803d", letterSpacing: "0.04em",
                    }}>
                      UNLOCKED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                  1 month of unlimited AI logbook generation
                </div>
              </div>

              {isPurchased ? (
                <span style={{ fontSize: 16, color: "#15803d", flexShrink: 0 }}>✓</span>
              ) : (
                <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#8C5A3C" : "var(--muted)", flexShrink: 0 }}>
                  ₦{pricePerMonth.toLocaleString()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div style={{
          marginTop: 14, padding: "10px 14px", borderRadius: 8,
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          fontSize: 12, color: "#b91c1c",
        }}>
          {error}
        </div>
      )}

      {/* Billing info for old monthly subscribers */}
      {isOldMonthlyPaid && subscribedAt && (
        <div style={{
          marginTop: 20, padding: "14px 18px", borderRadius: 12,
          background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#15803d", marginBottom: 4 }}>
            Active subscription
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Subscribed on{" "}
            <strong style={{ color: "var(--text)" }}>
              {new Date(subscribedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </strong>
            . All months unlocked.
          </div>
        </div>
      )}

      <p style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Secured by Paystack · No auto-renewals · Pay only for what you need
      </p>

      {/* Sticky pay bar — appears when months are selected */}
      {totalSelected > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "14px 20px",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, zIndex: 50,
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              {totalSelected} month{totalSelected > 1 ? "s" : ""} selected
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Total: ₦{totalPrice.toLocaleString()}
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={paying}
            style={{
              padding: "12px 24px", borderRadius: 12,
              background: paying ? "rgba(140,90,60,0.4)" : "#8C5A3C",
              color: "#fff", fontWeight: 700, fontSize: 14,
              border: "none", cursor: paying ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {paying ? "Processing…" : `Pay ₦${totalPrice.toLocaleString()} →`}
          </button>
        </div>
      )}

      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
    </div>
  );
}
