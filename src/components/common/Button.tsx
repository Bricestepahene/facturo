// src/components/common/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

const BG_COLOR: Record<NonNullable<Props['variant']>, string> = {
  primary:   COLORS.Primary,
  secondary: COLORS.Secondary,
  outline:   'transparent',
  ghost:     'transparent',
  danger:    COLORS.Error,
};

const TEXT_COLOR: Record<NonNullable<Props['variant']>, string> = {
  primary:   COLORS.Surface,
  secondary: COLORS.Surface,
  outline:   COLORS.Primary,
  ghost:     COLORS.Primary,
  danger:    COLORS.Surface,
};

const BORDER_COLOR: Record<NonNullable<Props['variant']>, string> = {
  primary:   COLORS.Primary,
  secondary: COLORS.Secondary,
  outline:   COLORS.Primary,
  ghost:     'transparent',
  danger:    COLORS.Error,
};

const PADDING_VERTICAL: Record<NonNullable<Props['size']>, number> = {
  sm: SPACING.xs + 2,
  md: SPACING.sm + 2,
  lg: SPACING.md,
};

const PADDING_HORIZONTAL: Record<NonNullable<Props['size']>, number> = {
  sm: SPACING.sm,
  md: SPACING.md,
  lg: SPACING.lg,
};

const FONT_SIZE_MAP: Record<NonNullable<Props['size']>, number> = {
  sm: FONT_SIZE.sm,
  md: FONT_SIZE.base,
  lg: FONT_SIZE.md,
};

const ICON_SIZE_MAP: Record<NonNullable<Props['size']>, number> = {
  sm: 14,
  md: 16,
  lg: 20,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: Props) {
  const bgColor    = BG_COLOR[variant];
  const textColor  = TEXT_COLOR[variant];
  const borderColor = BORDER_COLOR[variant];
  const paddingV   = PADDING_VERTICAL[size];
  const paddingH   = PADDING_HORIZONTAL[size];
  const fontSize   = FONT_SIZE_MAP[size];
  const iconSize   = ICON_SIZE_MAP[size];

  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      backgroundColor:  bgColor,
      borderColor:      borderColor,
      paddingVertical:  paddingV,
      paddingHorizontal: paddingH,
    },
    fullWidth ? styles.fullWidth : styles.selfStart,
    (disabled || loading) ? styles.disabled : styles.enabled,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={containerStyle}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon !== undefined && (
            <Ionicons
              name={icon as React.ComponentProps<typeof Ionicons>['name']}
              size={iconSize}
              color={textColor}
              style={styles.iconLeft}
            />
          )}
          <Text style={[styles.text, { color: textColor, fontSize }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    BORDER_RADIUS.md,
    borderWidth:     1,
    minWidth:        80,
  },
  fullWidth: {
    width:     '100%',
    alignSelf: 'stretch',
  },
  selfStart: {
    alignSelf: 'flex-start',
  },
  enabled: {
    opacity: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  inner: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent:'center',
  },
  iconLeft: {
    marginRight: SPACING.xs,
  },
  text: {
    fontWeight: FONT_WEIGHT.semibold,
  },
});
