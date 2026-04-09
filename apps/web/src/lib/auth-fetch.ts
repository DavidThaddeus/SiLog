import { supabase } from "./supabase";

/**
 * Returns fetch headers with the current user's auth token.
 * Use this for all API calls to /api/ai/* routes.
 */
export async function authHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}),
  };
}
