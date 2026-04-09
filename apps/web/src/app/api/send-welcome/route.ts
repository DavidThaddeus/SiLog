import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Resend not configured — silently skip, don't block onboarding
    return NextResponse.json({ sent: false, reason: "RESEND_API_KEY not set" });
  }

  const { fullName, email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const firstName = fullName?.split(" ")[0] ?? "there";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to SiLog</title>
</head>
<body style="margin:0;padding:0;background:#F9F5F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5F2;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:#4B2E2B;padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#F9F5F2;letter-spacing:-0.5px;">SiLog</div>
              <div style="font-size:11px;color:rgba(249,245,242,0.65);letter-spacing:0.15em;text-transform:uppercase;margin-top:4px;">Logbook Assistant</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2D1810;">Hi ${firstName} 👋</p>
              <p style="margin:0 0 24px;font-size:15px;color:#5C4033;line-height:1.7;">
                Welcome to SiLog — your AI-powered SIWES logbook assistant. Your profile is set up and your logbook weeks are ready.
              </p>

              <!-- What's next -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDF8F5;border-radius:12px;border:1px solid #E8D5C8;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8C5A3C;">What to do next</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom:12px;vertical-align:top;">
                          <span style="display:inline-block;width:24px;height:24px;background:#8C5A3C;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;margin-right:12px;flex-shrink:0;">1</span>
                          <span style="font-size:14px;color:#3D2010;line-height:24px;">Go to your <strong>Dashboard</strong> to see your week-by-week logbook.</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:12px;vertical-align:top;">
                          <span style="display:inline-block;width:24px;height:24px;background:#8C5A3C;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;margin-right:12px;">2</span>
                          <span style="font-size:14px;color:#3D2010;line-height:24px;">Click <strong>New Entry</strong> for any week and let AI draft your logbook entry.</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="vertical-align:top;">
                          <span style="display:inline-block;width:24px;height:24px;background:#8C5A3C;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;margin-right:12px;">3</span>
                          <span style="font-size:14px;color:#3D2010;line-height:24px;">Use <strong>Defense Prep</strong> to practice answering panel questions for your final assessment.</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Free plan note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;border-radius:10px;border-left:4px solid #8C5A3C;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#5C4033;line-height:1.6;">
                      You have <strong>5 free AI generations</strong> to get started. Subscribe monthly for unlimited access — just <strong>₦4,000/month</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://silog.app"}/dashboard"
                       style="display:inline-block;padding:14px 40px;background:#8C5A3C;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.02em;">
                      Go to your Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #F0E6DE;text-align:center;">
              <p style="margin:0;font-size:11px;color:#A08070;line-height:1.6;">
                You're receiving this because you created a SiLog account.<br />
                If this wasn't you, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: "SiLog <noreply@silog.app>",
      to: email,
      subject: `Welcome to SiLog, ${firstName} — your logbook is ready`,
      html,
    });

    if (error) {
      console.error("[send-welcome] Resend error:", error);
      return NextResponse.json({ sent: false, error: error.message });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[send-welcome] Unexpected error:", err);
    return NextResponse.json({ sent: false });
  }
}
