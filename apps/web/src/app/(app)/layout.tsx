"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadUserData, saveUserData } from "@/lib/db";
import { useDashboardStore } from "@/store/dashboard";
import { useOnboardingStore } from "@/store/onboarding";
import { generateWeeksFromProfile, durationMonthsToWeeks, recalcWeekFlags } from "@/lib/dashboard-mock";
import { AppShell } from "@/components/layout/AppShell";
import { useSubscriptionStore } from "@/store/subscription";
import {
  saveOfflineSnapshot,
  loadOfflineSnapshot,
  saveLocalData,
  loadLocalData,
  withTimeout,
} from "@/lib/offline-cache";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [offlineCachedAt, setOfflineCachedAt] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "failed">("synced");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      userIdRef.current = session.user.id;

      // Hydrate theme from localStorage (user's saved preference)
      const savedTheme = localStorage.getItem("silog-theme") as "light" | "dark" | null;
      useDashboardStore.getState().setTheme(savedTheme ?? "light");

      // Always wipe the store before loading — prevents data leaking between accounts
      useDashboardStore.setState({
        weeks: [],
        activityBank: { items: [], bankedCount: 0, emptyCoverageCount: 0 },
      });
      useOnboardingStore.setState({
        currentStep: 1,
        data: {
          attendanceDayNames: [],
          hasPersonalStudy: false,
          personalStudyDescription: "",
          studyLogbookFraming: null,
          companyDepartment: "",
        },
      });

      // ── Local-first: show app immediately if we have cached data ────────────
      const localSnap = loadLocalData(session.user.id);
      const offlineSnap = loadOfflineSnapshot(session.user.id);
      const hasLocalWeeks = localSnap && localSnap.weeks.length > 0;

      if (hasLocalWeeks && offlineSnap) {
        // Populate stores from offline snapshot (profile + subscription)
        useOnboardingStore.setState({
          data: {
            fullName: offlineSnap.profile.full_name ?? "",
            department: offlineSnap.profile.department ?? "",
            university: offlineSnap.profile.university ?? "",
            companyName: offlineSnap.profile.company_name ?? "",
            companyDepartment: offlineSnap.profile.company_dept ?? "",
            industry: offlineSnap.profile.industry ?? "",
            startDate: offlineSnap.profile.start_date ?? "",
            siwesDuration: (offlineSnap.siwesDuration ?? 6) as 3 | 6 | 12,
            attendanceDayNames: offlineSnap.profile.attendance_days ?? [],
            hasPersonalStudy: offlineSnap.profile.has_personal_study ?? false,
            studyLogbookFraming: (offlineSnap.profile.study_framing as "assigned" | "research" | null) ?? null,
          },
        });

        const offlinePurchasedBlocks = offlineSnap.subscription.purchasedBlocks ?? [];
        useSubscriptionStore.getState().setSubscription(
          offlineSnap.subscription.status,
          offlineSnap.subscription.expiresAt,
          offlineSnap.subscription.generationsUsed,
          offlineSnap.subscription.isFullPayment,
          offlineSnap.subscription.subscribedAt
        );
        useSubscriptionStore.getState().setPurchasedBlocks(offlinePurchasedBlocks);

        useDashboardStore.getState().setWeeks(
          recalcWeekFlags(localSnap.weeks, offlinePurchasedBlocks, offlineSnap.subscription.status === "paid")
        );
        useDashboardStore.setState({ activityBank: localSnap.activityBank });

        // Show the app immediately
        isInitializingRef.current = false;
        setReady(true);

        // Background refresh from Supabase — pass a flag so fetchAndPopulate
        // skips setReady(true) and router redirects (app is already showing)
        fetchAndPopulate(session.user.id, router, true).catch(() => {});
        return;
      }

      // ── Main data fetch (wrapped in timeout for offline detection) ──────────
      try {
        await withTimeout(fetchAndPopulate(session.user.id, router), 6_000);
        // fetchAndPopulate calls setReady(true) internally on success
      } catch {
        // Supabase unreachable or timed out — try offline cache
        const snap = loadOfflineSnapshot(session.user.id);
        if (!snap) {
          // No cache at all — can't recover; send to login
          router.replace("/login");
          return;
        }

        // Populate stores from snapshot
        useOnboardingStore.setState({
          data: {
            fullName: snap.profile.full_name ?? "",
            department: snap.profile.department ?? "",
            university: snap.profile.university ?? "",
            companyName: snap.profile.company_name ?? "",
            companyDepartment: snap.profile.company_dept ?? "",
            industry: snap.profile.industry ?? "",
            startDate: snap.profile.start_date ?? "",
            siwesDuration: (snap.siwesDuration ?? 6) as 3 | 6 | 12,
            attendanceDayNames: snap.profile.attendance_days ?? [],
            hasPersonalStudy: snap.profile.has_personal_study ?? false,
            studyLogbookFraming: (snap.profile.study_framing as "assigned" | "research" | null) ?? null,
          },
        });

        useSubscriptionStore.getState().setSubscription(
          snap.subscription.status,
          snap.subscription.expiresAt,
          snap.subscription.generationsUsed,
          snap.subscription.isFullPayment,
          snap.subscription.subscribedAt
        );

        const snapBlocks = snap.subscription.purchasedBlocks ?? [];
        useSubscriptionStore.getState().setPurchasedBlocks(snapBlocks);

        if (snap.weeks.length > 0) {
          useDashboardStore.getState().setWeeks(
            recalcWeekFlags(snap.weeks, snapBlocks, snap.subscription.status === "paid")
          );
          useDashboardStore.setState({ activityBank: snap.activityBank });
        }

        setOfflineCachedAt(snap.savedAt);
        isInitializingRef.current = false;
        setReady(true);
      }
    });

    // On sign-out: wipe store so next user starts clean, then redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        userIdRef.current = null;
        useDashboardStore.setState({
          weeks: [],
          activityBank: { items: [], bankedCount: 0, emptyCoverageCount: 0 },
        });
        useOnboardingStore.setState({
          currentStep: 1,
          data: {
            attendanceDayNames: [],
            hasPersonalStudy: false,
            personalStudyDescription: "",
            studyLogbookFraming: null,
            companyDepartment: "",
          },
        });
        useSubscriptionStore.getState().setPurchasedBlocks([]);
        router.replace("/login");
      }
    });

    // Auto-save on store changes:
    // 1. IMMEDIATELY write to localStorage (instant, never fails)
    // 2. Debounced 1.5s Supabase sync in background
    // Only save when weeks or activityBank actually change — ignore theme/expandedWeek/UI state
    let lastWeeksRef = useDashboardStore.getState().weeks;
    let lastBankRef = useDashboardStore.getState().activityBank;

    const unsubscribe = useDashboardStore.subscribe((state) => {
      if (!userIdRef.current) return;
      if (isInitializingRef.current) return;

      // Skip if only UI state changed (theme toggle, collapse, etc.)
      if (state.weeks === lastWeeksRef && state.activityBank === lastBankRef) return;
      lastWeeksRef = state.weeks;
      lastBankRef = state.activityBank;

      // Debounce localStorage write (100ms) — coalesces rapid edits into one write
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        if (!userIdRef.current) return;
        const { weeks, activityBank } = useDashboardStore.getState();
        saveLocalData(userIdRef.current, weeks, activityBank);
        setSyncStatus("pending");

        // Supabase sync after another 1.4s (total ~1.5s from last edit)
        const { error } = await saveUserData(userIdRef.current, weeks, activityBank);
        if (error) {
          setSyncStatus("failed");
        } else {
          setSyncStatus("synced");
        }
      }, 100);
    });

    // When connection returns, push any locally-saved data that failed to sync
    const handleOnline = () => {
      const uid = userIdRef.current;
      if (!uid) return;
      const local = loadLocalData(uid);
      if (!local) return;
      const { weeks, activityBank } = useDashboardStore.getState();
      saveUserData(uid, weeks, activityBank).then(({ error }) => {
        if (!error) setSyncStatus("synced");
      });
    };
    window.addEventListener("online", handleOnline);

    return () => {
      subscription.unsubscribe();
      unsubscribe();
      window.removeEventListener("online", handleOnline);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // ── Inner fetch function (extracted so it can be timeout-raced) ─────────────
  async function fetchAndPopulate(userId: string, routerRef: typeof router, isBackgroundRefresh = false) {
    // Single batched query for all profile columns — replaces 5 separate round-trips
    const [profileResult, lastPayment, savedWeeks, blocksResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, department, university, company_name, company_dept, industry, start_date, attendance_days, has_personal_study, study_framing, siwes_duration_months, subscription_status, subscription_expires_at, ai_generations_used, is_full_payment")
        .eq("id", userId)
        .maybeSingle(),
      Promise.resolve(
        supabase
          .from("payment_transactions")
          .select("created_at")
          .eq("user_id", userId)
          .eq("status", "success")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).then((r) => (r.error ? null : r.data)).catch(() => null),
      loadUserData(userId),
      Promise.resolve(
        supabase
          .from("subscription_blocks")
          .select("block_number")
          .eq("user_id", userId)
      ).then((r) => (r.error ? [] : (r.data ?? []))).catch(() => []),
    ]);

    const profile = profileResult.data;

    if (!profile) {
      // No profile row means onboarding was never completed
      if (!isBackgroundRefresh) routerRef.replace("/onboarding");
      return;
    }

    const siwesDuration = ((profile.siwes_duration_months as number) ?? 6) as 3 | 6 | 12;
    const purchasedBlocks = (blocksResult as { block_number: number }[]).map((b) => b.block_number);

    useOnboardingStore.setState({
      data: {
        fullName: profile.full_name ?? "",
        department: profile.department ?? "",
        university: profile.university ?? "",
        companyName: profile.company_name ?? "",
        companyDepartment: profile.company_dept ?? "",
        industry: profile.industry ?? "",
        startDate: profile.start_date ?? "",
        siwesDuration,
        attendanceDayNames: profile.attendance_days ?? [],
        hasPersonalStudy: profile.has_personal_study ?? false,
        studyLogbookFraming: profile.study_framing ?? null,
      },
    });

    // Populate subscription store — check expiry for monthly payers
    const isFullPayment = (profile.is_full_payment as boolean) ?? false;
    const subExpiry = (profile.subscription_expires_at as string | null) ?? null;
    const genUsed = (profile.ai_generations_used as number) ?? 0;

    let subStatus: "free" | "paid" = ((profile.subscription_status as "free" | "paid") ?? "free");
    if (subStatus === "paid" && !isFullPayment && subExpiry) {
      const expired = new Date(subExpiry) < new Date();
      if (expired) {
        subStatus = "free";
        supabase
          .from("profiles")
          .update({ subscription_status: "free", subscription_expires_at: null })
          .eq("id", userId)
          .then(() => {});
      }
    }

    const subscribedAt = (lastPayment as { created_at?: string } | null)?.created_at ?? null;

    useSubscriptionStore.getState().setSubscription(
      subStatus,
      isFullPayment ? null : subExpiry,
      genUsed,
      isFullPayment,
      subscribedAt
    );
    useSubscriptionStore.getState().setPurchasedBlocks(purchasedBlocks);

    // 2. Saved weeks already loaded in parallel above — no extra await needed
    const totalWeeks = durationMonthsToWeeks(siwesDuration);
    const saved = savedWeeks;

    // Check if there is a newer local snapshot (written on every store change).
    // This recovers entries created while Supabase sync was failing.
    const local = loadLocalData(userId);
    const supabaseTime = saved?.updatedAt ? new Date(saved.updatedAt).getTime() : 0;
    const localTime = local?.updatedAt ? new Date(local.updatedAt).getTime() : 0;
    const preferLocal = local && local.weeks.length > 0 && localTime > supabaseTime;

    const weeksSource = preferLocal ? local : saved;
    const bankSource = preferLocal ? local : saved;

    if (weeksSource && weeksSource.weeks.length > 0 && weeksSource.weeks.length === totalWeeks) {
      // Use saved data (local-first if newer, otherwise Supabase)
      // recalcWeekFlags ensures isCurrentWeek/isFutureWeek/isLocked reflect today's real state
      useDashboardStore.getState().setWeeks(
        recalcWeekFlags(weeksSource.weeks, purchasedBlocks, subStatus === "paid")
      );
      useDashboardStore.setState({ activityBank: bankSource!.activityBank });

      // If we used local data that's ahead of Supabase, push it up now
      if (preferLocal) {
        saveUserData(userId, local.weeks, local.activityBank).then(() => {
          setSyncStatus("synced");
        });
      }
    } else if (profile.start_date && profile.attendance_days?.length) {
      // Generate fresh weeks — either first login or duration was changed
      useDashboardStore.getState().setWeeks(
        recalcWeekFlags(
          generateWeeksFromProfile(profile.start_date, profile.attendance_days, totalWeeks),
          purchasedBlocks,
          subStatus === "paid"
        )
      );
      useDashboardStore.setState({
        activityBank: (bankSource ?? saved)?.activityBank ?? { items: [], bankedCount: 0, emptyCoverageCount: 0 },
      });
    }

    // Only set ready on foreground load — background refresh skips this
    if (!isBackgroundRefresh) {
      isInitializingRef.current = false;
      setReady(true);
    }

    // 3. Save offline snapshot in background — never blocks the UI
    setTimeout(() => {
      const weeks = useDashboardStore.getState().weeks;
      const activityBank = useDashboardStore.getState().activityBank;
      saveOfflineSnapshot({
        userId,
        savedAt: new Date().toISOString(),
        profile: {
          full_name: profile.full_name ?? null,
          department: profile.department ?? null,
          university: profile.university ?? null,
          company_name: profile.company_name ?? null,
          company_dept: profile.company_dept ?? null,
          industry: profile.industry ?? null,
          start_date: profile.start_date ?? null,
          attendance_days: profile.attendance_days ?? null,
          has_personal_study: profile.has_personal_study ?? null,
          study_framing: profile.study_framing ?? null,
        },
        siwesDuration,
        subscription: {
          status: subStatus,
          expiresAt: isFullPayment ? null : subExpiry,
          generationsUsed: genUsed,
          isFullPayment,
          subscribedAt,
          purchasedBlocks,
        },
        weeks,
        activityBank,
      });
    }, 0);
  }

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTopColor: "#8C5A3C",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <AppShell offlineCachedAt={offlineCachedAt} syncStatus={syncStatus}>{children}</AppShell>;
}
