import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export interface AnswerResult {
  score: number;       // 0–100
  feedback: string;
  modelAnswer: string;
}

export interface ScoreAnswersResponse {
  results: AnswerResult[];
  overallScore: number;
}

function simpleScore(answer: string, hint: string): AnswerResult {
  const len = answer.trim().length;
  const hintWords = hint.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  const mentionedHints = hintWords.filter((w) => answer.toLowerCase().includes(w)).length;
  const hintCoverage = hintWords.length > 0 ? mentionedHints / hintWords.length : 0;

  let score: number;
  if (len < 30) {
    score = 20;
  } else if (len < 80) {
    score = 40 + Math.round(hintCoverage * 20);
  } else if (len < 200) {
    score = 55 + Math.round(hintCoverage * 25);
  } else {
    score = 70 + Math.round(hintCoverage * 25);
  }

  const feedback =
    score >= 80
      ? "Good answer. You covered the key points clearly and showed strong understanding."
      : score >= 60
      ? "Decent attempt. Try to include more specific technical detail and reference the academic concepts involved."
      : score >= 40
      ? "Your answer is too brief or lacks technical depth. The panel expects specific processes, not general statements."
      : "Answer is too short. Expand significantly with specific steps, tools, and outcomes.";

  const modelAnswer = `A strong answer would: ${hint} Reference specific tools or procedures used, connect to relevant academic theory, and conclude with the outcome or lesson learned.`;

  return { score: Math.min(100, score), feedback, modelAnswer };
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { weekSummary, days, qa } = await req.json();

  const hasAI = !!(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_GPT4O || process.env.OPENAI_API_KEY_GPT4O_MINI || process.env.OPENROUTER_KEY_GEMINI || process.env.OPENROUTER_KEY_HAIKU || process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);

  if (!hasAI) {
    const results: AnswerResult[] = qa.map(({ answer, hint }: { question: string; hint: string; answer: string }) =>
      simpleScore(answer, hint)
    );
    const overallScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    return NextResponse.json({ results, overallScore } as ScoreAnswersResponse);
  }

  // ── Daily rate limit ─────────────────────────────────────────────────────────
  const { makeAdminClient, checkDailyLimit, incrementDailyLimit } = await import("@/lib/ai-rate-limit");
  const adminClient = makeAdminClient();
  const userId = (auth as { user: { id: string } }).user.id;
  const rateLimit = await checkDailyLimit(userId, adminClient);
  if (rateLimit.blocked) return rateLimit.response;
  await incrementDailyLimit(userId, adminClient, (rateLimit as { callsToday: number }).callsToday);

  const weekContext = days
    .map((d: { dayName: string; technicalNotes: string; keyActivities: string[] }) =>
      `${d.dayName}: ${d.keyActivities?.join(", ") || "—"}`
    )
    .join("\n");

  const qaFormatted = qa
    .map((item: { question: string; hint: string; answer: string }, i: number) =>
      `Q${i + 1}: ${item.question}\nHint (what's expected): ${item.hint}\nStudent answer: ${item.answer || "[No answer given]"}`
    )
    .join("\n\n");

  const prompt = `You are a SIWES defense examiner marking a student's practice answers.

WEEK CONTEXT:
${weekContext}
${weekSummary ? `Weekly summary: ${weekSummary}` : ""}

QUESTIONS AND ANSWERS:
${qaFormatted}

Score each answer on a scale of 0–100:
- 80–100: Accurate, specific, connects theory to practice
- 60–79: Mostly correct but lacks depth or specificity
- 40–59: Partial understanding, vague or too brief
- 0–39: Incorrect, missing, or just one sentence

For each question return:
- "score": integer 0–100
- "feedback": 1–2 sentences of actionable feedback
- "modelAnswer": what a full-mark answer would include (2–3 sentences)

Return ONLY a JSON array of ${qa.length} objects in order, matching the question sequence.

Example: [{"score":75,"feedback":"Good effort but lacked specifics on the RAM types.","modelAnswer":"A strong answer would mention DDR2 vs DDR3 voltage differences, how you identified them visually, and quote compatibility requirements."}]`;

  try {
    const { callAI } = await import("@/lib/ai-provider");
    const result = await callAI({ messages: [{ role: "user", content: prompt }], maxTokens: 1800 });

    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array");

    const results: AnswerResult[] = JSON.parse(jsonMatch[0]);
    const overallScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    return NextResponse.json({ results, overallScore, _usage: result.usage });
  } catch {
    const results: AnswerResult[] = qa.map(({ answer, hint }: { question: string; hint: string; answer: string }) =>
      simpleScore(answer, hint)
    );
    const overallScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    return NextResponse.json({ results, overallScore } as ScoreAnswersResponse);
  }
}
