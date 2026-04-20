export type DayStatus =
  | "filled"          // student submitted real work
  | "auto-filled"     // system filled from Activity Bank or curriculum
  | "manually-edited" // student directly edited the generated output
  | "empty"           // attendance day with no entry yet
  | "non-working";    // absent / non-attendance day

export interface DayEntry {
  id: string;
  date: string;              // ISO "YYYY-MM-DD"
  dayName: string;           // "Monday"
  isAttendanceDay: boolean;
  keyActivities: string[];
  status: DayStatus;
  hasNotes: boolean;
  notesPreview?: string;
  technicalNotes?: string;   // Full AI-generated technical notes (v1 — never overwritten)
  technicalNotesCurrent?: string; // Current version (may be manually edited)
  progressChartEntry?: string;    // ALL-CAPS short phrase for the progress chart column
  deptBridgeUsed?: string;        // Which academic theory was connected
  contentStream?: "office_work" | "personal_study" | "activity_bank" | "curriculum";
}

export interface WeekEntry {
  weekNumber: number;
  startDate: string;     // ISO date of Monday
  endDate: string;       // ISO date of Friday
  days: DayEntry[];
  isCurrentWeek: boolean;
  isFutureWeek: boolean;
  isLocked: boolean;     // true if this block hasn't been purchased yet
  blockNumber: number;   // 0 = free (week 1), 1+ = paid block
  completedDaysCount: number;
  totalAttendanceDays: number;
  exportStatus: "none" | "pending" | "exported";
  weekSummary?: string;
  weekSummaryCurrent?: string; // Editable version of the weekly summary
}

export interface BankedActivity {
  id: string;
  activityText: string;
  originalDate: string;  // ISO date when it actually happened
  expiresAt: string;     // 4 weeks after originalDate
}

export interface ActivityBankState {
  items: BankedActivity[];
  bankedCount: number;        // derived from items.length
  emptyCoverageCount: number; // derived: Math.ceil(items.length / 2.5)
}
