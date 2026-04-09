import { supabase } from "./supabase";
import type { WeekEntry, ActivityBankState } from "@/types/dashboard";

export async function loadUserData(userId: string): Promise<{
  weeks: WeekEntry[];
  activityBank: ActivityBankState;
} | null> {
  const { data, error } = await supabase
    .from("user_data")
    .select("weeks, activity_bank")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    weeks: data.weeks ?? [],
    activityBank: data.activity_bank ?? { items: [], bankedCount: 0, emptyCoverageCount: 0 },
  };
}

export async function saveUserData(
  userId: string,
  weeks: WeekEntry[],
  activityBank: ActivityBankState
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: userId,
      weeks,
      activity_bank: activityBank,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) {
    console.error("[saveUserData] Supabase error:", error.message, error);
    return { error: error.message };
  }
  return { error: null };
}
