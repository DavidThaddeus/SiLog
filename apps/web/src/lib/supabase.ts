import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// globalThis guard prevents multiple instances during Turbopack hot reload,
// which would cause Web Locks "lock stolen" errors on the auth token.
declare global {
  // eslint-disable-next-line no-var
  var __supabase: SupabaseClient | undefined;
}

export const supabase: SupabaseClient =
  globalThis.__supabase ??
  (globalThis.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Disable the Web Locks mutex — the globalThis singleton already
      // guarantees a single client instance, so the lock is unnecessary
      // and causes "lock stolen" noise in Turbopack dev mode.
      lock: (name, acquireTimeout, fn) => fn(),
    },
  }));
