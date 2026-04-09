import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    email: string;
    code: string;
    type: "signup" | "recovery";
    password?: string;  // required for signup
    newPassword?: string; // required for recovery
  };

  const { email, code, type, password, newPassword } = body;

  if (!email || !code || !type) {
    return NextResponse.json({ error: "email, code, and type required" }, { status: 400 });
  }

  const adminClient = makeAdminClient();

  // Look up the OTP
  const { data: otp, error: fetchError } = await adminClient
    .from("email_otps")
    .select("*")
    .eq("email", email)
    .eq("type", type)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !otp) {
    return NextResponse.json({ error: "Invalid or expired code. Request a new one." }, { status: 400 });
  }

  // Check expiry
  if (new Date(otp.expires_at) < new Date()) {
    await adminClient.from("email_otps").delete().eq("id", otp.id);
    return NextResponse.json({ error: "Code has expired. Request a new one." }, { status: 400 });
  }

  // Check code match
  if (otp.code !== code.trim()) {
    return NextResponse.json({ error: "Incorrect code. Check your email and try again." }, { status: 400 });
  }

  // Mark as used immediately to prevent replay
  await adminClient.from("email_otps").update({ used: true }).eq("id", otp.id);

  if (type === "signup") {
    if (!password) {
      return NextResponse.json({ error: "password required for signup" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    }

    // Create user as already confirmed — bypasses Supabase email entirely
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError || !newUser.user) {
      console.error("[verify-otp] createUser error:", createError);
      return NextResponse.json({ error: createError?.message ?? "Failed to create account." }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId: newUser.user.id });
  }

  if (type === "recovery") {
    if (!newPassword) {
      return NextResponse.json({ error: "newPassword required for recovery" }, { status: 400 });
    }

    // Find user by email
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    const user = usersData?.users?.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ error: "No account found with this email." }, { status: 404 });
    }

    // Update password directly
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error("[verify-otp] updateUser error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
