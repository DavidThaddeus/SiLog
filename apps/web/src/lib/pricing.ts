export const MONTHLY_NGN = 4_000;
export const MONTHLY_USD = 2.90;
export const MONTHLY_NGN_KOBO = MONTHLY_NGN * 100;

/** FUNAAB student discount — ₦3,500/month for @student.funaab.edu.ng emails */
export const FUNAAB_NGN = 3_500;
export const FUNAAB_NGN_KOBO = FUNAAB_NGN * 100;

export function isFunaabEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@student.funaab.edu.ng");
}

/** Full-duration price: (months × ₦4,000) − ₦2,000 discount */
export function fullPriceNgn(months: number): number {
  return months * MONTHLY_NGN - 2_000;
}
export function fullPriceUsd(months: number): number {
  return parseFloat((months * MONTHLY_USD - 1.45).toFixed(2));
}

/**
 * Prorated upgrade price for monthly subscribers:
 * (remaining months × ₦4,000) − ₦2,000 discount
 * Minimum ₦2,000 so we never charge ₦0 or negative.
 */
export function upgradePriceNgn(monthsRemaining: number): number {
  return Math.max(2_000, monthsRemaining * MONTHLY_NGN - 2_000);
}
export function upgradePriceUsd(monthsRemaining: number): number {
  return parseFloat(Math.max(1.45, monthsRemaining * MONTHLY_USD - 1.45).toFixed(2));
}

/**
 * How many full months of SIWES are still ahead.
 * Returns at least 1 (if they're on the last month).
 */
export function computeMonthsRemaining(startDate: string, siwesDuration: number): number {
  if (!startDate) return siwesDuration;
  const start = new Date(startDate);
  const now = new Date();
  const elapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(1, siwesDuration - Math.max(0, elapsed));
}

export type PlanId = "monthly" | "full" | `block_${number}`;

export const FREE_GENERATION_LIMIT = 5;

// ── Block Pricing (weekly unlock model) ──────────────────────────────────────
/** Standard price per 4-week block */
export const BLOCK_NGN = 4_000;
export const BLOCK_NGN_KOBO = BLOCK_NGN * 100;

/** FUNAAB student discount per block */
export const BLOCK_FUNAAB_NGN = 3_500;
export const BLOCK_FUNAAB_NGN_KOBO = BLOCK_FUNAAB_NGN * 100;

/**
 * Maps a week number to its block number.
 * Week 1 → 0 (always free). Weeks 2–5 → 1. Weeks 6–9 → 2. Etc.
 */
export function weekToBlock(weekNumber: number): number {
  if (weekNumber <= 1) return 0;
  return Math.ceil((weekNumber - 1) / 4);
}

/**
 * Returns the week range [start, end] (inclusive) for a given block number.
 * Pass totalWeeks to cap the end at the last week of the plan.
 */
export function blockWeekRange(
  blockNumber: number,
  totalWeeks?: number
): { start: number; end: number } {
  const start = (blockNumber - 1) * 4 + 2;
  const end = totalWeeks ? Math.min(start + 3, totalWeeks) : start + 3;
  return { start, end };
}

/** Total number of paid blocks needed for a plan of this many weeks. */
export function totalBlockCount(totalWeeks: number): number {
  if (totalWeeks <= 1) return 0;
  return Math.ceil((totalWeeks - 1) / 4);
}
