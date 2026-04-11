/**
 * Unified AI provider — three backends, resolved in priority order:
 *
 * 1. OpenRouter Gemini  (OPENROUTER_KEY_GEMINI)   → google/gemini-2.5-flash-preview
 * 2. OpenRouter Haiku   (OPENROUTER_KEY_HAIKU)     → anthropic/claude-haiku-4-5  (fallback if Gemini fails)
 * 3. Direct Anthropic   (ANTHROPIC_API_KEY)         → claude-haiku-4-5-20251001
 * 4. Direct Gemini      (GOOGLE_GENERATIVE_AI_KEY)  → gemini-2.0-flash
 *
 * OpenRouter keys take priority over direct keys when both are present.
 * To test one OpenRouter model in isolation, comment out the other key in .env.local.
 * The full system prompt is always passed regardless of which backend fires.
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

// ─── Model identifiers ────────────────────────────────────────────────────────

const OR_GEMINI_MODEL  = "google/gemini-2.5-flash-preview";
const OR_HAIKU_MODEL   = "anthropic/claude-haiku-4-5";
const ANTHROPIC_MODEL  = "claude-haiku-4-5-20251001";
const GEMINI_MODEL     = "gemini-2.0-flash";
const OPENROUTER_BASE  = "https://openrouter.ai/api/v1/chat/completions";

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function callAI(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens?: number;
}): Promise<AIResult> {
  const { messages, system, maxTokens = 2000 } = params;

  const orGeminiKey  = process.env.OPENROUTER_KEY_GEMINI;
  const orHaikuKey   = process.env.OPENROUTER_KEY_HAIKU;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey    = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // ── OpenRouter path (primary + fallback) ────────────────────────────────────
  if (orGeminiKey || orHaikuKey) {
    // Try Gemini first (if key is present)
    if (orGeminiKey) {
      try {
        return await callOpenRouter({
          messages, system, maxTokens,
          apiKey: orGeminiKey,
          model: OR_GEMINI_MODEL,
        });
      } catch (err) {
        // Only fall through to Haiku if Haiku key exists
        if (!orHaikuKey) throw err;
        console.warn("[ai-provider] OpenRouter Gemini failed, falling back to Haiku:", (err as Error).message);
      }
    }

    // Haiku fallback (or primary if Gemini key is absent)
    if (orHaikuKey) {
      return callOpenRouter({
        messages, system, maxTokens,
        apiKey: orHaikuKey,
        model: OR_HAIKU_MODEL,
      });
    }
  }

  // ── Direct Anthropic ────────────────────────────────────────────────────────
  if (anthropicKey) {
    return callAnthropic({ messages, system, maxTokens, apiKey: anthropicKey });
  }

  // ── Direct Gemini ───────────────────────────────────────────────────────────
  if (geminiKey) {
    return callGemini({ messages, system, maxTokens, apiKey: geminiKey });
  }

  throw new Error(
    "No AI provider configured. Set OPENROUTER_KEY_GEMINI, OPENROUTER_KEY_HAIKU, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY."
  );
}

// ─── OpenRouter (shared for both Gemini and Haiku) ────────────────────────────

async function callOpenRouter(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens: number;
  apiKey: string;
  model: string;
}): Promise<AIResult> {
  const { messages, system, maxTokens, apiKey, model } = params;

  // OpenRouter uses OpenAI-compatible format.
  // System prompt is passed as a { role: "system" } message prepended to the array.
  const orMessages: { role: string; content: string }[] = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(OPENROUTER_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://silog.app",
      "X-Title": "SiLog",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: orMessages,
    }),
    // 30-second timeout — if Gemini hangs, we need to fall through to Haiku promptly
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${model} error ${res.status}: ${errText}`);
  }

  const data = await res.json() as {
    choices: { message: { content: string } }[];
    usage: { prompt_tokens: number; completion_tokens: number };
    model: string;
  };

  const text = data.choices?.[0]?.message?.content ?? "";
  return {
    text,
    usage: {
      model: data.model ?? model,
      input: data.usage?.prompt_tokens ?? 0,
      output: data.usage?.completion_tokens ?? 0,
    },
  };
}

// ─── Direct Anthropic ─────────────────────────────────────────────────────────

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

// ─── Direct Gemini (REST) ─────────────────────────────────────────────────────

async function callGemini(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens: number;
  apiKey: string;
}): Promise<AIResult> {
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
