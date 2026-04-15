/**
 * Unified AI provider — 5 backends in priority order:
 *
 * 1. OpenAI GPT-5.4          (OPENAI_API_KEY_GPT54)        → gpt-5.4-2026-03-05        (PRIMARY)
 * 2. OpenAI GPT-5.4-mini     (OPENAI_API_KEY_GPT54_MINI)   → gpt-5.4-mini-2026-03-17   (FALLBACK)
 * 3. OpenRouter GPT-5.4-mini (OPENROUTER_KEY_GPT54_MINI)   → openai/gpt-5.4-mini        (BACKUP)
 * 4. OpenRouter Haiku 4.5    (OPENROUTER_KEY_HAIKU)        → anthropic/claude-haiku-4.5 (BACKUP)
 * 5. Direct Anthropic Haiku  (ANTHROPIC_API_KEY)           → claude-haiku-4-5-20251001  (EMERGENCY)
 *
 * Switch models by commenting/uncommenting keys in .env.local — no code changes ever needed.
 * If the active primary model fails at runtime, the system automatically falls back to the next available model.
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
const OR_GPT54_MINI    = "openai/gpt-5.4-mini";
const OR_HAIKU_MODEL   = "anthropic/claude-haiku-4.5";
const ANTHROPIC_MODEL  = "claude-haiku-4-5-20251001";

const OPENAI_BASE     = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

// ─── Cost table (USD per 1M tokens) ──────────────────────────────────────────

const COST_TABLE: Record<string, { input: number; output: number }> = {
  [GPT54_MODEL]:      { input: 2.50, output: 15.00 },
  [GPT54_MINI_MODEL]: { input: 0.75, output: 3.00  },
  [OR_GPT54_MINI]:    { input: 0.83, output: 3.30  }, // OpenRouter ~10% markup estimate
  [OR_HAIKU_MODEL]:   { input: 0.88, output: 4.40  }, // OpenRouter Haiku rate estimate
  [ANTHROPIC_MODEL]:  { input: 0.80, output: 4.00  },
};

function calcCost(model: string, input: number, output: number): number {
  const rates = COST_TABLE[model];
  if (!rates) return 0;
  return (input / 1_000_000) * rates.input + (output / 1_000_000) * rates.output;
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
  const orGpt54Mini  = process.env.OPENROUTER_KEY_GPT54_MINI;
  const orHaikuKey   = process.env.OPENROUTER_KEY_HAIKU;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Build the ordered list of providers that have keys configured
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
  if (orGpt54Mini) {
    chain.push({
      name: OR_GPT54_MINI,
      fn: () => callOpenRouter({ messages, system, maxTokens, apiKey: orGpt54Mini, model: OR_GPT54_MINI }),
    });
  }
  if (orHaikuKey) {
    chain.push({
      name: OR_HAIKU_MODEL,
      fn: () => callOpenRouter({ messages, system, maxTokens, apiKey: orHaikuKey, model: OR_HAIKU_MODEL }),
    });
  }
  if (anthropicKey) {
    chain.push({
      name: ANTHROPIC_MODEL,
      fn: () => callAnthropic({ messages, system, maxTokens, apiKey: anthropicKey }),
    });
  }

  if (chain.length === 0) {
    throw new Error(
      "No AI provider configured. Set at least one key in .env.local: " +
      "OPENAI_API_KEY_GPT54, OPENAI_API_KEY_GPT54_MINI, OPENROUTER_KEY_GPT54_MINI, " +
      "OPENROUTER_KEY_HAIKU, or ANTHROPIC_API_KEY."
    );
  }

  // Attempt each provider in order — automatically fall back on failure
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
  apiKey: string;
  model: string;
}): Promise<AIResult> {
  const { messages, system, maxTokens, apiKey, model } = params;

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

// ─── Direct Anthropic (emergency backup) ─────────────────────────────────────

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
  const input = response.usage.input_tokens;
  const output = response.usage.output_tokens;

  return {
    text,
    usage: {
      model: response.model,
      input,
      output,
      cost: calcCost(ANTHROPIC_MODEL, input, output),
    },
  };
}
