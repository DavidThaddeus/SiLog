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

export type PlanId = "monthly" | "full";

export const FREE_GENERATION_LIMIT = 5;
