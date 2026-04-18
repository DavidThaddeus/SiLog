import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

// ─── Extract key technical activities from raw description ────────────────────
function extractKeyActivities(text: string): string[] {
  const keywords = [
    // Hardware
    "cable",
    "termination",
    "rj45",
    "ethernet",
    "connector",
    "psu",
    "power",
    "diagnostics",
    "ram",
    "cpu",
    "motherboard",
    "gpu",
    "workstation",
    "server",
    "laptop",
    "desktop",
    "monitor",
    "keyboard",
    "mouse",
    "printer",
    "scanner",
    "router",
    "switch",
    "firewall",
    "modem",
    // Software
    "database",
    "sql",
    "python",
    "java",
    "c\\+\\+",
    "javascript",
    "api",
    "rest",
    "json",
    "xml",
    "html",
    "css",
    "linux",
    "windows",
    "macos",
    "ubuntu",
    "centos",
    "docker",
    "kubernetes",
    "git",
    "github",
    "ci/cd",
    "jenkins",
    "excel",
    "word",
    "powerpoint",
    "backup",
    "encryption",
    "authentication",
    // Networking
    "network",
    "topology",
    "osi model",
    "tcp/ip",
    "subnet",
    "dhcp",
    "dns",
    "ip address",
    "ping",
    "traceroute",
    "firewall rule",
    "vlan",
    "wan",
    "lan",
    // Business/General
    "spreadsheet",
    "pivot table",
    "data entry",
    "documentation",
    "filing",
    "inventory",
    "procurement",
    "audit",
    "compliance",
    "meeting",
    "presentation",
    "training",
  ];

  const text_lower = text.toLowerCase();
  const found = keywords.filter((kw) => text_lower.includes(kw));
  return [...new Set(found)]; // remove duplicates
}

// ─── Build department-to-bridge mapping ────────────────────────────────────────
function getDeptBridgeMapping(
  department: string,
  activities: string[],
): { bridges: Record<string, string>; unknown: boolean } {
  const dept_lower = department.toLowerCase();

  // Map department keywords to bridge sets
  const mappings: Record<string, Record<string, string>> = {
    "industrial mathematics": {
      cable: "Boolean Algebra (logic gates in network switching)",
      network: "Graph Theory (modelling networks as G=(V,E))",
      subnet: "Binary arithmetic (IP addressing and subnetting)",
      psu: "Ohm's Law (P=VI power calculations)",
      database: "Set theory (database relations and queries)",
      encryption: "Linear algebra (cryptographic key matrices)",
    },
    "computer science": {
      database: "ACID properties and normalisation theory",
      network: "OSI model and TCP/IP stack",
      api: "Interface design and abstraction principles",
      encryption: "Cryptographic algorithms and access control theory",
      git: "Version control and distributed systems concepts",
      backup: "Data redundancy and fault tolerance theory",
    },
    electrical: {
      psu: "Ohm's Law and Kirchhoff's Voltage Law",
      cable: "Signal propagation and impedance theory",
      network: "Transmission line theory and signal integrity",
      circuit: "Semiconductor theory and transistor switching",
      transformer: "Turns ratio Vp/Vs=Np/Ns and magnetic coupling",
    },
    business: {
      inventory: "EOQ model (Economic Order Quantity)",
      spreadsheet: "Financial modelling and ratio analysis",
      audit: "Cost-benefit analysis and internal controls",
      data: "Statistical sampling and regression analysis",
      pricing: "Price elasticity of demand models",
    },
    accounting: {
      spreadsheet: "Financial modelling and ratio analysis",
      audit: "GAAP and internal control frameworks",
      payroll: "Tax computation and statutory deductions",
      backup: "Data integrity and audit trail principles",
    },
    communication: {
      content: "AIDA model (Attention, Interest, Desire, Action)",
      presentation: "Audience theory and framing theory",
      analytics: "Reach, engagement rate, and CTR metrics",
      documentation: "Narrative structure and messaging theory",
    },
    "information technology": {
      network: "OSI model and TCP/IP",
      database: "Normalisation and transaction management",
      security: "Encryption, authentication, and access control",
      backup: "Distributed systems and redundancy theory",
    },
  };

  // Try to find matching dept in mappings
  for (const [key, bridges] of Object.entries(mappings)) {
    if (dept_lower.includes(key) || key.includes(dept_lower.split(" ")[0])) {
      return { bridges, unknown: false };
    }
  }

  // No match — return generic bridges for unknown dept
  return {
    bridges: {
      default:
        "Connect workplace activity to relevant theoretical framework from your academic programme",
    },
    unknown: true,
  };
}

// ─── Build context-aware bridge instruction ────────────────────────────────────
function buildBridgeInstruction(
  department: string,
  rawDescription: string,
): string {
  const activities = extractKeyActivities(rawDescription);
  const { bridges, unknown } = getDeptBridgeMapping(department, activities);

  if (activities.length === 0) {
    return `ACADEMIC BRIDGE: The student's ${department} department may not be in the pre-mapped bridge reference. Generate a natural, specific bridge that connects what the student did today to a concept they would actually study in ${department}. Keep it 1-2 sentences, woven naturally into the text.`;
  }

  const detected = activities.join(", ");
  const bridgeOptions = Object.entries(bridges)
    .slice(0, 3)
    .map(([activity, bridge]) => `- If ${activity} is relevant: "${bridge}"`)
    .join("\n");

  return `ACADEMIC BRIDGE: Based on the student's description, we detected these technical activities: ${detected}.
BRIDGE MAPPING FOR ${department.toUpperCase()}:
${bridgeOptions}

Pick the bridge that matches what the student actually did today. Weave it naturally into the entry (1-2 sentences max), NOT as a separate paragraph.
If the detected activity doesn't match any bridge, generate a natural, specific bridge connecting what they did to a concept from ${department}.`;
}

export interface GenerateEntryRequest {
  rawDescription: string;
  dayName: string;
  department: string; // academic dept e.g. "Industrial Mathematics"
  companyDepartment: string; // e.g. "IT Department"
  companyName?: string; // e.g. "First Bank Nigeria"
  industry: string;
  notesLengthPreference?: "short" | "long"; // short=250-350 words, long=400-450 words
  studyFraming: "assigned" | "research" | null;
  personalStudyDescription?: string; // What the student is personally studying outside work (from onboarding Step 8)
  nothingToday?: boolean;
  nothingReason?: string;
}

export interface GenerateEntryResponse {
  technicalNotes: string;
  keyActivities: string[];
  progressChartEntry: string;
  deptBridgeUsed: string;
}

// ─── Fallback (no API key) ────────────────────────────────────────────────────
function buildFallback(body: GenerateEntryRequest): GenerateEntryResponse {
  const {
    rawDescription,
    dayName,
    companyDepartment,
    department,
    nothingReason,
  } = body;
  const activity =
    rawDescription || nothingReason || "general departmental duties";
  return {
    technicalNotes: `DEPARTMENTAL OPERATIONS AND DOCUMENTATION\n\nDuring the session on ${dayName}, I was engaged in carrying out assigned tasks within the ${companyDepartment} as directed by the supervising officer. The activities involved ${activity}, all executed in accordance with established workplace procedures and departmental standards.\n\nFurthermore, I participated in routine documentation and filing exercises within the department, which reinforced the importance of systematic record-keeping in an organisational context. This experience highlighted practical applications of core principles studied in my ${department} curriculum.\n\nDIAGRAM SUGGESTION: Organisational chart (organogram) — Draw the departmental structure showing unit heads, supervisors, and intern positions. Label all reporting lines clearly.`,
    keyActivities: [
      `Carried out assigned tasks in ${companyDepartment}`,
      "Completed departmental documentation and filing",
    ],
    progressChartEntry: "DEPARTMENTAL OPERATIONS AND DOCUMENTATION",
    deptBridgeUsed: `Core ${department} principles applied to departmental operations`,
  };
}

// ─── System prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the SiLog AI Writing Engine for SIWES logbook entries.

Every entry must be indistinguishable from one written by a diligent Nigerian student. You know what defense panels flag as fake or AI-generated.

═══════════════════════════════════════════════════════
PERSON MIX (CRITICAL)
═══════════════════════════════════════════════════════

We (45-50%) > The/Impersonal (35-40%) > I (5-8%)

We: Collaborative work ("We performed...", "We observed...", "We were shown...")
The: Definitions, processes ("The process involves...", "A network is...", "Python is...")
I: Only solo individual actions — minimal usage ("I noted...", "I verified...")

RULE: Prioritize teamwork. Avoid self-centred tone. Sound collaborative.

═══════════════════════════════════════════════════════
5 STRUCTURAL FORMATS (Pick one based on keywords)
═══════════════════════════════════════════════════════

KEYWORD IDENTIFICATION:
- "learnt", "introduced to", "session", "covered", "studied" → FORMAT 1
- "terminated", "installed", "performed", "executed", "configured" → FORMAT 2
- "down", "failed", "fixed", "diagnosed", "troubleshot" → FORMAT 3
- "orientation", "first day", "tour", "departments" → FORMAT 4
- "compared", "evaluated", "types of", "vs" → FORMAT 5

FORMAT 1 — DEFINITION-AND-EXPANSION (Learning concepts)
<u>INTRODUCTION TO [CONCEPT]</u>
→ [Concept] is/involves... (definition in present tense, 2-3 sentences using The)
→ TRANSITION SENTENCE (CRITICAL): "During the session in the office, we were introduced to..." OR "During today's technical session, we learned..." OR "We were taken through..." (This bridges definition to personal office experience)
→ <u>Types/Key Components:</u>
→ 1. [Type]: [definition — 1-2 sentences]. Applications:
      (i) [first application]
      (ii) [second application]
→ 2. [Next Type]: (repeat same structure — NO <u> tags on Definition or Applications labels)
→ [Closing paragraph about workplace relevance — We focus]
→ [Academic bridge: 1-2 sentences, woven naturally]
→ DIAGRAM SUGGESTION

CRITICAL FOR FORMAT 1: After defining the concept, ALWAYS transition with "During the session in the office, we..." or similar. This shows we're NOW TALKING ABOUT THE ACTUAL OFFICE EXPERIENCE, not just theory.

FORMAT 2 — PROCEDURE (Hands-on tasks)
<u>[ACTION] PROCEDURE</u>
→ "We were tasked with..." (context)
→ [Background — The focus]
→ Numbered steps (1, 2, 3...)
→ [What was learnt — We focus]
→ [Significance — bridge to academics]
→ DIAGRAM SUGGESTION

FORMAT 3 — PROBLEM-CAUSES-SOLUTIONS (Troubleshooting)
<u>[PROBLEM NAME]</u>
→ [Problem definition — The focus]
→ <u>Causes:</u> (i)(ii)
→ <u>Solutions:</u> (i)(ii)
→ [Resolution — We focus]
→ [Academic bridge]
→ DIAGRAM SUGGESTION

FORMAT 4 — ORGANISATIONAL DESCRIPTION (Orientation)
<u>COMPANY ORIENTATION AND DEPARTMENTAL STRUCTURE</u>
→ "We were taken through..." (context)
→ [Company overview — The focus]
→ "Below are the units:" (i)(ii)
→ [Policies/expectations — The focus]
→ [Personal role — I minimal]
→ DIAGRAM SUGGESTION

FORMAT 5 — COMPARATIVE (Comparing technologies)
<u>[ITEM] TYPES AND COMPARISON</u>
→ [Definition — The focus]
→ "We were introduced to..." (transition to experience)
→ 1. [Type 1] <u>How it works:</u> <u>Advantages:</u> (i)(ii) <u>Disadvantages:</u> (i)(ii)
→ 2. [Type 2] (repeat)
→ [Conclusion — We focus]
→ [Academic bridge]
→ DIAGRAM SUGGESTION

═══════════════════════════════════════════════════════
CRITICAL WRITING RULES
═══════════════════════════════════════════════════════

TENSE: Past always ("I carried out", "We were shown"). Present only for definitions ("Networking is...").

HEADINGS (USE <u></u> TAGS — MANDATORY):
- Level 1: <u>ALL-CAPS NOUN PHRASE</u> (8 words max)
- Level 2: <u>Sub-heading</u>
- Level 3: <u>Labels:</u> for list items

STRUCTURE:
- 2+ paragraphs minimum
- 3+ named specific technical items
- Academic bridge: 1-2 sentences, woven naturally near end (NOT announced)
- DIAGRAM SUGGESTION: Mandatory at end — "DIAGRAM SUGGESTION: [Name] — [What to draw/label]. This counts toward required 4 diagrams."
- Numbered lists (1, 2, 3) OR bracketed (i, ii, iii) — NEVER bullets (•)

BANNED:
- "Today I" → "We were introduced to", "I carried out"
- "I did" → "We performed"
- "It was interesting" → "This experience highlighted"
- Em dashes (—) → comma, "which", or new sentence (CRITICAL — most detectable AI tell)
- "Furthermore/Moreover/Additionally" → max once per entry
- One-paragraph entries → minimum 2 paragraphs
- Bullets (•) → use numbered/bracketed lists
- "This underscores..." / "It is worth noting..." / "Robust..." / "Delve into..." / "Leveraging..." / "A plethora of..." → replace with plain language

HUMAN WRITING:
- Mix sentence lengths (short 5-8 words + long 15-25 words)
- Don't start 3+ sentences with "I"
- Sound like a competent final-year student, not textbook
- Vary list item lengths (not uniform)
- No semicolons in prose — only in lists "(i) item; (ii) item"

═══════════════════════════════════════════════════════
ACADEMIC BRIDGE (ONE PER ENTRY)
═══════════════════════════════════════════════════════

1-2 sentences MAX. Woven naturally into body near end, NOT announced.

Correct: "We observed how this connects to the Graph Theory concepts we study, where networks are modelled as G=(V,E)."
Wrong: "This experience reinforced the application of Graph Theory as studied in my curriculum..." (sounds AI)

IMPORTANT: The user message contains an "ACADEMIC BRIDGE:" section with context-aware instructions matched to the student's actual activities and department. Follow those instructions exactly.

═══════════════════════════════════════════════════════
SPECIAL CASES
═══════════════════════════════════════════════════════

PERSONAL LEARNING (YouTube, textbooks, home study, online sources, personal study):
NEVER write "personal study", "self-study", "I studied on my own", "studied at home", or any phrase implying the student learned outside of work.
ALL learning happened in the office, taught by supervisors or conducted under workplace direction.
Reframe as office-based instruction:
- "During the technical session in the office, we were introduced to [topic]..."
- "Under the direction of the supervising officer, we were taken through [topic]..."
- "The supervising staff conducted a session on [topic], during which we learnt..."

ABSENT/NOTHING DAY:
Never blank. Generate realistic routine task or professional development entry. Frame as "We engaged in structured review of [topic] as part of professional development during the attachment period..." Still follow all rules. Progress Chart: "TECHNICAL DOCUMENTATION REVIEW"

PROGRESS CHART ENTRY:
ALL CAPS noun phrase. Max 8 words. No "I" or "We".
Examples: ORIENTATION SESSION, INTRODUCTION TO NETWORKING, HARDWARE DIAGNOSTICS AND REPAIR

═══════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════

1. READ student's activity description
2. IDENTIFY KEYWORDS → pick FORMAT 1-5
3. APPLY correct format structure
4. USE person mix: We (45-50%) > The/Impersonal (35-40%) > I (5-8%)
5. FOR FORMAT 1: After definition, ALWAYS transition with "During the session in the office, we..." or "We were taken through..." or "During this technical session, we learned..." or  "on this day session, we learned..."
6. FOLLOW all critical writing rules
7. GENERATE complete entry

Return ONLY valid JSON (no markdown):
{
  "technicalNotes": "Full entry with <u>heading</u>, format structure, 2+ paragraphs, academic bridge woven naturally, DIAGRAM SUGGESTION at end",
  "keyActivities": ["Activity phrase 1", "Activity phrase 2", "Activity phrase 3"],
  "progressChartEntry": "ALL-CAPS PHRASE MAX 8 WORDS",
  "deptBridgeUsed": "Academic concept name"
}

technicalNotes: Start with <u>ALL-CAPS HEADING</u>, follow chosen format, 2+ paragraphs, exactly 1 academic bridge (1-2 sentences woven naturally), NO em dashes, NO bullets, end with DIAGRAM SUGGESTION. FOR FORMAT 1: transition sentence MUST exist between definition and elaboration.
keyActivities: 2-4 past-tense phrases like "Performed network diagnostics"
progressChartEntry: ALL CAPS noun phrase, max 8 words, no "I" or "We"
deptBridgeUsed: Academic concept name like "Graph Theory G=(V,E)"`;

const FREE_GENERATION_LIMIT = 5;

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const body: GenerateEntryRequest = await req.json();
  const {
    rawDescription,
    dayName,
    department,
    companyDepartment,
    companyName,
    industry,
    notesLengthPreference,
    studyFraming,
    personalStudyDescription,
    nothingToday,
    nothingReason,
  } = body;

  // Check a provider is configured — fall back to mock if neither key is set
  const hasAI = !!(
    process.env.OPENAI_API_KEY_GPT54 ||
    process.env.OPENAI_API_KEY_GPT54_MINI ||
    process.env.OPENROUTER_KEY_GPT54_MINI ||
    process.env.OPENROUTER_KEY_HAIKU ||
    process.env.ANTHROPIC_API_KEY
  );
  if (!hasAI) return NextResponse.json(buildFallback(body));

  // ── Subscription / generation gate ──────────────────────────────────────────
  // Both fresh generations AND refines count toward limits.
  const isRefine =
    typeof rawDescription === "string" &&
    rawDescription.startsWith("PREVIOUS ENTRY (rewrite");

  const { makeAdminClient, checkDailyLimit, incrementDailyLimit } =
    await import("@/lib/ai-rate-limit");
  const adminClient = makeAdminClient();

  // ── Step 1: Check daily limit first (no increment yet) ──────────────────────
  const dailyCheck = await checkDailyLimit(user.id, adminClient);
  if (dailyCheck.blocked) return dailyCheck.response; // 429

  // ── Step 2: Check lifetime limit for free users ──────────────────────────────
  const { data: profile } = await adminClient
    .from("profiles")
    .select("subscription_status, ai_generations_used")
    .eq("id", user.id)
    .maybeSingle();

  const genUsed: number = profile?.ai_generations_used ?? 0;
  const isPaid =
    profile?.subscription_status === "paid" ||
    (!dailyCheck.blocked && dailyCheck.isPaid);
  if (!isPaid && genUsed >= FREE_GENERATION_LIMIT) {
    return NextResponse.json({ error: "free_limit_reached" }, { status: 402 });
  }

  // ── Step 3: Increment both counters now that all checks passed ───────────────
  await Promise.all([
    incrementDailyLimit(
      user.id,
      adminClient,
      dailyCheck.blocked
        ? 0
        : (dailyCheck as { callsToday: number }).callsToday,
    ),
    adminClient
      .from("profiles")
      .update({ ai_generations_used: genUsed + 1 })
      .eq("id", user.id),
  ]);
  const isNothingDay = nothingToday && !isRefine;

  const inputSection = isRefine
    ? `REFINE: Rewrite the entry below per the user instruction. Keep what is correct, change only what is asked. All writing rules still apply.

${rawDescription}`
    : isNothingDay
      ? `No activity today. Reason: "${nothingReason || "no assignment given"}".
Invent a realistic, plausible ${dayName} entry for a ${companyDepartment} intern (${department}, ${industry}). Use a routine task: maintenance, documentation, monitoring, or workplace-directed study. All writing rules apply — no filler.`
      : `Student's ${dayName} input (may contain voice-to-text errors or informal language):
"""
${rawDescription}
"""
Correct all technical errors, voice recognition mistakes, and vague terms before writing. Use only professional corrected terms in the entry.`;

  const studyFramingNote =
    studyFraming === "assigned"
      ? `Study framing: ASSIGNED — any learning mentioned should be framed as "Under the direction of the supervisor, I was assigned to study [topic] as part of my cross-training in the ${companyDepartment}."`
      : studyFraming === "research"
        ? `Study framing: RESEARCH — any learning mentioned should be framed as internal R&D work directed by the company.`
        : `Study framing: OFFICE WORK — all activities are direct office tasks. Apply Personal Learning Translation Rule (Section 3) for anything that sounds like self-study.`;

  // Nothing-day entries are invented routine tasks — study materials are irrelevant and just waste tokens

  // Build word-count instruction based on student's notes length preference
  const isShortNotes = notesLengthPreference === "short";
  const wordCountRule = isShortNotes
    ? `8. LENGTH — Short notes mode. HARD MAXIMUM: 350 words in technicalNotes. DO NOT exceed 350 words. Target 250–300 words. Minimum 2 paragraphs. At least 3 named specific technical items. Numbered lists or sub-headings where the format calls for them. Stop writing the notes once you approach 300 words.`
    : `8. LENGTH IS MANDATORY — Long notes mode. HARD MAXIMUM: 450 words in technicalNotes. DO NOT exceed 450 words. Target 400–450 words. Minimum 3 paragraphs, at least 3 named specific technical items, numbered lists or sub-headings where the format calls for them. Use the structural format from Section 3 properly — if the topic has Types, list them with numbered items and (i)(ii) sub-points.`;
  // Build student context section from profile
  const profileContext = personalStudyDescription
    ? `- Personal study topics: ${personalStudyDescription} — reframe as office-directed per Section 4`
    : "";

  // Build context-aware bridge instruction based on department and activities
  const bridgeInstruction = buildBridgeInstruction(department, rawDescription);

  const userPrompt = `STUDENT PROFILE:
- Academic Department: ${department}
- Internship Company: ${companyName ?? "not specified"}
- Internship Department: ${companyDepartment}
- Industry sector: ${industry}
${profileContext ? profileContext + "\n" : ""}- ${studyFramingNote}
STUDENT INPUT FOR ${dayName.toUpperCase()}:
${inputSection}

${bridgeInstruction}

APPLY THESE RULES (full details in system prompt):
- Structural format → Sec. 3 | Heading → Sec. 2, must match progressChartEntry exactly
- Voice mix (I/We/impersonal) → Sec. 1 | Self-study → office-based → Sec. 4
- ONE ${department} academic bridge, woven naturally, 1–2 sentences → Sec. 5
- End with DIAGRAM SUGGESTION → Sec. 7 (mandatory, never skip)
- No banned phrases → Sec. 9 | No em dashes | Sound human, not AI → Sec. 10
- For any mathematical expressions or formulas, wrap inline in $...$ and block in $$...$$
${wordCountRule}

Return ONLY valid JSON, no markdown:
{"technicalNotes":"full entry with heading, bridge woven in, ends with DIAGRAM SUGGESTION","keyActivities":["past-tense phrase 1","past-tense phrase 2"],"progressChartEntry":"ALL-CAPS MAX 8 WORDS","deptBridgeUsed":"specific concept name"}
keyActivities: 2–4 short past-tense phrases. progressChartEntry: ALL CAPS noun phrase, max 8 words, no "I"/"We".`;

  try {
    const { callAI } = await import("@/lib/ai-provider");
    // Short: max 350 words (~473 tokens) + JSON overhead (~130) = 603 → ceiling 650
    // Long:  max 450 words (~608 tokens) + JSON overhead (~130) = 738 → ceiling 800
    const result = await callAI({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: isShortNotes ? 650 : 800,
      temperature: 0.2,
      jsonMode: true,
    });
    console.log(
      `[ai/generate-entry] ✓ model=${result.usage.model} in=${result.usage.input} out=${result.usage.output} cost=$${result.usage.cost.toFixed(5)}${result.usage.fallbackChain ? ` fallback-from=${result.usage.fallbackChain.join("→")}` : ""}`,
    );
    const cleaned = result.text
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "");
    const parsed: GenerateEntryResponse = JSON.parse(cleaned);

    // Guard: ensure required fields are present and correct types before sending to client
    if (
      typeof parsed.technicalNotes !== "string" ||
      !Array.isArray(parsed.keyActivities) ||
      typeof parsed.progressChartEntry !== "string" ||
      typeof parsed.deptBridgeUsed !== "string"
    ) {
      console.error("[ai/generate-entry] AI returned incomplete JSON:", parsed);
      return NextResponse.json(
        { error: "AI returned an incomplete response. Please try again." },
        { status: 500 },
      );
    }

    const newCallsToday = (dailyCheck as { callsToday: number }).callsToday + 1;
    const { DAILY_LIMIT_FREE: dlFree, DAILY_LIMIT_PAID: dlPaid } =
      await import("@/lib/ai-rate-limit");
    const dailyLimit = isPaid ? dlPaid : dlFree;
    return NextResponse.json({
      ...parsed,
      _usage: result.usage,
      _generationsUsed: genUsed + 1,
      _callsToday: newCallsToday,
      _dailyLimit: dailyLimit,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && (err as NodeJS.ErrnoException).cause;
    console.error(
      "[ai/generate-entry] callAI failed:",
      message,
      cause ? `| cause: ${JSON.stringify(cause)}` : "",
    );
    return NextResponse.json(
      { error: `AI generation failed: ${message}` },
      { status: 500 },
    );
  }
}
