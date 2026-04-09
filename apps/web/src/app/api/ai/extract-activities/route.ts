import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

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

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const { rawDescription, dayName }: ExtractActivitiesRequest = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json(MOCK_ACTIVITIES);

  try {
    const { Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Extract every distinct activity from this SIWES student's description of their ${dayName}.

Description:
"""
${rawDescription}
"""

Return a JSON object: { "activities": ["activity 1", "activity 2", ...] }

Rules:
- Each activity is a short phrase (1 sentence max), past tense
- Extract EVERY distinct task mentioned, even minor ones
- Do not combine separate activities
- Do not add activities not mentioned
- Return ONLY the JSON, no markdown`,
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed: ExtractActivitiesResponse = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[ai/extract-activities]", err);
    return NextResponse.json(MOCK_ACTIVITIES);
  }
}
