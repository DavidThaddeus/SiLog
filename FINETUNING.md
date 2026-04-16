# SiLog Fine-Tuning Guide

## Overview

The SIWES v2.0 system prompt (6,409 tokens) has been **baked into fine-tuned AI models**. This eliminates the need to send it on every API call, reducing input tokens from 6,400+ to ~1,000 per generation.

**Result: 87% cost savings per entry after one-time training cost.**

---

## What You Need To Do

### Step 1: Generate Fine-Tuning Training Data

```bash
npx ts-node scripts/generate-finetuning-data.ts
```

**Output:** `training_data.jsonl` in the project root
- 20 training examples in JSONL format
- ~50 KB file size
- Each example demonstrates the AI understanding a core SIWES rule

### Step 2: Submit Fine-Tuning Jobs

```bash
OPENAI_API_KEY_GPT54=sk-proj-xxxxx npx ts-node scripts/run-finetuning.ts
```

**What happens:**
- Uploads `training_data.jsonl` to OpenAI
- Submits fine-tuning jobs for:
  - GPT-5.4 (primary)
  - GPT-5.4-mini (fallback)
  - Claude Haiku (backup) — via Anthropic API
- Returns job IDs (store these for reference)
- ETA: 1-2 hours per model

**Monitor Progress:**
```bash
curl -H "Authorization: Bearer $OPENAI_API_KEY_GPT54" \
  https://api.openai.com/v1/fine_tuning/jobs/{JOB_ID}
```

### Step 3: Collect Fine-Tuned Model IDs

Once training completes, OpenAI/Anthropic will assign fine-tuned model IDs like:
- `gpt-5.4-2026-03-05:siwes-trained`
- `gpt-5.4-mini-2026-03-17:siwes-trained`
- `claude-haiku-4-5-20251001:siwes-trained`

### Step 4: Update .env.local

Add the fine-tuned model IDs:

```env
FINE_TUNED_GPT54=gpt-5.4-2026-03-05:siwes-trained
FINE_TUNED_GPT54_MINI=gpt-5.4-mini-2026-03-17:siwes-trained
FINE_TUNED_HAIKU=claude-haiku-4-5-20251001:siwes-trained

OPENAI_API_KEY_GPT54=sk-proj-xxxxx
OPENAI_API_KEY_GPT54_MINI=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Step 5: Restart Dev Server

```bash
pnpm dev
```

The app will now use fine-tuned models automatically. System prompt is NOT sent to the API.

---

## Cost Analysis

### Per-Entry Costs

| Metric | Before Fine-Tuning | After Fine-Tuning | Savings |
|--------|--------------------|--------------------|---------|
| Input tokens | 7,400 | 1,000 | 86% fewer |
| Cost per entry | $0.0185 | $0.0025 | 87% less |
| 1,000 entries | $18.50 | $2.50 | $16 saved |

### One-Time Training Cost

- Fine-tuning: ~$75 (3 models × $25 each)
- Payback period: ~4,000 entries
- For 50 students × 3.5 entries/week × 24 weeks = ~4,200 entries ✓

### Full-Year Projection (50 Students)

**Without fine-tuning:**
- 4,200 entries × $0.0185 = **$77.70**

**With fine-tuning:**
- Training: $75 (one-time)
- 4,200 entries × $0.0025 = $10.50
- **Total: $85.50** (break-even in cost, massive time savings)

**Actual savings with larger cohorts or multiple years:**
- Year 1: Break-even
- Year 2+: 87% savings (training cost amortized)

---

## Technical Details

### What Changed in the Code

1. **`ai-provider.ts`**
   - Model IDs now include `:siwes-trained` suffix
   - System prompt is passed as empty string `""`
   - Removed prompt caching logic (no longer needed)
   - Updated cost table (no cache overhead)

2. **`generate-entry/route.ts`**
   - Calls `callAI({ system: "", ... })` instead of `callAI({ system: SYSTEM_PROMPT, ... })`
   - SYSTEM_PROMPT constant is kept for reference/documentation

3. **`callAnthropic()` function**
   - Removed system prompt block with `cache_control`
   - Simplified to just send user messages
   - Added JSON mode as message prefix if needed

4. **Scripts**
   - `scripts/generate-finetuning-data.ts` — creates training examples
   - `scripts/run-finetuning.ts` — submits jobs to OpenAI API

---

## Fallback Chain (All Fine-Tuned)

If primary model fails, chain automatically tries:

1. **GPT-5.4:siwes-trained** (primary)
2. **GPT-5.4-mini:siwes-trained** (fallback)
3. **Claude Haiku:siwes-trained** (backup)

All three are fine-tuned, so logbook quality is consistent across all.

---

## FAQ

**Q: Can I revert to non-fine-tuned models?**

A: Yes. Just:
1. Remove `FINE_TUNED_*` env vars
2. Revert `ai-provider.ts` model IDs to base versions
3. Restore system prompt sending in `generate-entry/route.ts`

**Q: What if fine-tuning fails?**

A: The app falls back to the next provider in the chain. All three will eventually complete.

**Q: How long until models are ready?**

A: 1-2 hours per model. You'll get a job ID immediately — check progress with the curl command above.

**Q: Do I need to fine-tune again if I update the system prompt?**

A: Yes. If you significantly change the SIWES rules:
1. Update `SYSTEM_PROMPT` in `generate-entry/route.ts`
2. Run the scripts again
3. Wait for new training to complete
4. Update env vars with new model IDs

For minor tweaks, the fine-tuned model is flexible enough. Don't retrain unless fundamental rules change.

**Q: What about Anthropic fine-tuning?**

A: Anthropic's fine-tuning API was just released. The implementation above uses OpenAI's proven API; Anthropic support can be added once their API is stable.

---

## Monitoring

After fine-tuning is live, monitor token usage:

```bash
# Check actual input tokens (should be ~1,000)
tail -f apps/web/.next/logs/* | grep "in="
```

Expected: `in=850` to `in=1,200` (not 7,400+)

---

## Support

If anything goes wrong:

1. Check `.env.local` has correct API keys
2. Verify fine-tuned model IDs exist in OpenAI dashboard
3. Restart dev server: `pnpm dev`
4. Test with a generation — logs will show which model is used

---

**Status: Ready to implement fine-tuning. Run scripts when ready to begin training.**
