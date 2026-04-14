/**
 * Unified AI provider — six backends, resolved in priority order:
 *
 * 1. OpenAI GPT-4o       (OPENAI_API_KEY_GPT4O)        → gpt-4o             (PRIMARY)
 * 2. OpenAI GPT-4o-mini  (OPENAI_API_KEY_GPT4O_MINI)   → gpt-4o-mini        (FALLBACK)
 * 3. OpenRouter Gemini   (OPENROUTER_KEY_GEMINI)        → google/gemini-2.5-flash-preview
 * 4. OpenRouter Haiku    (OPENROUTER_KEY_HAIKU)         → anthropic/claude-haiku-4-5
 * 5. Direct Anthropic    (ANTHROPIC_API_KEY)             → claude-haiku-4-5-20251001
 * 6. Direct Gemini       (GOOGLE_GENERATIVE_AI_API_KEY)  → gemini-2.0-flash   (LAST RESORT)
 *
 * All keys are optional. Comment/uncomment in .env.local to choose active providers.
 * No code changes ever needed — pure .env.local switching.
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

const OPENAI_GPT4O_MODEL      = "gpt-4o";
const OPENAI_GPT4O_MINI_MODEL = "gpt-4o-mini";
const OR_GEMINI_MODEL         = "google/gemini-2.5-flash-preview";
const OR_HAIKU_MODEL          = "anthropic/claude-haiku-4-5";
const ANTHROPIC_MODEL         = "claude-haiku-4-5-20251001";
const GEMINI_MODEL            = "gemini-2.0-flash";
const OPENROUTER_BASE         = "https://openrouter.ai/api/v1/chat/completions";
const OPENAI_BASE             = "https://api.openai.com/v1/chat/completions";

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function callAI(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<AIResult> {
  const { messages, system, maxTokens = 2000, temperature = 0.2, jsonMode = false } = params;

  // One key covers both GPT-4o and GPT-4o-mini — they are different models on the same account
  const openaiKey     = process.env.OPENAI_API_KEY_GPT4O || process.env.OPENAI_API_KEY;
  const orGeminiKey   = process.env.OPENROUTER_KEY_GEMINI;
  const orHaikuKey    = process.env.OPENROUTER_KEY_HAIKU;
  const anthropicKey  = process.env.ANTHROPIC_API_KEY;
  const geminiKey     = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  // ── OpenAI GPT-4o (primary) ─────────────────────────────────────────────────
  if (openaiKey) {
    console.log("[ai-provider] Using OpenAI GPT-4o");
    return callOpenAIChat({ messages, system, maxTokens, temperature, jsonMode, apiKey: openaiKey, model: OPENAI_GPT4O_MODEL });
  }

  // ── OpenRouter Gemini ───────────────────────────────────────────────────────
  if (orGeminiKey) {
    console.log("[ai-provider] Using OpenRouter Gemini");
    return callOpenRouter({ messages, system, maxTokens, apiKey: orGeminiKey, model: OR_GEMINI_MODEL });
  }

  // ── OpenRouter Haiku ────────────────────────────────────────────────────────
  if (orHaikuKey) {
    console.log("[ai-provider] Using OpenRouter Haiku");
    return callOpenRouter({ messages, system, maxTokens, apiKey: orHaikuKey, model: OR_HAIKU_MODEL });
  }

  // ── Direct Anthropic ────────────────────────────────────────────────────────
  if (anthropicKey) {
    console.log("[ai-provider] Using direct Anthropic (Haiku)");
    return callAnthropic({ messages, system, maxTokens, apiKey: anthropicKey });
  }

  // ── Direct Gemini ───────────────────────────────────────────────────────────
  if (geminiKey) {
    console.log("[ai-provider] Using direct Google Gemini");
    return callGemini({ messages, system, maxTokens, apiKey: geminiKey });
  }

  throw new Error(
    "No AI provider configured. Set one of: OPENAI_API_KEY_GPT4O, OPENAI_API_KEY_GPT4O_MINI, " +
    "OPENROUTER_KEY_GEMINI, OPENROUTER_KEY_HAIKU, ANTHROPIC_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY."
  );
}

// ─── OpenAI Chat Completions (GPT-4o / GPT-4o-mini) ──────────────────────────

async function callOpenAIChat(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens: number;
  temperature: number;
  jsonMode: boolean;
  apiKey: string;
  model: string;
}): Promise<AIResult> {
  const { messages, system, maxTokens, temperature, jsonMode, apiKey, model } = params;

  const openaiMessages: { role: string; content: string }[] = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  let res: Response;
  try {
    res = await fetch(OPENAI_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: openaiMessages,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI ${model} HTTP ${res.status}: ${errText}`);
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

// ─── OpenRouter (shared for Gemini and Haiku) ─────────────────────────────────

async function callOpenRouter(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens: number;
  apiKey: string;
  model: string;
}): Promise<AIResult> {
  const { messages, system, maxTokens, apiKey, model } = params;

  const orMessages: { role: string; content: string }[] = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let res: Response;
  try {
    res = await fetch(OPENROUTER_BASE, {
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
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

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
