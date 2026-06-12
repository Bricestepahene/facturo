// src/components/common/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

type Variant =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'converted'
  | 'info'
  | 'success'
  | 'error'
  | 'warning';

interface Props {
  label: string;
  variant: Variant;
}

// Hex alpha for 10% opacity: 0.1 * 255 = 25.5 ≈ 26 = 0x1A
const VARIANT_COLORS: Record<Variant, { text: string; bg: string }> = {
  draft:     { text: COLORS.StatusDraft,     bg: `${COLORS.StatusDraft}1A` },
  sent:      { text: COLORS.StatusSent,      bg: `${COLORS.StatusSent}1A` },
  paid:      { text: COLORS.StatusPaid,      bg: `${COLORS.StatusPaid}1A` },
  overdue:   { text: COLORS.StatusOverdue,   bg: `${COLORS.StatusOverdue}1A` },
  cancelled: { text: COLORS.StatusCancelled, bg: `${COLORS.StatusCancelled}1A` },
  converted: { text: COLORS.StatusConverted, bg: `${COLORS.StatusConverted}1A` },
  info:      { text: COLORS.Info,            bg: `${COLORS.Info}1A` },
  success:   { text: COLORS.Success,         bg: `${COLORS.Success}1A` },
  error:     { text: COLORS.Error,           bg: `${COLORS.Error}1A` },
  warning:   { text: COLORS.Warning,         bg: `${COLORS.Warning}1A` },
};

export function Badge({ label, variant }: Props) {
  const colors = VARIANT_COLORS[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical:   2,
    borderRadius:      BORDER_RADIUS.full,
    alignSelf:         'flex-start',
  },
  text: {
    fontSize:   FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
});
