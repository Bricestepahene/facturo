// src/screens/dashboard/DashboardScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { TabScreenProps } from '@/navigation/types';
import { useTranslation } from '@/i18n/index';
import { documentRepository } from '@/repositories/DocumentRepository';
import { settingsRepository } from '@/repositories/SettingsRepository';
import { useUsageStore } from '@/stores/usageStore';
import { formatCurrency, getCurrencyConfig } from '@/utils/currency';
import { formatDate } from '@/utils/dateUtils';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import type { Document, DocumentStats } from '@/types';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

// AdBanner will be a placeholder component if not yet created
let AdBanner: React.ComponentType<{ position?: string }> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AdBanner = require('@/components/ads/AdBanner').AdBanner;
} catch {
  AdBanner = null;
}

type Props = TabScreenProps<'Dashboard'>;

const STATUS_TO_VARIANT: Record<string, 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'converted'> = {
  draft: 'draft',
  sent: 'sent',
  paid: 'paid',
  overdue: 'overdue',
  cancelled: 'cancelled',
  converted: 'converted',
};

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.facturo.app';

export default function DashboardScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { isPro, hydrate } = useUsageStore();

  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState('EUR');

  const loadData = useCallback(async () => {
    try {
      const [usageData, docStats, docs, companySettings] = await Promise.all([
        settingsRepository.checkAndResetMonthlyCount(),
        documentRepository.getStats(),
        documentRepository.findAll({ sortBy: 'date', sortOrder: 'desc' }),
        settingsRepository.getCompanySettings(),
      ]);
      hydrate(usageData);
      setStats(docStats);
      setRecentDocs(docs.slice(0, 5));
      setDefaultCurrencyCode(companySettings.defaultCurrencyCode);
    } catch {
      // silently handle load errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hydrate]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData();
    }, [loadData]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  const handleAnalytics = useCallback(() => {
    if (isPro) {
      // Navigate to analytics when screen exists
      // navigation.navigate('AnalyticsDashboard');
    } else {
      navigation.navigate('UpgradePro');
    }
  }, [isPro, navigation]);

  const handleNewInvoice = useCallback(() => {
    navigation.navigate('DocumentEditor', { type: 'invoice' });
  }, [navigation]);

  const handleNewQuote = useCallback(() => {
    navigation.navigate('DocumentEditor', { type: 'quote' });
  }, [navigation]);

  const handleDocumentPress = useCallback(
    (doc: Document) => {
      navigation.navigate('DocumentEditor', { documentId: doc.id });
    },
    [navigation],
  );

  const handleInviteColleague = useCallback(() => {
    void Linking.openURL(PLAY_STORE_URL);
  }, []);

  const currencyConfig = getCurrencyConfig(defaultCurrencyCode);

  const getClientName = (clientSnapshot: string): string => {
    try {
      const parsed = JSON.parse(clientSnapshot) as { name?: string };
      return parsed.name ?? t('common:unknown');
    } catch {
      return t('common:unknown');
    }
  };

  const renderDocumentItem = useCallback(
    ({ item }: { item: Document }) => {
      const docCurrency = getCurrencyConfig(item.currencyCode);
      const clientName = getClientName(item.clientSnapshot);
      const statusVariant = STATUS_TO_VARIANT[item.status] ?? 'draft';
      const statusLabel = t(`document:status.${item.status}`);
      const typeLabel = t(`document:type.${item.type}`);
      const typeIcon = item.type === 'invoice' ? '📄' : '📋';

      return (
        <TouchableOpacity
          style={styles.docRow}
          onPress={() => handleDocumentPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.docRowLeft}>
            <View style={styles.docBadgeRow}>
              <Badge label={statusLabel} variant={statusVariant} />
              <Text style={styles.docTypeIcon}>{typeIcon}</Text>
            </View>
            <Text style={styles.docNumber} numberOfLines={1}>
              {item.number}
            </Text>
            <Text style={styles.docClient} numberOfLines={1}>
              {clientName}
            </Text>
            <Text style={styles.docDate}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.docRowRight}>
            <Text style={styles.docAmount}>
              {formatCurrency(item.total, docCurrency)}
            </Text>
            <Text style={styles.docTypeLabel}>{typeLabel}</Text>
          </View>
        </TouchableOpacity>
      );
    },
    [t, handleDocumentPress],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.Primary} />
        <Text style={styles.loadingText}>{t('common:loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Facturo</Text>
        <TouchableOpacity
          style={styles.analyticsButton}
          onPress={handleAnalytics}
          activeOpacity={0.7}
        >
          <Text style={styles.analyticsButtonText}>
            {t('common:details')} {!isPro && '🔒'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.Primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards Row */}
        {stats && (
          <View style={styles.statsRow}>
            <Card style={styles.statCard} elevation={1}>
              <Text style={styles.statLabel}>{t('document:thisMonth')}</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {formatCurrency(stats.totalThisMonth, currencyConfig)}
              </Text>
            </Card>
            <Card style={styles.statCard} elevation={1}>
              <Text style={styles.statLabel}>{t('document:pending')}</Text>
              <Text style={[styles.statValue, styles.statValueWarning]} numberOfLines={1}>
                {formatCurrency(stats.pendingAmount, currencyConfig)}
              </Text>
            </Card>
            <Card style={styles.statCard} elevation={1}>
              <Text style={styles.statLabel}>{t('document:overdue')}</Text>
              <Text style={[styles.statValue, styles.statValueDanger]} numberOfLines={1}>
                {stats.overdueCount}
              </Text>
            </Card>
          </View>
        )}

        {/* FAB-style action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonInvoice]}
            onPress={handleNewInvoice}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonIcon}>📄</Text>
            <Text style={styles.actionButtonText}>{t('document:createInvoice')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonQuote]}
            onPress={handleNewQuote}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonIcon}>📋</Text>
            <Text style={styles.actionButtonText}>{t('document:createQuote')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Documents Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('document:noDocuments')}</Text>
        </View>

        {recentDocs.length === 0 ? (
          <Card style={styles.emptyCard} elevation={0}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>{t('document:noDocumentsSubtitle')}</Text>
          </Card>
        ) : (
          <Card style={styles.docsCard} elevation={1}>
            <FlatList
              data={recentDocs}
              keyExtractor={(item) => item.id}
              renderItem={renderDocumentItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </Card>
        )}

        {/* Invite Button */}
        <TouchableOpacity style={styles.inviteButton} onPress={handleInviteColleague} activeOpacity={0.7}>
          <Text style={styles.inviteText}>{t('onboarding:letsGo')} 👋</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* AdBanner for free users */}
      {!isPro && AdBanner && <AdBanner position="bottom" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.Background,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 56 : SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.Surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.Primary,
  },
  analyticsButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: COLORS.SurfaceVariant,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  analyticsButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.TextSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
    textAlign: 'center',
  },
  statValueWarning: {
    color: COLORS.Warning,
  },
  statValueDanger: {
    color: COLORS.Error,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  actionButtonInvoice: {
    backgroundColor: COLORS.Primary,
  },
  actionButtonQuote: {
    backgroundColor: COLORS.Secondary,
  },
  actionButtonIcon: {
    fontSize: FONT_SIZE.md,
  },
  actionButtonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextPrimary,
  },
  docsCard: {
    marginHorizontal: SPACING.md,
    padding: 0,
    overflow: 'hidden',
  },
  emptyCard: {
    marginHorizontal: SPACING.md,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    textAlign: 'center',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
  },
  docRowLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  docBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  docTypeIcon: {
    fontSize: FONT_SIZE.sm,
  },
  docNumber: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextPrimary,
    marginBottom: 1,
  },
  docClient: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
    marginBottom: 1,
  },
  docDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.TextDisabled,
  },
  docRowRight: {
    alignItems: 'flex-end',
  },
  docAmount: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
    marginBottom: 2,
  },
  docTypeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.TextDisabled,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.Divider,
    marginHorizontal: SPACING.md,
  },
  inviteButton: {
    alignSelf: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  inviteText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.medium,
    textDecorationLine: 'underline',
  },
  bottomPadding: {
    height: SPACING.xl,
  },
});
