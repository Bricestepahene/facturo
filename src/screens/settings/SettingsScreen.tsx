// src/screens/settings/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Constants from 'expo-constants';
import { useTranslation } from '@/i18n/index';
import { settingsRepository } from '@/repositories/SettingsRepository';
import { useUsageStore } from '@/stores/usageStore';
import { AdBanner } from '@/components/ads/AdBanner';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import type { CompanySettings } from '@/types';
import type { TabScreenProps } from '@/navigation/types';

type Props = TabScreenProps<'Settings'>;

interface SettingsItem {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
  chevron?: boolean;
  badge?: string;
}

export default function SettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const isPro = useUsageStore((s) => s.isPro);
  const [company, setCompany] = useState<CompanySettings | null>(null);

  useEffect(() => {
    settingsRepository.getCompanySettings().then(setCompany).catch(() => null);
  }, []);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  async function handlePrivacyPolicy() {
    const url = 'https://facturo.app/privacy';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    }
  }

  const settingsItems: SettingsItem[] = [
    {
      id: 'companyProfile',
      icon: '🏢',
      label: t('settings:companyProfile'),
      onPress: () => navigation.navigate('CompanyProfile'),
      chevron: true,
    },
    {
      id: 'taxRates',
      icon: '💰',
      label: t('settings:taxRates'),
      onPress: () => navigation.navigate('TaxRates'),
      chevron: true,
    },
    {
      id: 'backup',
      icon: '💾',
      label: t('settings:backup'),
      onPress: () => navigation.navigate('Backup'),
      chevron: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('settings:settings')}</Text>
        </View>

        {company?.name ? (
          <View style={styles.companyCard}>
            <Text style={styles.companyIcon}>🏢</Text>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{company.name}</Text>
              {isPro ? (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>Pro ✓</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          {settingsItems.map((item, index) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.row}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <Text style={styles.rowIcon}>{item.icon}</Text>
                <Text style={styles.rowLabel}>{item.label}</Text>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                {item.chevron ? (
                  <Text style={styles.chevron}>›</Text>
                ) : null}
              </TouchableOpacity>
              {index < settingsItems.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>

        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeCard}
            onPress={() => navigation.navigate('UpgradePro')}
            activeOpacity={0.85}
          >
            <Text style={styles.upgradeIcon}>👑</Text>
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeTitle}>{t('monetization:upgradeToPro')}</Text>
              <Text style={styles.upgradeSubtitle}>{t('monetization:unlimitedPdfs')}</Text>
            </View>
            <Text style={styles.chevronUpgrade}>›</Text>
          </TouchableOpacity>
        )}

        {isPro && (
          <View style={styles.proActiveCard}>
            <Text style={styles.proActiveIcon}>✓</Text>
            <Text style={styles.proActiveText}>{t('monetization:alreadyPro')}</Text>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={handlePrivacyPolicy}
            activeOpacity={0.7}
          >
            <Text style={styles.rowIcon}>🔒</Text>
            <Text style={styles.rowLabel}>{t('settings:privacyPolicy')}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>
          {t('settings:version', { version: appVersion })}
        </Text>
      </ScrollView>

      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  scroll: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.Surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.Surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOW.light,
  },
  companyIcon: {
    fontSize: FONT_SIZE.xxl,
  },
  companyInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  companyName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextPrimary,
  },
  proBadge: {
    backgroundColor: COLORS.Secondary + '22',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  proBadgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.Secondary,
  },
  section: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    overflow: 'hidden',
    ...SHADOW.light,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  rowIcon: {
    fontSize: FONT_SIZE.lg,
    width: 28,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
  },
  badge: {
    backgroundColor: COLORS.Primary + '1A',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.Primary,
  },
  chevron: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.TextDisabled,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.Divider,
    marginLeft: SPACING.md + 28 + SPACING.sm,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.Primary,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOW.medium,
  },
  upgradeIcon: {
    fontSize: FONT_SIZE.xxl,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.Surface,
  },
  upgradeSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.Surface,
    opacity: 0.8,
  },
  chevronUpgrade: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.Surface,
    opacity: 0.8,
  },
  proActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.Secondary + '1A',
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  proActiveIcon: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.Secondary,
  },
  proActiveText: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.Secondary,
  },
  versionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextDisabled,
    textAlign: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
});
