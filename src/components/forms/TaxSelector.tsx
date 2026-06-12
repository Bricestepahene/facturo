// src/components/forms/TaxSelector.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ListRenderItemInfo,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { TaxRate } from '@/db/schema';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

interface Props {
  selectedTaxRateIds: string[];
  onChange: (ids: string[]) => void;
  taxRates: TaxRate[];
  label?: string;
  style?: object;
}

export function TaxSelector({
  selectedTaxRateIds,
  onChange,
  taxRates,
  label,
  style,
}: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  function toggleRate(id: string) {
    if (selectedTaxRateIds.includes(id)) {
      onChange(selectedTaxRateIds.filter((x) => x !== id));
    } else {
      onChange([...selectedTaxRateIds, id]);
    }
  }

  function removeRate(id: string) {
    onChange(selectedTaxRateIds.filter((x) => x !== id));
  }

  const selectedRates = taxRates.filter((r) => selectedTaxRateIds.includes(r.id));

  function renderItem({ item }: ListRenderItemInfo<TaxRate>) {
    const checked = selectedTaxRateIds.includes(item.id);
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => toggleRate(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.rateInfo}>
          <Text style={styles.rateName}>{item.name}</Text>
          <Text style={styles.rateValue}>{item.rate}%</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.chipsRow}>
        {selectedRates.map((rate) => (
          <TouchableOpacity
            key={rate.id}
            style={styles.chip}
            onPress={() => removeRate(rate.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipText}>
              {rate.name} {rate.rate}%
            </Text>
            <Text style={styles.chipRemove}>✕</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setVisible(true)}
          activeOpacity={0.7}
          accessibilityLabel={t('document:addTax')}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('document:taxRate')}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.closeBtn}>{t('common:close')}</Text>
            </TouchableOpacity>
          </View>

          {taxRates.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('settings:noTaxRates')}</Text>
            </View>
          ) : (
            <FlatList<TaxRate>
              data={taxRates}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
    marginBottom: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.Primary + '1A',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    gap: 4,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  chipRemove: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.Primary,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.Primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.Primary,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    backgroundColor: COLORS.Surface,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
  },
  closeBtn: {
    fontSize: FONT_SIZE.base,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  listContent: {
    paddingVertical: SPACING.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.Border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.Primary,
    backgroundColor: COLORS.Primary,
  },
  checkmark: {
    fontSize: FONT_SIZE.xs,
    color: '#ffffff',
    fontWeight: FONT_WEIGHT.bold,
  },
  rateInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rateName: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
  },
  rateValue: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.Border,
    marginLeft: SPACING.md + 22 + SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    textAlign: 'center',
  },
});
