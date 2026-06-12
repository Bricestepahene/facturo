// src/stores/usageStore.ts
import { create } from 'zustand';
import type { AppUsage } from '@/db/schema';

const FREE_PDF_LIMIT = 5;

interface UsageState {
  pdfCountThisMonth: number;
  lastResetMonth: string;
  isPro: boolean;
  proReceiptToken: string | null;
  // Actions
  hydrate: (usage: AppUsage) => void;
  setPro: (token: string) => void;
  incrementCount: () => void;
  resetIfNewMonth: (currentMonth: string) => void;
  // Computed (as functions since zustand doesn't support computed)
  canGeneratePdfDirectly: () => boolean;
}

export const useUsageStore = create<UsageState>((set, get) => ({
  pdfCountThisMonth: 0,
  lastResetMonth: '',
  isPro: false,
  proReceiptToken: null,
  hydrate: (usage) => set({
    pdfCountThisMonth: usage.pdfCountThisMonth,
    lastResetMonth: usage.lastResetMonth,
    isPro: usage.isPro,
    proReceiptToken: usage.proReceiptToken ?? null,
  }),
  setPro: (token) => set({ isPro: true, proReceiptToken: token }),
  incrementCount: () => set((state) => ({ pdfCountThisMonth: state.pdfCountThisMonth + 1 })),
  resetIfNewMonth: (currentMonth) => {
    const state = get();
    if (state.lastResetMonth !== currentMonth) {
      set({ pdfCountThisMonth: 0, lastResetMonth: currentMonth });
    }
  },
  canGeneratePdfDirectly: () => {
    const state = get();
    return state.isPro || state.pdfCountThisMonth < FREE_PDF_LIMIT;
  },
}));

export { FREE_PDF_LIMIT };
