import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verifies the Bearer token in the Authorization header.
 * Returns the authenticated user or a 401 NextResponse.
 *
 * Usage in an API route:
 *   const result = await requireAuth(req);
 *   if (result instanceof NextResponse) return result;
 *   const { user } = result;
 */
export async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  return { user };
}
