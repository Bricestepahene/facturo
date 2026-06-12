// src/components/ads/AdBanner.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';
import { useUsageStore } from '@/stores/usageStore';
import { COLORS } from '@/theme/colors';
import { SPACING } from '@/theme/spacing';

interface Props {
  style?: object;
}

const AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : (Constants.expoConfig?.extra?.admobBannerAndroid as string | undefined) ?? TestIds.BANNER;

export function AdBanner({ style }: Props) {
  const isPro = useUsageStore((s) => s.isPro);
  if (isPro) return null;
  return (
    <View style={[styles.container, style]}>
      <BannerAd unitId={AD_UNIT_ID} size={BannerAdSize.BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.AdBackground,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
});
