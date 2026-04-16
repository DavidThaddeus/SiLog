import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

// ─── Extract key technical activities from raw description ────────────────────
function extractKeyActivities(text: string): string[] {
  const keywords = [
    // Hardware
    "cable", "termination", "rj45", "ethernet", "connector", "psu", "power", "diagnostics", "ram", "cpu", "motherboard", "gpu", "workstation", "server", "laptop", "desktop", "monitor", "keyboard", "mouse", "printer", "scanner", "router", "switch", "firewall", "modem",
    // Software
    "database", "sql", "python", "java", "c\\+\\+", "javascript", "api", "rest", "json", "xml", "html", "css", "linux", "windows", "macos", "ubuntu", "centos", "docker", "kubernetes", "git", "github", "ci/cd", "jenkins", "excel", "word", "powerpoint", "backup", "encryption", "authentication",
    // Networking
    "network", "topology", "osi model", "tcp/ip", "subnet", "dhcp", "dns", "ip address", "ping", "traceroute", "firewall rule", "vlan", "wan", "lan",
    // Business/General
    "spreadsheet", "pivot table", "data entry", "documentation", "filing", "inventory", "procurement", "audit", "compliance", "meeting", "presentation", "training",
  ];

  const text_lower = text.toLowerCase();
  const found = keywords.filter(kw => text_lower.includes(kw));
  return [...new Set(found)]; // remove duplicates
}

// ─── Build department-to-bridge mapping ────────────────────────────────────────
function getDeptBridgeMapping(department: string, activities: string[]): { bridges: Record<string, string>; unknown: boolean } {
  const dept_lower = department.toLowerCase();

  // Map department keywords to bridge sets
  const mappings: Record<string, Record<string, string>> = {
    "industrial mathematics": {
      "cable": "Boolean Algebra (logic gates in network switching)",
      "network": "Graph Theory (modelling networks as G=(V,E))",
      "subnet": "Binary arithmetic (IP addressing and subnetting)",
      "psu": "Ohm's Law (P=VI power calculations)",
      "database": "Set theory (database relations and queries)",
      "encryption": "Linear algebra (cryptographic key matrices)",
    },
    "computer science": {
      "database": "ACID properties and normalisation theory",
      "network": "OSI model and TCP/IP stack",
      "api": "Interface design and abstraction principles",
      "encryption": "Cryptographic algorithms and access control theory",
      "git": "Version control and distributed systems concepts",
      "backup": "Data redundancy and fault tolerance theory",
    },
    "electrical": {
      "psu": "Ohm's Law and Kirchhoff's Voltage Law",
      "cable": "Signal propagation and impedance theory",
      "network": "Transmission line theory and signal integrity",
      "circuit": "Semiconductor theory and transistor switching",
      "transformer": "Turns ratio Vp/Vs=Np/Ns and magnetic coupling",
    },
    "business": {
      "inventory": "EOQ model (Economic Order Quantity)",
      "spreadsheet": "Financial modelling and ratio analysis",
      "audit": "Cost-benefit analysis and internal controls",
      "data": "Statistical sampling and regression analysis",
      "pricing": "Price elasticity of demand models",
    },
    "accounting": {
      "spreadsheet": "Financial modelling and ratio analysis",
      "audit": "GAAP and internal control frameworks",
      "payroll": "Tax computation and statutory deductions",
      "backup": "Data integrity and audit trail principles",
    },
    "communication": {
      "content": "AIDA model (Attention, Interest, Desire, Action)",
      "presentation": "Audience theory and framing theory",
      "analytics": "Reach, engagement rate, and CTR metrics",
      "documentation": "Narrative structure and messaging theory",
    },
    "information technology": {
      "network": "OSI model and TCP/IP",
      "database": "Normalisation and transaction management",
      "security": "Encryption, authentication, and access control",
      "backup": "Distributed systems and redundancy theory",
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
      "default": "Connect workplace activity to relevant theoretical framework from your academic programme",
    },
    unknown: true,
  };
}

// ─── Build context-aware bridge instruction ────────────────────────────────────
function buildBridgeInstruction(department: string, rawDescription: string): string {
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
  department: string;          // academic dept e.g. "Industrial Mathematics"
  companyDepartment: string;   // e.g. "IT Department"
  companyName?: string;        // e.g. "First Bank Nigeria"
  industry: string;
  companyDescription?: string; // What the company does
  myRoleDescription?: string;  // What the student's role is
  notesLengthPreference?: "short" | "long"; // short=250-350 words, long=400-450 words
  studyFraming: "assigned" | "research" | null;
  personalStudyDescription?: string; // What the student is personally studying outside work (from onboarding Step 8)
  nothingToday?: boolean;
  nothingReason?: string;
  studyMaterialsText?: string; // Extracted text from the student's uploaded study PDFs
}

export interface GenerateEntryResponse {
  technicalNotes: string;
  keyActivities: string[];
  progressChartEntry: string;
  deptBridgeUsed: string;
}

// ─── Fallback (no API key) ────────────────────────────────────────────────────
function buildFallback(body: GenerateEntryRequest): GenerateEntryResponse {
  const { rawDescription, dayName, companyDepartment, department, nothingReason } = body;
  const activity = rawDescription || nothingReason || "general departmental duties";
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
→ 1. [Type] <u>Definition:</u> ... <u>Applications:</u> (i)(ii)
→ 2. [Next Type] (repeat)
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

PERSONAL LEARNING (YouTube, textbooks, online sources):
Reframe as office-based:
- "office": "During the session in the office, we were introduced to..."
- "assigned": "Under supervisor direction, we were assigned to study [topic]..."
- "research": "We were directed to conduct structured research into [topic]..."

ABSENT/NOTHING DAY:
Never blank. Generate realistic routine task or professional development entry. Frame as "We engaged in structured review of [topic] as part of professional development during the attachment period..." Still follow all rules. Progress Chart: "TECHNICAL DOCUMENTATION REVIEW AND SELF-STUDY"

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
5. FOR FORMAT 1: After definition, ALWAYS transition with "During the session in the office, we..." or "We were taken through..." or "During this technical session, we learned..."
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
    companyDescription,
    myRoleDescription,
    notesLengthPreference,
    studyFraming,
    personalStudyDescription,
    nothingToday,
    nothingReason,
    studyMaterialsText,
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
  const isRefine = typeof rawDescription === "string" && rawDescription.startsWith("PREVIOUS ENTRY (rewrite");

  const { makeAdminClient, checkDailyLimit, incrementDailyLimit } = await import("@/lib/ai-rate-limit");
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
  const isPaid = profile?.subscription_status === "paid" || (!dailyCheck.blocked && dailyCheck.isPaid);
  if (!isPaid && genUsed >= FREE_GENERATION_LIMIT) {
    return NextResponse.json({ error: "free_limit_reached" }, { status: 402 });
  }

  // ── Step 3: Increment both counters now that all checks passed ───────────────
  await Promise.all([
    incrementDailyLimit(user.id, adminClient, dailyCheck.blocked ? 0 : (dailyCheck as { callsToday: number }).callsToday),
    adminClient
      .from("profiles")
      .update({ ai_generations_used: genUsed + 1 })
      .eq("id", user.id),
  ]);
  const isNothingDay = nothingToday && !isRefine;

  const inputSection = isRefine
    ? `The student wants to REFINE a previously generated logbook entry. The full context is below:

${rawDescription}

YOUR JOB: Rewrite the logbook entry applying the USER INSTRUCTION exactly. Keep everything that is correct. Only change what the instruction asks. The result must still follow ALL writing rules: correct structural format, academic bridge, minimum 2 paragraphs, diagram suggestion at end, no em dashes, no AI patterns.`
    : isNothingDay
    ? `The student had no specific activity assigned today. Reason given: "${nothingReason || "no formal assignment given"}".

YOUR JOB: Invent a realistic, specific, and credible logbook entry for this day. Do NOT write generic filler. Use everything you know about the student:
- They study ${department} at university
- They are interning in the ${companyDepartment} of a ${industry} organisation
- It is ${dayName}

Generate an entry that a real student in this exact placement would plausibly have done on a quiet day. Draw from one of these options in order of preference:
1. A routine support or maintenance task common in the ${companyDepartment} (e.g. equipment checks, data entry, documentation, assisting a colleague, filing, system monitoring)
2. Structured self-directed study of a topic directly relevant to their placement and their ${department} course (framed as professional development during attachment, NOT as "I studied at home")
3. A review or continuation of something that would naturally occur in a ${industry} setting

The entry must still follow ALL writing rules: correct structural format, academic bridge from ${department}, minimum 2 paragraphs, diagram suggestion at the end. It must read as a genuine productive workday, not as "I had nothing to do."`
    : `The student described their ${dayName} in casual, sometimes imprecise language (possibly via voice-to-text on mobile):
"""
${rawDescription}
"""

IMPORTANT — MISTAKE CORRECTION: Before writing the entry, mentally correct any words that are:
- Technically wrong or misused (e.g. "arrayed the cables" → "arranged/terminated the cables", "netwurk" → "network", "I fixed the water" → "resolved the cooling system issue")
- Garbled by voice recognition (e.g. "cable termination asian" → "cable termination", "rj for five" → "RJ45")
- Vague or informal (e.g. "did stuff with the computer" → identify the most likely technical task given the department and industry context)
Use ONLY the corrected professional terms in the final entry. Never repeat the student's wrong word.`;


  const studyFramingNote = studyFraming === "assigned"
    ? `Study framing: ASSIGNED — any learning mentioned should be framed as "Under the direction of the supervisor, I was assigned to study [topic] as part of my cross-training in the ${companyDepartment}."`
    : studyFraming === "research"
    ? `Study framing: RESEARCH — any learning mentioned should be framed as internal R&D work directed by the company.`
    : `Study framing: OFFICE WORK — all activities are direct office tasks. Apply Personal Learning Translation Rule (Section 3) for anything that sounds like self-study.`;

  const studyMaterialsSection = studyMaterialsText
    ? `\nSTUDENT'S ACTUAL STUDY MATERIALS (extracted from their uploaded PDFs):
These are the real topics and content the student is studying. When writing entries involving personal study, reference specific concepts, terminology, and ideas from these materials directly — do NOT invent generic topics.
---
${studyMaterialsText.slice(0, 12_000)}
---`
    : "";

  // Build word-count instruction based on student's notes length preference
  const isShortNotes = notesLengthPreference === "short";
  const wordCountRule = isShortNotes
    ? `8. LENGTH — Short notes mode (1-3 pages). Target 250–350 words in technicalNotes. Minimum 2 paragraphs. At least 3 named specific technical items. Numbered lists or sub-headings where the format calls for them. Do NOT flatten structured topics into plain prose, but keep paragraphs concise.`
    : `8. LENGTH IS MANDATORY — Long notes mode (4-5 pages). The technicalNotes must be a FULL, DETAILED entry. Target 400–450 words. Minimum 3 paragraphs, at least 3 named specific technical items, numbered lists or sub-headings where the format calls for them. Use the structural format from Section 3 properly — if the topic has Types, list them with numbered items and (i)(ii) sub-points.`;
  // Build student context section from profile
  const profileContext = [
    companyName ? `- Company: ${companyName}` : "",
    companyDescription ? `- What the company does: ${companyDescription}` : "",
    myRoleDescription ? `- Student's role: ${myRoleDescription}` : "",
    personalStudyDescription
      ? `- Personal study topics (outside work): ${personalStudyDescription} — when the student mentions learning this personally, apply the Personal Learning Translation Rule (Section 4): reframe it as a session or directed study that happened at the office, using the studyFraming mode above.`
      : "",
  ].filter(Boolean).join("\n");

  // Build context-aware bridge instruction based on department and activities
  const bridgeInstruction = buildBridgeInstruction(department, rawDescription);

  const userPrompt = `STUDENT PROFILE:
- Academic Department: ${department}
- Internship Company: ${companyName ?? "not specified"}
- Internship Department: ${companyDepartment}
- Industry sector: ${industry}
${profileContext ? profileContext + "\n" : ""}- ${studyFramingNote}
${studyMaterialsSection}
STUDENT INPUT FOR ${dayName.toUpperCase()}:
${inputSection}

${bridgeInstruction}

YOUR TASK: Generate a complete, professional SIWES logbook technical notes entry following ALL rules in the system prompt.

SPECIFIC REQUIREMENTS FOR THIS ENTRY:
0. CORRECT ANY MISTAKES FIRST — fix technically wrong words, voice-recognition errors, or vague terms before writing anything. Use only the corrected professional version in the entry.
1. Choose the correct structural format from Section 3 (Five Structural Formats) based on the content type
2. Write the UNDERLINED ALL-CAPS heading following Section 2 heading hierarchy — it must match the progressChartEntry exactly
3. Mix first person I, first person We, and third person impersonal naturally (Section 1)
4. Apply Personal Learning Translation Rule (Section 4) for anything that sounds like self-study — frame it as office-based
5. Inject exactly ONE academic bridge from the ${department} bridge reference (Section 5) — 1-2 sentences only, woven naturally, not announced
6. End with the mandatory DIAGRAM SUGGESTION (Section 7) — never skip it
7. Check every sentence against the banned phrases list (Section 9) before writing it
${wordCountRule}
9. CRITICAL — NO EM DASHES (—) anywhere in the body. Replace with a comma, "which", or a new sentence (Section 10)
10. CRITICAL — Write like a real student, not an AI. Vary sentence lengths. Max one "Furthermore/Moreover/Additionally" per entry. Sound human (Section 10)

Return ONLY a valid JSON object with exactly these four keys, no markdown, no explanation:
{
  "technicalNotes": "The full entry — UNDERLINED ALL-CAPS heading, minimum 2 paragraphs, academic bridge woven naturally, ends with DIAGRAM SUGGESTION",
  "keyActivities": ["Short past-tense phrase 1", "Short past-tense phrase 2", "Short past-tense phrase 3"],
  "progressChartEntry": "ALL-CAPS PHRASE MAX 8 WORDS — matches the heading in technicalNotes",
  "deptBridgeUsed": "Name of the specific academic concept injected e.g. 'Graph Theory G=(V,E)' or 'ACID Properties of Database Transactions'"
}

keyActivities: 2 to 4 items. Each is a short past-tense phrase like "Carried out RJ45 cable termination using T568B standard" or "Participated in scheduled database backup procedure".
progressChartEntry: The column header in the physical logbook — ALL CAPS, maximum 8 words, noun phrase, no "I" or "We".`;

  try {
    const { callAI } = await import("@/lib/ai-provider");
    const result = await callAI({ system: SYSTEM_PROMPT, messages: [{ role: "user", content: userPrompt }], maxTokens: 4000, temperature: 0.2, jsonMode: true });
    console.log(`[ai/generate-entry] ✓ model=${result.usage.model} in=${result.usage.input} out=${result.usage.output} cost=$${result.usage.cost.toFixed(5)}${result.usage.fallbackChain ? ` fallback-from=${result.usage.fallbackChain.join("→")}` : ""}`);
    const cleaned = result.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed: GenerateEntryResponse = JSON.parse(cleaned);

    // Guard: ensure required fields are present and correct types before sending to client
    if (
      typeof parsed.technicalNotes !== "string" ||
      !Array.isArray(parsed.keyActivities) ||
      typeof parsed.progressChartEntry !== "string" ||
      typeof parsed.deptBridgeUsed !== "string"
    ) {
      console.error("[ai/generate-entry] AI returned incomplete JSON:", parsed);
      return NextResponse.json({ error: "AI returned an incomplete response. Please try again." }, { status: 500 });
    }

    const newCallsToday = (dailyCheck as { callsToday: number }).callsToday + 1;
    const { DAILY_LIMIT_FREE: dlFree, DAILY_LIMIT_PAID: dlPaid } = await import("@/lib/ai-rate-limit");
    const dailyLimit = isPaid ? dlPaid : dlFree;
    return NextResponse.json({ ...parsed, _usage: result.usage, _generationsUsed: genUsed + 1, _callsToday: newCallsToday, _dailyLimit: dailyLimit });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error && (err as NodeJS.ErrnoException).cause;
    console.error("[ai/generate-entry] callAI failed:", message, cause ? `| cause: ${JSON.stringify(cause)}` : "");
    return NextResponse.json({ error: `AI generation failed: ${message}` }, { status: 500 });
  }
}
