// src/screens/documents/DocumentListScreen.tsx
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { TabScreenProps } from '@/navigation/types';
import { useTranslation } from '@/i18n/index';
import { documentRepository } from '@/repositories/DocumentRepository';
import { useDocumentUiStore } from '@/stores/documentUiStore';
import { useUsageStore } from '@/stores/usageStore';
import { formatCurrency, getCurrencyConfig } from '@/utils/currency';
import { formatDate } from '@/utils/dateUtils';
import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import type { Document, DocumentStats } from '@/types';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

let AdBanner: React.ComponentType<{ position?: string }> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AdBanner = require('@/components/ads/AdBanner').AdBanner;
} catch {
  AdBanner = null;
}

type Props = TabScreenProps<'Documents'>;

type ActiveTab = 'all' | 'invoice' | 'quote';

const STATUS_VARIANT_MAP: Record<
  string,
  'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'converted'
> = {
  draft: 'draft',
  sent: 'sent',
  paid: 'paid',
  overdue: 'overdue',
  cancelled: 'cancelled',
  converted: 'converted',
};

const TABS: Array<{ key: ActiveTab; labelKey: string }> = [
  { key: 'all', labelKey: 'common:all' },
  { key: 'invoice', labelKey: 'document:invoices' },
  { key: 'quote', labelKey: 'document:quotes' },
];

export default function DocumentListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { isPro } = useUsageStore();
  const {
    activeTab,
    searchQuery,
    sortBy,
    sortOrder,
    setActiveTab,
    setSearchQuery,
  } = useDocumentUiStore();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchVisible, setSearchVisible] = useState(false);
  const [actionMenuDocId, setActionMenuDocId] = useState<string | null>(null);
  const [deleteConfirmDocId, setDeleteConfirmDocId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, docStats] = await Promise.all([
        documentRepository.findAll({
          type: activeTab !== 'all' ? activeTab : undefined,
          searchQuery: searchQuery || undefined,
          sortBy,
          sortOrder,
        }),
        documentRepository.getStats(),
      ]);
      setDocuments(docs);
      setStats(docStats);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, sortBy, sortOrder]);

  useFocusEffect(
    useCallback(() => {
      void loadDocuments();
    }, [loadDocuments]),
  );

  const handleTabChange = useCallback(
    (tab: ActiveTab) => {
      setActiveTab(tab);
    },
    [setActiveTab],
  );

  const handleSearchToggle = useCallback(() => {
    setSearchVisible((v) => {
      if (v) {
        setSearchQuery('');
      } else {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return !v;
    });
  }, [setSearchQuery]);

  const handleDocumentPress = useCallback(
    (docId: string) => {
      navigation.navigate('DocumentEditor', { documentId: docId });
    },
    [navigation],
  );

  const handlePreviewPdf = useCallback(
    (docId: string) => {
      setActionMenuDocId(null);
      navigation.navigate('PdfPreview', { documentId: docId });
    },
    [navigation],
  );

  const handleEdit = useCallback(
    (docId: string) => {
      setActionMenuDocId(null);
      navigation.navigate('DocumentEditor', { documentId: docId });
    },
    [navigation],
  );

  const handleDeleteRequest = useCallback((docId: string) => {
    setActionMenuDocId(null);
    setDeleteConfirmDocId(docId);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmDocId) return;
    setDeleteLoading(true);
    try {
      await documentRepository.delete(deleteConfirmDocId);
      setDeleteConfirmDocId(null);
      void loadDocuments();
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteConfirmDocId, loadDocuments, t]);

  const handleDuplicate = useCallback(
    async (docId: string) => {
      setActionMenuDocId(null);
      try {
        const duplicated = await documentRepository.duplicate(docId);
        void loadDocuments();
        navigation.navigate('DocumentEditor', { documentId: duplicated.id });
      } catch {
        Alert.alert(t('common:error'), t('common:unexpectedError'));
      }
    },
    [loadDocuments, navigation, t],
  );

  const handleCreateInvoice = useCallback(() => {
    setCreateSheetVisible(false);
    navigation.navigate('DocumentEditor', { type: 'invoice' });
  }, [navigation]);

  const handleCreateQuote = useCallback(() => {
    setCreateSheetVisible(false);
    navigation.navigate('DocumentEditor', { type: 'quote' });
  }, [navigation]);

  const getClientName = (clientSnapshot: string): string => {
    try {
      const parsed = JSON.parse(clientSnapshot) as { name?: string };
      return parsed.name ?? t('common:unknown');
    } catch {
      return t('common:unknown');
    }
  };

  const renderDocumentRow = useCallback(
    ({ item }: { item: Document }) => {
      const docCurrency = getCurrencyConfig(item.currencyCode);
      const clientName = getClientName(item.clientSnapshot);
      const statusVariant = STATUS_VARIANT_MAP[item.status] ?? 'draft';
      const statusLabel = t(`document:status.${item.status}`);
      const typeIcon = item.type === 'invoice' ? '📄' : '📋';
      const isMenuOpen = actionMenuDocId === item.id;

      return (
        <TouchableOpacity
          style={styles.docRow}
          onPress={() => handleDocumentPress(item.id)}
          onLongPress={() => setActionMenuDocId(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.docRowMain}>
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
              <Text style={styles.docAmount} numberOfLines={1}>
                {formatCurrency(item.total, docCurrency)}
              </Text>
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setActionMenuDocId(isMenuOpen ? null : item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.moreButtonText}>•••</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Inline quick actions */}
          {isMenuOpen && (
            <View style={styles.actionMenu}>
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => handleEdit(item.id)}
              >
                <Text style={styles.actionMenuText}>{t('common:edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => handlePreviewPdf(item.id)}
              >
                <Text style={styles.actionMenuText}>{t('document:preview')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionMenuItem}
                onPress={() => void handleDuplicate(item.id)}
              >
                <Text style={styles.actionMenuText}>{t('common:duplicate')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionMenuItem, styles.actionMenuItemDanger]}
                onPress={() => handleDeleteRequest(item.id)}
              >
                <Text style={styles.actionMenuTextDanger}>{t('common:delete')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [
      t,
      actionMenuDocId,
      handleDocumentPress,
      handleEdit,
      handlePreviewPdf,
      handleDuplicate,
      handleDeleteRequest,
    ],
  );

  const renderListHeader = () => (
    <>
      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsRow}>
          <Card style={styles.statCard} elevation={1}>
            <Text style={styles.statLabel}>{t('document:thisMonth')}</Text>
            <Text style={styles.statValue} numberOfLines={1}>
              {stats.totalThisMonth.toFixed(0)}
            </Text>
          </Card>
          <Card style={styles.statCard} elevation={1}>
            <Text style={styles.statLabel}>{t('document:pending')}</Text>
            <Text style={[styles.statValue, styles.statValueWarning]} numberOfLines={1}>
              {stats.pendingAmount.toFixed(0)}
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
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings:documents')}</Text>
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={handleSearchToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.searchIconText}>{searchVisible ? '✕' : '🔍'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {searchVisible && (
        <View style={styles.searchBar}>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={t('document:searchDocuments')}
            placeholderTextColor={COLORS.TextDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
            >
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Document List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.Primary} />
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderDocumentRow}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            <EmptyState
              icon="📄"
              title={t('document:noDocuments')}
              subtitle={t('document:noDocumentsSubtitle')}
              actionLabel={t('document:createInvoice')}
              onAction={handleCreateInvoice}
            />
          }
          contentContainerStyle={documents.length === 0 ? styles.emptyContainer : styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onPress={() => setActionMenuDocId(null)}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreateSheetVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* AdBanner */}
      {!isPro && AdBanner && <AdBanner position="bottom" />}

      {/* Create Sheet Modal */}
      <Modal
        visible={createSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCreateSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCreateSheetVisible(false)}
        >
          <View style={styles.createSheet}>
            <View style={styles.createSheetHandle} />
            <Text style={styles.createSheetTitle}>{t('document:newDocument')}</Text>
            <TouchableOpacity
              style={styles.createSheetOption}
              onPress={handleCreateInvoice}
              activeOpacity={0.7}
            >
              <Text style={styles.createSheetOptionIcon}>📄</Text>
              <View>
                <Text style={styles.createSheetOptionTitle}>{t('document:createInvoice')}</Text>
                <Text style={styles.createSheetOptionDesc}>{t('document:invoice')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createSheetOption}
              onPress={handleCreateQuote}
              activeOpacity={0.7}
            >
              <Text style={styles.createSheetOptionIcon}>📋</Text>
              <View>
                <Text style={styles.createSheetOptionTitle}>{t('document:createQuote')}</Text>
                <Text style={styles.createSheetOptionDesc}>{t('document:quote')}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createSheetCancel}
              onPress={() => setCreateSheetVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.createSheetCancelText}>{t('common:cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        visible={deleteConfirmDocId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmDocId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>{t('common:deleteConfirmTitle')}</Text>
            <Text style={styles.confirmMessage}>{t('document:deleteDocumentConfirm')}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonCancel]}
                onPress={() => setDeleteConfirmDocId(null)}
                disabled={deleteLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonCancelText}>{t('common:cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonDanger]}
                onPress={() => void handleDeleteConfirm()}
                disabled={deleteLoading}
                activeOpacity={0.7}
              >
                {deleteLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonDangerText}>{t('common:delete')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
  },
  searchIconButton: {
    padding: SPACING.xs,
  },
  searchIconText: {
    fontSize: FONT_SIZE.md,
  },
  searchBar: {
    backgroundColor: COLORS.Surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    backgroundColor: COLORS.SurfaceVariant,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.Surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.Primary,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
  },
  tabTextActive: {
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.TextSecondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
  },
  statValueWarning: {
    color: COLORS.Warning,
  },
  statValueDanger: {
    color: COLORS.Error,
  },
  listContent: {
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  docRow: {
    backgroundColor: COLORS.Surface,
  },
  docRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: SPACING.xs,
  },
  docAmount: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
  },
  moreButton: {
    padding: SPACING.xs,
  },
  moreButtonText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.TextDisabled,
    letterSpacing: 1,
  },
  actionMenu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.SurfaceVariant,
    borderTopWidth: 1,
    borderTopColor: COLORS.Divider,
  },
  actionMenuItem: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm + 2,
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.Border,
  },
  actionMenuItemDanger: {
    borderColor: COLORS.Error + '40',
    backgroundColor: COLORS.Error + '0D',
  },
  actionMenuText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  actionMenuTextDanger: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.Error,
    fontWeight: FONT_WEIGHT.medium,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.Divider,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xxl + SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.Primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
  fabText: {
    fontSize: FONT_SIZE.xxl,
    color: '#fff',
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: FONT_SIZE.xxl + 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.Overlay,
    justifyContent: 'flex-end',
  },
  createSheet: {
    backgroundColor: COLORS.Surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  createSheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.Border,
    marginBottom: SPACING.md,
  },
  createSheetTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  createSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Divider,
  },
  createSheetOptionIcon: {
    fontSize: 32,
  },
  createSheetOptionTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextPrimary,
  },
  createSheetOptionDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
    marginTop: 2,
  },
  createSheetCancel: {
    marginTop: SPACING.md,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  createSheetCancelText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  confirmModal: {
    backgroundColor: COLORS.Surface,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  confirmTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
    marginBottom: SPACING.sm,
  },
  confirmMessage: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    lineHeight: FONT_SIZE.base * 1.5,
    marginBottom: SPACING.lg,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmButtonCancel: {
    backgroundColor: COLORS.Surface,
    borderColor: COLORS.Border,
  },
  confirmButtonDanger: {
    backgroundColor: COLORS.Error,
    borderColor: COLORS.Error,
  },
  confirmButtonCancelText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextSecondary,
  },
  confirmButtonDangerText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#fff',
  },
});
