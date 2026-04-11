import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Daily AI call limits.
 * Free users: 3 calls/day.
 * Paid users: 5 calls/day.
 * Day boundary: resets at 01:00 UTC (= 02:00 WAT for Nigerian students).
 */
export const DAILY_LIMIT_PAID = 5;
export const DAILY_LIMIT_FREE = 3;

/**
 * Returns the current "day key" (YYYY-MM-DD) where the day boundary is 01:00 UTC.
 * Before 01:00 UTC, we're still in the previous calendar day's period.
 */
function getDayKey(): string {
  const now = new Date();
  // Shift back by 1 hour so the period boundary sits at 01:00 UTC
  const adjusted = new Date(now.getTime() - 60 * 60 * 1000);
  return adjusted.toISOString().split("T")[0];
}

type CheckResult =
  | { blocked: false; callsToday: number; isPaid: boolean }
  | { blocked: true; response: NextResponse };

/**
 * Read the user's daily call count and subscription status.
 * Does NOT increment. Call incrementDailyLimit() separately after all checks pass.
 */
export async function checkDailyLimit(
  userId: string,
  adminClient: SupabaseClient
): Promise<CheckResult> {
  const dayKey = getDayKey();

  try {
    const { data } = await adminClient
      .from("profiles")
      .select("subscription_status, ai_calls_today, ai_calls_date")
      .eq("id", userId)
      .maybeSingle();

    const isPaid = data?.subscription_status === "paid";
    const callsToday = data?.ai_calls_date === dayKey ? (data?.ai_calls_today ?? 0) : 0;
    const limit = isPaid ? DAILY_LIMIT_PAID : DAILY_LIMIT_FREE;

    if (callsToday >= limit) {
      return {
        blocked: true,
        response: NextResponse.json(
          {
            error: "daily_limit_reached",
            message: isPaid
              ? `You've used all ${DAILY_LIMIT_PAID} AI calls for today. Resets at 1:00 AM UTC.`
              : `Free plan allows ${DAILY_LIMIT_FREE} AI calls per day. Come back tomorrow or upgrade.`,
            limit,
            callsToday,
          },
          { status: 429 }
        ),
      };
    }

    return { blocked: false, callsToday, isPaid };
  } catch {
    // Column may not exist yet — allow the call through
    return { blocked: false, callsToday: 0, isPaid: false };
  }
}

/**
 * Increment the daily call counter. Call this only after all checks pass.
 */
export async function incrementDailyLimit(
  userId: string,
  adminClient: SupabaseClient,
  currentCallsToday: number
): Promise<void> {
  const dayKey = getDayKey();
  try {
    await adminClient
      .from("profiles")
      .update({ ai_calls_today: currentCallsToday + 1, ai_calls_date: dayKey })
      .eq("id", userId);
  } catch {
    // Best-effort — don't block the call if update fails
  }
}

/** Create the admin Supabase client (service role — bypasses RLS) */
export function makeAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
