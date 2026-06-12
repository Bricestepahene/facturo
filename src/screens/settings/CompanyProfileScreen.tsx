// src/screens/settings/CompanyProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '@/i18n';
import { settingsRepository } from '@/repositories/SettingsRepository';
import { Button, Input } from '@/components/common';
import { CurrencyPicker } from '@/components/forms/CurrencyPicker';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import type { RootStackScreenProps } from '@/navigation/types';
import type { CompanySettings } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'settings:companyName'),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  defaultCurrencyCode: z.string().min(1),
  defaultLanguage: z.enum(['fr', 'en']),
  invoicePrefix: z.string().min(1),
  quotePrefix: z.string().min(1),
  defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365),
  legalMentions: z.string().optional(),
  bankDetails: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = RootStackScreenProps<'CompanyProfile'>;

export default function CompanyProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      countryCode: 'FR',
      phone: '',
      email: '',
      website: '',
      taxId: '',
      registrationNumber: '',
      defaultCurrencyCode: 'EUR',
      defaultLanguage: 'fr',
      invoicePrefix: 'FAC',
      quotePrefix: 'DEV',
      defaultPaymentTermsDays: 30,
      legalMentions: '',
      bankDetails: '',
    },
  });

  useEffect(() => {
    settingsRepository.getCompanySettings().then((s: CompanySettings) => {
      reset({
        name: s.name ?? '',
        addressLine1: s.addressLine1 ?? '',
        addressLine2: s.addressLine2 ?? '',
        city: s.city ?? '',
        state: s.state ?? '',
        postalCode: s.postalCode ?? '',
        countryCode: s.countryCode ?? 'FR',
        phone: s.phone ?? '',
        email: s.email ?? '',
        website: s.website ?? '',
        taxId: s.taxId ?? '',
        registrationNumber: s.registrationNumber ?? '',
        defaultCurrencyCode: s.defaultCurrencyCode ?? 'EUR',
        defaultLanguage: (s.defaultLanguage as 'fr' | 'en') ?? 'fr',
        invoicePrefix: s.invoicePrefix ?? 'FAC',
        quotePrefix: s.quotePrefix ?? 'DEV',
        defaultPaymentTermsDays: s.defaultPaymentTermsDays ?? 30,
        legalMentions: s.legalMentions ?? '',
        bankDetails: s.bankDetails ?? '',
      });
      setInitializing(false);
    });
  }, [reset]);

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await settingsRepository.updateCompanySettings({
        ...values,
        addressLine1: values.addressLine1 || null,
        addressLine2: values.addressLine2 || null,
        city: values.city || null,
        state: values.state || null,
        postalCode: values.postalCode || null,
        countryCode: values.countryCode || 'FR',
        phone: values.phone || null,
        email: values.email || null,
        website: values.website || null,
        taxId: values.taxId || null,
        registrationNumber: values.registrationNumber || null,
        legalMentions: values.legalMentions || null,
        bankDetails: values.bankDetails || null,
      });
      Alert.alert(t('common:success'), t('settings:settingsSaved'));
      navigation.goBack();
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  if (initializing) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings:general')}</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:companyName')}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                  placeholder="Acme Corp"
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:email')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:phone')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                />
              )}
            />
            <Controller
              control={control}
              name="website"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:website')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              )}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings:address')}</Text>
            <Controller
              control={control}
              name="addressLine1"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:addressLine1')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <Controller
              control={control}
              name="addressLine2"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:addressLine2')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Controller
                  control={control}
                  name="postalCode"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t('settings:postalCode')}
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="numbers-and-punctuation"
                    />
                  )}
                />
              </View>
              <View style={[styles.flex, styles.rowGap]}>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t('settings:city')}
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </View>
            </View>
            <Controller
              control={control}
              name="countryCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:country')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="characters"
                  maxLength={2}
                  placeholder="FR"
                />
              )}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings:documents')}</Text>
            <Controller
              control={control}
              name="taxId"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:taxId')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="characters"
                />
              )}
            />
            <Controller
              control={control}
              name="registrationNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:registrationNumber')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <Controller
              control={control}
              name="defaultCurrencyCode"
              render={({ field: { onChange, value } }) => (
                <CurrencyPicker
                  value={value}
                  onChange={(cfg) => onChange(cfg.code)}
                  label={t('settings:defaultCurrency')}
                />
              )}
            />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Controller
                  control={control}
                  name="invoicePrefix"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t('settings:invoicePrefix')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="characters"
                    />
                  )}
                />
              </View>
              <View style={[styles.flex, styles.rowGap]}>
                <Controller
                  control={control}
                  name="quotePrefix"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t('settings:quotePrefix')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="characters"
                    />
                  )}
                />
              </View>
            </View>
            <Controller
              control={control}
              name="defaultPaymentTermsDays"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:defaultPaymentDays')}
                  value={String(value)}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                />
              )}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings:privacy')}</Text>
            <Controller
              control={control}
              name="legalMentions"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:legalMentions')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                />
              )}
            />
            <Controller
              control={control}
              name="bankDetails"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('settings:bankDetails')}
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                />
              )}
            />
          </View>

          <View style={styles.submitRow}>
            <Button
              title={t('settings:save')}
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              disabled={!isDirty}
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    gap: SPACING.sm,
    ...SHADOW.light,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rowGap: {
    marginLeft: SPACING.sm,
  },
  submitRow: {
    marginTop: SPACING.sm,
  },
});
