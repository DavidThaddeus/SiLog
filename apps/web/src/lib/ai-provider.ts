/**
 * Unified AI provider — supports Anthropic (Claude Haiku) and Google (Gemini Flash).
 *
 * Priority: ANTHROPIC_API_KEY → GOOGLE_GENERATIVE_AI_API_KEY
 *
 * To switch providers, just set/unset the relevant env var.
 * Both keys set → Anthropic wins (Claude Haiku is preferred).
 */

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIUsage {
  model: string;
  input: number;
  output: number;
}

export interface AIResult {
  text: string;
  usage: AIUsage;
}

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const GEMINI_MODEL    = "gemini-2.0-flash";

export async function callAI(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens?: number;
}): Promise<AIResult> {
  const { messages, system, maxTokens = 2000 } = params;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey    = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (anthropicKey) {
    return callAnthropic({ messages, system, maxTokens, apiKey: anthropicKey });
  }
  if (geminiKey) {
    return callGemini({ messages, system, maxTokens, apiKey: geminiKey });
  }

  throw new Error("No AI provider configured. Set ANTHROPIC_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.");
}

// ─── Anthropic ───────────────────────────────────────────────────────────────

async function callAnthropic(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens: number;
  apiKey: string;
}): Promise<AIResult> {
  const { Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: params.apiKey });

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: params.maxTokens,
    ...(params.system ? { system: params.system } : {}),
    messages: params.messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return {
    text,
    usage: {
      model: response.model,
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
    },
  };
}

// ─── Gemini (REST — no package needed) ───────────────────────────────────────

async function callGemini(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens: number;
  apiKey: string;
}): Promise<AIResult> {
  // Map messages to Gemini's "contents" format
  // Gemini doesn't support system in messages array — prepend as first user turn
  const contents = params.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { maxOutputTokens: params.maxTokens },
  };

  if (params.system) {
    body.systemInstruction = { parts: [{ text: params.system }] };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${params.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    candidates: { content: { parts: { text: string }[] } }[];
    usageMetadata: { promptTokenCount: number; candidatesTokenCount: number };
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const usage = data.usageMetadata;

  return {
    text,
    usage: {
      model: GEMINI_MODEL,
      input: usage?.promptTokenCount ?? 0,
      output: usage?.candidatesTokenCount ?? 0,
    },
  };
}
