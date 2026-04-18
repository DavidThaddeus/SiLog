import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

const FREE_GENERATION_LIMIT = 5;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { instruction, currentNotes, dayName, notesLengthPreference } = await req.json();
  const isShortNotes = notesLengthPreference === "short";

  const hasAI = !!(process.env.OPENAI_API_KEY_GPT54 || process.env.OPENAI_API_KEY_GPT54_MINI || process.env.OPENROUTER_KEY_GPT54_MINI || process.env.OPENROUTER_KEY_HAIKU || process.env.ANTHROPIC_API_KEY);
  if (!hasAI) {
    return NextResponse.json({
      explanation: "Preview mode — add an AI provider key to .env.local to enable live rewriting.",
      rewritten: currentNotes,
    });
  }

  const { makeAdminClient, checkDailyLimit, incrementDailyLimit, DAILY_LIMIT_FREE, DAILY_LIMIT_PAID } = await import("@/lib/ai-rate-limit");
  const adminClient = makeAdminClient();
  const userId = (auth as { user: { id: string } }).user.id;

  // ── Step 1: Check daily limit ────────────────────────────────────────────────
  const rateLimit = await checkDailyLimit(userId, adminClient);
  if (rateLimit.blocked) return rateLimit.response;
  const dailyCheck = rateLimit as { callsToday: number; isPaid: boolean };

  // ── Step 2: Check lifetime limit for free users ──────────────────────────────
  const { data: profile } = await adminClient
    .from("profiles")
    .select("subscription_status, ai_generations_used")
    .eq("id", userId)
    .maybeSingle();

  const genUsed: number = profile?.ai_generations_used ?? 0;
  const isPaid = profile?.subscription_status === "paid" || dailyCheck.isPaid;
  if (!isPaid && genUsed >= FREE_GENERATION_LIMIT) {
    return NextResponse.json({ error: "free_limit_reached" }, { status: 402 });
  }

  // ── Step 3: Increment both counters after all checks pass ────────────────────
  await Promise.all([
    incrementDailyLimit(userId, adminClient, dailyCheck.callsToday),
    adminClient
      .from("profiles")
      .update({ ai_generations_used: genUsed + 1 })
      .eq("id", userId),
  ]);

  const newCallsToday = dailyCheck.callsToday + 1;
  const dailyLimit = isPaid ? DAILY_LIMIT_PAID : DAILY_LIMIT_FREE;

  try {
    const { callAI } = await import("@/lib/ai-provider");
    const result = await callAI({
      maxTokens: isShortNotes ? 450 : 600,
      messages: [{
        role: "user",
        content: `You are an expert SIWES logbook editor for Nigerian university students.

The student has a technical notes entry for ${dayName} that needs to be improved.

CURRENT NOTES:
${currentNotes}

INSTRUCTION: ${instruction}

Rules:
- Always write in professional, academic engineering prose
- All study activities must be framed as workplace activity
- Connect activities to relevant academic/theoretical concepts from Nigerian university curricula
- Use formal language appropriate for a university defence panel
- Do NOT add fabricated activities — only improve what is already there
- Return ONLY the rewritten notes text, nothing else`,
      }],
    });

    return NextResponse.json({
      explanation: "Here is the revised version based on your instruction:",
      rewritten: result.text || currentNotes,
      _usage: result.usage,
      _callsToday: newCallsToday,
      _dailyLimit: dailyLimit,
      _generationsUsed: genUsed + 1,
    });
  } catch (err) {
    console.error("[ai/rewrite]", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
