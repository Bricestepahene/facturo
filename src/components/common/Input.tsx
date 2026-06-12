// src/components/common/Input.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardTypeOptions,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  securedEntry?: boolean;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  style?: ViewStyle;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  keyboardType,
  securedEntry = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
}: Props) {
  const [focused, setFocused] = useState(false);

  const hasError   = error !== undefined && error.length > 0;
  const borderColor = hasError
    ? COLORS.Error
    : focused
    ? COLORS.BorderFocus
    : COLORS.Border;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          { borderColor },
          disabled ? styles.inputDisabled : undefined,
        ]}
      >
        {leftIcon !== undefined && (
          <Ionicons
            name={leftIcon as React.ComponentProps<typeof Ionicons>['name']}
            size={18}
            color={COLORS.TextSecondary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TextDisabled}
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={securedEntry}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            leftIcon !== undefined  ? styles.inputWithLeftIcon  : undefined,
            rightIcon !== undefined ? styles.inputWithRightIcon : undefined,
            multiline               ? styles.inputMultiline     : undefined,
            disabled                ? styles.inputTextDisabled  : undefined,
          ]}
        />

        {rightIcon !== undefined && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconWrapper}
            disabled={onRightIconPress === undefined}
          >
            <Ionicons
              name={rightIcon as React.ComponentProps<typeof Ionicons>['name']}
              size={18}
              color={COLORS.TextSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {hasError && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize:     FONT_SIZE.sm,
    fontWeight:   FONT_WEIGHT.medium,
    color:        COLORS.TextSecondary,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    borderWidth:     1,
    borderRadius:    BORDER_RADIUS.md,
    backgroundColor: COLORS.Surface,
  },
  leftIcon: {
    marginLeft: SPACING.sm,
  },
  rightIconWrapper: {
    paddingHorizontal: SPACING.sm,
    paddingVertical:   SPACING.sm,
    justifyContent:    'center',
    alignItems:        'center',
  },
  input: {
    flex:              1,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical:   SPACING.sm,
    fontSize:          FONT_SIZE.base,
    color:             COLORS.TextPrimary,
  },
  inputWithLeftIcon: {
    paddingLeft: SPACING.xs,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.xs,
  },
  inputMultiline: {
    minHeight:  SPACING.xxl + SPACING.lg,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: COLORS.SurfaceVariant,
  },
  inputTextDisabled: {
    color: COLORS.TextDisabled,
  },
  errorText: {
    fontSize:   FONT_SIZE.xs,
    color:      COLORS.Error,
    marginTop:  SPACING.xs,
  },
});
