// src/components/forms/CurrencyPicker.tsx
import React, { useState, useMemo } from 'react';
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
import { CURRENCY_LIST, CurrencyConfig } from '@/utils/currency';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';

interface Props {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  style?: object;
}

export function CurrencyPicker({ value, onChange, label, style }: Props) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const selected = useMemo(
    () => CURRENCY_LIST.find((c) => c.code === value),
    [value],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCY_LIST;
    return CURRENCY_LIST.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q),
    );
  }, [search]);

  function handleSelect(code: string) {
    onChange(code);
    setSearch('');
    setVisible(false);
  }

  function renderItem({ item }: ListRenderItemInfo<CurrencyConfig>) {
    const isSelected = item.code === value;
    return (
      <TouchableOpacity
        style={[styles.listItem, isSelected && styles.listItemSelected]}
        onPress={() => handleSelect(item.code)}
        activeOpacity={0.7}
      >
        <Text style={styles.itemSymbol}>{item.symbol}</Text>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemCode, isSelected && styles.itemCodeSelected]}>
            {item.code}
          </Text>
          <Text style={styles.itemName}>{item.name}</Text>
        </View>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)} activeOpacity={0.7}>
        <Text style={styles.triggerSymbol}>{selected?.symbol ?? ''}</Text>
        <Text style={styles.triggerCode}>{value}</Text>
        <Text style={styles.triggerName}>{selected?.name ?? ''}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Devise</Text>
            <TouchableOpacity onPress={() => { setSearch(''); setVisible(false); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une devise…"
              placeholderTextColor={COLORS.TextDisabled}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList<CurrencyConfig>
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

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
    gap: SPACING.xs,
  },
  triggerSymbol: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    fontWeight: FONT_WEIGHT.semibold,
    minWidth: 24,
  },
  triggerCode: {
    fontSize: FONT_SIZE.base,
    color: COLORS.TextPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  triggerName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
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
  itemSymbol: {
    fontSize: FONT_SIZE.md,
    color: COLORS.TextPrimary,
    minWidth: 28,
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemCode: {
    fontSize: FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.TextPrimary,
  },
  itemCodeSelected: {
    color: COLORS.Primary,
  },
  itemName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
  },
  checkmark: {
    fontSize: FONT_SIZE.base,
    color: COLORS.Primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.Border,
    marginLeft: SPACING.md + 28 + SPACING.sm,
  },
});
