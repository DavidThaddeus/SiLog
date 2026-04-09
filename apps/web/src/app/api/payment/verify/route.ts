import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";

const PLAN_MONTHS: Record<string, number> = {
  monthly: 1,
  "3months": 3,
  "6months": 6,
  "12months": 12,
};

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  const body = await req.json() as { reference: string; planId: string; upgradeMonths?: number };
  const { reference, planId, upgradeMonths } = body;

  if (!reference || !planId) {
    return NextResponse.json({ error: "Missing reference or planId" }, { status: 400 });
  }

  // Verify transaction with Paystack
  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!paystackRes.ok) {
    return NextResponse.json({ error: "Paystack verification request failed" }, { status: 502 });
  }

  const paystackData = await paystackRes.json() as {
    status: boolean;
    data: { status: string; amount: number; customer: { email: string } };
  };

  if (!paystackData.status || paystackData.data.status !== "success") {
    return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
  }

  // "upgrade" = monthly subscriber paying remaining months → becomes full payer
  // Full payment = anything that is not purely "monthly" (3/6/12months or upgrade)
  const isFullPayment = planId !== "monthly";

  // Monthly: expires in 1 month. Full/upgrade: no expiry — paid forever.
  const expiresAt = isFullPayment ? null : (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  })();

  // months covered by this payment (used in transaction log)
  const monthsCovered = PLAN_MONTHS[planId] ?? upgradeMonths ?? 1;

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Update profile — core columns first (always exist), then extended columns best-effort
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      subscription_status: "paid",
      subscription_expires_at: expiresAt?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("Failed to update subscription:", profileError);
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }

  // Best-effort: set is_full_payment (column added via migration — may not exist yet)
  try {
    await adminClient
      .from("profiles")
      .update({ is_full_payment: isFullPayment })
      .eq("id", user.id);
  } catch { /* column may not exist yet — safe to ignore */ }

  // Log the transaction permanently
  await adminClient.from("payment_transactions").insert({
    user_id: user.id,
    paystack_reference: reference,
    plan_id: planId,
    months_covered: monthsCovered,
    amount_kobo: paystackData.data.amount,
    currency: "NGN",
    status: "success",
    is_full_payment: isFullPayment,
    subscription_expires_at: expiresAt?.toISOString() ?? null,
  });

  return NextResponse.json({
    ok: true,
    isFullPayment,
    expiresAt: expiresAt?.toISOString() ?? null,
    subscribedAt: new Date().toISOString(),
  });
}
