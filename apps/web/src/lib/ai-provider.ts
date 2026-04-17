/**
 * Unified AI provider — 6 backends in priority order:
 *
 * 1. OpenAI GPT-5.4          (OPENAI_API_KEY_GPT54)        → gpt-5.4-2026-03-05        (PRIMARY)
 * 2. OpenAI GPT-5.4-mini     (OPENAI_API_KEY_GPT54_MINI)   → gpt-5.4-mini-2026-03-17   (FALLBACK)
 * 3. OpenRouter GPT-5.4      (OPENROUTER_KEY_GPT54)        → openai/gpt-5.4             (BACKUP)
 * 4. OpenRouter GPT-5.4-mini (OPENROUTER_KEY_GPT54_MINI)   → openai/gpt-5.4-mini        (BACKUP)
 * 5. OpenRouter Haiku 4.5    (OPENROUTER_KEY_HAIKU)        → anthropic/claude-haiku-4.5 (BACKUP)
 * 6. Direct Anthropic Haiku  (ANTHROPIC_API_KEY)           → claude-haiku-4-5-20251001  (EMERGENCY)
 *
 * Switch models by commenting/uncommenting keys in .env.local — no code changes ever needed.
 * If the active primary model fails at runtime, the system automatically falls back to the next available model.
 * IMPORTANT: Restart the dev server after any .env.local change — Next.js caches env vars in memory.
 */

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIUsage {
  model: string;
  input: number;
  output: number;
  cost: number;            // USD, calculated from token counts
  fallbackChain?: string[]; // models attempted before this one succeeded
}

export interface AIResult {
  text: string;
  usage: AIUsage;
}

// ─── Model identifiers ────────────────────────────────────────────────────────

const GPT54_MODEL      = "gpt-5.4-2026-03-05";
const GPT54_MINI_MODEL = "gpt-5.4-mini-2026-03-17";
const OR_GPT54_MODEL   = "openai/gpt-5.4";
const OR_GPT54_MINI    = "openai/gpt-5.4-mini";
const OR_HAIKU_MODEL   = "anthropic/claude-haiku-4.5";
const ANTHROPIC_MODEL  = "claude-haiku-4-5-20251001";

const OPENAI_BASE     = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

// ─── Cost table (USD per 1M tokens) ──────────────────────────────────────────

const COST_TABLE: Record<string, { input: number; output: number; cacheWrite?: number; cacheRead?: number }> = {
  [GPT54_MODEL]:      { input: 2.50, output: 15.00 },
  [GPT54_MINI_MODEL]: { input: 0.75, output: 3.00  },
  [OR_GPT54_MODEL]:   { input: 2.75, output: 16.50 }, // OpenRouter GPT-5.4 ~10% markup estimate
  [OR_GPT54_MINI]:    { input: 0.83, output: 3.30  }, // OpenRouter GPT-5.4-mini ~10% markup estimate
  [OR_HAIKU_MODEL]:   { input: 0.88, output: 4.40  }, // OpenRouter Haiku rate estimate
  // Anthropic Haiku 4.5: input $0.80, cache write $1.00 (1.25×), cache read $0.08 (0.1×), output $4.00
  [ANTHROPIC_MODEL]:  { input: 0.80, output: 4.00, cacheWrite: 1.00, cacheRead: 0.08 },
};

function calcCost(
  model: string,
  input: number,
  output: number,
  cacheWriteTokens = 0,
  cacheReadTokens = 0,
): number {
  const rates = COST_TABLE[model];
  if (!rates) return 0;
  const billableInput = input - cacheWriteTokens - cacheReadTokens;
  return (
    (billableInput      / 1_000_000) * rates.input +
    (cacheWriteTokens   / 1_000_000) * (rates.cacheWrite ?? rates.input * 1.25) +
    (cacheReadTokens    / 1_000_000) * (rates.cacheRead  ?? rates.input * 0.10) +
    (output             / 1_000_000) * rates.output
  );
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function callAI(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<AIResult> {
  const { messages, system, maxTokens = 2000, temperature = 0.2, jsonMode = false } = params;

  const gpt54Key     = process.env.OPENAI_API_KEY_GPT54;
  const gpt54MiniKey = process.env.OPENAI_API_KEY_GPT54_MINI;
  const orGpt54Key   = process.env.OPENROUTER_KEY_GPT54;
  const orGpt54Mini  = process.env.OPENROUTER_KEY_GPT54_MINI;
  const orHaikuKey   = process.env.OPENROUTER_KEY_HAIKU;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  type Provider = { name: string; fn: () => Promise<AIResult> };
  const chain: Provider[] = [];

  if (gpt54Key) {
    chain.push({
      name: GPT54_MODEL,
      fn: () => callOpenAI({ messages, system, maxTokens, temperature, jsonMode, apiKey: gpt54Key, model: GPT54_MODEL }),
    });
  }
  if (gpt54MiniKey) {
    chain.push({
      name: GPT54_MINI_MODEL,
      fn: () => callOpenAI({ messages, system, maxTokens, temperature, jsonMode, apiKey: gpt54MiniKey, model: GPT54_MINI_MODEL }),
    });
  }
  if (orGpt54Key) {
    chain.push({
      name: OR_GPT54_MODEL,
      fn: () => callOpenRouter({ messages, system, maxTokens, temperature, jsonMode, apiKey: orGpt54Key, model: OR_GPT54_MODEL }),
    });
  }
  if (orGpt54Mini) {
    chain.push({
      name: OR_GPT54_MINI,
      fn: () => callOpenRouter({ messages, system, maxTokens, temperature, jsonMode, apiKey: orGpt54Mini, model: OR_GPT54_MINI }),
    });
  }
  if (orHaikuKey) {
    chain.push({
      name: OR_HAIKU_MODEL,
      fn: () => callOpenRouter({ messages, system, maxTokens, temperature, jsonMode, apiKey: orHaikuKey, model: OR_HAIKU_MODEL }),
    });
  }
  if (anthropicKey) {
    chain.push({
      name: ANTHROPIC_MODEL,
      fn: () => callAnthropic({ messages, system, maxTokens, temperature, jsonMode, apiKey: anthropicKey }),
    });
  }

  if (chain.length === 0) {
    throw new Error(
      "No AI provider configured. Set at least one key in .env.local: " +
      "OPENAI_API_KEY_GPT54, OPENAI_API_KEY_GPT54_MINI, OPENROUTER_KEY_GPT54, " +
      "OPENROUTER_KEY_GPT54_MINI, OPENROUTER_KEY_HAIKU, or ANTHROPIC_API_KEY."
    );
  }

  const attempted: string[] = [];
  for (const provider of chain) {
    try {
      console.log(
        `[ai-provider] Attempting ${provider.name}` +
        (attempted.length > 0 ? ` (fallback from: ${attempted.join(" → ")})` : "")
      );
      const result = await provider.fn();
      if (attempted.length > 0) {
        result.usage.fallbackChain = [...attempted];
        console.log(`[ai-provider] ✓ Succeeded with ${provider.name} after ${attempted.length} failure(s)`);
      } else {
        console.log(`[ai-provider] ✓ Succeeded with ${provider.name} | in=${result.usage.input} out=${result.usage.output} cost=$${result.usage.cost.toFixed(5)}`);
      }
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ai-provider] ✗ ${provider.name} failed: ${msg}`);
      attempted.push(provider.name);
    }
  }

  throw new Error(
    `All AI providers failed. Attempted: ${attempted.join(" → ")}. ` +
    "Check your API keys and network connection."
  );
}

// ─── OpenAI Chat Completions (GPT-5.4 / GPT-5.4-mini) ────────────────────────

async function callOpenAI(params: {
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
        max_completion_tokens: maxTokens,
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
  const input = data.usage?.prompt_tokens ?? 0;
  const output = data.usage?.completion_tokens ?? 0;

  return {
    text,
    usage: {
      model: data.model ?? model,
      input,
      output,
      cost: calcCost(model, input, output),
    },
  };
}

// ─── OpenRouter (GPT-5.4-mini / Haiku) ───────────────────────────────────────

async function callOpenRouter(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens: number;
  temperature: number;
  jsonMode: boolean;
  apiKey: string;
  model: string;
}): Promise<AIResult> {
  const { messages, system, maxTokens, temperature, jsonMode, apiKey, model } = params;

  const orMessages: { role: string; content: string }[] = [
    ...(system ? [{ role: "system", content: system }] : []),
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  let res: Response;
  try {
    res = await fetch(OPENROUTER_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://silog.pro",
        "X-Title": "SiLog",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: orMessages,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${model} HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json() as {
    choices: { message: { content: string } }[];
    usage: { prompt_tokens: number; completion_tokens: number };
    model: string;
  };

  const text = data.choices?.[0]?.message?.content ?? "";
  const input = data.usage?.prompt_tokens ?? 0;
  const output = data.usage?.completion_tokens ?? 0;

  return {
    text,
    usage: {
      model: data.model ?? model,
      input,
      output,
      cost: calcCost(model, input, output),
    },
  };
}

// ─── Direct Anthropic — with prompt caching ──────────────────────────────────
//
// The system prompt is marked cache_control: { type: "ephemeral" }.
// Anthropic caches it for 5 minutes from the last hit.
// First call in a window: cache WRITE (1.25× input price).
// Any call within 5 min: cache READ (0.10× input price) — 90% cheaper.

async function callAnthropic(params: {
  messages: AIMessage[];
  system?: string;
  maxTokens: number;
  temperature: number;
  jsonMode: boolean;
  apiKey: string;
}): Promise<AIResult> {
  const { Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: params.apiKey });

  // Anthropic has no native JSON mode — enforce via system prompt suffix
  const systemText = params.jsonMode
    ? (params.system
        ? params.system + "\n\nCRITICAL: Return ONLY a valid JSON object. No markdown, no explanation, no code fences. Start your response with { and end with }."
        : "Return ONLY a valid JSON object. No markdown, no explanation, no code fences.")
    : params.system;

  type CachedTextBlock = { type: "text"; text: string; cache_control: { type: "ephemeral" } };
  const systemBlock: CachedTextBlock[] | undefined = systemText
    ? [{ type: "text", text: systemText, cache_control: { type: "ephemeral" } }]
    : undefined;

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    ...(systemBlock ? { system: systemBlock } : {}),
    messages: params.messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  const usage = response.usage as typeof response.usage & {
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  const input      = usage.input_tokens;
  const output     = usage.output_tokens;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead  = usage.cache_read_input_tokens     ?? 0;

  const cost = calcCost(ANTHROPIC_MODEL, input, output, cacheWrite, cacheRead);

  if (cacheWrite > 0 || cacheRead > 0) {
    const saving = cacheRead > 0 ? ` | cache-read=${cacheRead} (saved ~${((cacheRead * 0.9) / 1_000_000 * 0.80).toFixed(5)} USD)` : "";
    const write  = cacheWrite > 0 ? ` | cache-write=${cacheWrite}` : "";
    console.log(`[ai-provider/anthropic] prompt-cache${write}${saving}`);
  }

  return {
    text,
    usage: {
      model: response.model,
      input,
      output,
      cost,
    },
  };
}
