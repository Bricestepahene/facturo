// src/screens/products/ProductListScreen.tsx
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
import { productRepository } from '@/repositories/ProductRepository';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { EmptyState } from '@/components/common/EmptyState';
import { AdBanner } from '@/components/ads/AdBanner';
import { COLORS } from '@/theme/colors';
import { SPACING, BORDER_RADIUS, SHADOW } from '@/theme/spacing';
import { FONT_SIZE, FONT_WEIGHT } from '@/theme/typography';
import { getCurrencyConfig, formatCurrency } from '@/utils/currency';
import type { Product } from '@/types';
import type { TabScreenProps } from '@/navigation/types';

type Props = TabScreenProps<'Products'>;

export default function ProductListScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const eurConfig = getCurrencyConfig('EUR');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await productRepository.findAll(search);
      setProducts(rows);
    } catch {
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts]),
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await productRepository.delete(deleteTarget.id);
      setDeleteTarget(null);
      loadProducts();
    } catch {
      setDeleteTarget(null);
      Alert.alert(t('common:error'), t('common:unexpectedError'));
    }
  }

  function handleEdit(productId: string) {
    navigation.navigate('ProductForm', { productId });
  }

  function handleAdd() {
    navigation.navigate('ProductForm', {});
  }

  function renderItem({ item }: ListRenderItemInfo<Product>) {
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
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productPrice}>
            {formatCurrency(item.unitPrice, eurConfig)}
          </Text>
        </View>
        {item.description ? (
          <Text style={styles.productDesc} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
        <Text style={styles.productUnit}>
          {t(`product:units.${item.unit}`, { defaultValue: item.unit })}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('product:products')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('product:searchProducts')}
          placeholderTextColor={COLORS.TextDisabled}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={loadProducts}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList<Product>
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          products.length === 0 && styles.listEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={loading}
        onRefresh={loadProducts}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="📦"
              title={t('product:noProducts')}
              subtitle={t('product:noProductsSubtitle')}
              actionLabel={t('product:addProduct')}
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
        title={t('product:deleteProduct')}
        message={t('product:deleteProductConfirm')}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  productName: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.TextPrimary,
  },
  productPrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.Primary,
  },
  productDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.TextSecondary,
    marginBottom: 2,
  },
  productUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.TextDisabled,
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
