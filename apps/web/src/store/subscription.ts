"use client";

import { create } from "zustand";

export const FREE_GENERATION_LIMIT = 5;

interface SubscriptionStore {
  status: "free" | "paid";
  expiresAt: string | null;   // next billing date for monthly; null = never expires
  subscribedAt: string | null; // date of last successful payment
  isFullPayment: boolean;
  generationsUsed: number;
  readOnly: boolean;
  callsToday: number | null;
  dailyLimit: number | null;
  purchasedBlocks: number[];  // block numbers the user has paid for
  setSubscription: (
    status: "free" | "paid",
    expiresAt: string | null,
    generationsUsed?: number,
    isFullPayment?: boolean,
    subscribedAt?: string | null
  ) => void;
  markPaid: (expiresAt: string | null, isFullPayment: boolean, subscribedAt?: string | null) => void;
  setGenerationsUsed: (n: number) => void;
  setReadOnly: (v: boolean) => void;
  setDailyUsage: (callsToday: number, dailyLimit: number) => void;
  setPurchasedBlocks: (blocks: number[]) => void;
  addPurchasedBlock: (block: number) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>()((set) => ({
  status: "free",
  expiresAt: null,
  subscribedAt: null,
  isFullPayment: false,
  generationsUsed: 0,
  readOnly: false,
  callsToday: null,
  dailyLimit: null,
  purchasedBlocks: [],
  setSubscription: (status, expiresAt, generationsUsed = 0, isFullPayment = false, subscribedAt = null) =>
    set({ status, expiresAt, generationsUsed, isFullPayment, subscribedAt }),
  markPaid: (expiresAt, isFullPayment, subscribedAt = new Date().toISOString()) =>
    set({ status: "paid", expiresAt, isFullPayment, readOnly: false, subscribedAt }),
  setGenerationsUsed: (n) => set({ generationsUsed: n }),
  setReadOnly: (v) => set({ readOnly: v }),
  setDailyUsage: (callsToday, dailyLimit) => set({ callsToday, dailyLimit }),
  setPurchasedBlocks: (blocks) => set({ purchasedBlocks: blocks }),
  addPurchasedBlock: (block) =>
    set((state) => ({
      purchasedBlocks: state.purchasedBlocks.includes(block)
        ? state.purchasedBlocks
        : [...state.purchasedBlocks, block],
    })),
}));
