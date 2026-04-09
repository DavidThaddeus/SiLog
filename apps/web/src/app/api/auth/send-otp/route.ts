import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function signupHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F9F5F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:#4B2E2B;padding:28px 40px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:#F9F5F2;">SiLog</div>
          <div style="font-size:10px;color:rgba(249,245,242,0.6);letter-spacing:0.15em;text-transform:uppercase;margin-top:3px;">Logbook Assistant</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#2D1810;">Verify your email</p>
          <p style="margin:0 0 28px;font-size:14px;color:#5C4033;line-height:1.7;">
            Enter this code to confirm your SiLog account. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="text-align:center;margin:0 0 28px;">
            <div style="display:inline-block;background:#FDF8F5;border:2px solid #8C5A3C;border-radius:12px;padding:20px 40px;">
              <span style="font-size:42px;font-weight:900;letter-spacing:0.2em;color:#4B2E2B;font-family:'Courier New',monospace;">${code}</span>
            </div>
          </div>
          <p style="margin:0;font-size:12px;color:#A08070;text-align:center;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function recoveryHtml(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F9F5F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:#4B2E2B;padding:28px 40px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:#F9F5F2;">SiLog</div>
          <div style="font-size:10px;color:rgba(249,245,242,0.6);letter-spacing:0.15em;text-transform:uppercase;margin-top:3px;">Logbook Assistant</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#2D1810;">Reset your password</p>
          <p style="margin:0 0 28px;font-size:14px;color:#5C4033;line-height:1.7;">
            Enter this code to set a new password. It expires in <strong>10 minutes</strong>.
          </p>
          <div style="text-align:center;margin:0 0 28px;">
            <div style="display:inline-block;background:#FDF8F5;border:2px solid #8C5A3C;border-radius:12px;padding:20px 40px;">
              <span style="font-size:42px;font-weight:900;letter-spacing:0.2em;color:#4B2E2B;font-family:'Courier New',monospace;">${code}</span>
            </div>
          </div>
          <p style="margin:0;font-size:12px;color:#A08070;text-align:center;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendViaGmail(to: string, subject: string, html: string): Promise<string | null> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  try {
    await transporter.sendMail({ from: `SiLog <${process.env.GMAIL_USER}>`, to, subject, html });
    return null;
  } catch (err: unknown) {
    return err instanceof Error ? err.message : "Gmail send failed";
  }
}

async function sendViaResend(to: string, subject: string, html: string, apiKey: string): Promise<string | null> {
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: `SiLog <${fromEmail}>`, to, subject, html });
  return error ? error.message : null;
}

export async function POST(req: NextRequest) {
  const { email, type } = await req.json() as { email: string; type: "signup" | "recovery" };

  if (!email || !type) {
    return NextResponse.json({ error: "email and type required" }, { status: 400 });
  }

  const hasGmail = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const resendKey = process.env.RESEND_API_KEY;

  if (!hasGmail && !resendKey) {
    return NextResponse.json(
      { error: "Email service not configured. Add GMAIL_USER + GMAIL_APP_PASSWORD to your environment." },
      { status: 503 }
    );
  }

  const adminClient = makeAdminClient();

  // Rate-limit: block if a code was sent in the last 60 seconds
  const { data: recent } = await adminClient
    .from("email_otps")
    .select("created_at")
    .eq("email", email)
    .eq("type", type)
    .eq("used", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent) {
    const secondsAgo = (Date.now() - new Date(recent.created_at).getTime()) / 1000;
    if (secondsAgo < 60) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(60 - secondsAgo)} seconds before requesting another code.` },
        { status: 429 }
      );
    }
  }

  // Delete old unused codes for this email+type
  await adminClient.from("email_otps").delete().eq("email", email).eq("type", type).eq("used", false);

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: insertError } = await adminClient.from("email_otps").insert({
    email,
    code,
    type,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error("[send-otp] DB insert error:", insertError);
    return NextResponse.json({ error: "Could not create verification code." }, { status: 500 });
  }

  const subject = type === "signup" ? "Your SiLog verification code" : "Your SiLog password reset code";
  const html = type === "signup" ? signupHtml(code) : recoveryHtml(code);

  // Priority: Gmail (no domain needed) → Resend (needs verified domain)
  const sendError = hasGmail
    ? await sendViaGmail(email, subject, html)
    : await sendViaResend(email, subject, html, resendKey!);

  if (sendError) {
    console.error("[send-otp] send error:", sendError);
    await adminClient.from("email_otps").delete().eq("email", email).eq("type", type).eq("code", code);
    return NextResponse.json({ error: "Failed to send email: " + sendError }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
