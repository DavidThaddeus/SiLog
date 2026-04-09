"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import {
  MONTHLY_NGN, MONTHLY_USD, MONTHLY_NGN_KOBO,
  FUNAAB_NGN, FUNAAB_NGN_KOBO,
  isFunaabEmail,
} from "@/lib/pricing";
import { FREE_GENERATION_LIMIT, useSubscriptionStore } from "@/store/subscription";
import { useOnboardingStore } from "@/store/onboarding";
import { supabase } from "@/lib/supabase";

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
  const [currency, setCurrency] = useState<"ngn" | "usd">("ngn");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserEmail(user?.email ?? null));
  }, []);

  const { status, generationsUsed, subscribedAt, expiresAt: nextBillingDate, markPaid } = useSubscriptionStore();
  const siwesDuration = (useOnboardingStore((s) => s.data.siwesDuration) ?? 6) as 3 | 6 | 12;
  const fullName = useOnboardingStore((s) => s.data.fullName);

  const isFunaab = userEmail ? isFunaabEmail(userEmail) : false;
  const activeNgn = isFunaab ? FUNAAB_NGN : MONTHLY_NGN;
  const activeKobo = isFunaab ? FUNAAB_NGN_KOBO : MONTHLY_NGN_KOBO;

  const isPaid = status === "paid";
  const generationsLeft = Math.max(0, FREE_GENERATION_LIMIT - generationsUsed);
  const durationLabel = DURATION_LABELS[siwesDuration];

  async function handlePay() {
    if (typeof window === "undefined" || !window.PaystackPop) {
      setError("Payment system is loading — wait a moment and try again.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please refresh and log in again.");
      setLoading(false);
      return;
    }

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: user.email ?? "",
      amount: activeKobo,
      currency: "NGN",
      metadata: {
        custom_fields: [
          { display_name: "Name", variable_name: "name", value: fullName ?? user.email },
          { display_name: "Plan", variable_name: "plan", value: "monthly" },
          { display_name: "User ID", variable_name: "user_id", value: user.id },
        ],
      },
      callback: (response: { reference: string }) => {
        supabase.auth.getSession()
          .then(({ data: { session } }) =>
            fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({ reference: response.reference, planId: "monthly" }),
            })
          )
          .then((res) => {
            if (!res.ok) throw new Error("Verification failed");
            return res.json() as Promise<{ expiresAt: string | null; isFullPayment: boolean; subscribedAt: string | null }>;
          })
          .then(({ expiresAt, isFullPayment, subscribedAt }) => {
            markPaid(expiresAt ?? null, isFullPayment ?? false, subscribedAt ?? undefined);
          })
          .catch(() => {
            setError(
              "Payment received but verification failed. Reference: " +
              response.reference +
              " — contact support."
            );
          })
          .finally(() => setLoading(false));
      },
      onClose: () => setLoading(false),
    });

    handler.openIframe();
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8" style={{ maxWidth: 560, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontSize: 10, fontFamily: "var(--font-dm-mono)", fontWeight: 700,
          letterSpacing: "0.14em", textTransform: "uppercase", color: "#8C5A3C", marginBottom: 8,
        }}>
          Plans &amp; Pricing
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text)" }}>
          Unlock your full logbook
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Your SIWES duration: <strong style={{ color: "var(--text)" }}>{durationLabel}</strong>.
          {isPaid
            ? " Your subscription is active."
            : " Subscribe monthly to keep generating AI logbook entries."}
        </p>
      </div>

      {/* Status pill */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "8px 16px", borderRadius: 20, marginBottom: 28,
        background: isPaid ? "rgba(34,197,94,0.08)" : "rgba(140,90,60,0.08)",
        border: `1px solid ${isPaid ? "rgba(34,197,94,0.25)" : "rgba(140,90,60,0.25)"}`,
      }}>
        <span style={{ fontSize: 13 }}>{isPaid ? "✓" : "◉"}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: isPaid ? "#15803d" : "#8C5A3C" }}>
          {isPaid
            ? "Active subscription"
            : `Free plan · ${generationsLeft} of ${FREE_GENERATION_LIMIT} AI entries remaining`}
        </span>
      </div>

      {/* Billing dates — shown when subscribed */}
      {isPaid && subscribedAt && (
        <div style={{
          marginBottom: 24, padding: "14px 18px", borderRadius: 12,
          background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#15803d", marginBottom: 2 }}>
            Subscription dates
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--text-muted)" }}>Subscribed on</span>
            <strong style={{ color: "var(--text)" }}>
              {new Date(subscribedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
            </strong>
          </div>
          {nextBillingDate && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>Next billing date</span>
              <strong style={{ color: "#8C5A3C" }}>
                {new Date(nextBillingDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
              </strong>
            </div>
          )}
          <p style={{ margin: 0, marginTop: 4, fontSize: 11, color: "var(--text-muted)" }}>
            No auto-renewal — you must manually resubscribe when your month ends.
          </p>
        </div>
      )}

      {/* Currency toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        {(["ngn", "usd"] as const).map((c) => (
          <button key={c} onClick={() => setCurrency(c)} style={{
            padding: "5px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: currency === c ? "none" : "1.5px solid var(--border)",
            background: currency === c ? "#8C5A3C" : "transparent",
            color: currency === c ? "#fff" : "var(--text-muted)", cursor: "pointer",
          }}>
            {c === "ngn" ? "₦ NGN" : "$ USD"}
          </button>
        ))}
        {currency === "usd" && (
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>display only — charged in NGN</span>
        )}
      </div>

      {/* Monthly plan card */}
      <div style={{
        padding: "22px 22px", borderRadius: 16,
        border: "2px solid #8C5A3C",
        background: "rgba(140,90,60,0.05)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Monthly Plan</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
              Unlimited AI logbook generation, edit &amp; regenerate any entry, Activity Bank access.
              Renew each month manually — no auto-billing.
            </div>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                "Unlimited AI entry generation",
                "Edit and regenerate any entry",
                "Activity Bank + Defense Prep tools",
                "No auto-renewal — you pay when ready",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                  <span style={{ color: "#8C5A3C", flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {/* Strikethrough original price for FUNAAB students */}
            {isFunaab && currency === "ngn" && (
              <div style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "line-through" }}>
                ₦{MONTHLY_NGN.toLocaleString()}
              </div>
            )}
            <div style={{ fontWeight: 900, fontSize: 28, color: "#8C5A3C" }}>
              {currency === "ngn" ? `₦${activeNgn.toLocaleString()}` : `$${MONTHLY_USD.toFixed(2)}`}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>per month</div>
            {isFunaab && (
              <div style={{ fontSize: 10, color: "#15803d", fontWeight: 600, marginTop: 2 }}>
                🎓 FUNAAB discount
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={loading || isPaid}
          style={{
            marginTop: 18, width: "100%", padding: "13px 0", borderRadius: 10,
            background: isPaid
              ? "rgba(34,197,94,0.1)"
              : loading
              ? "rgba(140,90,60,0.4)"
              : "#8C5A3C",
            color: isPaid ? "#15803d" : "#fff",
            fontWeight: 700, fontSize: 14,
            border: isPaid ? "1px solid rgba(34,197,94,0.3)" : "none",
            cursor: isPaid || loading ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {isPaid
            ? "✓ Subscription active"
            : loading
            ? "Processing…"
            : `Subscribe for ${currency === "ngn" ? `₦${activeNgn.toLocaleString()}` : `$${MONTHLY_USD.toFixed(2)}`}/month →`}
        </button>
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

      <p style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Secured by Paystack · No auto-renewals
      </p>

      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
    </div>
  );
}
