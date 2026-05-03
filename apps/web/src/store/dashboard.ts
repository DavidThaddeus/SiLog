"use client";

import { create } from "zustand";
import type { WeekEntry, ActivityBankState, BankedActivity, DayEntry } from "@/types/dashboard";

interface DashboardStore {
  weeks: WeekEntry[];
  activityBank: ActivityBankState;
  expandedWeekNumber: number | null;
  theme: "light" | "dark";

  setWeeks: (weeks: WeekEntry[]) => void;
  setExpandedWeek: (n: number | null) => void;
  toggleWeek: (n: number) => void;
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;

  // Activity Bank
  addToBank: (activities: { text: string; date: string }[]) => void;
  removeFromBank: (id: string) => void;
  editBankItem: (id: string, text: string) => void;
  consumeFromBank: (ids: string[]) => BankedActivity[];

  // Entry editing
  updateDayNotes: (entryId: string, notes: string) => void;
  updateDayActivityName: (entryId: string, name: string) => void;
  updateWeekSummary: (weekNumber: number, summary: string) => void;
  fillDayEntry: (
    entryId: string,
    data: {
      technicalNotes: string;
      keyActivities: string[];
      progressChartEntry: string;
      deptBridgeUsed: string;
      notesPreview: string;
    }
  ) => void;

  // Selectors
  getDayEntry: (entryId: string) => DayEntry | undefined;
  getWeek: (weekNumber: number) => WeekEntry | undefined;
}

export const useDashboardStore = create<DashboardStore>()(
  (set, get) => ({
  weeks: [],
  activityBank: { items: [], bankedCount: 0, emptyCoverageCount: 0 },
  expandedWeekNumber: null,
  theme: (typeof window !== "undefined" ? (localStorage.getItem("silog-theme") as "light" | "dark" | null) : null) ?? "light",

  setWeeks: (weeks) => {
    const current = weeks.find((w) => w.isCurrentWeek);
    set({ weeks, expandedWeekNumber: current?.weekNumber ?? null });
  },

  setExpandedWeek: (n) => set({ expandedWeekNumber: n }),

  toggleWeek: (n) =>
    set((s) => ({ expandedWeekNumber: s.expandedWeekNumber === n ? null : n })),

  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("silog-theme", theme);
    }
  },

  toggleTheme: () => {
    const next = get().theme === "light" ? "dark" : "light";
    get().setTheme(next);
  },

  updateDayNotes: (entryId, notes) =>
    set((s) => ({
      weeks: s.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) =>
          d.id === entryId
            ? { ...d, technicalNotesCurrent: notes, status: d.status === "filled" || d.status === "auto-filled" ? "manually-edited" : d.status }
            : d
        ),
      })),
    })),

  updateDayActivityName: (entryId, name) =>
    set((s) => ({
      weeks: s.weeks.map((w) => ({
        ...w,
        days: w.days.map((d) =>
          d.id === entryId ? { ...d, progressChartEntry: name } : d
        ),
      })),
    })),

  updateWeekSummary: (weekNumber, summary) =>
    set((s) => ({
      weeks: s.weeks.map((w) =>
        w.weekNumber === weekNumber ? { ...w, weekSummaryCurrent: summary } : w
      ),
    })),

  addToBank: (activities) =>
    set((s) => {
      const newItems = activities.map(({ text, date }) => {
        const expires = new Date(date + "T00:00:00");
        expires.setDate(expires.getDate() + 28);
        return {
          id: `bank-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          activityText: text,
          originalDate: date,
          expiresAt: expires.toISOString().split("T")[0],
        } as BankedActivity;
      });
      const items = [...s.activityBank.items, ...newItems];
      return {
        activityBank: {
          items,
          bankedCount: items.length,
          emptyCoverageCount: Math.ceil(items.length / 2.5),
        },
      };
    }),

  editBankItem: (id, text) =>
    set((s) => {
      const items = s.activityBank.items.map((a) => a.id === id ? { ...a, activityText: text } : a);
      return { activityBank: { items, bankedCount: items.length, emptyCoverageCount: Math.ceil(items.length / 2.5) } };
    }),

  removeFromBank: (id) =>
    set((s) => {
      const items = s.activityBank.items.filter((a) => a.id !== id);
      return {
        activityBank: {
          items,
          bankedCount: items.length,
          emptyCoverageCount: Math.ceil(items.length / 2.5),
        },
      };
    }),

  consumeFromBank: (ids) => {
    const consumed: BankedActivity[] = [];
    set((s) => {
      const items = s.activityBank.items.filter((a) => {
        if (ids.includes(a.id)) { consumed.push(a); return false; }
        return true;
      });
      return {
        activityBank: {
          items,
          bankedCount: items.length,
          emptyCoverageCount: Math.ceil(items.length / 2.5),
        },
      };
    });
    return consumed;
  },

  fillDayEntry: (entryId, data) =>
    set((s) => ({
      weeks: s.weeks.map((w) => {
        // Check if this week contains the target day before doing any work
        const targetIdx = w.days.findIndex((d) => d.id === entryId);
        if (targetIdx === -1) return w;

        // Single pass: build updated days array and count completions together
        let completedDaysCount = 0;
        const days = w.days.map((d, i) => {
          let updated: DayEntry;
          if (i === targetIdx) {
            updated = {
              ...d,
              technicalNotes: data.technicalNotes,
              technicalNotesCurrent: data.technicalNotes,
              keyActivities: data.keyActivities,
              progressChartEntry: data.progressChartEntry,
              deptBridgeUsed: data.deptBridgeUsed,
              notesPreview: data.notesPreview,
              hasNotes: true,
              status: "filled" as const,
            };
          } else {
            updated = d;
          }
          if (updated.hasNotes) completedDaysCount++;
          return updated;
        });

        return { ...w, days, completedDaysCount };
      }),
    })),

  getDayEntry: (entryId) => {
    for (const w of get().weeks) {
      const day = w.days.find((d) => d.id === entryId);
      if (day) return day;
    }
    return undefined;
  },

  getWeek: (weekNumber) => get().weeks.find((w) => w.weekNumber === weekNumber),
  })
);
