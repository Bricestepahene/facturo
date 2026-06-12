// src/screens/settings/BackupScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from '@/i18n';
import { exportBackup, importBackup } from '@/services/backup/BackupService';
import { Button, Card } from '@/components/common';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

export default function BackupScreen() {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportBackup();
      Alert.alert(t('common:success'), t('settings:backupSuccess'));
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    Alert.alert(
      t('settings:backupImport'),
      t('settings:backupWarning'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('settings:backupImport'),
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            try {
              await importBackup();
              Alert.alert(t('common:success'), t('settings:importSuccess'));
            } catch {
              Alert.alert(t('common:error'), t('common:unexpectedError'));
            } finally {
              setImporting(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.cardIcon}>💾</Text>
          <Text style={styles.cardTitle}>{t('settings:backupExport')}</Text>
          <Text style={styles.cardDesc}>
            {t('settings:exportData')}
          </Text>
          <Button
            title={exporting ? t('common:loading') : t('common:export')}
            onPress={handleExport}
            disabled={exporting}
            fullWidth
            variant="primary"
          />
          {exporting && <ActivityIndicator style={styles.spinner} color={COLORS.Primary} />}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardIcon}>📂</Text>
          <Text style={styles.cardTitle}>{t('settings:backupImport')}</Text>
          <Text style={styles.cardDesc}>
            {t('settings:importData')}
          </Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ {t('settings:backupWarning')}</Text>
          </View>
          <Button
            title={importing ? t('common:loading') : t('common:import')}
            onPress={handleImport}
            disabled={importing}
            fullWidth
            variant="outline"
          />
          {importing && <ActivityIndicator style={styles.spinner} color={COLORS.Primary} />}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.Background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl, gap: SPACING.md },
  card: { gap: SPACING.md, padding: SPACING.lg, alignItems: 'center' },
  cardIcon: { fontSize: 48, textAlign: 'center' },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: COLORS.Warning + '1A',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    width: '100%',
  },
  warningText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.Warning,
    textAlign: 'center',
  },
  spinner: { marginTop: SPACING.xs },
});
