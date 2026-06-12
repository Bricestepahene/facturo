// src/screens/preview/PdfPreviewScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from '@/i18n';
import { documentRepository } from '@/repositories/DocumentRepository';
import { settingsRepository } from '@/repositories/SettingsRepository';
import { generatePdf } from '@/services/pdf/PdfGenerator';
import { sharePdf, downloadPdf, printPdf } from '@/services/pdf/PdfSharing';
import { runAdGate } from '@/services/monetization/AdGate';
import { useUsageStore } from '@/stores/usageStore';
import { formatCurrency, getCurrencyConfig } from '@/utils/currency';
import { roundForDisplay } from '@/utils/calculations';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import type { RootStackScreenProps } from '@/navigation/types';
import type { DocumentWithItems, CompanySettings } from '@/types';
import type { CurrencyConfig } from '@/utils/currency';

type Props = RootStackScreenProps<'PdfPreview'>;
type Phase = 'loading' | 'adgate' | 'generating' | 'ready' | 'error';

export default function PdfPreviewScreen({ route, navigation }: Props) {
  const { documentId } = route.params;
  const { t } = useTranslation();
  const isPro = useUsageStore((s) => s.isPro);
  const pdfCount = useUsageStore((s) => s.pdfCountThisMonth);
  const incrementCount = useUsageStore((s) => s.incrementCount);

  const [phase, setPhase] = useState<Phase>('loading');
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocumentWithItems | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig | null>(null);
  const [sharing, setSharing] = useState(false);

  const doGenerate = useCallback(async (
    document: DocumentWithItems,
    settings: CompanySettings,
  ) => {
    setPhase('generating');
    try {
      const uri = await generatePdf(document, settings, isPro);
      await settingsRepository.incrementPdfCount();
      incrementCount();
      setPdfUri(uri);
      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }, [isPro, incrementCount]);

  useEffect(() => {
    async function init() {
      try {
        const [document, settings] = await Promise.all([
          documentRepository.findWithItems(documentId),
          settingsRepository.getCompanySettings(),
        ]);
        if (!document) { setPhase('error'); return; }

        setDoc(document);
        setCompany(settings);
        setCurrencyConfig(getCurrencyConfig(document.currencyCode));

        const usage = await settingsRepository.getAppUsage();
        await runAdGate(usage, {
          onShowAdGate: async (adAvailable) => {
            setPhase('adgate');
            return new Promise((resolve) => {
              Alert.alert(
                t('monetization:adGateTitle'),
                t('monetization:adGateMessage', { count: pdfCount }),
                [
                  adAvailable
                    ? { text: t('monetization:watchAdButton'), onPress: () => resolve('watch-ad') }
                    : { text: t('monetization:bypassAd'), onPress: () => resolve('bypass') },
                  { text: t('monetization:upgradeToPro'), onPress: () => resolve('upgrade') },
                ],
                { cancelable: false },
              );
            });
          },
          onGenerate: () => doGenerate(document, settings),
          onNavigateToUpgrade: () => navigation.navigate('UpgradePro'),
        });
      } catch {
        setPhase('error');
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function handleShare() {
    if (!pdfUri) return;
    setSharing(true);
    try {
      await sharePdf(pdfUri);
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setSharing(false);
    }
  }

  async function handleDownload() {
    if (!pdfUri || !doc) return;
    try {
      const safeNumber = (doc.number ?? 'doc').replace(/[^a-zA-Z0-9_-]/g, '_');
      await downloadPdf(pdfUri, `facturo_${safeNumber}.pdf`);
      Alert.alert(t('common:success'), t('common:download'));
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    }
  }

  async function handlePrint() {
    if (!pdfUri) return;
    try {
      await printPdf(pdfUri);
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    }
  }

  if (phase === 'loading' || phase === 'adgate' || phase === 'generating') {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.Primary} />
        <Text style={styles.loadingText}>
          {phase === 'generating' ? t('pdf:generatingPdf') : t('common:loading')}
        </Text>
      </SafeAreaView>
    );
  }

  if (phase === 'error' || !doc || !currencyConfig) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{t('pdf:errorGenerating')}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => doc && company && doGenerate(doc, company)}
        >
          <Text style={styles.retryText}>{t('common:retry')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const fmt = (amount: number) =>
    formatCurrency(roundForDisplay(amount, currencyConfig.decimalDigits), currencyConfig);

  let clientName = t('document:noClient');
  try {
    const snapshot = doc.clientSnapshot ? JSON.parse(doc.clientSnapshot) as { name?: string } : null;
    if (snapshot?.name) clientName = snapshot.name;
  } catch { /* ignore */ }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleShare} disabled={sharing}>
          <Text style={styles.toolbarIcon}>📤</Text>
          <Text style={styles.toolbarLabel}>{t('common:share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleDownload}>
          <Text style={styles.toolbarIcon}>⬇️</Text>
          <Text style={styles.toolbarLabel}>{t('common:download')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn} onPress={handlePrint}>
          <Text style={styles.toolbarIcon}>🖨️</Text>
          <Text style={styles.toolbarLabel}>{t('common:print')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.docHeader}>
          <View style={styles.docHeaderLeft}>
            <Text style={styles.docType}>
              {doc.type === 'invoice' ? t('document:invoice') : t('document:quote')}
            </Text>
            <Text style={styles.docNumber}>{doc.number}</Text>
            <Text style={styles.docDate}>{doc.date}</Text>
          </View>
          {doc.status === 'draft' && (
            <View style={styles.draftBadge}>
              <Text style={styles.draftText}>{t('pdf:draft')}</Text>
            </View>
          )}
        </View>

        <View style={styles.clientBlock}>
          <Text style={styles.blockLabel}>{t('pdf:billTo')}</Text>
          <Text style={styles.clientName}>{clientName}</Text>
        </View>

        <View style={styles.itemsBlock}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.col, styles.colDesc]}>{t('pdf:description')}</Text>
            <Text style={[styles.col, styles.colQty]}>{t('pdf:qty')}</Text>
            <Text style={[styles.col, styles.colAmount]}>{t('pdf:amount')}</Text>
          </View>
          {doc.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.col, styles.colDesc]} numberOfLines={2}>{item.description}</Text>
              <Text style={[styles.col, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.col, styles.colAmount]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('common:subtotal')}</Text>
            <Text style={styles.totalValue}>{fmt(doc.subtotal)}</Text>
          </View>
          {doc.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('common:discount')}</Text>
              <Text style={[styles.totalValue, styles.discount]}>-{fmt(doc.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('common:tax')}</Text>
            <Text style={styles.totalValue}>{fmt(doc.taxTotal)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>{t('common:total')}</Text>
            <Text style={styles.grandTotalValue}>{fmt(doc.total)}</Text>
          </View>
        </View>

        {!isPro && (
          <View style={styles.branding}>
            <Text style={styles.brandingText}>Créé avec Facturo — facturo.app</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.Background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, padding: SPACING.lg },
  loadingText: { fontSize: FONT_SIZE.base, color: COLORS.TextSecondary },
  errorIcon: { fontSize: 48 },
  errorText: { fontSize: FONT_SIZE.base, color: COLORS.Error, textAlign: 'center' },
  retryBtn: {
    backgroundColor: COLORS.Primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: { color: COLORS.Surface, fontWeight: FONT_WEIGHT.semibold },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: COLORS.Surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    paddingVertical: SPACING.sm,
    ...SHADOW.light,
  },
  toolbarBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: SPACING.xs },
  toolbarIcon: { fontSize: FONT_SIZE.xl },
  toolbarLabel: { fontSize: FONT_SIZE.xs, color: COLORS.TextSecondary },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  docHeader: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...SHADOW.light,
  },
  docHeaderLeft: { gap: SPACING.xs },
  docType: { fontSize: FONT_SIZE.sm, color: COLORS.TextSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  docNumber: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.TextPrimary },
  docDate: { fontSize: FONT_SIZE.sm, color: COLORS.TextSecondary },
  draftBadge: {
    backgroundColor: COLORS.Warning + '1A',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.Warning,
  },
  draftText: { fontSize: FONT_SIZE.xs, color: COLORS.Warning, fontWeight: FONT_WEIGHT.bold },
  clientBlock: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.light,
  },
  blockLabel: { fontSize: FONT_SIZE.sm, color: COLORS.TextSecondary, marginBottom: SPACING.xs },
  clientName: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold, color: COLORS.TextPrimary },
  itemsBlock: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.light,
  },
  itemsHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.SurfaceVariant,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.Divider,
  },
  col: { fontSize: FONT_SIZE.sm },
  colDesc: { flex: 3, color: COLORS.TextPrimary },
  colQty: { flex: 1, color: COLORS.TextSecondary, textAlign: 'center' },
  colAmount: { flex: 2, color: COLORS.TextPrimary, textAlign: 'right', fontWeight: FONT_WEIGHT.medium },
  totals: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOW.light,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: FONT_SIZE.sm, color: COLORS.TextSecondary },
  totalValue: { fontSize: FONT_SIZE.sm, color: COLORS.TextPrimary },
  discount: { color: COLORS.Secondary },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.Divider,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  grandTotalLabel: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, color: COLORS.TextPrimary },
  grandTotalValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.Primary },
  branding: { alignItems: 'center', paddingTop: SPACING.sm },
  brandingText: { fontSize: FONT_SIZE.xs, color: COLORS.TextDisabled },
});
