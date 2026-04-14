import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { instruction, currentNotes, dayName } = await req.json();

  const hasAI = !!(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_GPT4O || process.env.OPENAI_API_KEY_GPT4O_MINI || process.env.OPENROUTER_KEY_GEMINI || process.env.OPENROUTER_KEY_HAIKU || process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  if (!hasAI) {
    return NextResponse.json({
      explanation: "Preview mode — add ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to enable live rewriting.",
      rewritten: currentNotes,
    });
  }

  // ── Daily rate limit ─────────────────────────────────────────────────────────
  const { makeAdminClient, checkDailyLimit, incrementDailyLimit } = await import("@/lib/ai-rate-limit");
  const adminClient = makeAdminClient();
  const userId = (auth as { user: { id: string } }).user.id;
  const rateLimit = await checkDailyLimit(userId, adminClient);
  if (rateLimit.blocked) return rateLimit.response;
  await incrementDailyLimit(userId, adminClient, (rateLimit as { callsToday: number }).callsToday);

  try {
    const { callAI } = await import("@/lib/ai-provider");
    const result = await callAI({
      maxTokens: 2000,
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
    });
  } catch (err) {
    console.error("[ai/rewrite]", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
