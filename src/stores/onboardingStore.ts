// src/stores/onboardingStore.ts
import { create } from 'zustand';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  currentStep: number;
  // Actions
  completeOnboarding: () => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  hydrate: (hasSeenOnboarding: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,
  currentStep: 0,
  completeOnboarding: () => set({ hasSeenOnboarding: true, currentStep: 0 }),
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  hydrate: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
}));
