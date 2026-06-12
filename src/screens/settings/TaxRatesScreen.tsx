// src/screens/settings/TaxRatesScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  SafeAreaView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '@/i18n';
import { taxRateRepository } from '@/repositories/TaxRateRepository';
import { generateId } from '@/utils/documentNumber';
import { today } from '@/utils/dateUtils';
import { Button, Input, ConfirmModal, EmptyState } from '@/components/common';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import type { TaxRate } from '@/types';

const taxSchema = z.object({
  name: z.string().min(1),
  rate: z.coerce.number().min(0).max(100),
  isDefault: z.boolean(),
  isCompound: z.boolean(),
});

type TaxFormValues = z.infer<typeof taxSchema>;

export default function TaxRatesScreen() {
  const { t } = useTranslation();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxRate | null>(null);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TaxFormValues>({
    resolver: zodResolver(taxSchema),
    defaultValues: { name: '', rate: 20, isDefault: false, isCompound: false },
  });

  const loadTaxRates = useCallback(async () => {
    const rates = await taxRateRepository.findAll();
    setTaxRates(rates);
  }, []);

  useEffect(() => { loadTaxRates(); }, [loadTaxRates]);

  function openCreate() {
    setEditingId(null);
    reset({ name: '', rate: 20, isDefault: false, isCompound: false });
    setModalVisible(true);
  }

  function openEdit(rate: TaxRate) {
    setEditingId(rate.id);
    reset({ name: rate.name, rate: rate.rate, isDefault: rate.isDefault, isCompound: rate.isCompound });
    setModalVisible(true);
  }

  async function onSubmit(values: TaxFormValues) {
    setLoading(true);
    try {
      if (editingId) {
        await taxRateRepository.update(editingId, {
          name: values.name,
          rate: values.rate,
          isDefault: values.isDefault,
          isCompound: values.isCompound,
        });
        if (values.isDefault) {
          await taxRateRepository.setDefault(editingId);
        }
      } else {
        const newId = await generateId();
        const created = await taxRateRepository.create({
          id: newId,
          name: values.name,
          rate: values.rate,
          isDefault: values.isDefault,
          isCompound: values.isCompound,
          createdAt: today(),
        });
        if (values.isDefault) {
          await taxRateRepository.setDefault(created.id);
        }
      }
      await loadTaxRates();
      setModalVisible(false);
      Alert.alert(t('common:success'), t('settings:taxRateSaved'));
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(rate: TaxRate) {
    try {
      await taxRateRepository.delete(rate.id);
      await loadTaxRates();
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    }
    setDeleteTarget(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={taxRates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="💰"
            title={t('settings:noTaxRates')}
            subtitle={t('settings:addTaxRate')}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Button title={t('settings:addTaxRate')} onPress={openCreate} size="sm" />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.rateName}>{item.name}</Text>
              <Text style={styles.rateValue}>{item.rate}%</Text>
              <View style={styles.badges}>
                {item.isDefault && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{t('settings:taxRateDefault')}</Text>
                  </View>
                )}
                {item.isCompound && (
                  <View style={[styles.badge, styles.badgeCompound]}>
                    <Text style={styles.badgeText}>{t('settings:taxRateCompound')}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDeleteTarget(item)} style={styles.actionBtn}>
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingId ? t('settings:editTaxRate') : t('settings:addTaxRate')}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('settings:taxRateName')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    placeholder="TVA 20%"
                  />
                )}
              />
              <Controller
                control={control}
                name="rate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('settings:taxRateValue')}
                    value={String(value)}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.rate?.message}
                    keyboardType="decimal-pad"
                    placeholder="20"
                  />
                )}
              />

              <Controller
                control={control}
                name="isDefault"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{t('settings:isDefault')}</Text>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: COLORS.Border, true: COLORS.Primary }}
                      thumbColor={COLORS.Surface}
                    />
                  </View>
                )}
              />
              <Controller
                control={control}
                name="isCompound"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{t('settings:isCompound')}</Text>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: COLORS.Border, true: COLORS.Primary }}
                      thumbColor={COLORS.Surface}
                    />
                  </View>
                )}
              />

              <View style={styles.modalActions}>
                <Button
                  title={t('common:cancel')}
                  variant="outline"
                  onPress={() => setModalVisible(false)}
                  style={styles.actionFlex}
                />
                <Button
                  title={t('common:save')}
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                  style={styles.actionFlex}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <ConfirmModal
        visible={!!deleteTarget}
        title={t('settings:deleteTaxRate')}
        message={t('settings:deleteTaxRateConfirm')}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.Background },
  flex: { flex: 1 },
  list: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  headerRow: { alignItems: 'flex-end', marginBottom: SPACING.md },
  card: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.light,
  },
  cardLeft: { flex: 1, gap: SPACING.xs },
  rateName: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: COLORS.TextPrimary },
  rateValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.Primary },
  badges: { flexDirection: 'row', gap: SPACING.xs },
  badge: { backgroundColor: COLORS.Primary + '1A', paddingHorizontal: SPACING.xs, paddingVertical: 2, borderRadius: BORDER_RADIUS.sm },
  badgeCompound: { backgroundColor: COLORS.Warning + '1A' },
  badgeText: { fontSize: FONT_SIZE.xs, color: COLORS.Primary },
  cardActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { padding: SPACING.xs },
  actionIcon: { fontSize: FONT_SIZE.lg },
  modal: { flex: 1, backgroundColor: COLORS.Background },
  modalScroll: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.sm },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.TextPrimary },
  closeBtn: { fontSize: FONT_SIZE.xl, color: COLORS.TextSecondary, padding: SPACING.xs },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  switchLabel: { fontSize: FONT_SIZE.base, color: COLORS.TextPrimary },
  modalActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  actionFlex: { flex: 1 },
});
