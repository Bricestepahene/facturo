// src/components/forms/LineItemRow.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { DocumentItem, TaxRate } from '@/db/schema';
import { CurrencyConfig, formatCurrency } from '@/utils/currency';
import { TaxSelector } from '@/components/forms/TaxSelector';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

interface Props {
  item: Partial<DocumentItem>;
  index: number;
  onUpdate: (index: number, field: string, value: unknown) => void;
  onRemove: (index: number) => void;
  taxRates: TaxRate[];
  currencyConfig: CurrencyConfig;
  isLast: boolean;
}

function parseNumber(text: string): number {
  const n = parseFloat(text.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function calcLineTotal(
  quantity: number,
  unitPrice: number,
  discountType: 'percentage' | 'fixed' | null | undefined,
  discountValue: number | null | undefined,
  appliedTaxRateIds: string[],
  taxRates: TaxRate[],
): number {
  const subtotal = quantity * unitPrice;
  let taxable = subtotal;
  if (discountType && discountValue != null && discountValue !== 0) {
    if (discountType === 'percentage') {
      taxable = subtotal * (1 - discountValue / 100);
    } else {
      taxable = Math.max(0, subtotal - discountValue);
    }
  }
  const taxAmount = taxRates
    .filter((r) => appliedTaxRateIds.includes(r.id))
    .reduce((sum, r) => sum + (r.rate / 100) * taxable, 0);
  return taxable + taxAmount;
}

export function LineItemRow({
  item,
  index,
  onUpdate,
  onRemove,
  taxRates,
  currencyConfig,
  isLast,
}: Props) {
  const { t } = useTranslation();

  const description = item.description ?? '';
  const quantity = item.quantity ?? 1;
  const unitPrice = item.unitPrice ?? 0;
  const unit = item.unit ?? 'pcs';
  const discountType = item.discountType ?? null;
  const discountValue = item.discountValue ?? null;
  const appliedTaxRateIds: string[] = item.appliedTaxRateIds
    ? (JSON.parse(item.appliedTaxRateIds) as string[])
    : [];

  const lineTotal = calcLineTotal(
    quantity,
    unitPrice,
    discountType,
    discountValue,
    appliedTaxRateIds,
    taxRates,
  );

  const handleUpdate = useCallback(
    (field: string, value: unknown) => onUpdate(index, field, value),
    [index, onUpdate],
  );

  const handleTaxChange = useCallback(
    (ids: string[]) => onUpdate(index, 'appliedTaxRateIds', JSON.stringify(ids)),
    [index, onUpdate],
  );

  return (
    <View style={[styles.container, isLast && styles.containerLast]}>
      <View style={styles.headerRow}>
        <Text style={styles.indexLabel}>#{index + 1}</Text>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(index)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t('document:removeItem')}
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.descriptionInput}
        value={description}
        onChangeText={(v) => handleUpdate('description', v)}
        placeholder={t('common:description')}
        placeholderTextColor={COLORS.TextDisabled}
        multiline
        numberOfLines={2}
      />

      <View style={styles.row}>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t('document:quantity')}</Text>
          <TextInput
            style={styles.smallInput}
            value={String(quantity)}
            onChangeText={(v) => handleUpdate('quantity', parseNumber(v))}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t('document:unit')}</Text>
          <TextInput
            style={styles.smallInput}
            value={unit}
            onChangeText={(v) => handleUpdate('unit', v)}
            placeholder="pcs"
            placeholderTextColor={COLORS.TextDisabled}
            maxLength={10}
          />
        </View>

        <View style={[styles.fieldGroup, styles.fieldGroupWide]}>
          <Text style={styles.fieldLabel}>{t('document:unitPrice')}</Text>
          <TextInput
            style={styles.smallInput}
            value={String(unitPrice)}
            onChangeText={(v) => handleUpdate('unitPrice', parseNumber(v))}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        </View>
      </View>

      {discountType != null && (
        <View style={styles.row}>
          <View style={[styles.fieldGroup, styles.fieldGroupWide]}>
            <Text style={styles.fieldLabel}>
              {t('common:discount')}{' '}
              {discountType === 'percentage'
                ? t('document:percentage')
                : `(${currencyConfig.symbol})`}
            </Text>
            <TextInput
              style={styles.smallInput}
              value={String(discountValue ?? 0)}
              onChangeText={(v) => handleUpdate('discountValue', parseNumber(v))}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
          </View>
        </View>
      )}

      <TaxSelector
        selectedTaxRateIds={appliedTaxRateIds}
        onChange={handleTaxChange}
        taxRates={taxRates}
        label={t('document:taxRate')}
      />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t('common:total')}</Text>
        <Text style={styles.totalValue}>
          {formatCurrency(lineTotal, currencyConfig)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.Border,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  containerLast: {
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  indexLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextSecondary,
  },
  removeBtn: {
    padding: 2,
  },
  removeBtnText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.Error,
    fontWeight: FONT_WEIGHT.bold,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    backgroundColor: COLORS.Background,
    marginBottom: SPACING.xs,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  fieldGroup: {
    flex: 1,
  },
  fieldGroupWide: {
    flex: 2,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.TextSecondary,
    marginBottom: 2,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: SPACING.xs + 2,
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextPrimary,
    backgroundColor: COLORS.Background,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.Border,
    marginTop: SPACING.xs,
  },
  totalLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  totalValue: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    fontWeight: FONT_WEIGHT.bold,
  },
});
