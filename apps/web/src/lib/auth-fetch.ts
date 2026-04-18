import { supabase } from "./supabase";

/**
 * Returns fetch headers with the current user's auth token.
 * Use this for all API calls to /api/ai/* routes.
 *
 * Strategy:
 * 1. Try getSession() — returns cached session and auto-refreshes if expired.
 * 2. If that returns no token, force a refresh via refreshSession().
 * 3. If still nothing, return headers without auth (route will 401 → user sees error).
 */
export async function authHeaders(): Promise<HeadersInit> {
  let { data: { session } } = await supabase.auth.getSession();

  // If getSession returned no token, the session may have expired and the
  // background refresh hasn't fired yet — force a refresh now.
  if (!session?.access_token) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      // Refresh token is invalid/expired — sign out so SIGNED_OUT fires
      // and the layout's onAuthStateChange redirects to /login.
      supabase.auth.signOut().catch(() => {});
      return { "Content-Type": "application/json" };
    }
    session = refreshed.session;
  }

  return {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };
}
