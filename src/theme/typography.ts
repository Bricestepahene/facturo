// src/theme/typography.ts
import { StyleSheet } from 'react-native';

export const FONT_SIZE = {
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   20,
  xxl:  24,
  xxxl: 32,
} as const;

export const FONT_WEIGHT = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
};

export const LINE_HEIGHT = {
  tight:   1.2,
  normal:  1.5,
  relaxed: 1.8,
} as const;

export const TEXT_STYLES = StyleSheet.create({
  h1: {
    fontSize:   FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: FONT_SIZE.xxxl * LINE_HEIGHT.tight,
  },
  h2: {
    fontSize:   FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: FONT_SIZE.xxl * LINE_HEIGHT.tight,
  },
  h3: {
    fontSize:   FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semibold,
  },
  h4: {
    fontSize:   FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  body: {
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.regular,
  },
  bodyMedium: {
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
  },
  bodySm: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.regular,
  },
  caption: {
    fontSize:   FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
  },
  button: {
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
  },
  label: {
    fontSize:   FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
});

// ── Legacy compatibility export (keeps existing imports working) ─────────────
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium:  'System',
    bold:    'System',
    mono:    'SpaceMono-Regular',
  },
  sizes:       FONT_SIZE,
  lineHeights: LINE_HEIGHT,
  fontWeights: FONT_WEIGHT,
} as const;

export type FontSizeKey   = keyof typeof FONT_SIZE;
export type FontWeightKey = keyof typeof FONT_WEIGHT;
export type LineHeightKey = keyof typeof LINE_HEIGHT;
export type TextStyleKey  = keyof typeof TEXT_STYLES;
