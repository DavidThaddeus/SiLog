"use client";

import { useState } from "react";
import Script from "next/script";
import {
  MONTHLY_NGN, MONTHLY_NGN_KOBO, MONTHLY_USD,
  FUNAAB_NGN, FUNAAB_NGN_KOBO,
  isFunaabEmail,
} from "@/lib/pricing";
import { supabase } from "@/lib/supabase";

interface Props {
  userEmail: string;
  userName?: string;
  siwesDuration: 3 | 6 | 12;
  onSuccess: () => void;
  onReadOnly: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PaystackPop: any;
  }
}

export function PaywallModal({ userEmail, userName, onSuccess, onReadOnly }: Props) {
  const [currency, setCurrency] = useState<"ngn" | "usd">("ngn");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFunaab = isFunaabEmail(userEmail);
  const activeNgn = isFunaab ? FUNAAB_NGN : MONTHLY_NGN;
  const activeKobo = isFunaab ? FUNAAB_NGN_KOBO : MONTHLY_NGN_KOBO;

  const priceDisplay = currency === "ngn"
    ? `₦${activeNgn.toLocaleString()}`
    : `$${MONTHLY_USD.toFixed(2)}`;

  const handlePay = async () => {
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
      email: userEmail,
      amount: activeKobo,
      currency: "NGN",
      metadata: {
        custom_fields: [
          { display_name: "Name", variable_name: "name", value: userName ?? userEmail },
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
            return res.json();
          })
          .then(() => onSuccess())
          .catch(() => {
            setError("Payment received but verification failed. Reference: " + response.reference);
          })
          .finally(() => setLoading(false));
      },
      onClose: () => setLoading(false),
    });

    handler.openIframe();
  };

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        zIndex: 200, backdropFilter: "blur(3px)",
      }} />

      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 201, background: "var(--surface)", borderRadius: 20,
        width: "min(480px, 95vw)", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
      }}>
        <div style={{ padding: "28px 28px 0" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: "#8C5A3C", textTransform: "uppercase", marginBottom: 8,
          }}>
            Upgrade SiLog
          </div>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>
            Your 5 free AI entries are used up.
          </h2>
          <p style={{ marginTop: 10, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Subscribe monthly to keep generating logbook entries. No auto-renewal — you pay when you&apos;re ready.
          </p>

          {/* FUNAAB discount notice */}
          {isFunaab && (
            <div style={{
              marginTop: 12, padding: "9px 13px", borderRadius: 8,
              background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.3)",
              fontSize: 12, color: "#15803d", display: "flex", alignItems: "center", gap: 7,
            }}>
              <span style={{ fontSize: 14 }}>🎓</span>
              <span><strong>FUNAAB student discount applied</strong> — ₦500 off every month.</span>
            </div>
          )}
        </div>

        {/* Currency toggle */}
        <div style={{ padding: "16px 28px 0", display: "flex", gap: 8, alignItems: "center" }}>
          {(["ngn", "usd"] as const).map((c) => (
            <button key={c} onClick={() => setCurrency(c)} style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: currency === c ? "none" : "1.5px solid rgba(140,90,60,0.25)",
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

        <div style={{ padding: "16px 28px" }}>
          <div style={{
            padding: "18px 20px", borderRadius: 16,
            border: "2px solid #8C5A3C", background: "rgba(140,90,60,0.07)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>
                  Monthly Plan
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                  Renew each month manually — no auto-billing
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {/* Strikethrough original price for FUNAAB */}
                {isFunaab && currency === "ngn" && (
                  <div style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "line-through" }}>
                    ₦{MONTHLY_NGN.toLocaleString()}
                  </div>
                )}
                <div style={{ fontWeight: 900, fontSize: 26, color: "#8C5A3C" }}>{priceDisplay}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>per month</div>
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(140,90,60,0.15)" }}>
              {[
                "Unlimited AI logbook entry generation",
                "Edit and regenerate any entry",
                "Activity Bank + Defense Prep tools",
                "No auto-renewal — you stay in control",
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", gap: 8, fontSize: 12,
                  color: "var(--text-muted)", marginBottom: i < 3 ? 5 : 0,
                }}>
                  <span style={{ color: "#8C5A3C", flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "0 28px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          {error && (
            <p style={{ fontSize: 12, color: "#dc2626", textAlign: "center", margin: 0 }}>{error}</p>
          )}
          <button onClick={handlePay} disabled={loading} style={{
            width: "100%", padding: "14px 0", borderRadius: 14,
            background: loading ? "rgba(140,90,60,0.4)" : "#8C5A3C",
            color: "#fff", fontWeight: 700, fontSize: 15,
            border: "none", cursor: loading ? "default" : "pointer",
          }}>
            {loading ? "Processing…" : `Subscribe for ${priceDisplay}/month →`}
          </button>
          <button onClick={onReadOnly} style={{
            width: "100%", padding: "11px 0", borderRadius: 14,
            background: "transparent", color: "var(--text-muted)", fontSize: 13,
            border: "1.5px solid rgba(140,90,60,0.2)", cursor: "pointer",
          }}>
            Continue in read-only mode (view only)
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
            Secured by Paystack · No auto-renewal
          </p>
        </div>
      </div>

      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
    </>
  );
}
