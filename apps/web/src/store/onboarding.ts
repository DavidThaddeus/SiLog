"use client";

import { create } from "zustand";
import type { OnboardingData } from "@/types/onboarding";

interface OnboardingStore {
  currentStep: number;
  data: Partial<OnboardingData>;
  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

const DEFAULT_DATA: Partial<OnboardingData> = {
  attendanceDayNames: [],
  hasPersonalStudy: false,
  personalStudyDescription: "",
  studyLogbookFraming: null,
  companyDepartment: "",
  siwesDuration: 6,
};

export const useOnboardingStore = create<OnboardingStore>()(
  (set) => ({
    currentStep: 1,
    data: DEFAULT_DATA,

    setField: (key, value) =>
      set((state) => ({ data: { ...state.data, [key]: value } })),

    nextStep: () =>
      set((state) => ({ currentStep: Math.min(state.currentStep + 1, 8) })),

    prevStep: () =>
      set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

    goToStep: (step) => set({ currentStep: step }),

    reset: () => set({ currentStep: 1, data: DEFAULT_DATA }),
  })
);
