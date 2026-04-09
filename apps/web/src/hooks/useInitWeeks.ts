"use client";

import { useDashboardStore } from "@/store/dashboard";

/**
 * Returns weeks from the store.
 * The (app) layout guarantees weeks are populated before any page mounts.
 * This hook exists so pages don't import the store directly — kept simple on purpose.
 */
export function useInitWeeks() {
  const { weeks } = useDashboardStore();
  return { weeks };
}
