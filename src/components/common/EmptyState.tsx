// src/components/common/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/theme/colors';
import { SPACING } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import { Button } from './Button';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons
        name={icon as React.ComponentProps<typeof Ionicons>['name']}
        size={48}
        color={COLORS.TextDisabled}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      {subtitle !== undefined && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      {actionLabel !== undefined && onAction !== undefined && (
        <View style={styles.actionWrapper}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        SPACING.xl,
  },
  icon: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize:     FONT_SIZE.lg,
    fontWeight:   FONT_WEIGHT.semibold,
    color:        COLORS.TextPrimary,
    textAlign:    'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize:     FONT_SIZE.base,
    color:        COLORS.TextSecondary,
    textAlign:    'center',
    marginBottom: SPACING.lg,
  },
  actionWrapper: {
    marginTop: SPACING.sm,
  },
});
