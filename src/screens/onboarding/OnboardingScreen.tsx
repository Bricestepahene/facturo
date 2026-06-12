// src/screens/onboarding/OnboardingScreen.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RootStackScreenProps } from '@/navigation/types';
import { useTranslation } from '@/i18n/index';
import { settingsRepository } from '@/repositories/SettingsRepository';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { CURRENCY_LIST, getCurrencyConfig } from '@/utils/currency';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = RootStackScreenProps<'Onboarding'>;

interface SlideData {
  icon: string;
  titleKey: string;
  descKey: string;
}

const SLIDES: SlideData[] = [
  {
    icon: '🧾',
    titleKey: 'onboarding:slide1Title',
    descKey: 'onboarding:slide1Desc',
  },
  {
    icon: '👥',
    titleKey: 'onboarding:slide2Title',
    descKey: 'onboarding:slide2Desc',
  },
  {
    icon: '📊',
    titleKey: 'onboarding:slide3Title',
    descKey: 'onboarding:slide3Desc',
  },
];

const TOTAL_STEPS = 4; // 3 slides + 1 setup form

const setupSchema = z.object({
  companyName: z.string().min(1),
  defaultCurrencyCode: z.string().min(3),
  defaultLanguage: z.enum(['fr', 'en']),
});

type SetupFormData = z.infer<typeof setupSchema>;

export default function OnboardingScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { completeOnboarding } = useOnboardingStore();
  const flatListRef = useRef<FlatList<SlideData>>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      companyName: '',
      defaultCurrencyCode: 'EUR',
      defaultLanguage: 'fr',
    },
  });

  const selectedCurrencyCode = watch('defaultCurrencyCode');
  const selectedLanguage = watch('defaultLanguage');
  const selectedCurrencyConfig = getCurrencyConfig(selectedCurrencyCode);

  const goToStep = useCallback(
    (step: number) => {
      const clampedStep = Math.max(0, Math.min(step, TOTAL_STEPS - 1));
      setCurrentStep(clampedStep);
      if (clampedStep < SLIDES.length && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: clampedStep, animated: true });
      }
    },
    [],
  );

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, goToStep]);

  const handleSkip = useCallback(() => {
    goToStep(TOTAL_STEPS - 1);
  }, [goToStep]);

  const onFinish = useCallback(
    async (data: SetupFormData) => {
      setSaving(true);
      try {
        await settingsRepository.updateCompanySettings({
          name: data.companyName,
          defaultCurrencyCode: data.defaultCurrencyCode,
          defaultLanguage: data.defaultLanguage,
        });
        await settingsRepository.updateAppUsage({ hasSeenOnboarding: true });
        completeOnboarding();
        navigation.replace('Main');
      } catch {
        // silently handle
      } finally {
        setSaving(false);
      }
    },
    [completeOnboarding, navigation],
  );

  const renderSlide = useCallback(
    ({ item }: { item: SlideData }) => (
      <View style={styles.slide}>
        <Text style={styles.slideIcon}>{item.icon}</Text>
        <Text style={styles.slideTitle}>{t(item.titleKey)}</Text>
        <Text style={styles.slideDesc}>{t(item.descKey)}</Text>
      </View>
    ),
    [t],
  );

  const renderSetupForm = () => (
    <ScrollView
      style={styles.setupScrollView}
      contentContainerStyle={styles.setupContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.setupTitle}>{t('onboarding:setupTitle')}</Text>
      <Text style={styles.setupSubtitle}>{t('onboarding:setupSubtitle')}</Text>

      {/* Company Name */}
      <Controller
        control={control}
        name="companyName"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('settings:companyName')}
            placeholder={t('onboarding:companyNamePlaceholder')}
            value={value}
            onChangeText={onChange}
            error={errors.companyName ? t('common:fieldRequired') : undefined}
            autoCapitalize="words"
            returnKeyType="done"
          />
        )}
      />

      {/* Currency Picker */}
      <Controller
        control={control}
        name="defaultCurrencyCode"
        render={({ field: { onChange } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('onboarding:selectCurrency')}</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowCurrencyPicker((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerButtonText}>
                {selectedCurrencyConfig.symbol} {selectedCurrencyConfig.code} — {selectedCurrencyConfig.name}
              </Text>
              <Text style={styles.pickerChevron}>{showCurrencyPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showCurrencyPicker && (
              <View style={styles.currencyList}>
                <ScrollView style={styles.currencyScroll} nestedScrollEnabled>
                  {CURRENCY_LIST.slice(0, 30).map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={[
                        styles.currencyItem,
                        selectedCurrencyCode === c.code && styles.currencyItemSelected,
                      ]}
                      onPress={() => {
                        onChange(c.code);
                        setShowCurrencyPicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.currencyItemText,
                          selectedCurrencyCode === c.code && styles.currencyItemTextSelected,
                        ]}
                      >
                        {c.symbol} {c.code} — {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      />

      {/* Language Toggle */}
      <Controller
        control={control}
        name="defaultLanguage"
        render={({ field: { onChange } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('onboarding:selectLanguage')}</Text>
            <View style={styles.languageToggle}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'fr' && styles.languageOptionActive,
                ]}
                onPress={() => onChange('fr')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    selectedLanguage === 'fr' && styles.languageOptionTextActive,
                  ]}
                >
                  {t('settings:languageOptions.fr')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'en' && styles.languageOptionActive,
                ]}
                onPress={() => onChange('en')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    selectedLanguage === 'en' && styles.languageOptionTextActive,
                  ]}
                >
                  {t('settings:languageOptions.en')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.setupButtonRow}>
        <Button
          title={saving ? t('common:loading') : t('onboarding:getStarted')}
          onPress={handleSubmit(onFinish)}
          variant="primary"
          fullWidth
          loading={saving}
          disabled={saving}
        />
      </View>
    </ScrollView>
  );

  const isLastInfoSlide = currentStep === SLIDES.length - 1;
  const isSetupStep = currentStep === TOTAL_STEPS - 1;

  return (
    <View style={styles.container}>
      {/* Slides */}
      {!isSetupStep && (
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(_, idx) => String(idx)}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={styles.slideList}
        />
      )}

      {/* Setup Form */}
      {isSetupStep && renderSetupForm()}

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, currentStep === idx && styles.dotActive]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      {!isSetupStep && (
        <View style={styles.navButtons}>
          {!isLastInfoSlide ? (
            <>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
                <Text style={styles.skipText}>{t('common:skip')}</Text>
              </TouchableOpacity>
              <Button
                title={t('common:next')}
                onPress={handleNext}
                variant="primary"
                size="lg"
                style={styles.nextButton}
              />
            </>
          ) : (
            <Button
              title={t('onboarding:almostDone')}
              onPress={handleNext}
              variant="primary"
              fullWidth
              size="lg"
            />
          )}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.Background,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.lg,
  },
  slideList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  slideIcon: {
    fontSize: 80,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  slideTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  slideDesc: {
    fontSize: FONT_SIZE.md,
    color: COLORS.TextSecondary,
    textAlign: 'center',
    lineHeight: FONT_SIZE.md * 1.5,
  },
  setupScrollView: {
    flex: 1,
  },
  setupContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  setupTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  setupSubtitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
    marginBottom: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.Surface,
  },
  pickerButtonText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    flex: 1,
  },
  pickerChevron: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.TextSecondary,
    marginLeft: SPACING.xs,
  },
  currencyList: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.Surface,
    overflow: 'hidden',
  },
  currencyScroll: {
    maxHeight: 200,
  },
  currencyItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Divider,
  },
  currencyItemSelected: {
    backgroundColor: COLORS.Primary + '1A',
  },
  currencyItemText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
  },
  currencyItemTextSelected: {
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  languageToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.SurfaceVariant,
  },
  languageOption: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  languageOptionActive: {
    backgroundColor: COLORS.Primary,
  },
  languageOptionText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  languageOptionTextActive: {
    color: '#fff',
    fontWeight: FONT_WEIGHT.semibold,
  },
  setupButtonRow: {
    marginTop: SPACING.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.Border,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.Primary,
  },
  navButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  skipButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  skipText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  nextButton: {
    minWidth: 120,
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 24 : SPACING.md,
  },
});
