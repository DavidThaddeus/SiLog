export interface OnboardingData {
  // Q1
  fullName: string;
  university: string;
  // Q2
  department: string;
  level: string;
  // Q3
  companyName: string;
  companyDepartment: string; // e.g. "IT Department", "Finance & Accounts"
  industry: string;
  // Q4
  logbookTemplateId: string;
  // Q5
  startDate: string; // ISO date string YYYY-MM-DD
  siwesDuration: 3 | 6 | 12; // months → 13, 26, or 52 weeks
  supervisorName: string;
  // Q6
  attendanceDayNames: string[]; // ["Monday", "Wednesday", "Friday"]
  // Q7
  workloadLevel: "light" | "moderate" | "heavy";
  // Q8
  hasPersonalStudy: boolean;
  personalStudyDescription: string;
  // How the study activity is framed in the logbook — always as workplace activity
  studyLogbookFraming: "assigned" | "research" | null;
}

export const STEP_META = [
  { num: "01", label: "Name & University", phase: 1 },
  { num: "02", label: "Department & Level", phase: 1 },
  { num: "03", label: "Company & Industry", phase: 1 },
  { num: "04", label: "Logbook Format", phase: 1 },
  { num: "05", label: "Start Date & Supervisor", phase: 1 },
  { num: "06", label: "Attendance Days", phase: 2 },
  { num: "07", label: "Workload", phase: 2 },
  { num: "08", label: "Personal Study", phase: 2 },
] as const;

export const TOTAL_STEPS = STEP_META.length;
