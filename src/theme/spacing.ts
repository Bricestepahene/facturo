// src/theme/spacing.ts
import { Platform } from 'react-native';

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  xxl:  24,
  full: 9999,
} as const;

export const SHADOW = {
  light: Platform.select({
    ios: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius:  2,
    },
    android: { elevation: 2 },
    default: {},
  }),
  medium: Platform.select({
    ios: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius:  4,
    },
    android: { elevation: 4 },
    default: {},
  }),
  heavy: Platform.select({
    ios: {
      shadowColor:   '#000',
      shadowOffset:  { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius:  8,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

export type SpacingKey      = keyof typeof SPACING;
export type BorderRadiusKey = keyof typeof BORDER_RADIUS;
export type ShadowKey       = keyof typeof SHADOW;
