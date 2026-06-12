// src/screens/clients/ClientListScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  SafeAreaView,
  ListRenderItemInfo,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '@/i18n/index';
import { clientRepository } from '@/repositories/ClientRepository';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { AdBanner } from '@/components/ads/AdBanner';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import type { Client } from '@/types';
import type { TabScreenProps } from '@/navigation/types';

type Props = TabScreenProps<'Clients'>;

export default function ClientListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await clientRepository.findAll(search);
      setClients(rows);
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients]),
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await clientRepository.delete(deleteTarget.id);
      setDeleteTarget(null);
      loadClients();
    } catch {
      setDeleteTarget(null);
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    }
  }

  function handleEdit(clientId: string) {
    navigation.navigate('ClientForm', { clientId });
  }

  function handleAdd() {
    navigation.navigate('ClientForm', {});
  }

  function renderItem({ item }: ListRenderItemInfo<Client>) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleEdit(item.id)}
        onLongPress={() =>
          Alert.alert(t('common:actions'), item.name, [
            { text: t('common:edit'), onPress: () => handleEdit(item.id) },
            {
              text: t('common:delete'),
              style: 'destructive',
              onPress: () => setDeleteTarget(item),
            },
            { text: t('common:cancel'), style: 'cancel' },
          ])
        }
        activeOpacity={0.75}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.clientName} numberOfLines={1}>
            {item.name}
          </Text>
          <Badge
            label={t(`client:type.${item.type}`)}
            variant={item.type === 'company' ? 'info' : 'success'}
          />
        </View>
        {item.email ? (
          <Text style={styles.clientMeta} numberOfLines={1}>
            {item.email}
          </Text>
        ) : null}
        {item.phone ? (
          <Text style={styles.clientMeta} numberOfLines={1}>
            {item.phone}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('client:clients')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('client:searchClients')}
          placeholderTextColor={COLORS.TextDisabled}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadClients}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList<Client>
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          clients.length === 0 && styles.listEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={loading}
        onRefresh={loadClients}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="👥"
              title={t('client:noClients')}
              subtitle={t('client:noClientsSubtitle')}
              actionLabel={t('client:addClient')}
              onAction={handleAdd}
            />
          ) : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAdd} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AdBanner />

      <ConfirmModal
        visible={deleteTarget !== null}
        title={t('client:deleteClient')}
        message={t('client:deleteClientConfirm')}
        confirmLabel={t('common:delete')}
        cancelLabel={t('common:cancel')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
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
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.Surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    backgroundColor: COLORS.Background,
  },
  listContent: {
    padding: SPACING.md,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.Surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  clientName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextPrimary,
  },
  clientMeta: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
    marginTop: 2,
  },
  separator: {
    height: SPACING.sm,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl + 56,
    right: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.Primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.heavy,
  },
  fabIcon: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.Surface,
    fontWeight: FONT_WEIGHT.regular,
    lineHeight: 32,
  },
});
