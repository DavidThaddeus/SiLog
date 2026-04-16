import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { callAI } from "@/lib/ai-provider";

export interface ExtractActivitiesRequest {
  rawDescription: string;
  dayName: string;
}

export interface ExtractActivitiesResponse {
  activities: string[]; // list of short activity phrases, each 1 sentence max
}

const MOCK_ACTIVITIES: ExtractActivitiesResponse = {
  activities: [
    "Hardware diagnostics on 4 workstations",
    "RAM module replacement — DDR3 8GB",
    "CMOS battery function verification",
    "Submitted hardware condition report to IT Manager",
  ],
};

const hasAI = !!(
  process.env.OPENAI_API_KEY_GPT54 ||
  process.env.OPENAI_API_KEY_GPT54_MINI ||
  process.env.OPENROUTER_KEY_GPT54_MINI ||
  process.env.OPENROUTER_KEY_HAIKU ||
  process.env.ANTHROPIC_API_KEY
);

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rawDescription, dayName }: ExtractActivitiesRequest = await req.json();

  if (!hasAI) return NextResponse.json(MOCK_ACTIVITIES);

  try {
    const result = await callAI({
      maxTokens: 600,
      temperature: 0.1,
      jsonMode: true,
      messages: [
        {
          role: "user",
          content: `You are reading a SIWES student's informal description of their workday. Extract every distinct activity as a clear, complete phrase.

Student's ${dayName} description:
"""
${rawDescription}
"""

Return a JSON object: { "activities": ["activity 1", "activity 2", ...] }

STRICT RULES:
- Each activity MUST be a complete, meaningful phrase that describes a real task (minimum 4 words each)
- WRONG: "audit", "systems", "Mr Hassan", "fixes" — these are tiny word fragments, NOT activities
- RIGHT: "Performed system audit and diagnostic fixes on company all-in-one computers", "Disassembled equipment to diagnose hardware faults", "Learnt about motherboard components and their functions"
- Describe WHAT was done, not just a noun. Always include an action verb.
- Group closely related sub-tasks into one activity (e.g. disassembly + diagnosis = one activity)
- Extract every distinct task mentioned — separate tasks that are genuinely different
- Do not invent activities not mentioned in the description
- Past tense throughout
- Return ONLY the JSON, no markdown, no explanation`,
        },
      ],
    });

    const raw = result.text.trim();
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed: ExtractActivitiesResponse = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[ai/extract-activities]", err);
    return NextResponse.json(MOCK_ACTIVITIES);
  }
}
