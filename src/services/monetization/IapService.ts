// src/services/monetization/IapService.ts
import * as InAppPurchases from 'expo-in-app-purchases';
import Constants from 'expo-constants';
import { settingsRepository } from '@/repositories/SettingsRepository';
import { useUsageStore } from '@/stores/usageStore';

const PRODUCT_IDS = {
  onetime: (Constants.expoConfig?.extra?.iapProductIdOnetime as string | undefined) ?? 'facturo_pro_onetime',
  monthly: (Constants.expoConfig?.extra?.iapProductIdMonthly as string | undefined) ?? 'facturo_pro_monthly',
};

export const IAP_PRODUCT_IDS = PRODUCT_IDS;

let iapInitialized = false;

export async function initializeIap(): Promise<void> {
  if (iapInitialized) return;
  try {
    await InAppPurchases.connectAsync();
    iapInitialized = true;
  } catch {
    // IAP not available
  }
}

export async function getProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
  try {
    const { results } = await InAppPurchases.getProductsAsync([PRODUCT_IDS.onetime, PRODUCT_IDS.monthly]);
    return results ?? [];
  } catch {
    return [];
  }
}

export async function purchasePro(productId: string): Promise<boolean> {
  try {
    await InAppPurchases.purchaseItemAsync(productId);
    return true;
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const history = await InAppPurchases.getPurchaseHistoryAsync();
    const proIds = [PRODUCT_IDS.onetime, PRODUCT_IDS.monthly];
    const hasProPurchase = history.results?.some(p => proIds.includes(p.productId)) ?? false;
    if (hasProPurchase) {
      await settingsRepository.updateAppUsage({ isPro: true });
      useUsageStore.getState().setPro('restored');
    }
    return hasProPurchase;
  } catch {
    return false;
  }
}

export async function verifyAndActivatePro(receipt: string): Promise<void> {
  await settingsRepository.updateAppUsage({ isPro: true, proReceiptToken: receipt });
  useUsageStore.getState().setPro(receipt);
}

export const IapService = { initializeIap, getProducts, purchasePro, restorePurchases, verifyAndActivatePro };
