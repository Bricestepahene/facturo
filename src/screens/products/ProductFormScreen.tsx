// src/screens/products/ProductFormScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  ListRenderItemInfo,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/i18n/index';
import { productRepository } from '@/repositories/ProductRepository';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Button } from '@/components/common/Button';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import type { RootStackScreenProps } from '@/navigation/types';
import type { NewProduct } from '@/types';

type Props = RootStackScreenProps<'ProductForm'>;

const UNIT_OPTIONS = ['pcs', 'heure', 'jour', 'mois', 'forfait', 'km'] as const;
type UnitOption = (typeof UNIT_OPTIONS)[number];

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unitPrice: z.string().min(1),
  unit: z.string().min(1),
  category: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProductFormScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const productId = route.params?.productId;
  const isEdit = Boolean(productId);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      unitPrice: '',
      unit: 'pcs',
      category: '',
    },
  });

  const selectedUnit = watch('unit');

  useEffect(() => {
    if (!productId) return;
    productRepository.findById(productId).then((product) => {
      if (!product) return;
      reset({
        name: product.name,
        description: product.description ?? '',
        unitPrice: String(product.unitPrice),
        unit: product.unit,
        category: product.category ?? '',
      });
    });
  }, [productId, reset]);

  async function onSubmit(data: FormData) {
    const priceNum = parseFloat(data.unitPrice.replace(',', '.'));
    if (isNaN(priceNum)) {
      Alert.alert(t('common:error'), t('common:invalidNumber'));
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<NewProduct> = {
        name: data.name,
        description: data.description || undefined,
        unitPrice: priceNum,
        unit: data.unit,
        category: data.category || undefined,
      };
      if (isEdit && productId) {
        await productRepository.update(productId, payload);
      } else {
        await productRepository.create(payload as NewProduct);
      }
      navigation.goBack();
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!productId) return;
    setDeleting(true);
    try {
      await productRepository.delete(productId);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    }
  }

  function renderUnitItem({ item }: ListRenderItemInfo<UnitOption>) {
    const isSelected = item === selectedUnit;
    return (
      <TouchableOpacity
        style={[styles.unitItem, isSelected && styles.unitItemSelected]}
        onPress={() => {
          setValue('unit', item);
          setShowUnitPicker(false);
        }}
        activeOpacity={0.75}
      >
        <Text style={[styles.unitItemText, isSelected && styles.unitItemTextSelected]}>
          {t(`product:units.${item}`, { defaultValue: item })}
        </Text>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common:details')}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>
                {t('product:name')}
                <Text style={styles.required}> *</Text>
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder={t('product:name')}
                    placeholderTextColor={COLORS.TextDisabled}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.name ? (
                <Text style={styles.errorText}>{t('product:required.name')}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('product:description')}</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    placeholder={t('product:description')}
                    placeholderTextColor={COLORS.TextDisabled}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common:amount')}</Text>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.label}>
                  {t('product:unitPrice')}
                  <Text style={styles.required}> *</Text>
                </Text>
                <Controller
                  control={control}
                  name="unitPrice"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      style={[styles.input, errors.unitPrice && styles.inputError]}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.TextDisabled}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                    />
                  )}
                />
                {errors.unitPrice ? (
                  <Text style={styles.errorText}>{t('product:required.unitPrice')}</Text>
                ) : null}
              </View>

              <View style={styles.flex}>
                <Text style={styles.label}>{t('product:unit')}</Text>
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  onPress={() => setShowUnitPicker(true)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.pickerValue}>
                    {t(`product:units.${selectedUnit}`, { defaultValue: selectedUnit })}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('product:category')}</Text>
              <Controller
                control={control}
                name="category"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder={t('product:category')}
                    placeholderTextColor={COLORS.TextDisabled}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title={t('common:save')}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              fullWidth
              loading={saving}
            />
            <Button
              title={t('common:cancel')}
              onPress={() => navigation.goBack()}
              variant="outline"
              fullWidth
              style={styles.actionSpacing}
            />
            {isEdit && (
              <Button
                title={t('product:deleteProduct')}
                onPress={() => setShowDeleteModal(true)}
                variant="danger"
                fullWidth
                loading={deleting}
                style={styles.actionSpacing}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showUnitPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('product:unit')}</Text>
              <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList<UnitOption>
              data={[...UNIT_OPTIONS]}
              keyExtractor={(item) => item}
              renderItem={renderUnitItem}
              ItemSeparatorComponent={() => <View style={styles.listSep} />}
            />
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={showDeleteModal}
        title={t('product:deleteProduct')}
        message={t('product:deleteProductConfirm')}
        confirmLabel={t('common:delete')}
        cancelLabel={t('common:cancel')}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        destructive
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  section: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.light,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  field: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
    marginBottom: 4,
  },
  required: {
    color: COLORS.Error,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    backgroundColor: COLORS.Surface,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.Error,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.Error,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.Surface,
  },
  pickerValue: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
  },
  chevron: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.TextDisabled,
  },
  actions: {
    marginTop: SPACING.sm,
  },
  actionSpacing: {
    marginTop: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.Overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.Surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
  },
  closeBtn: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    padding: SPACING.xs,
  },
  unitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  unitItemSelected: {
    backgroundColor: COLORS.Primary + '0D',
  },
  unitItemText: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
  },
  unitItemTextSelected: {
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  checkmark: {
    fontSize: FONT_SIZE.base,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  listSep: {
    height: 1,
    backgroundColor: COLORS.Divider,
    marginLeft: SPACING.md,
  },
});
