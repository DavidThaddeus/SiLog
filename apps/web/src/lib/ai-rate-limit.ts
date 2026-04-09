import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Daily AI call limits.
 * Free users: 5 lifetime (enforced separately) + max 3/day within those 5.
 * Paid users: 20 calls/day, resets at midnight UTC.
 */
export const DAILY_LIMIT_PAID = 20;
export const DAILY_LIMIT_FREE = 3;

type RateLimitResult =
  | { blocked: false; callsToday: number }
  | { blocked: true; response: NextResponse };

/**
 * Check + increment the daily AI call counter for a user.
 * Uses the admin client (service role) so it bypasses RLS.
 * Returns { blocked: false } if OK, or { blocked: true, response } to return immediately.
 */
export async function checkAndIncrementDailyLimit(
  userId: string,
  adminClient: SupabaseClient
): Promise<RateLimitResult> {
  const todayUTC = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Load just the rate-limit columns — best-effort, won't block if column missing
  let callsToday = 0;
  let isPaid = false;

  try {
    const { data } = await adminClient
      .from("profiles")
      .select("subscription_status, ai_calls_today, ai_calls_date")
      .eq("id", userId)
      .maybeSingle();

    isPaid = data?.subscription_status === "paid";
    // Reset counter if it's a new day
    callsToday = data?.ai_calls_date === todayUTC ? (data?.ai_calls_today ?? 0) : 0;
  } catch {
    // Column may not exist yet — allow the call through
    return { blocked: false, callsToday: 0 };
  }

  const limit = isPaid ? DAILY_LIMIT_PAID : DAILY_LIMIT_FREE;

  if (callsToday >= limit) {
    return {
      blocked: true,
      response: NextResponse.json(
        {
          error: "daily_limit_reached",
          message: isPaid
            ? `You've reached the daily limit of ${DAILY_LIMIT_PAID} AI calls. Resets at midnight UTC.`
            : `Free plan allows ${DAILY_LIMIT_FREE} AI calls per day. Upgrade for more.`,
          limit,
          callsToday,
          resetsAt: `${todayUTC}T24:00:00Z`,
        },
        { status: 429 }
      ),
    };
  }

  // Increment counter
  try {
    await adminClient
      .from("profiles")
      .update({ ai_calls_today: callsToday + 1, ai_calls_date: todayUTC })
      .eq("id", userId);
  } catch {
    // Best-effort — don't block the call if update fails
  }

  return { blocked: false, callsToday: callsToday + 1 };
}

/** Create the admin Supabase client (service role — bypasses RLS) */
export function makeAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
