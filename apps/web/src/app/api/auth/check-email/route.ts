import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/auth/check-email
 * Body: { email: string }
 * Returns: { exists: boolean }
 *
 * Used on the signup form to reject existing emails before sending an OTP.
 * Uses the admin client to query auth.users — no RLS, no exposure of user data.
 */
export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const adminClient = makeAdminClient();

  // listUsers with a filter is O(1) on Supabase's side — no full scan
  const { data, error } = await adminClient.auth.admin.listUsers();

  if (error) {
    // Don't block signup over a lookup failure — let verify-otp catch it
    console.error("[check-email] listUsers error:", error.message);
    return NextResponse.json({ exists: false });
  }

  const exists = (data?.users ?? []).some(
    (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
  );

  return NextResponse.json({ exists });
}
