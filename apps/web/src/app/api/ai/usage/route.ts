import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { makeAdminClient, DAILY_LIMIT_FREE, DAILY_LIMIT_PAID } from "@/lib/ai-rate-limit";

/**
 * GET /api/ai/usage
 * Returns the current user's daily AI call usage.
 * Used to show "X of Y calls used today" in the UI without making a generate call.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const adminClient = makeAdminClient();

    const { data } = await adminClient
      .from("profiles")
      .select("subscription_status, ai_calls_today, ai_calls_date")
      .eq("id", user.id)
      .maybeSingle();

    const isPaid = data?.subscription_status === "paid";
    const dailyLimit = isPaid ? DAILY_LIMIT_PAID : DAILY_LIMIT_FREE;

    // Compute WAT day key (UTC+1)
    const now = new Date();
    const wat = new Date(now.getTime() + 60 * 60 * 1000);
    const dayKey = wat.toISOString().split("T")[0];

    const callsToday = data?.ai_calls_date === dayKey ? (data?.ai_calls_today ?? 0) : 0;
    const remaining = Math.max(0, dailyLimit - callsToday);

    return NextResponse.json({ callsToday, dailyLimit, remaining, isPaid });
  } catch {
    return NextResponse.json({ callsToday: 0, dailyLimit: DAILY_LIMIT_FREE, remaining: DAILY_LIMIT_FREE, isPaid: false });
  }
}
