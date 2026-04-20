import type { WeekEntry, DayEntry, DayStatus, ActivityBankState, BankedActivity } from "@/types/dashboard";

/** Local copy — avoids circular module init with pricing.ts under Turbopack. */
function weekToBlock(weekNumber: number): number {
  if (weekNumber <= 1) return 0;
  return Math.ceil((weekNumber - 1) / 4);
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const ATTENDANCE_DAYS = new Set(["Monday", "Wednesday", "Friday"]);

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function toISO(d: Date): string {
  // Use local date components to avoid UTC-offset shifting the date
  // (e.g. WAT is UTC+1: midnight local = 23:00 prev-day UTC → wrong date)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function mondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

// today is used only by mock data generators below — never for real user data.
const today = new Date();
today.setHours(0, 0, 0, 0);
const SIWES_START = addDays(mondayOf(today), -7 * 7);

// ─── FULL TECHNICAL NOTES ─────────────────────────────────────────────────────

const TECHNICAL_NOTES: Record<string, string> = {
  Monday: `On this day, I was assigned to carry out systematic diagnostic procedures on four workstations in the IT department. The diagnostic process commenced with the application of the Power-On Self-Test (POST) procedure on each machine. The POST sequence evaluates each connected hardware component as either functional (binary state: 1) or non-functional (binary state: 0), representing a direct application of Boolean Algebra — a foundational topic within my Industrial Mathematics curriculum.

Upon completing the initial diagnostic on the third workstation, I identified a faulty Random Access Memory (RAM) module of the DDR3 standard with a capacity of 8 gigabytes. The module was extracted using an ESD (Electrostatic Discharge) wristband to prevent static damage to the circuit board. A replacement module of equivalent specification was sourced from the department's hardware repository and installed. Following installation, the machine successfully completed the POST cycle, confirming operational status.

The mathematical significance of RAM capacity is expressed as: Total addressable memory = 2ⁿ, where n represents the number of address lines. A 64-bit system can theoretically address 2⁶⁴ bytes, a number derived directly from binary exponentiation studied in my Discrete Mathematics course.

Following the repairs, I compiled a hardware condition report for all four systems, documenting serial numbers, component specifications, and fault descriptions. This documentation was submitted to the Head of IT Operations for filing.`,

  Wednesday: `On this day, I was directed by my supervisor to apply thermal compound to three central processing units (CPUs) that had been flagged for overheating during the previous week's diagnostics. The thermal paste application procedure requires precision, as an insufficient or excessive quantity will degrade thermal conductivity between the CPU die and the heatsink.

The application process involved: (1) cleaning the existing dried compound from both the CPU lid and the heatsink base using isopropyl alcohol, (2) applying a rice-grain quantity of Arctic MX-4 thermal compound to the centre of the CPU die, and (3) securing the heatsink and verifying the mounting pressure. Post-installation temperature readings were recorded using HWMonitor software, confirming idle temperatures dropped from an average of 87°C to 41°C — a reduction of 46°C.

This task connects directly to the principles of Heat Transfer studied in my Applied Mathematics course. The rate of heat conduction is governed by Fourier's Law: Q/t = -kA(ΔT/Δx), where k is the thermal conductivity of the paste, A is the contact area, and ΔT/Δx is the temperature gradient. The thermal paste acts as a conductor to fill microscopic air gaps that would otherwise act as insulation (air having a thermal conductivity of 0.026 W/m·K versus the paste's 8.5 W/m·K).

Following the thermal paste application, I also carried out a POST diagnostic on all three repaired units to confirm successful completion of the boot cycle.`,

  Friday: `On this day, I participated in the end-of-week IT infrastructure audit conducted by the department. The audit involved cataloguing all hardware assets across three floors of the building — a total of 47 workstations, 12 network switches, 6 servers, and 22 IP phones — verifying each against the department's asset register using an asset tracking spreadsheet.

Discrepancies identified during the audit included two workstations that were listed in the register but could not be physically located, and one server whose serial number differed from the recorded value. These were flagged in the audit report for investigation by the Procurement unit.

I was also tasked with verifying the UTP cable labelling on the 24-port patch panel in the second-floor network closet. Seven cables were found to be unlabelled, and I relabelled them using the cable numbering convention: [Floor]-[Room]-[Port Number]. This systematic labelling approach applies Graph Theory principles from my Industrial Mathematics course — specifically, the mapping of a network topology as a directed graph G = (V, E), where each vertex V represents a network node and each edge E represents a physical cable connection.

At the end of the day, the completed audit report was compiled and submitted to the IT Manager, with recommendations for updating the asset register.`,

  Tuesday_study: `On this day, I was assigned to develop the predictive analytics module for the department's AI-assisted helpdesk system — an ongoing internal project aimed at automating the categorisation and resolution-time estimation of IT support tickets submitted across the organisation.

My specific task was to build the regression component that estimates ticket resolution time from historical input features (ticket category, severity level, and assigned technician). I implemented a Linear Regression model from scratch in Python using NumPy, constructing the cost function J(θ) = (1/2m) Σᵢ(hθ(xᵢ) − yᵢ)² and optimising it via the Gradient Descent algorithm with the update rule θⱼ := θⱼ − α(∂/∂θⱼ)J(θ), where α is the learning rate.

This implementation connects directly to Ordinary Least Squares (OLS) minimisation from my Statistical Methods module, and the partial differentiation in the gradient update rule applies concepts from my Calculus II coursework. The learning rate was tuned empirically: values above 0.1 caused the cost function to diverge, while α = 0.01 produced stable convergence over 1,000 iterations on the training dataset.

The documented Python implementation was delivered to the development lead at the end of the day for code review and integration into the helpdesk system's pipeline.`,

  Thursday_study: `On this day, I continued development of the AI helpdesk system, implementing the binary classification module responsible for escalation routing — determining whether an incoming support ticket should be handled at first-level support or escalated to a senior technician.

I built a Logistic Regression classifier in Python, chosen for its interpretability and suitability for binary outcomes. The logistic (sigmoid) activation function σ(z) = 1/(1 + e⁻ᶻ) maps the model's linear output to a probability score between 0 and 1, which is then thresholded at 0.5 for the escalation decision. The full training pipeline implemented was:
  (1) Initialising weights and bias to zero
  (2) Computing the forward pass: z = Xw + b, then a = σ(z)
  (3) Computing binary cross-entropy loss: L = −[y log(a) + (1−y) log(1−a)]
  (4) Performing backpropagation to compute gradients
  (5) Updating parameters via gradient descent

The binary cross-entropy loss function is grounded in Maximum Likelihood Estimation (MLE), a technique covered in my Probability and Statistics module, while the matrix operations (X·w) apply Linear Algebra — specifically matrix-vector products in ℝⁿ — from my Industrial Mathematics curriculum.

The classifier was tested on 200 historical ticket records, achieving 84% accuracy on the validation split. The implementation was submitted to the team lead as the classification component of the helpdesk system's ML pipeline.`,
};

const PROGRESS_CHART_ENTRIES: Record<string, string> = {
  Monday: "HARDWARE DIAGNOSTICS AND RAM MODULE REPLACEMENT",
  Wednesday: "CPU THERMAL COMPOUND APPLICATION AND HEAT TRANSFER ANALYSIS",
  Friday: "END-OF-WEEK IT INFRASTRUCTURE AUDIT AND ASSET VERIFICATION",
  Tuesday_study: "MACHINE LEARNING RESEARCH: LINEAR REGRESSION AND GRADIENT DESCENT",
  Thursday_study: "MACHINE LEARNING RESEARCH: LOGISTIC REGRESSION IMPLEMENTATION",
};

const DEPT_BRIDGES: Record<string, string> = {
  Monday: "Boolean Algebra (POST binary evaluation); Binary Arithmetic (memory addressing: 2ⁿ)",
  Wednesday: "Fourier's Law of Heat Conduction; Applied Calculus (thermal gradient ΔT/Δx)",
  Friday: "Graph Theory: G=(V,E) network topology mapping; Set Theory (asset catalogue)",
  Tuesday_study: "Ordinary Least Squares; Partial Differentiation (gradient descent update rule)",
  Thursday_study: "Maximum Likelihood Estimation; Linear Algebra (matrix-vector products)",
};

const WEEK_SUMMARIES = [
  "During this week, I carried out hardware diagnostics and component replacement across multiple workstations, applied thermal compound to overheating CPUs, and participated in the end-of-week IT infrastructure audit. Each activity was connected to core Industrial Mathematics theory — Boolean Algebra in POST procedures, Fourier's Law in heat transfer analysis, and Graph Theory in network topology documentation.",
  "This week was characterised by network configuration tasks, IP subnet planning, and firewall rule auditing. The subnetting exercises provided a direct practical application of Base-2 Binary Arithmetic from my Industrial Mathematics curriculum, while the network topology diagramming reinforced Graph Theory principles.",
  "I was engaged this week in software deployment and Active Directory management. The recursive nature of Group Policy Object (GPO) inheritance demonstrated tree-structured data relationships studied in my Discrete Mathematics course. The weekly machine learning study continued, reinforcing statistical estimation theory.",
];

// ─── GENERATION ───────────────────────────────────────────────────────────────

function makeDay(
  weekIndex: number,
  weekStart: Date,
  dayIndex: number,
  currentWeekIndex: number
): DayEntry {
  const dayName = DAYS[dayIndex];
  const date = addDays(weekStart, dayIndex);
  const isAttendance = ATTENDANCE_DAYS.has(dayName);
  const isPast = weekIndex < currentWeekIndex;
  const isCurrent = weekIndex === currentWeekIndex;

  let status: DayStatus = "empty";
  let keyActivities: string[] = [];
  let hasNotes = false;
  let notesPreview: string | undefined;
  let technicalNotes: string | undefined;
  let progressChartEntry: string | undefined;
  let deptBridgeUsed: string | undefined;
  let contentStream: DayEntry["contentStream"] = "office_work";

  const isStudyDay = !isAttendance && (isPast || (isCurrent && dayIndex < 3));

  if (isStudyDay) {
    const key = dayIndex === 1 ? "Tuesday_study" : "Thursday_study";
    status = "auto-filled";
    keyActivities =
      dayIndex === 1
        ? ["Machine Learning: Linear Regression & Gradient Descent", "Implemented cost function in Python"]
        : ["Machine Learning: Logistic Regression", "Binary classification implementation"];
    hasNotes = true;
    technicalNotes = TECHNICAL_NOTES[key];
    progressChartEntry = PROGRESS_CHART_ENTRIES[key];
    deptBridgeUsed = DEPT_BRIDGES[key];
    notesPreview = technicalNotes.slice(0, 160) + "…";
    contentStream = "office_work";
  } else if (isPast && isAttendance) {
    const actMap: Record<string, string[][]> = {
      Monday: [
        ["Hardware diagnostics on 4 workstations", "RAM module replacement (DDR3, 8GB)"],
        ["Configured DHCP server settings", "Network cable fault tracing — 2nd floor"],
        ["Windows 10 OS installation", "Active Directory user account setup"],
      ],
      Wednesday: [
        ["Thermal paste application to 3 CPUs", "POST troubleshooting — CMOS battery replacement"],
        ["IP subnet planning for server wing", "Network topology diagram drafting"],
        ["Firewall rule audit", "Switch port assignment documentation"],
      ],
      Friday: [
        ["End-of-week IT infrastructure audit", "Asset register verification — 47 workstations"],
        ["Printer driver deployment via Group Policy", "CCTV camera positioning assistance"],
        ["IT status report compilation", "File server backup verification"],
      ],
    };
    const pool = actMap[dayName] ?? [];
    keyActivities = pool[weekIndex % pool.length] ?? [];
    const roll = (weekIndex * 3 + dayIndex) % 10;
    status = roll < 3 ? "manually-edited" : roll < 8 ? "filled" : "auto-filled";
    hasNotes = true;
    technicalNotes = TECHNICAL_NOTES[dayName];
    progressChartEntry = PROGRESS_CHART_ENTRIES[dayName];
    deptBridgeUsed = DEPT_BRIDGES[dayName];
    notesPreview = technicalNotes.slice(0, 160) + "…";
  } else if (isCurrent && isAttendance && dayIndex < 3) {
    const actMap: Record<string, string[]> = {
      Monday: ["Hardware diagnostics on 4 workstations", "RAM module replacement (DDR3, 8GB)"],
      Wednesday: ["Thermal paste application to 3 CPUs", "CPU temperature verification with HWMonitor"],
    };
    keyActivities = actMap[dayName] ?? [];
    status = dayIndex === 0 ? "manually-edited" : "filled";
    hasNotes = true;
    technicalNotes = TECHNICAL_NOTES[dayName];
    progressChartEntry = PROGRESS_CHART_ENTRIES[dayName];
    deptBridgeUsed = DEPT_BRIDGES[dayName];
    notesPreview = technicalNotes.slice(0, 160) + "…";
  }

  return {
    id: toISO(date),
    date: toISO(date),
    dayName,
    isAttendanceDay: isAttendance,
    keyActivities,
    status,
    hasNotes,
    notesPreview,
    technicalNotes,
    technicalNotesCurrent: technicalNotes, // starts as a copy — user edits go here
    progressChartEntry,
    deptBridgeUsed,
    contentStream,
  };
}

// ─── REAL WEEKS GENERATOR (from user profile) ─────────────────────────────────
// Used for real users. Generates empty weeks from their actual start date and
// attendance days — no mock data, no pre-filled entries.

/**
 * Recalculate isCurrentWeek, isFutureWeek, isLocked, and blockNumber on every week.
 * Call this every time saved weeks are loaded from Supabase or localStorage so
 * the flags always reflect today's real date and current purchase state.
 *
 * isPaidUser=true with purchasedBlocks=[] → old monthly subscriber → all weeks unlocked.
 * isPaidUser=true with purchasedBlocks=[1,2] → block payer → only those blocks unlocked.
 * isPaidUser=false → free user → only week 1 (block 0) unlocked.
 */
export function recalcWeekFlags(
  weeks: WeekEntry[],
  purchasedBlocks: number[] = [],
  isPaidUser = false
): WeekEntry[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentWeekStart = toISO(mondayOf(now));
  const purchasedSet = new Set(purchasedBlocks);

  // Old monthly subscribers (paid, no block rows) get all weeks unlocked for backward compat
  const allUnlocked = isPaidUser && purchasedBlocks.length === 0;

  return weeks.map((w) => {
    const blockNumber = weekToBlock(w.weekNumber);
    const isLocked = !allUnlocked && blockNumber > 0 && !purchasedSet.has(blockNumber);
    return {
      ...w,
      blockNumber,
      isLocked,
      isCurrentWeek: w.startDate === currentWeekStart,
      isFutureWeek: w.startDate > currentWeekStart,
    };
  });
}

/** Convert SIWES duration in months to the number of logbook weeks. */
export function durationMonthsToWeeks(months: 3 | 6 | 12 | number): number {
  if (months === 3)  return 13;
  if (months === 12) return 52;
  return 26; // 6 months default
}

export function generateWeeksFromProfile(
  startDateISO: string,        // e.g. "2024-09-02" — their actual SIWES start date
  attendanceDayNames: string[], // e.g. ["Monday", "Wednesday", "Friday"]
  totalWeeks = 26               // default 6 months (26 weeks)
): WeekEntry[] {
  const start = mondayOf(new Date(startDateISO + "T00:00:00"));
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentWeekStart = mondayOf(now);
  const attendanceSet = new Set(attendanceDayNames);

  return Array.from({ length: totalWeeks }, (_, w) => {
    const weekStart = addDays(start, w * 7);
    const weekEnd = addDays(weekStart, 4);
    const isCurrent = toISO(weekStart) === toISO(currentWeekStart);
    const isFuture = weekStart > currentWeekStart;

    const days: DayEntry[] = DAYS.map((dayName, di) => {
      const date = addDays(weekStart, di);
      const isAttendance = attendanceSet.has(dayName);
      return {
        id: toISO(date),
        date: toISO(date),
        dayName,
        isAttendanceDay: isAttendance,
        keyActivities: [],
        status: (isAttendance ? "empty" : "non-working") as DayStatus,
        hasNotes: false,
      };
    });

    const attendanceDays = days.filter((d) => d.isAttendanceDay);

    const weekNum = w + 1;
    return {
      weekNumber: weekNum,
      startDate: toISO(weekStart),
      endDate: toISO(weekEnd),
      days,
      isCurrentWeek: isCurrent,
      isFutureWeek: isFuture,
      isLocked: false,           // recalcWeekFlags sets this correctly on every load
      blockNumber: weekToBlock(weekNum),
      completedDaysCount: 0,
      totalAttendanceDays: attendanceDays.length,
      exportStatus: "none" as const,
      weekSummary: undefined,
      weekSummaryCurrent: undefined,
    };
  });
}

// ─── DEMO / MOCK GENERATOR (only used in development) ─────────────────────────

export function generateMockWeeks(): WeekEntry[] {
  const currentWeekStart = mondayOf(today);
  const currentWeekIndex = Math.round(
    (currentWeekStart.getTime() - SIWES_START.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );

  return Array.from({ length: 24 }, (_, w) => {
    const weekStart = addDays(SIWES_START, w * 7);
    const weekEnd = addDays(weekStart, 4);
    const isCurrent = w === currentWeekIndex;
    const isFuture = w > currentWeekIndex;

    const days = DAYS.map((_, di) => makeDay(w, weekStart, di, currentWeekIndex));
    const attendanceDays = days.filter((d) => d.isAttendanceDay);
    const completedDays = attendanceDays.filter((d) => d.status !== "empty").length;
    const summary = WEEK_SUMMARIES[w % WEEK_SUMMARIES.length];

    return {
      weekNumber: w + 1,
      startDate: toISO(weekStart),
      endDate: toISO(weekEnd),
      days,
      isCurrentWeek: isCurrent,
      isFutureWeek: isFuture,
      isLocked: false,
      blockNumber: 0,
      completedDaysCount: completedDays,
      totalAttendanceDays: attendanceDays.length,
      exportStatus: w < currentWeekIndex - 1 ? "exported" : "none",
      weekSummary: !isFuture ? summary : undefined,
      weekSummaryCurrent: !isFuture ? summary : undefined,
    };
  });
}

function bankExpiry(daysAgo: number): string {
  const d = addDays(today, -daysAgo);
  const exp = addDays(d, 28);
  return toISO(exp);
}

export const MOCK_BANKED_ACTIVITIES: BankedActivity[] = [
  {
    id: "bank-mock-1",
    activityText: "Configured static IP addresses for 3 workstations in the accounts department",
    originalDate: toISO(addDays(today, -8)),
    expiresAt: bankExpiry(8),
  },
  {
    id: "bank-mock-2",
    activityText: "Assisted with printer driver installation on Windows 11 machines across 2nd floor",
    originalDate: toISO(addDays(today, -7)),
    expiresAt: bankExpiry(7),
  },
  {
    id: "bank-mock-3",
    activityText: "Documented network cable routing in the server room patch panel using labelling convention",
    originalDate: toISO(addDays(today, -6)),
    expiresAt: bankExpiry(6),
  },
  {
    id: "bank-mock-4",
    activityText: "Observed UPS battery replacement procedure for server rack backup power system",
    originalDate: toISO(addDays(today, -5)),
    expiresAt: bankExpiry(5),
  },
];

export const MOCK_ACTIVITY_BANK: ActivityBankState = {
  items: MOCK_BANKED_ACTIVITIES,
  bankedCount: MOCK_BANKED_ACTIVITIES.length,
  emptyCoverageCount: Math.ceil(MOCK_BANKED_ACTIVITIES.length / 2.5),
};
