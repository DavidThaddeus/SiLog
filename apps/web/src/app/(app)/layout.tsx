"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { loadUserData, saveUserData } from "@/lib/db";
import { useDashboardStore } from "@/store/dashboard";
import { useOnboardingStore } from "@/store/onboarding";
import { generateWeeksFromProfile, durationMonthsToWeeks } from "@/lib/dashboard-mock";
import { AppShell } from "@/components/layout/AppShell";
import { useSubscriptionStore } from "@/store/subscription";
import {
  saveOfflineSnapshot,
  loadOfflineSnapshot,
  withTimeout,
} from "@/lib/offline-cache";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [offlineCachedAt, setOfflineCachedAt] = useState<string | null>(null);
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

      // ── Main data fetch (wrapped in timeout for offline detection) ──────────
      try {
        await withTimeout(fetchAndPopulate(session.user.id, router), 10_000);
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

        if (snap.weeks.length > 0) {
          useDashboardStore.getState().setWeeks(snap.weeks);
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
        router.replace("/login");
      }
    });

    // Auto-save on store changes (debounced 1.5s)
    const unsubscribe = useDashboardStore.subscribe((state) => {
      if (!userIdRef.current) return;
      if (isInitializingRef.current) return; // never save during initial load
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (userIdRef.current) {
          saveUserData(userIdRef.current, state.weeks, state.activityBank);
        }
      }, 1500);
    });

    return () => {
      subscription.unsubscribe();
      unsubscribe();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // ── Inner fetch function (extracted so it can be timeout-raced) ─────────────
  async function fetchAndPopulate(userId: string, routerRef: typeof router) {
    // 1. Load profile from Supabase → populate onboarding store
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "full_name, department, university, company_name, company_dept, industry, start_date, attendance_days, has_personal_study, study_framing"
      )
      .eq("id", userId)
      .maybeSingle();

    // Extended columns — each fetched individually so a missing column never
    // poisons unrelated data.
    const loadCol = async <T extends Record<string, unknown>>(col: string): Promise<T | null> => {
      const r = await supabase.from("profiles").select(col).eq("id", userId).maybeSingle();
      return r.error ? null : (r.data as T | null);
    };

    const lastPaymentPromise = Promise.resolve(
      supabase
        .from("payment_transactions")
        .select("created_at")
        .eq("user_id", userId)
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    )
      .then((r) => (r.error ? null : r.data))
      .catch(() => null);

    const [durRow, subRow, genRow, fullPayRow, lastPayment] = await Promise.all([
      loadCol<{ siwes_duration_months: number }>("siwes_duration_months"),
      loadCol<{ subscription_status: string; subscription_expires_at: string | null }>(
        "subscription_status, subscription_expires_at"
      ),
      loadCol<{ ai_generations_used: number }>("ai_generations_used"),
      loadCol<{ is_full_payment: boolean }>("is_full_payment"),
      lastPaymentPromise,
    ]);

    if (!profile) {
      // No profile row means onboarding was never completed
      routerRef.replace("/onboarding");
      return;
    }

    const siwesDuration = (durRow?.siwes_duration_months ?? 6) as 3 | 6 | 12;

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
    const isFullPayment = fullPayRow?.is_full_payment ?? false;
    const subExpiry = subRow?.subscription_expires_at ?? null;
    const genUsed = genRow?.ai_generations_used ?? 0;

    let subStatus: "free" | "paid" = (subRow?.subscription_status as "free" | "paid") ?? "free";
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

    // 2. Load saved weeks + activity bank, or generate fresh from profile
    const totalWeeks = durationMonthsToWeeks(siwesDuration);
    const saved = await loadUserData(userId);
    if (saved && saved.weeks.length > 0 && saved.weeks.length === totalWeeks) {
      // Only use saved data if week count matches the user's current duration
      useDashboardStore.getState().setWeeks(saved.weeks);
      useDashboardStore.setState({ activityBank: saved.activityBank });
    } else if (profile.start_date && profile.attendance_days?.length) {
      // Generate fresh weeks — either first login or duration was changed
      useDashboardStore.getState().setWeeks(
        generateWeeksFromProfile(profile.start_date, profile.attendance_days, totalWeeks)
      );
      useDashboardStore.setState({
        activityBank: saved?.activityBank ?? { items: [], bankedCount: 0, emptyCoverageCount: 0 },
      });
    }

    // 3. Save offline snapshot for future fallback
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
      },
      weeks,
      activityBank,
    });

    isInitializingRef.current = false;
    setReady(true);
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

  return <AppShell offlineCachedAt={offlineCachedAt}>{children}</AppShell>;
}
