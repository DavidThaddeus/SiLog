"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { OfflineBanner } from "./OfflineBanner";
import { TrialBanner } from "@/components/payment/TrialBanner";
import { PaywallModal } from "@/components/payment/PaywallModal";
import { useSubscriptionStore, FREE_GENERATION_LIMIT } from "@/store/subscription";
import { useOnboardingStore } from "@/store/onboarding";
import { supabase } from "@/lib/supabase";

export function AppShell({ children, offlineCachedAt, syncStatus }: {
  children: React.ReactNode;
  offlineCachedAt?: string | null;
  syncStatus?: "synced" | "pending" | "failed";
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const { status, isFullPayment: isFullyPaid, generationsUsed, markPaid, setReadOnly } = useSubscriptionStore();
  const siwesDuration = (useOnboardingStore((s) => s.data.siwesDuration) ?? 6) as 3 | 6 | 12;

  const generationsLeft = Math.max(0, FREE_GENERATION_LIMIT - generationsUsed);
  // Trial expired: free plan AND used up all generations
  const trialExpired = status === "free" && generationsUsed >= FREE_GENERATION_LIMIT;
  const inTrial = status === "free" && !trialExpired;

  // Full payers are NEVER shown the paywall — defence-in-depth guard
  const canShowPaywall = !isFullyPaid && status !== "paid";

  // Paywall is open if explicitly triggered OR if locked and user hasn't dismissed to read-only yet
  const paywallOpen = canShowPaywall && (showPaywall || (trialExpired && !useSubscriptionStore.getState().readOnly));

  const handlePaySuccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load core status first (always exists)
    const { data: subRow } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    // Load is_full_payment separately — column may not exist yet
    const { data: fullPayRow } = await supabase
      .from("profiles")
      .select("is_full_payment")
      .eq("id", user.id)
      .maybeSingle()
      .then((r) => r.error ? { data: null } : r);

    if (subRow?.subscription_status === "paid") {
      const isFullPay = (fullPayRow as { is_full_payment?: boolean } | null)?.is_full_payment ?? false;
      markPaid(subRow.subscription_expires_at ?? null, isFullPay, new Date().toISOString());
    }
    setShowPaywall(false);
  };

  const handleReadOnly = () => {
    setReadOnly(true);
    setShowPaywall(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 99,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar is always position:fixed — never affects page flow */}
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Page column: shifts right on desktop to clear the fixed sidebar */}
      <div className={collapsed ? "lg:pl-[68px]" : "lg:pl-[260px]"}>
        <AppTopbar
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onMobileMenuOpen={() => setMobileOpen(true)}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          syncStatus={syncStatus}
        />

        {/* Plain block — window scrolls, no height traps, works on every phone/browser */}
        <main style={{
          background: "var(--surface)",
          overflowX: "hidden",
          paddingTop: offlineCachedAt ? 92 : 56,
          paddingBottom: 48,
        }}>
          {offlineCachedAt && <OfflineBanner cachedAt={offlineCachedAt} />}
          {inTrial && (
            <TrialBanner
              generationsUsed={generationsUsed}
              generationsLeft={generationsLeft}
            />
          )}
          {children}
        </main>
      </div>

      {/* Paywall modal */}
      {paywallOpen && (
        <PaywallModalLoader
          siwesDuration={siwesDuration}
          onSuccess={handlePaySuccess}
          onReadOnly={handleReadOnly}
        />
      )}
    </div>
  );
}

/** Loads the user's email then renders PaywallModal */
function PaywallModalLoader({
  siwesDuration,
  onSuccess,
  onReadOnly,
}: {
  siwesDuration: 3 | 6 | 12;
  onSuccess: () => void;
  onReadOnly: () => void;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const fullName = useOnboardingStore((s) => s.data.fullName);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? "");
    });
  }, []);

  if (!email) return null;

  return (
    <PaywallModal
      userEmail={email}
      userName={fullName ?? undefined}
      siwesDuration={siwesDuration}
      onSuccess={onSuccess}
      onReadOnly={onReadOnly}
    />
  );
}
