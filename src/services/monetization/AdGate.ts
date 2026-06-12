// src/services/monetization/AdGate.ts
import type { AppUsage } from '@/db/schema';
import { FREE_PDF_LIMIT } from '@/stores/usageStore';
import { isAdLoaded, showRewardedAd } from './AdService';

export function canGeneratePdfDirectly(usage: AppUsage): boolean {
  return usage.isPro || usage.pdfCountThisMonth < FREE_PDF_LIMIT;
}

export type AdGateDecision = 'direct' | 'watch-ad' | 'upgrade' | 'bypass';

export interface AdGateCallbacks {
  onShowAdGate: (adAvailable: boolean) => Promise<AdGateDecision>;
  onGenerate: () => Promise<void>;
  onNavigateToUpgrade: () => void;
}

export async function runAdGate(usage: AppUsage, callbacks: AdGateCallbacks): Promise<void> {
  if (canGeneratePdfDirectly(usage)) {
    await callbacks.onGenerate();
    return;
  }

  const adAvailable = isAdLoaded();
  const decision = await callbacks.onShowAdGate(adAvailable);

  switch (decision) {
    case 'watch-ad': {
      const earned = await showRewardedAd();
      if (earned) {
        await callbacks.onGenerate();
      } else {
        // Ad failed to complete — bypass to never block
        await callbacks.onGenerate();
      }
      break;
    }
    case 'upgrade':
      callbacks.onNavigateToUpgrade();
      break;
    case 'bypass':
    default:
      // Never block the user
      await callbacks.onGenerate();
      break;
  }
}
