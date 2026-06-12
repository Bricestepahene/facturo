// src/components/common/Card.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: 0 | 1 | 2 | 3;
}

const SHADOW_MAP = {
  0: {} as ViewStyle,
  1: SHADOW.light  as ViewStyle,
  2: SHADOW.medium as ViewStyle,
  3: SHADOW.heavy  as ViewStyle,
} as const;

export function Card({ children, style, onPress, elevation = 1 }: Props) {
  const shadowStyle = SHADOW_MAP[elevation];

  if (onPress !== undefined) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.card, shadowStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, shadowStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.Surface,
    borderRadius:    BORDER_RADIUS.lg,
    padding:         SPACING.md,
    borderWidth:     1,
    borderColor:     COLORS.Border,
  },
});
