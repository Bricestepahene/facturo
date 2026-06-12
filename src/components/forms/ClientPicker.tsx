// src/components/forms/ClientPicker.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ListRenderItemInfo,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Client } from '@/db/schema';
import { clientRepository } from '@/repositories/ClientRepository';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

interface Props {
  selectedClientId: string | null;
  onSelect: (client: Client | null) => void;
  onCreateNew: () => void;
  label?: string;
  style?: object;
}

export function ClientPicker({
  selectedClientId,
  onSelect,
  onCreateNew,
  label,
  style,
}: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const loadClients = useCallback(async () => {
    const all = await clientRepository.findAll();
    setClients(all);
    if (selectedClientId) {
      const found = all.find((c) => c.id === selectedClientId) ?? null;
      setSelectedClient(found);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filtered = search.trim()
    ? clients.filter((c) => {
        const q = search.trim().toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q)
        );
      })
    : clients;

  function handleSelect(client: Client) {
    setSelectedClient(client);
    onSelect(client);
    setSearch('');
    setVisible(false);
  }

  function handleCreateNew() {
    setVisible(false);
    onCreateNew();
  }

  function renderItem({ item }: ListRenderItemInfo<Client>) {
    const isSelected = item.id === selectedClientId;
    return (
      <TouchableOpacity
        style={[styles.listItem, isSelected && styles.listItemSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.name[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text
            style={[styles.clientName, isSelected && styles.clientNameSelected]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {item.email ? (
            <Text style={styles.clientSubtitle} numberOfLines={1}>
              {item.email}
            </Text>
          ) : null}
        </View>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        {selectedClient ? (
          <Text style={styles.triggerValue} numberOfLines={1}>
            {selectedClient.name}
          </Text>
        ) : (
          <Text style={styles.triggerPlaceholder}>
            {t('document:selectClient')}
          </Text>
        )}
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('document:client')}</Text>
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setVisible(false);
              }}
            >
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('client:searchClients')}
              placeholderTextColor={COLORS.TextDisabled}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          <TouchableOpacity
            style={styles.createNewBtn}
            onPress={handleCreateNew}
            activeOpacity={0.7}
          >
            <View style={styles.createNewIconWrapper}>
              <Text style={styles.createNewIconText}>+</Text>
            </View>
            <Text style={styles.createNewText}>{t('client:addClient')}</Text>
          </TouchableOpacity>

          <FlatList<Client>
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('client:noClients')}</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextSecondary,
    marginBottom: 4,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.Border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.Surface,
  },
  triggerValue: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
  },
  triggerPlaceholder: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.TextDisabled,
  },
  chevron: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.TextDisabled,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.Background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    backgroundColor: COLORS.Surface,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.TextPrimary,
  },
  closeBtn: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
    padding: SPACING.xs,
  },
  searchContainer: {
    padding: SPACING.sm,
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
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.Border,
    gap: SPACING.sm,
  },
  createNewIconWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.Primary + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createNewIconText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.bold,
    lineHeight: FONT_SIZE.lg + 2,
  },
  createNewText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  listContent: {
    paddingVertical: SPACING.xs,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  listItemSelected: {
    backgroundColor: COLORS.Primary + '0D',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.Primary + '2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.Primary,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextPrimary,
  },
  clientNameSelected: {
    color: COLORS.Primary,
  },
  clientSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
    marginTop: 1,
  },
  checkmark: {
    fontSize: FONT_SIZE.base,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.Border,
    marginLeft: SPACING.md + AVATAR_SIZE + SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextSecondary,
  },
});
