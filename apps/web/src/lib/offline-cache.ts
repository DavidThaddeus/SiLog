import type { WeekEntry, ActivityBankState } from "@/types/dashboard";

const CACHE_KEY_PREFIX = "silog_offline_";

export interface OfflineSnapshot {
  userId: string;
  savedAt: string;
  profile: {
    full_name: string | null;
    department: string | null;
    university: string | null;
    company_name: string | null;
    company_dept: string | null;
    industry: string | null;
    start_date: string | null;
    attendance_days: string[] | null;
    has_personal_study: boolean | null;
    study_framing: string | null;
  };
  siwesDuration: number;
  subscription: {
    status: "free" | "paid";
    expiresAt: string | null;
    generationsUsed: number;
    isFullPayment: boolean;
    subscribedAt: string | null;
  };
  weeks: WeekEntry[];
  activityBank: ActivityBankState;
}

export function saveOfflineSnapshot(snapshot: OfflineSnapshot): void {
  try {
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${snapshot.userId}`,
      JSON.stringify(snapshot)
    );
  } catch {
    // Storage quota exceeded or unavailable — silently skip
  }
}

export function loadOfflineSnapshot(userId: string): OfflineSnapshot | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as OfflineSnapshot;
  } catch {
    return null;
  }
}

export function clearOfflineSnapshot(userId: string): void {
  try {
    localStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
  } catch {
    // ignore
  }
}

/** Races a promise against a timeout. Rejects with "timeout" if time runs out. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}
