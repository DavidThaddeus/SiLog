"use client";

import { useRouter } from "next/navigation";
import { isFunaabEmail, BLOCK_NGN, BLOCK_FUNAAB_NGN } from "@/lib/pricing";

interface Props {
  userEmail: string;
  userName?: string;
  siwesDuration: 3 | 6 | 12;
  onSuccess: () => void;
  onReadOnly: () => void;
}

export function PaywallModal({ userEmail, onReadOnly }: Props) {
  const router = useRouter();
  const isFunaab = isFunaabEmail(userEmail);
  const pricePerBlock = isFunaab ? BLOCK_FUNAAB_NGN : BLOCK_NGN;

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        zIndex: 200, backdropFilter: "blur(3px)",
      }} />

      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 201, background: "var(--surface)", borderRadius: 20,
        width: "min(460px, 95vw)", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
        padding: "28px 28px 24px",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          color: "#8C5A3C", textTransform: "uppercase", marginBottom: 8,
        }}>
          Free preview used
        </div>
        <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>
          Your 5 free AI entries are used up.
        </h2>
        <p style={{ marginTop: 10, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Purchase a month to unlock the next 4 weeks and get unlimited AI logbook generation.
          No subscriptions — pay only for what you need.
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

        {/* Block preview */}
        <div style={{
          marginTop: 18, padding: "16px 18px", borderRadius: 14,
          border: "2px solid #8C5A3C", background: "rgba(140,90,60,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>Month 1</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                Weeks 2–5 · 1 month · unlimited AI entries
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {isFunaab && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "line-through" }}>
                  ₦{BLOCK_NGN.toLocaleString()}
                </div>
              )}
              <div style={{ fontWeight: 900, fontSize: 24, color: "#8C5A3C" }}>
                ₦{pricePerBlock.toLocaleString()}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(140,90,60,0.15)" }}>
            {[
              "Unlimited AI logbook entry generation",
              "Edit and regenerate any entry",
              "Activity Bank + Defense Prep tools",
              "Pay per block — no auto-renewal",
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

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => router.push("/pricing")}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 14,
              background: "#8C5A3C", color: "#fff",
              fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
            }}
          >
            View all blocks &amp; unlock →
          </button>
          <button
            onClick={onReadOnly}
            style={{
              width: "100%", padding: "11px 0", borderRadius: 14,
              background: "transparent", color: "var(--text-muted)", fontSize: 13,
              border: "1.5px solid rgba(140,90,60,0.2)", cursor: "pointer",
            }}
          >
            Continue in read-only mode (view only)
          </button>
          <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
            Secured by Paystack · No auto-renewal
          </p>
        </div>
      </div>
    </>
  );
}
