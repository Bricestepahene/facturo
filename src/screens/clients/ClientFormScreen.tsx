// src/screens/clients/ClientFormScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/i18n/index';
import { clientRepository } from '@/repositories/ClientRepository';
import { CurrencyPicker } from '@/components/forms/CurrencyPicker';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { Button } from '@/components/common/Button';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import type { RootStackScreenProps } from '@/navigation/types';
import type { NewClient } from '@/types';

type Props = RootStackScreenProps<'ClientForm'>;

const schema = z.object({
  type: z.enum(['individual', 'company']),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  defaultCurrencyCode: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ClientFormScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const clientId = route.params?.clientId;
  const isEdit = Boolean(clientId);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'individual',
      name: '',
      email: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      countryCode: 'FR',
      taxId: '',
      registrationNumber: '',
      defaultCurrencyCode: 'EUR',
      notes: '',
    },
  });

  useEffect(() => {
    if (!clientId) return;
    clientRepository.findById(clientId).then((client) => {
      if (!client) return;
      reset({
        type: client.type,
        name: client.name,
        email: client.email ?? '',
        phone: client.phone ?? '',
        addressLine1: client.addressLine1 ?? '',
        addressLine2: client.addressLine2 ?? '',
        city: client.city ?? '',
        state: client.state ?? '',
        postalCode: client.postalCode ?? '',
        countryCode: client.countryCode ?? 'FR',
        taxId: client.taxId ?? '',
        registrationNumber: client.registrationNumber ?? '',
        defaultCurrencyCode: client.defaultCurrencyCode ?? 'EUR',
        notes: client.notes ?? '',
      });
    });
  }, [clientId, reset]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    try {
      const payload: Partial<NewClient> = {
        type: data.type,
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        addressLine1: data.addressLine1 || undefined,
        addressLine2: data.addressLine2 || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        postalCode: data.postalCode || undefined,
        countryCode: data.countryCode || 'FR',
        taxId: data.taxId || undefined,
        registrationNumber: data.registrationNumber || undefined,
        defaultCurrencyCode: data.defaultCurrencyCode || undefined,
        notes: data.notes || undefined,
      };

      if (isEdit && clientId) {
        await clientRepository.update(clientId, payload);
      } else {
        await clientRepository.create(payload as NewClient);
      }
      navigation.goBack();
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!clientId) return;
    setDeleting(true);
    try {
      await clientRepository.delete(clientId);
      setShowDeleteModal(false);
      navigation.goBack();
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    }
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

            <Text style={styles.label}>{t('common:required')}</Text>
            <Controller
              control={control}
              name="type"
              render={({ field: { value, onChange } }) => (
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, value === 'individual' && styles.toggleBtnActive]}
                    onPress={() => onChange('individual')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        value === 'individual' && styles.toggleBtnTextActive,
                      ]}
                    >
                      {t('client:type.individual')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, value === 'company' && styles.toggleBtnActive]}
                    onPress={() => onChange('company')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        value === 'company' && styles.toggleBtnTextActive,
                      ]}
                    >
                      {t('client:type.company')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />

            <FieldInput
              control={control}
              name="name"
              label={t('client:name')}
              placeholder={t('client:name')}
              error={errors.name?.message}
              required
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('client:contactInfo')}</Text>
            <FieldInput
              control={control}
              name="email"
              label={t('common:email')}
              placeholder={t('common:email')}
              keyboardType="email-address"
              error={errors.email?.message}
            />
            <FieldInput
              control={control}
              name="phone"
              label={t('common:phone')}
              placeholder={t('common:phone')}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common:address')}</Text>
            <FieldInput
              control={control}
              name="addressLine1"
              label={t('client:addressLine1')}
              placeholder={t('client:addressLine1')}
            />
            <FieldInput
              control={control}
              name="addressLine2"
              label={t('client:addressLine2')}
              placeholder={t('client:addressLine2')}
            />
            <View style={styles.row}>
              <View style={styles.flex}>
                <FieldInput
                  control={control}
                  name="city"
                  label={t('common:city')}
                  placeholder={t('common:city')}
                />
              </View>
              <View style={styles.flex}>
                <FieldInput
                  control={control}
                  name="postalCode"
                  label={t('client:postalCode')}
                  placeholder={t('client:postalCode')}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <FieldInput
              control={control}
              name="state"
              label={t('client:state')}
              placeholder={t('client:state')}
            />
            <FieldInput
              control={control}
              name="countryCode"
              label={t('common:country')}
              placeholder="FR"
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('client:billingInfo')}</Text>
            <FieldInput
              control={control}
              name="taxId"
              label={t('client:taxId')}
              placeholder={t('client:taxId')}
            />
            <FieldInput
              control={control}
              name="registrationNumber"
              label={t('client:registrationNumber')}
              placeholder={t('client:registrationNumber')}
            />
            <Controller
              control={control}
              name="defaultCurrencyCode"
              render={({ field: { value, onChange } }) => (
                <CurrencyPicker
                  value={value ?? 'EUR'}
                  onChange={onChange}
                  label={t('client:defaultCurrency')}
                />
              )}
            />
          </View>

          <View style={styles.section}>
            <FieldInput
              control={control}
              name="notes"
              label={t('common:notes')}
              placeholder={t('common:notes')}
              multiline
              numberOfLines={3}
            />
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
                title={t('client:deleteClient')}
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

      <ConfirmModal
        visible={showDeleteModal}
        title={t('client:deleteClient')}
        message={t('client:deleteClientConfirm')}
        confirmLabel={t('common:delete')}
        cancelLabel={t('common:cancel')}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        destructive
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Internal helper — avoids repetition for each text field
// ---------------------------------------------------------------------------

import { Control, Controller as ControllerCmp } from 'react-hook-form';
import { TextInput } from 'react-native';

interface FieldInputProps {
  control: Control<FormData>;
  name: keyof FormData;
  label: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function FieldInput({
  control,
  name,
  label,
  placeholder,
  error,
  required,
  multiline,
  numberOfLines,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldInputProps) {
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>
        {label}
        {required ? <Text style={fieldStyles.required}> *</Text> : null}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            style={[
              fieldStyles.input,
              multiline && fieldStyles.inputMultiline,
              error ? fieldStyles.inputError : null,
            ]}
            placeholder={placeholder}
            placeholderTextColor={COLORS.TextDisabled}
            value={typeof value === 'string' ? value : ''}
            onChangeText={onChange}
            onBlur={onBlur}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
          />
        )}
      />
      {error ? <Text style={fieldStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
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
});

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
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
    marginBottom: SPACING.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.Border,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.Surface,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.Primary,
  },
  toggleBtnText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
  },
  toggleBtnTextActive: {
    color: COLORS.Surface,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actions: {
    marginTop: SPACING.sm,
  },
  actionSpacing: {
    marginTop: SPACING.sm,
  },
});
