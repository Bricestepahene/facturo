// src/screens/upgrade/UpgradeProScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from '@/i18n';
import {
  getProducts,
  purchasePro,
  restorePurchases,
  IAP_PRODUCT_IDS,
  verifyAndActivatePro,
} from '@/services/monetization/IapService';
import { useUsageStore } from '@/stores/usageStore';
import { Button } from '@/components/common';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'UpgradePro'>;

interface ProductInfo {
  productId: string;
  price: string;
  title: string;
}

const FEATURES = [
  { icon: '∞', key: 'proFeaturesList.unlimitedPdfs' },
  { icon: '🚫', key: 'proFeaturesList.noAds' },
  { icon: '🖼️', key: 'proFeaturesList.customLogo' },
  { icon: '💱', key: 'proFeaturesList.multiCurrency' },
  { icon: '⭐', key: 'proFeaturesList.prioritySupport' },
] as const;

export default function UpgradeProScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const isPro = useUsageStore((s) => s.isPro);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getProducts().then((raw) => {
      const info: ProductInfo[] = raw.map((p) => ({
        productId: p.productId,
        price: p.price ?? '—',
        title: p.title ?? p.productId,
      }));
      setProducts(info);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handlePurchase(productId: string) {
    setPurchasing(true);
    try {
      const success = await purchasePro(productId);
      if (success) {
        await verifyAndActivatePro(productId);
        Alert.alert(t('monetization:purchaseSuccess'), '', [
          { text: t('common:ok'), onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(t('common:error'), t('monetization:purchaseFailed'));
      }
    } catch {
      Alert.alert(t('common:error'), t('monetization:purchaseError'));
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        Alert.alert(t('common:success'), t('monetization:restoreSuccess'), [
          { text: t('common:ok'), onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(t('common:info'), t('monetization:restoreFailed'));
      }
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setRestoring(false);
    }
  }

  if (isPro) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.proIcon}>✅</Text>
        <Text style={styles.proTitle}>{t('monetization:alreadyPro')}</Text>
        <Button title={t('common:close')} onPress={() => navigation.goBack()} variant="outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.heroTitle}>{t('monetization:upgradeToPro')}</Text>
          <Text style={styles.heroSubtitle}>{t('monetization:proFeatures')}</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.key} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{t(`monetization:${f.key}` as Parameters<typeof t>[0])}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.Primary} style={styles.spinner} />
        ) : (
          <View style={styles.plans}>
            {products.length === 0 ? (
              <>
                <TouchableOpacity
                  style={styles.planCard}
                  onPress={() => handlePurchase(IAP_PRODUCT_IDS.onetime)}
                  disabled={purchasing}
                  activeOpacity={0.85}
                >
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>{t('monetization:oneTimePurchase')}</Text>
                    <Text style={styles.planPrice}>{t('monetization:price.oneTime', { price: '9.99 €' })}</Text>
                  </View>
                  <Text style={styles.planArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.planCard, styles.planCardFeatured]}
                  onPress={() => handlePurchase(IAP_PRODUCT_IDS.monthly)}
                  disabled={purchasing}
                  activeOpacity={0.85}
                >
                  <View style={styles.planInfo}>
                    <Text style={[styles.planTitle, styles.planTitleWhite]}>{t('monetization:monthlyPlan')}</Text>
                    <Text style={[styles.planPrice, styles.planPriceWhite]}>{t('monetization:price.monthly', { price: '1.99 €' })}</Text>
                  </View>
                  <Text style={[styles.planArrow, styles.planArrowWhite]}>›</Text>
                </TouchableOpacity>
              </>
            ) : (
              products.map((p) => (
                <TouchableOpacity
                  key={p.productId}
                  style={p.productId === IAP_PRODUCT_IDS.monthly ? [styles.planCard, styles.planCardFeatured] : styles.planCard}
                  onPress={() => handlePurchase(p.productId)}
                  disabled={purchasing}
                  activeOpacity={0.85}
                >
                  <View style={styles.planInfo}>
                    <Text style={p.productId === IAP_PRODUCT_IDS.monthly ? [styles.planTitle, styles.planTitleWhite] : styles.planTitle}>
                      {p.title}
                    </Text>
                    <Text style={p.productId === IAP_PRODUCT_IDS.monthly ? [styles.planPrice, styles.planPriceWhite] : styles.planPrice}>
                      {p.price}
                    </Text>
                  </View>
                  <Text style={p.productId === IAP_PRODUCT_IDS.monthly ? [styles.planArrow, styles.planArrowWhite] : styles.planArrow}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {purchasing && (
          <View style={styles.buyingIndicator}>
            <ActivityIndicator color={COLORS.Primary} />
            <Text style={styles.buyingText}>{t('common:loading')}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
        >
          <Text style={styles.restoreText}>{t('monetization:restorePurchase')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.skipText}>{t('monetization:maybeLater')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.Background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg },
  proIcon: { fontSize: 64 },
  proTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.TextPrimary, textAlign: 'center' },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  hero: { alignItems: 'center', marginBottom: SPACING.xl, gap: SPACING.sm },
  crown: { fontSize: 64 },
  heroTitle: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.TextPrimary, textAlign: 'center' },
  heroSubtitle: { fontSize: FONT_SIZE.base, color: COLORS.TextSecondary, textAlign: 'center' },
  features: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.md,
    ...SHADOW.light,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  featureIcon: { fontSize: FONT_SIZE.xl, width: 32, textAlign: 'center' },
  featureLabel: { fontSize: FONT_SIZE.base, color: COLORS.TextPrimary, flex: 1 },
  plans: { gap: SPACING.md, marginBottom: SPACING.lg },
  planCard: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.Border,
    ...SHADOW.light,
  },
  planCardFeatured: {
    backgroundColor: COLORS.Primary,
    borderColor: COLORS.Primary,
    ...SHADOW.medium,
  },
  planInfo: { flex: 1 },
  planTitle: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: COLORS.TextPrimary },
  planTitleWhite: { color: COLORS.Surface },
  planPrice: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.Primary, marginTop: 4 },
  planPriceWhite: { color: COLORS.Surface, opacity: 0.9 },
  planArrow: { fontSize: FONT_SIZE.xxl, color: COLORS.TextDisabled },
  planArrowWhite: { color: COLORS.Surface, opacity: 0.7 },
  spinner: { marginVertical: SPACING.lg },
  buyingIndicator: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, justifyContent: 'center', marginBottom: SPACING.md },
  buyingText: { fontSize: FONT_SIZE.sm, color: COLORS.TextSecondary },
  restoreBtn: { alignItems: 'center', paddingVertical: SPACING.sm, marginBottom: SPACING.sm },
  restoreText: { fontSize: FONT_SIZE.sm, color: COLORS.Primary },
  skipBtn: { alignItems: 'center', paddingVertical: SPACING.sm },
  skipText: { fontSize: FONT_SIZE.sm, color: COLORS.TextDisabled },
});
