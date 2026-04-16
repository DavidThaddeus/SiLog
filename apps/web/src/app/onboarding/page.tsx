"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { supabase } from "@/lib/supabase";
import { ProgressPanel } from "@/components/onboarding/ProgressPanel";
import { Step1Name } from "@/components/onboarding/steps/Step1Name";
import { Step2Department } from "@/components/onboarding/steps/Step2Department";
import { Step3Company } from "@/components/onboarding/steps/Step3Company";
import { Step4Logbook } from "@/components/onboarding/steps/Step4Logbook";
import { Step5Dates } from "@/components/onboarding/steps/Step5Dates";
import { Step6Attendance } from "@/components/onboarding/steps/Step6Attendance";
import { Step7Workload } from "@/components/onboarding/steps/Step7Workload";
import { Step8Study } from "@/components/onboarding/steps/Step8Study";

const STEPS = [
  Step1Name,
  Step2Department,
  Step3Company,
  Step4Logbook,
  Step5Dates,
  Step6Attendance,
  Step7Workload,
  Step8Study,
];

export default function OnboardingPage() {
  const { currentStep } = useOnboardingStore();
  const router = useRouter();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Force light mode on onboarding — dark mode only available inside the app
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "light");
    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
      else document.documentElement.removeAttribute("data-theme");
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const StepComponent = STEPS[currentStep - 1];

  const handleComplete = async () => {
    const { data } = useOnboardingStore.getState();
    setSaveError(null);
    setSaving(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      setSaveError("Not signed in. Please go back to login.");
      setSaving(false);
      return;
    }

    // Core profile save — only columns that are guaranteed to exist
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: data.fullName ?? null,
      department: data.department ?? null,
      university: data.university ?? null,
      company_name: data.companyName ?? null,
      company_dept: data.companyDepartment ?? null,
      industry: data.industry ?? null,
      start_date: data.startDate ?? null,
      attendance_days: data.attendanceDayNames ?? [],
      has_personal_study: data.hasPersonalStudy ?? false,
      study_framing: data.studyLogbookFraming ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setSaveError(`Failed to save profile: ${error.message}`);
      setSaving(false);
      return;
    }

    // Best-effort: save extended columns (added via migration) — won't block if column missing
    await supabase.from("profiles").update({
      siwes_duration_months: data.siwesDuration ?? 6,
      company_description: data.companyDescription ?? null,
      role_description: data.myRoleDescription ?? null,
      notes_length_preference: data.notesLengthPreference ?? "long",
    }).eq("id", user.id).then(() => {});

    // Fire welcome email — best effort, never blocks onboarding
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      fetch("/api/send-welcome", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fullName: data.fullName ?? "", email: user.email }),
      }).catch(() => {});
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      <ProgressPanel currentStep={currentStep} />
      <div style={{ flex: 1, position: "relative" }}>
        {/* Sign-out escape hatch — top-right corner */}
        <button
          onClick={handleSignOut}
          style={{
            position: "fixed", top: 14, right: 16, zIndex: 200,
            background: "none", border: "1px solid rgba(140,90,60,0.25)",
            borderRadius: 8, padding: "5px 12px", fontSize: 12,
            color: "var(--text-muted)", cursor: "pointer",
          }}
        >
          Sign out
        </button>

        {saveError && (
          <div style={{
            position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
            zIndex: 100, background: "#fef2f2", border: "1px solid #fca5a5",
            borderRadius: 8, padding: "12px 20px", color: "#b91c1c", fontSize: 13,
            maxWidth: 480, textAlign: "center",
          }}>
            {saveError}
          </div>
        )}
        <StepComponent onComplete={saving ? () => {} : handleComplete} />
      </div>
    </div>
  );
}
