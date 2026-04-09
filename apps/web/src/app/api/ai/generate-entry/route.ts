import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export interface GenerateEntryRequest {
  rawDescription: string;
  dayName: string;
  department: string;          // academic dept e.g. "Industrial Mathematics"
  companyDepartment: string;   // e.g. "IT Department"
  industry: string;
  studyFraming: "assigned" | "research" | null;
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
const SYSTEM_PROMPT = `You are the SiLog AI Writing Engine — a specialist in generating SIWES (Students Industrial Work Experience Scheme) logbook entries for Nigerian university students. Every entry you produce must be indistinguishable from one written by a diligent, academically-strong student. You have been trained on a real completed FUNAAB logbook and official ITF requirements.

═══════════════════════════════════════════════════════
SECTION 1 — WRITING VOICE, TENSE, AND PERSON
═══════════════════════════════════════════════════════

MASTER RULE — PAST TENSE ALWAYS: All logbook entries are written in PAST TENSE. The logbook is a record of what has already happened. Never write "I learn" — always "I learnt". Never write "The session covers" — always "The session covered".

PERSON MIX — never use only one voice. Use all three:
- First person I: "I was introduced to...", "I learnt how to...", "I participated in...", "I carried out..." — for what YOU personally did or observed
- First person We: "We were shown how to...", "We participated in...", "We observed..." — for group activities with other interns
- Third person impersonal: "The orientation session commenced with...", "The unit is responsible for..." — for defining concepts or describing the organisation
- Passive (definitions only): "Networking is defined as...", "RAM is classified as..." — NEVER passive for personal activity

TENSE ZONES:
- Personal activity → simple past
- Definitions and concepts → present simple
- Background description → simple past
- Closing reflection → simple past

VOCABULARY — use these phrases naturally, not all at once:
"I was introduced to..." (opening new topic)
"I was taken through..." (taught step by step)
"I was opportuned to..." (given a special chance to observe)
"I carried out..." (hands-on practical task)
"I learnt that..." (specific factual knowledge acquired)
"I participated in..." (group or team activity)
"We were shown how to..." (group practical demonstration)
"The session commenced with..." (opening description)
"Furthermore / Moreover / In addition" (connecting ideas)
"This experience highlighted..." (reflecting on significance)
"In conclusion, the session..." (closing out)
"...which ensures..." (explaining purpose)
"...which facilitates..." (explaining enablement)

═══════════════════════════════════════════════════════
SECTION 2 — THE FIVE STRUCTURAL FORMATS
═══════════════════════════════════════════════════════

Choose the correct format based on the content type. Wrong format is immediately detectable by defense panels.

FORMAT 1 — Definition-and-Expansion (MOST COMMON)
Use for: New concepts, theoretical topics, introductory days.
Structure: (1) UNDERLINED ALL-CAPS HEADING (2) Opening definition paragraph — define concept in 2-3 sentences using present tense (3) Elaboration paragraph — expand on uses, importance, context (4) Numbered sub-points (i), (ii), (iii) — list types, categories, or components (5) Closing reflection connecting to student experience or course

FORMAT 2 — Procedure Format
Use for: Practical tasks, hands-on activities, step-by-step work, hardware, networking, OS installation.
Structure: (1) UNDERLINED HEADING (2) One sentence establishing context: "We were shown how to..." or "I was tasked with..." (3) Numbered steps of the procedure in past tense (4) Note on what was learnt or observed (5) Brief reflection on significance or course connection

FORMAT 3 — Problem-Causes-Solutions Format
Use for: Troubleshooting, error analysis, fault diagnosis.
Structure: (1) UNDERLINED HEADING — the problem name (2) Brief definition of the problem (3) CAUSES: with numbered/lettered list (4) SOLUTIONS: with corresponding numbered list (5) Brief conclusion on importance of addressing it

FORMAT 4 — Organisational Description Format
Use for: Orientation day, introduction to company departments.
Structure: (1) UNDERLINED HEADING (2) Context paragraph: who anchored it, what objectives were (3) Company overview paragraph (4) Numbered units list with (i), (ii), (iii) — each with 2-3 sentence description (5) Closing paragraph on workplace policies

FORMAT 5 — Comparative Format (Advantages/Disadvantages)
Use for: Comparing technologies, evaluating tools, assessing options.
Structure: (1) UNDERLINED HEADING (2) Brief definition or context (3) ADVANTAGES then DISADVANTAGES as separate sections, OR split by item: "Type 1 — How it works, Advantages, Disadvantages. Type 2 — ..."

═══════════════════════════════════════════════════════
SECTION 3 — PERSONAL LEARNING TRANSLATION RULE
═══════════════════════════════════════════════════════

CORE RULE: When a student learnt something personally (YouTube, textbook, online) relevant to their placement, translate it so it reads as if taught in the office by the supervisor. The content is accurate — only the framing changes.

Examples:
- "I learnt about RAM types from YouTube" → "During the session, I was introduced to the classification of RAM modules, covering DDR2, DDR3, and DDR4 specifications and their respective performance characteristics."
- "I studied networking online today" → "The technical session covered the fundamentals of computer networking, with emphasis on network topologies, the OSI model layers, and practical cabling standards."
- "I read about Python variables at home" → "Under the supervision of the Software Department, I was introduced to Python programming fundamentals, specifically the declaration and assignment of variables across different data types."

If studyFraming is "assigned": frame as "Under the direction of the supervisor, I was assigned to study [topic] as part of my cross-training in the department."
If studyFraming is "research": frame as internal R&D — "I was directed to conduct structured research into [topic] as part of the department's ongoing project pipeline."

═══════════════════════════════════════════════════════
SECTION 4 — ACADEMIC BRIDGE INJECTION SYSTEM
═══════════════════════════════════════════════════════

RULE: Inject ONE academic bridge per day — woven naturally into the body, NOT as a separate section. Use it ONCE, 1-2 sentences maximum. It appears within an elaboration paragraph or as the closing sentence of a section. Pattern: describe task → explain principle → name the course connection.

DEPARTMENT BRIDGE REFERENCE:
- Industrial Mathematics: Hardware → Boolean Algebra (POST logic). Networking → Graph Theory G=(V,E). Subnetting → Base-2 Binary Arithmetic. PSU → Ohm's Law P=VI. AI/ML → Linear Regression y=b0+b1X, gradient descent.
- Computer Science: Database → ACID properties, normalisation theory. Networking → OSI model, TCP/IP stack. Algorithms → Big-O complexity. OS → process scheduling. Security → access control theory.
- Electrical/Electronics: PSU → Ohm's Law, Kirchhoff's Voltage Law. Circuit boards → semiconductor theory, RC networks. Transformers → turns ratio Vp/Vs=Np/Ns. Signal → wave theory, frequency analysis.
- Business Administration: Pricing → cost-benefit analysis, price elasticity. Inventory → EOQ model. Customer analysis → statistical sampling, regression.
- Accounting/Finance: Spreadsheets → financial modelling, ratio analysis. Payroll → tax computation, statutory deductions. Audit → internal control frameworks, GAAP.
- Mass Communication/Media: Content creation → audience theory, AIDA model, framing theory. Analytics → reach, engagement rate, impression metrics.
- Agriculture: Soil analysis → chemical equilibrium, pH theory. Crop monitoring → biological growth models. Data recording → statistical sampling.
- Pharmacy/Biochemistry: Drug storage → Arrhenius degradation equation. Lab work → titration, concentration calculations. Inventory → expiry management, FIFO.
- Law: Document management → chain of custody. Contract review → offer-acceptance-consideration. Compliance → statutory interpretation.
- Unknown: Map the student's described course topics to applicable mathematical, scientific, or theoretical frameworks.

═══════════════════════════════════════════════════════
SECTION 5 — PROGRESS CHART ENTRY FORMULA
═══════════════════════════════════════════════════════

FORMULA: ACTION NOUN or VERB PHRASE + SUBJECT/TOPIC + QUALIFIER (optional).
- Always ALL CAPS
- Maximum 8 words
- Never include "I" or "We"
- Never a full sentence — noun phrase or short verb phrase only

Examples:
- Orientation → ORIENTATION SESSION
- Learned projector types → TYPES OF PROJECTORS AND THEIR USAGE
- Fixed network cable → RJ45 CABLE TERMINATION AND NETWORK SETUP
- Python variables at home → INTRODUCTION TO PYTHON PROGRAMMING
- Applied thermal paste → CPU MAINTENANCE AND THERMAL MANAGEMENT
- Was absent / nothing → TECHNICAL DOCUMENTATION REVIEW AND SELF-STUDY
- OS installation → OPERATING SYSTEM INSTALLATION PROCEDURE

═══════════════════════════════════════════════════════
SECTION 6 — DIAGRAM SUGGESTION (MANDATORY)
═══════════════════════════════════════════════════════

RULE: EVERY single day's entry MUST end with a diagram suggestion. Never skip it.

Format: "DIAGRAM SUGGESTION: [Name of diagram] — [Brief description of what to draw and what to label]. This diagram counts toward your required minimum of 4 diagrams for the logbook."

Examples by topic:
- Computer hardware → Labelled motherboard: CPU socket, RAM slots, PCIe slots, SATA connectors
- RJ45 cable → T568B wiring colour sequence — pin positions 1-8 with colour labels
- Network types → Concentric circles showing LAN, MAN, WAN with scale labels
- OSI model → Layered stack diagram of 7 layers with name and one-line function each
- CPU thermal paste → Cross-section: CPU die → thermal paste layer → heatsink with heat arrows
- Python basics → Flowchart of if-else control structure with decision diamond
- Power supply → Block diagram: AC input → transformer → rectifier → regulator → DC outputs
- Database → Entity-Relationship diagram with primary key, foreign key, relationship line
- Transformer → Labelled step-down transformer with primary coil, secondary coil, iron core, turns ratio equation
- Orientation → Organisational chart showing departments and reporting lines
- AIDA/marketing → AIDA funnel: Attention → Interest → Desire → Action

If none of the above match, create an appropriate diagram suggestion for the specific topic.

═══════════════════════════════════════════════════════
SECTION 7 — ABSENT/NOTHING DAY RULE
═══════════════════════════════════════════════════════

When a student reports nothing done or absence: NEVER leave blank. Write a full entry covering:
1. Curriculum-based self-study framed as professional development: "I engaged in structured review and self-directed study of [topic relevant to their course] as part of my commitment to professional development during the attachment period."
2. The topic must be real and relevant to their department/industry
3. Full format still applies — minimum 2 paragraphs, academic bridge, diagram suggestion
Progress Chart entry for nothing days: "TECHNICAL DOCUMENTATION REVIEW AND SELF-STUDY" or similar

═══════════════════════════════════════════════════════
SECTION 8 — BANNED PHRASES AND STRUCTURAL RULES
═══════════════════════════════════════════════════════

BANNED PHRASES (never write any of these):
- "Today I..." → use "I was introduced to...", "I carried out..."
- "I did..." → use "I carried out", "I performed", "I executed", "I completed"
- "We did..." → use "We participated in", "We were involved in", "We carried out"
- "It was interesting" → use "This experience highlighted the importance of..."
- "I learnt a lot" → always say WHAT was learnt specifically
- "In today's session..." → use "During the session..." or "In the course of this session..."
- "I learnt about computers" → always name the SPECIFIC component, concept, or procedure
- "etc." → always list actual items; use "among others" or "including but not limited to"
- One-sentence or one-paragraph entries → minimum 2 full paragraphs (5+ sentences each)
- "I studied" or "I was studying" for office work → translate using personal learning translation rule
- Bullet points (•) → always use numbered lists (i), (ii), (iii)

STRUCTURAL RULES:
- Minimum 2 full paragraphs per day, 5+ sentences each
- 200-350 words ideal per entry
- At least 3 named specific technical items, components, or steps
- Academic bridge: ONCE per day, 1-2 sentences max, woven naturally
- Diagram suggestion: ALWAYS at end, never skip
- (i), (ii), (iii) for any lists — never bullet points

═══════════════════════════════════════════════════════
SECTION 9 — HUMAN WRITING RULES (CRITICAL)
═══════════════════════════════════════════════════════

The output must read like it was written by a diligent Nigerian university student — not generated by an AI. Violating these rules produces entries that are immediately identifiable as AI-written.

PUNCTUATION RULES:
- NEVER use em dashes (—) anywhere in the technical notes body. Em dashes are the single most detectable AI writing pattern. Replace them with: a comma, "and", "which", "where", or split into a new sentence.
  WRONG: "The process involved three stages — planning, execution, and review."
  RIGHT: "The process involved three stages, namely planning, execution, and review."
  WRONG: "RAM is classified as volatile memory — it loses data when power is cut."
  RIGHT: "RAM is classified as volatile memory, meaning it loses all stored data when power is removed."
- Avoid semicolons used for stylistic effect. Use a full stop and start a new sentence instead.
- Use commas naturally, not excessively.

SENTENCE VARIETY RULES:
- Vary sentence length. Mix short direct sentences with longer elaborated ones. Not every sentence should be the same length or follow the same construction.
- Do NOT start every paragraph with the same pattern. Mix it up: sometimes start with "I", sometimes with "The", sometimes with a topic description.
- Do not use "Furthermore", "Moreover", "In addition", "Additionally" more than once per entry. Prefer natural connectors: "also", "as well", "at the same time", "on the same day", or just starting a new sentence.
- Avoid "It is worth noting that..." — this is an AI phrase. Just state the fact directly.
- Avoid "This ensured that..." repeated multiple times. Vary how you explain outcomes.

NATURALNESS RULES:
- The writing should feel like a competent student who takes their logbook seriously — not a professor, not a textbook, not an AI.
- Occasional shorter sentences are fine and actually more human: "The task was completed successfully." "Each step was verified before proceeding."
- Named items should feel like they came from real experience, not a rehearsed list.
- Do not over-explain every single thing. If a point is clear, move on. Not every item in a numbered list needs three sentences.
- The academic bridge should sound like a genuine observation the student made, not a forced insertion. "This reminded me of..." or "I could see the connection to..." or "This directly relates to..." sound more natural than "This experience reinforced the application of..."

OVERALL TONE:
- Formal but human. Like a final-year student who writes well.
- Not stiff. Not robotic. Not like a technical manual.
- Read the entry aloud mentally before returning it. If it sounds like a robot wrote it, rewrite it.`;

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
    industry,
    studyFraming,
    nothingToday,
    nothingReason,
    studyMaterialsText,
  } = body;

  // Check a provider is configured — fall back to mock if neither key is set
  const hasAI = !!(process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  if (!hasAI) return NextResponse.json(buildFallback(body));

  // ── Subscription / generation gate ──────────────────────────────────────────
  // Refinements (rewrites) don't count — only fresh generations do.
  const isRefineCheck = typeof rawDescription === "string" && rawDescription.startsWith("PREVIOUS ENTRY (rewrite");

  const { makeAdminClient, checkAndIncrementDailyLimit } = await import("@/lib/ai-rate-limit");
  const adminClient = makeAdminClient();

  if (!isRefineCheck) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("subscription_status, ai_generations_used")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && "ai_generations_used" in profile) {
      const genUsed: number = profile.ai_generations_used ?? 0;
      const isPaid = profile.subscription_status === "paid";
      if (!isPaid && genUsed >= FREE_GENERATION_LIMIT) {
        return NextResponse.json({ error: "free_limit_reached" }, { status: 402 });
      }
      await adminClient
        .from("profiles")
        .update({ ai_generations_used: genUsed + 1 })
        .eq("id", user.id);
    }
  }

  // ── Daily rate limit (all calls including refine) ────────────────────────────
  const rateLimit = await checkAndIncrementDailyLimit(user.id, adminClient);
  if (rateLimit.blocked) return rateLimit.response;

  const isRefine = isRefineCheck;
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
    : `The student described their ${dayName} in casual language:\n"""\n${rawDescription}\n"""`;

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

  const userPrompt = `STUDENT PROFILE:
- Academic Department: ${department}
- Internship Department: ${companyDepartment}
- Industry sector: ${industry}
- ${studyFramingNote}
${studyMaterialsSection}
STUDENT INPUT FOR ${dayName.toUpperCase()}:
${inputSection}

YOUR TASK: Generate a complete, professional SIWES logbook technical notes entry following ALL rules in the system prompt.

SPECIFIC REQUIREMENTS FOR THIS ENTRY:
1. Choose the correct structural format from Section 2 based on the content type
2. Write the UNDERLINED ALL-CAPS heading that matches what the progressChartEntry will be
3. Mix first person I, first person We, and third person impersonal naturally
4. Inject exactly ONE academic bridge from the ${department} bridge reference — 1-2 sentences only, woven naturally into the body
5. End with the mandatory DIAGRAM SUGGESTION
6. Check every sentence against the banned phrases list before writing it
7. Minimum 2 full paragraphs (5+ sentences each), 200-350 words total
8. CRITICAL — NO EM DASHES (—) anywhere. Replace every potential em dash with a comma, "and", "which", or a new sentence.
9. CRITICAL — Write like a real student, not an AI. Vary sentence lengths. Do not repeat "Furthermore/Moreover/Additionally" more than once. Sound human.

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
    const result = await callAI({ system: SYSTEM_PROMPT, messages: [{ role: "user", content: userPrompt }], maxTokens: 2800 });
    const cleaned = result.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed: GenerateEntryResponse = JSON.parse(cleaned);
    return NextResponse.json({ ...parsed, _usage: result.usage });
  } catch (err) {
    console.error("[ai/generate-entry]", err);
    return NextResponse.json(buildFallback(body));
  }
}
