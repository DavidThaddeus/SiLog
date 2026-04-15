import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export interface DefenseQuestion {
  id: string;
  question: string;
  hint: string;
}

export interface DefenseQuestionsResponse {
  questions: DefenseQuestion[];
}

const FALLBACK_TEMPLATES = [
  {
    q: (w: number) => `Walk the panel through your most significant activity during week ${w} and explain how you executed it.`,
    h: "Mention specific tools, steps taken, and the outcome.",
  },
  {
    q: (_: number, firstActivity: string) =>
      firstActivity
        ? `You mentioned "${firstActivity}" in your logbook. Can you explain the technical process involved in detail?`
        : "Pick one technical task from this week and explain the process step by step.",
    h: "Break it into clear steps. Reference any theory or principles you applied.",
  },
  {
    q: (_: number, __: string, deptBridge: string) =>
      deptBridge
        ? `Your entry references ${deptBridge}. How does this concept apply to the practical work you described?`
        : "How did the theoretical knowledge from your department relate to the practical work you did this week?",
    h: "Connect a specific academic concept to a real task you performed.",
  },
  {
    q: () => "What was the most technically challenging problem you encountered this week, and how did you resolve it?",
    h: "Describe the problem clearly, your diagnostic process, and how you arrived at a solution.",
  },
  {
    q: () => "If you were to repeat this week, what would you do differently to improve your output or efficiency?",
    h: "Show critical thinking. Mention specific improvements and why they would matter.",
  },
];

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { weekNumber, startDate, endDate, weekSummary, days } = await req.json();

  const hasAI = !!(process.env.OPENAI_API_KEY_GPT54 || process.env.OPENAI_API_KEY_GPT54_MINI || process.env.OPENROUTER_KEY_GPT54_MINI || process.env.OPENROUTER_KEY_HAIKU || process.env.ANTHROPIC_API_KEY);

  if (!hasAI) {
    const firstDay = days?.[0];
    const firstActivity = firstDay?.keyActivities?.[0] ?? firstDay?.progressChartEntry ?? "";
    const deptBridge = firstDay?.deptBridgeUsed ?? "";
    const questions: DefenseQuestion[] = FALLBACK_TEMPLATES.map((t, i) => ({
      id: `q-${i + 1}`,
      question: t.q(weekNumber, firstActivity, deptBridge),
      hint: t.h,
    }));
    return NextResponse.json({ questions } as DefenseQuestionsResponse);
  }

  // ── Daily rate limit ─────────────────────────────────────────────────────────
  const { makeAdminClient, checkDailyLimit, incrementDailyLimit } = await import("@/lib/ai-rate-limit");
  const adminClient = makeAdminClient();
  const userId = (auth as { user: { id: string } }).user.id;
  const rateLimit = await checkDailyLimit(userId, adminClient);
  if (rateLimit.blocked) return rateLimit.response;
  await incrementDailyLimit(userId, adminClient, (rateLimit as { callsToday: number }).callsToday);

  const weekContext = days
    .map((d: { dayName: string; progressChartEntry: string; keyActivities: string[]; technicalNotes: string; deptBridgeUsed: string }) =>
      `${d.dayName}: ${d.progressChartEntry || "—"}\nActivities: ${d.keyActivities?.join(", ") || "—"}\nNotes: ${(d.technicalNotes || "").slice(0, 200)}`
    )
    .join("\n\n");

  const prompt = `You are a SIWES/industrial attachment defense examiner at a Nigerian university.
Generate exactly 5 panel-style defense questions based on the student's Week ${weekNumber} logbook entries (${startDate} to ${endDate}).

WEEK CONTEXT:
${weekContext}
${weekSummary ? `\nWeekly Summary: ${weekSummary}` : ""}

Generate 5 questions that:
1. Are based directly on the student's real logged activities — not generic
2. Range from easy recall to challenging analysis
3. Test understanding of both the practical work AND academic connections
4. Sound exactly like what a real university defense panel would ask

Return ONLY a JSON array with exactly 5 objects, each with:
- "id": "q-1" through "q-5"
- "question": the panel question (start directly — no "Could you explain..." preamble, go straight to the point)
- "hint": what a strong answer should cover (1 sentence, for the student's reference)

Example format:
[{"id":"q-1","question":"Walk us through the RAM identification procedure you performed on Wednesday.","hint":"Mention DDR types, voltage differences, and how you confirmed compatibility."}]`;

  try {
    const { callAI } = await import("@/lib/ai-provider");
    const result = await callAI({ messages: [{ role: "user", content: prompt }], maxTokens: 1200 });
    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found");

    const questions: DefenseQuestion[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ questions, _usage: result.usage });
  } catch {
    // Fallback
    const firstDay = days?.[0];
    const firstActivity = firstDay?.keyActivities?.[0] ?? firstDay?.progressChartEntry ?? "";
    const deptBridge = firstDay?.deptBridgeUsed ?? "";
    const questions: DefenseQuestion[] = FALLBACK_TEMPLATES.map((t, i) => ({
      id: `q-${i + 1}`,
      question: t.q(weekNumber, firstActivity, deptBridge),
      hint: t.h,
    }));
    return NextResponse.json({ questions } as DefenseQuestionsResponse);
  }
}
