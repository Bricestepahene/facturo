// src/components/common/LoadingScreen.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/theme/colors';
import { SPACING } from '@/theme/spacing';
import { FONT_SIZE } from '@/theme/typography';

interface Props {
  message?: string;
}

export function LoadingScreen({ message }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.Primary} />
      {message !== undefined && (
        <Text style={styles.message}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    backgroundColor: COLORS.Background,
  },
  message: {
    marginTop: SPACING.md,
    fontSize:  FONT_SIZE.base,
    color:     COLORS.TextSecondary,
    textAlign: 'center',
  },
});
