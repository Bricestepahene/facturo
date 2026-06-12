// src/services/monetization/AdService.ts
import {
  RewardedAd,
  RewardedAdEventType,
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import MobileAds from 'react-native-google-mobile-ads';

const UNIT_IDS = {
  rewarded: __DEV__
    ? TestIds.REWARDED
    : (Constants.expoConfig?.extra?.admobRewardedAndroid as string | undefined) ?? TestIds.REWARDED,
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : (Constants.expoConfig?.extra?.admobInterstitialAndroid as string | undefined) ?? TestIds.INTERSTITIAL,
};

let rewardedAd: RewardedAd | null = null;
let rewardedAdLoaded = false;

export async function initializeAds(): Promise<void> {
  try {
    await MobileAds().initialize();
  } catch {
    // Ads not available in dev or on this device
  }
}

export function preloadRewardedAd(): void {
  rewardedAd = RewardedAd.createForAdRequest(UNIT_IDS.rewarded, {
    requestNonPersonalizedAdsOnly: true,
  });

  rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedAdLoaded = true;
  });

  rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    rewardedAdLoaded = false;
    // Preload next ad
    setTimeout(preloadRewardedAd, 1000);
  });

  rewardedAd.load();
}

export function isAdLoaded(): boolean {
  return rewardedAdLoaded;
}

export async function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!rewardedAd || !rewardedAdLoaded) {
      resolve(false);
      return;
    }

    let rewardEarned = false;

    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardEarned = true;
    });

    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedAdLoaded = false;
      resolve(rewardEarned);
      setTimeout(preloadRewardedAd, 1000);
    });

    rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
      rewardedAdLoaded = false;
      resolve(false);
    });

    rewardedAd.show().catch(() => resolve(false));
  });
}

export async function showInterstitialAd(): Promise<void> {
  const interstitial = InterstitialAd.createForAdRequest(UNIT_IDS.interstitial, {
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise((resolve) => {
    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitial.show().catch(() => resolve());
    });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => resolve());
    interstitial.addAdEventListener(AdEventType.ERROR, () => resolve());
    interstitial.load();
  });
}
