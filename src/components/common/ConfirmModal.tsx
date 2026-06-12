// src/components/common/ConfirmModal.tsx
import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import { Button } from './Button';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
}: Props) {
  const { t } = useTranslation('common');

  const resolvedConfirmLabel = confirmLabel ?? t('common:confirm');
  const resolvedCancelLabel  = cancelLabel  ?? t('common:cancel');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <View style={styles.btnWrapper}>
              <Button
                title={resolvedCancelLabel}
                onPress={onCancel}
                variant="outline"
                fullWidth
              />
            </View>
            <View style={styles.btnWrapper}>
              <Button
                title={resolvedConfirmLabel}
                onPress={onConfirm}
                variant={destructive ? 'danger' : 'primary'}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: COLORS.Overlay,
    justifyContent:  'center',
    alignItems:      'center',
    padding:         SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.Surface,
    borderRadius:    BORDER_RADIUS.xl,
    padding:         SPACING.lg,
    width:           '100%',
    maxWidth:        400,
  },
  title: {
    fontSize:     FONT_SIZE.lg,
    fontWeight:   FONT_WEIGHT.bold,
    color:        COLORS.TextPrimary,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize:     FONT_SIZE.base,
    color:        COLORS.TextSecondary,
    lineHeight:   FONT_SIZE.base * 1.5,
    marginBottom: SPACING.lg,
  },
  buttons: {
    flexDirection: 'row',
    gap:           SPACING.sm,
  },
  btnWrapper: {
    flex: 1,
  },
});
