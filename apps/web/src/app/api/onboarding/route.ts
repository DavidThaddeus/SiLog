import { NextRequest, NextResponse } from "next/server";
import type { OnboardingData } from "@/types/onboarding";

function validateOnboardingData(data: Partial<OnboardingData>): string[] {
  const errors: string[] = [];
  if (!data.fullName?.trim()) errors.push("fullName is required");
  if (!data.university?.trim()) errors.push("university is required");
  if (!data.department?.trim()) errors.push("department is required");
  if (!data.level) errors.push("level is required");
  if (!data.companyName?.trim()) errors.push("companyName is required");
  if (!data.industry) errors.push("industry is required");
  if (!data.logbookTemplateId) errors.push("logbookTemplateId is required");
  if (!data.startDate) errors.push("startDate is required");
  if (!data.supervisorName?.trim()) errors.push("supervisorName is required");
  if (!data.attendanceDayNames?.length) errors.push("at least one attendance day is required");
  if (!data.workloadLevel) errors.push("workloadLevel is required");
  return errors;
}

export async function POST(req: NextRequest) {
  try {
    const body: Partial<OnboardingData> = await req.json();
    const errors = validateOnboardingData(body);
    if (errors.length > 0) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[onboarding] Error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
