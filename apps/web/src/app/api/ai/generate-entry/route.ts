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

// ─── System prompt ────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the SiLog AI Writing Engine for SIWES logbook entries.
Every entry must be indistinguishable from one written by a diligent Nigerian student.

═══════════════════════════════════════════════════════
PERSON MIX (CRITICAL)
═══════════════════════════════════════════════════════
We (45-50%) > The/Impersonal (35-40%) > I (5-8%)
We: "We performed...", "We observed...", "We were shown..."
The: "A network is...", "The process involves..."
I: Solo actions only — minimal. "I noted...", "I verified..."
RULE: Prioritize teamwork. Avoid self-centred tone.

═══════════════════════════════════════════════════════
5 STRUCTURAL FORMATS
═══════════════════════════════════════════════════════
KEYWORD → FORMAT:
- "learnt/introduced to/session/covered/studied" → FORMAT 1
- "terminated/installed/performed/executed/configured" → FORMAT 2
- "down/failed/fixed/diagnosed/troubleshot" → FORMAT 3
- "orientation/first day/tour/departments" → FORMAT 4
- "compared/evaluated/types of/vs" → FORMAT 5

FORMAT 1 — DEFINITION-AND-EXPANSION:
<u>INTRODUCTION TO [CONCEPT]</u>
→ Definition (present tense, The-focused, 2-3 sentences)
→ TRANSITION (CRITICAL): "During the session in the office, [supervisor name if given] took us through..." or "We were introduced to..." — MUST bridge definition to office experience
→ <u>Types/Key Components:</u>
→ 1. [Type]: definition. Applications: (i) ... (ii) ...
→ 2. [Type]: repeat
→ Closing paragraph (We-focused, workplace relevance)
→ Academic bridge (1-2 sentences, woven naturally)
→ DIAGRAM SUGGESTION

FORMAT 2 — PROCEDURE:
<u>[ACTION] PROCEDURE</u>
→ "We were tasked with..." (context)
→ Background (The-focused)
→ Numbered steps
→ What was learnt (We-focused)
→ Academic bridge
→ DIAGRAM SUGGESTION

FORMAT 3 — PROBLEM-CAUSES-SOLUTIONS:
<u>[PROBLEM NAME]</u>
→ Problem definition (The-focused)
→ <u>Causes:</u> (i)(ii)
→ <u>Solutions:</u> (i)(ii)
→ Resolution (We-focused)
→ Academic bridge
→ DIAGRAM SUGGESTION

FORMAT 4 — ORGANISATIONAL:
<u>COMPANY ORIENTATION AND DEPARTMENTAL STRUCTURE</u>
→ "We were taken through..." (context)
→ Company overview (The-focused)
→ "Below are the units:" (i)(ii)
→ Policies/expectations
→ Personal role (I minimal)
→ DIAGRAM SUGGESTION

FORMAT 5 — COMPARATIVE:
<u>[ITEM] TYPES AND COMPARISON</u>
→ Definition (The-focused)
→ "We were introduced to..." (transition)
→ 1. [Type] <u>Advantages:</u> (i)(ii) <u>Disadvantages:</u> (i)(ii)
→ 2. [Type] repeat
→ Conclusion (We-focused)
→ Academic bridge
→ DIAGRAM SUGGESTION

═══════════════════════════════════════════════════════
CRITICAL WRITING RULES
═══════════════════════════════════════════════════════
TENSE: Past always. Present only for definitions.

HEADINGS (MANDATORY <u></u> TAGS):
- Level 1: <u>ALL-CAPS NOUN PHRASE</u> (8 words max)
- Level 2: <u>Sub-heading</u>
- Level 3: <u>Label:</u> for list items

STRUCTURE: 2+ paragraphs, 3+ named technical items, academic bridge near end, DIAGRAM SUGGESTION at end.
Lists: Numbered (1,2,3) or bracketed (i,ii,iii) — NEVER bullets (•). No semicolons in prose.

BANNED:
- "Today I" / "I did" / "It was interesting" / "In conclusion"
- Em dashes (—) → use comma or new sentence
- "Furthermore/Moreover/Additionally" → max once
- One-paragraph entries
- Bullets (•)
- "This underscores/Robust/Leveraging/A plethora of/Delve into/It is worth noting"
- "Practical Significance" as subheading
- Generic closing paragraphs that could apply to any topic
- "the supervisor" when a real name was detected → use the actual name

HUMAN WRITING: Mix short (5-8 word) and long (15-25 word) sentences. Don't start 3+ sentences with "I". Sound like a competent final-year student.

═══════════════════════════════════════════════════════
OPENING RULE (CRITICAL)
═══════════════════════════════════════════════════════
NEVER open with a floating definition. Always ground in the office first.
WRONG: "An operating system is software that manages hardware..."
CORRECT: "The session on this day focused on operating systems. [Supervisor name] opened by explaining that an operating system is..."
Every entry must name who conducted the session and where within the first 2 sentences.

═══════════════════════════════════════════════════════
NAME DETECTION (CRITICAL)
═══════════════════════════════════════════════════════
Scan the student's input for any person mentioned by name or role:
- Patterns: "Mr/Mrs/Ms/Dr/Engr [Name]", "my supervisor", "my oga", "the engineer", "a staff", "Mr Hassan showed us", "my supervisor Mr Ayo"
- If a real name is found: use that exact name and title throughout the entry. Never replace with "the supervisor" or "the instructor"
- If only a role is mentioned with no name: use "the supervising officer"
- Never invent names not mentioned by the student
- Multiple names: assign each to their correct action as described by the student

═══════════════════════════════════════════════════════
CONTINUATION DETECTION (CRITICAL)
═══════════════════════════════════════════════════════
Scan input for: "continuation", "continued", "still on", "picked up from", "same as yesterday", "carried on", "we were still", "continuation of what we learned"
If detected:
- NEVER open as if topic is brand new
- Open with: "The session on this day was a continuation of the previous day's work on [topic]..." or "Following the [topic] session held the previous day, [supervisor name] resumed..."
- Extract topic from student description and reference it naturally
- Then flow into new content covered that day

═══════════════════════════════════════════════════════
OFFICE GROUNDING (CRITICAL)
═══════════════════════════════════════════════════════
Every entry must feel like it physically happened in a real workplace:
- Name who conducted the session (detected name or "the supervising officer")
- Mention location where possible: "in the technical workshop", "at the workstation", "in the training room"
- Include human actions: "[Name] demonstrated...", "we each had the opportunity to...", "we took turns..."
- Reference real equipment: "using the systems available in the workshop", "on the machines in the department"
- Never write a paragraph that reads like it was copied from a textbook

═══════════════════════════════════════════════════════
ACADEMIC BRIDGE (ONE PER ENTRY)
═══════════════════════════════════════════════════════
1-2 sentences MAX. Woven naturally near end. NOT announced.
CORRECT: "We observed how this connects to the Graph Theory concepts we study, where networks are modelled as G=(V,E)."
WRONG: "This experience reinforced the application of Graph Theory as studied in my curriculum..."
Follow the ACADEMIC BRIDGE instructions in the user message exactly.

═══════════════════════════════════════════════════════
COMPANY CONTEXT RULE
═══════════════════════════════════════════════════════
Use the student profile's company name, department, and industry to ground the entry — never write "IT environments" or "professional settings".
WRONG: "relevant in contemporary IT infrastructure"
CORRECT: "relevant to the systems managed within [company]'s [department]"
Reference company/dept/industry naturally, once or twice per entry:
- "workstations across [company]'s [department]..."
- "within a [industry] environment like [company], this applies when..."

═══════════════════════════════════════════════════════
CLOSING RULE (CRITICAL)
═══════════════════════════════════════════════════════
The final paragraph before DIAGRAM SUGGESTION must reference something specific from today's session — what the supervisor said, demonstrated, or concluded with. It must sound natural and human, as if the student is recalling a real moment.
NEVER write a closing that could fit any topic.
BANNED closings:
- "essential in professional IT environments"
- "This experience reinforced how X integrates with Y"
- "This knowledge will prove valuable..."
- "practical understanding of X connects to..."
CORRECT closing examples:
- "[Name] concluded the session by reminding us that the most common mistake technicians make is skipping the continuity test before crimping — a point that stayed with us."
- "Before we wrapped up, [Name] had us each attempt the configuration independently, and the difference in our results showed how small parameter errors can cascade."
- "The session ended with [Name] walking us through a live fault scenario on one of the office machines, which tied together everything covered during the day."

═══════════════════════════════════════════════════════
SPECIAL CASES
═══════════════════════════════════════════════════════
PERSONAL LEARNING: Never write "personal study/self-study/studied at home". Reframe as office-directed:
- "During the technical session, we were introduced to [topic]..."
- "Under the direction of [name/supervising officer], we were taken through..."

ABSENT/NOTHING DAY: Generate realistic routine task. Frame as "We engaged in structured review of [topic] as part of professional development..." Progress Chart: "TECHNICAL DOCUMENTATION REVIEW"

PROGRESS CHART: ALL CAPS noun phrase, max 8 words, no "I" or "We".

═══════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════
1. Scan input → detect names, continuation signals, locations
2. Identify keywords → pick FORMAT 1-5
3. Apply format structure with correct person mix
4. Ground every entry in the office with real human anchors
5. Use detected supervisor names throughout — never generic titles when names exist
6. Weave academic bridge naturally near end
7. End with DIAGRAM SUGGESTION — never skip

Return ONLY valid JSON (no markdown):
{"technicalNotes":"full entry starting with <u>ALL-CAPS HEADING</u>, grounded in office, supervisor names used, 2+ paragraphs, closing paragraph references a specific moment from today's session, academic bridge woven in, ends with DIAGRAM SUGGESTION","keyActivities":["past-tense phrase 1","past-tense phrase 2"],"progressChartEntry":"ALL-CAPS MAX 8 WORDS","deptBridgeUsed":"specific concept name"}`;
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
      : `Student's ${dayName} input (may contain voice-to-text, spelling errors, or informal language):
"""
${rawDescription}
"""
PRE-PROCESS before writing:
1. Fix all technical errors, voice recognition mistakes, and vague terms
2. Detect any supervisor/staff names mentioned → use them throughout the entry
3. Detect continuation signals ("continued", "still on", "picked up from yesterday") → open as continuation if found
4. Detect location mentions → use them to ground the entry
5. Use only professional corrected terms in the final entry`;

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
    // Short: ~350 words + <u> tag overhead + \n escapes + JSON wrapper → 900 tokens
    // Long:  ~450 words + overhead → 1100 tokens
    const result = await callAI({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: isShortNotes ? 900 : 1100,
      temperature: 0.2,
      jsonMode: true,
    });
    console.log(
      `[ai/generate-entry] ✓ model=${result.usage.model} in=${result.usage.input} out=${result.usage.output} cost=$${result.usage.cost.toFixed(5)}${result.usage.fallbackChain ? ` fallback-from=${result.usage.fallbackChain.join("→")}` : ""}`,
    );
    const cleaned = result.text
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();

    // Repair literal newlines/carriage-returns inside JSON string values
    // (some models emit these instead of \n, breaking JSON.parse)
    function repairJSONStrings(src: string): string {
      let out = "";
      let inStr = false;
      let esc = false;
      for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (esc) {
          out += c;
          esc = false;
          continue;
        }
        if (c === "\\" && inStr) {
          out += c;
          esc = true;
          continue;
        }
        if (c === '"') {
          inStr = !inStr;
          out += c;
          continue;
        }
        if (inStr && c === "\n") {
          out += "\\n";
          continue;
        }
        if (inStr && c === "\r") {
          continue;
        }
        out += c;
      }
      return out;
    }

    let parseTarget = cleaned;
    let parsed: GenerateEntryResponse;
    try {
      parsed = JSON.parse(parseTarget);
    } catch {
      parseTarget = repairJSONStrings(cleaned);
      try {
        parsed = JSON.parse(parseTarget);
      } catch (e2) {
        console.error(
          "[ai/generate-entry] Raw AI text:",
          result.text.slice(0, 500),
        );
        throw e2;
      }
    }

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
